import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { env } from '@common/constants/env.constants.js';
import { Layer } from '@common/constants/layer.constants.js';
import { http } from '@common/constants/http.constants.js';
import { AppError } from '@common/errors/AppError.js';
import { ValidationError } from '@common/errors/subclasses.js';
import { logger } from '@adapters/logging/pino.logger.js';

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.resolve('scripts/extract_formatting.py');
const TIMEOUT_MS = 60000;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const EXIT_NOT_A_DOCX = 3; // keep in sync with scripts/extract_formatting.py
const MAX_LOGGED_STDERR = 600;

const MESSAGES = Object.freeze({
  NOT_A_DOCX: 'This file could not be read as a Word (.docx) document. Make sure it is a real .docx, not an older .doc file renamed.',
  ANALYSIS_FAILED: "We couldn't analyse this document's formatting. Please try again, or contact support quoting the reference shown.",
  SETUP_FAILED: 'Document analysis is temporarily unavailable. Please contact your administrator.',
  LOG: 'Formatting extraction failed',
});
const CODES = Object.freeze({
  ANALYSIS_FAILED: 'FORMATTING_ANALYSIS_FAILED',
  SETUP_FAILED: 'FORMATTING_SETUP_FAILED',
});

const describe = (error) => ({
  exitCode: error.code,
  killed: error.killed,
  signal: error.signal,
  stderr: String(error.stderr ?? '').trim().slice(-MAX_LOGGED_STDERR),
  message: error.message?.split('\n')[0],
});

/** Python itself is missing, or python-docx is not installed: a server setup problem, never the user's file. */
const isSetupProblem = (details) =>
  details.exitCode === 'ENOENT' ||
  /ModuleNotFoundError|No module named|Python was not found|not recognized as an internal/i.test(`${details.stderr} ${details.message}`);

export const docxFormattingAdapter = Object.freeze({
  /**
   * Runs the python-docx script and returns the resolved formatting profile. Three distinct failures,
   * each reported honestly (and always logged with the real cause):
   *  - the file is not a readable .docx: the user's problem (400)
   *  - Python / python-docx not available: a setup problem (non-operational, logged loudly)
   *  - the script itself failed on a valid file: our bug (422 with a reference, logged)
   */
  extractFormatting: async (filePath) => {
    let stdout;
    try {
      ({ stdout } = await execFileAsync(env.PYTHON_BIN, [SCRIPT_PATH, filePath], {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true,
      }));
    } catch (error) {
      const details = describe(error);
      logger.warn({ ...details, python: env.PYTHON_BIN }, MESSAGES.LOG);

      if (details.exitCode === EXIT_NOT_A_DOCX) {
        throw new ValidationError(MESSAGES.NOT_A_DOCX, { layer: Layer.ADAPTER, cause: error });
      }
      if (isSetupProblem(details)) {
        throw new AppError(MESSAGES.SETUP_FAILED, {
          code: CODES.SETUP_FAILED,
          isOperational: false,
          layer: Layer.ADAPTER,
          cause: error,
        });
      }
      throw new AppError(MESSAGES.ANALYSIS_FAILED, {
        statusCode: http.STATUS_CODES.UNPROCESSABLE_ENTITY,
        code: CODES.ANALYSIS_FAILED,
        layer: Layer.ADAPTER,
        cause: error,
      });
    }

    try {
      return JSON.parse(stdout);
    } catch (error) {
      logger.warn({ message: error.message, stdoutStart: stdout.slice(0, 200) }, MESSAGES.LOG);
      throw new AppError(MESSAGES.ANALYSIS_FAILED, {
        statusCode: http.STATUS_CODES.UNPROCESSABLE_ENTITY,
        code: CODES.ANALYSIS_FAILED,
        layer: Layer.ADAPTER,
        cause: error,
      });
    }
  },
});
