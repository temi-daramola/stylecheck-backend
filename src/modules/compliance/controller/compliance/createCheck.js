import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError, ValidationError, ForbiddenError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, MAX_DOCUMENT_TEXT_LENGTH, MIN_DOCUMENT_TEXT_LENGTH } = ComplianceConstants;
const { buildCompliancePrompt, alignResults } = utils.prompt;
const { computeScore } = utils.scoring;
const { removeFile } = utils.upload;
const { toCheckDetailDto } = utils.report;

export async function createCheck(supervisorId, { studentName, chapterSection, file }) {
  try {
    if (!file) {
      throw new ValidationError(MESSAGES.FILE_REQUIRED, { layer: Layer.CONTROLLER });
    }

    // Server-side gate: the dashboard lock is advisory, this is the authority.
    const manual = await this.styleManualDAO.findBySupervisorId(supervisorId);
    if (!manual || manual.rules.length === 0) {
      throw new ForbiddenError(MESSAGES.MANUAL_REQUIRED, { layer: Layer.CONTROLLER, code: CODES.MANUAL_REQUIRED });
    }

    // Text (content rules) and formatting (formatting rules) come from the same file, in parallel.
    const [documentText, formattingProfile] = await Promise.all([
      this.adapters.docxTextAdapter.extractText(file.path),
      this.adapters.docxFormattingAdapter.extractFormatting(file.path),
    ]);

    if (documentText.trim().length < MIN_DOCUMENT_TEXT_LENGTH) {
      throw new ValidationError(MESSAGES.DOCUMENT_EMPTY, { layer: Layer.CONTROLLER });
    }
    if (documentText.length > MAX_DOCUMENT_TEXT_LENGTH) {
      throw new ValidationError(MESSAGES.DOCUMENT_TOO_LONG, { layer: Layer.CONTROLLER });
    }

    const prompt = buildCompliancePrompt({ rules: manual.rules, documentText, formattingProfile });
    const geminiResult = await this.adapters.geminiAdapter.generateJson(prompt);
    const results = alignResults(manual.rules, geminiResult);

    const check = await this.checkDAO.create({
      supervisorId,
      studentName,
      chapterSection,
      documentFileName: file.originalname,
      ...computeScore(results),
    });

    let ruleResults;
    try {
      ruleResults = await this.ruleResultDAO.createMany(check._id, results);
    } catch (error) {
      // Never leave a check without its breakdown behind.
      await this.checkDAO.deleteById(check._id);
      throw error;
    }

    this.notifySupervisor(supervisorId, check);

    return ResponseUtils.success(MESSAGES.CHECK_SUCCESS, toCheckDetailDto(check, ruleResults));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.CHECK_FAILED, {
      code: CODES.CHECK_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  } finally {
    // The student document is never kept: remove it whether the check succeeded or failed.
    await removeFile(file?.path).catch((error) =>
      this.logger.warn({ err: error }, 'Could not remove temporary upload')
    );
  }
}
