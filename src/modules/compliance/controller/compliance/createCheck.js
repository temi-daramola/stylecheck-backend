import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';
import { requireReadyManual } from '@modules/compliance/controller/compliance/requireReadyManual.util.js';
import { analyseCheck, withPendingReference } from '@modules/compliance/controller/compliance/analyseCheck.util.js';

const { ResponseUtils } = common.utilities;
const { AppError, ValidationError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, MAX_DOCUMENT_TEXT_LENGTH, MIN_DOCUMENT_TEXT_LENGTH } = ComplianceConstants;
const { removeFile } = utils.upload;
const { toCheckDetailDto } = utils.report;

/**
 * One ordinary request in three steps: read the document, save the check as pending (so the work
 * survives an AI failure), then run the AI analysis. If the analysis fails, the error carries the
 * pending check's id and the supervisor can retry without uploading the document again.
 */
export async function createCheck(supervisorId, { studentName, chapterSection, file }) {
  try {
    if (!file) {
      throw new ValidationError(MESSAGES.FILE_REQUIRED, { layer: Layer.CONTROLLER });
    }

    const manual = await requireReadyManual.call(this, supervisorId);

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

    // From here on the document's content is safe in the database, so the uploaded file is not needed again.
    const pending = await this.checkDAO.createPending({
      supervisorId,
      studentName,
      chapterSection,
      documentFileName: file.originalname,
      pendingInput: { documentText, formattingProfile },
    });

    let analysis;
    try {
      analysis = await analyseCheck.call(this, pending, manual);
    } catch (error) {
      throw withPendingReference(error, pending._id);
    }

    this.notifySupervisor(supervisorId, analysis.completed);
    return ResponseUtils.success(MESSAGES.CHECK_SUCCESS, toCheckDetailDto(analysis.completed, analysis.ruleResults));
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
