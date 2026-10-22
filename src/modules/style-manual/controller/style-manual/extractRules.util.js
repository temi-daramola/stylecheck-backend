import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { utils } from '@modules/style-manual/utils/_index.js';

const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = StyleManualConstants;
const { buildRuleExtractionPrompt, normalizeRules } = utils.ruleExtraction;
const UNPROCESSABLE = 422;

/**
 * Sends a saved manual's text to the AI and returns the validated rules. Throws if nothing usable
 * came back. Called with the controller as `this`. The saved record is untouched on failure.
 */
export async function extractRules(extractedText) {
  const geminiResult = await this.geminiAdapter.generateJson(buildRuleExtractionPrompt(extractedText));

  const rules = normalizeRules(geminiResult);
  if (rules.length === 0) {
    throw new AppError(MESSAGES.NO_RULES_EXTRACTED, {
      statusCode: UNPROCESSABLE,
      code: CODES.NO_RULES_EXTRACTED,
      layer: Layer.CONTROLLER,
    });
  }
  return rules;
}
