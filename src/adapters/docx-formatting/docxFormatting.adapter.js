import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { env } from '@common/constants/env.constants.js';
import { Layer } from '@common/constants/layer.constants.js';
import { AppError } from '@common/errors/AppError.js';
import { ValidationError } from '@common/errors/subclasses.js';

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.resolve('scripts/extract_formatting.py');
const TIMEOUT_MS = 60000;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const UNREADABLE_MESSAGE = 'This file could not be read as a .docx document.';
const EXTRACTION_FAILED_MESSAGE = 'Could not extract formatting from the document.';
const EXTRACTION_FAILED_CODE = 'FORMATTING_EXTRACTION_FAILED';

export const docxFormattingAdapter = Object.freeze({
  /**
   * Runs the python-docx script and returns the resolved formatting profile.
   * Two failure kinds: the script rejected the file (a bad document, the supervisor's problem),
   * or python itself could not run (a server problem, logged loudly).
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
      // Script ran and exited non-zero: the document itself is unreadable.
      if (typeof error.code === 'number' && error.code === 1) {
        throw new ValidationError(UNREADABLE_MESSAGE, { layer: Layer.ADAPTER, cause: error });
      }
      // Python missing, timed out, or crashed: treat as a server fault.
      throw new AppError(EXTRACTION_FAILED_MESSAGE, {
        code: EXTRACTION_FAILED_CODE,
        isOperational: false,
        layer: Layer.ADAPTER,
        cause: error,
      });
    }

    try {
      return JSON.parse(stdout);
    } catch (error) {
      throw new AppError(EXTRACTION_FAILED_MESSAGE, {
        code: EXTRACTION_FAILED_CODE,
        isOperational: false,
        layer: Layer.ADAPTER,
        cause: error,
      });
    }
  },
});
