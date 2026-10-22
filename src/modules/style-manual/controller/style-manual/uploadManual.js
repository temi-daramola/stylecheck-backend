import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { utils } from '@modules/style-manual/utils/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = StyleManualConstants;
const { buildRuleExtractionPrompt, normalizeRules } = utils.ruleExtraction;

export async function uploadManual(supervisorId, { fileName, fileType, fileSize, extractedText }) {
  try {
    const prompt = buildRuleExtractionPrompt(extractedText);
    const geminiResult = await this.geminiAdapter.generateJson(prompt);

    const rules = normalizeRules(geminiResult);
    if (rules.length === 0) {
      throw new AppError(MESSAGES.NO_RULES_EXTRACTED, {
        statusCode: 422,
        code: CODES.NO_RULES_EXTRACTED,
        layer: Layer.CONTROLLER,
      });
    }

    const manual = await this.styleManualDAO.replaceForSupervisor(supervisorId, {
      fileName: fileName.trim(),
      fileType,
      fileSize,
      rules,
    });

    return ResponseUtils.success(MESSAGES.UPLOAD_SUCCESS, manual);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.UPLOAD_FAILED, {
      code: CODES.UPLOAD_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
