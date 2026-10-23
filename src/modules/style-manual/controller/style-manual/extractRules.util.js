import { common } from '@common/_index.js';
import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';
import { utils } from '@modules/style-manual/utils/_index.js';

const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES, MAX_OUTPUT_TOKENS, REQUEST_TIMEOUT_MS } = StyleManualConstants;
const { buildRuleExtractionPrompt, normalizeRules, findUncoveredReferences } = utils.ruleExtraction;
const UNPROCESSABLE = 422;

const rulesOf = (geminiResult) => (Array.isArray(geminiResult?.rules) ? geminiResult.rules : []);

/**
 * Sends a saved manual's text to the AI and returns the validated rules. Called with the controller as `this`.
 *
 * Pass 1 extracts everything. If the manual numbers its rules ([1], [2], ...), a generic check then lists any
 * number no extracted rule cites, and one follow-up request asks for just those. A failed follow-up fails the
 * whole processing (the manual stays saved and can be processed again): an incomplete rule list is worse than none.
 * The saved record is untouched on failure.
 */
export async function extractRules(extractedText) {
  const options = { maxOutputTokens: MAX_OUTPUT_TOKENS, timeoutMs: REQUEST_TIMEOUT_MS };
  const first = await this.geminiAdapter.generateJson(buildRuleExtractionPrompt(extractedText), options);
  let rawRules = rulesOf(first);

  const missing = findUncoveredReferences(extractedText, rawRules);
  if (missing.length > 0) {
    const followUp = await this.geminiAdapter.generateJson(
      buildRuleExtractionPrompt(extractedText, { onlyReferences: missing }),
      options
    );
    rawRules = [...rawRules, ...rulesOf(followUp)];
  }

  const rules = normalizeRules({ rules: rawRules });
  if (rules.length === 0) {
    throw new AppError(MESSAGES.NO_RULES_EXTRACTED, {
      statusCode: UNPROCESSABLE,
      code: CODES.NO_RULES_EXTRACTED,
      layer: Layer.CONTROLLER,
    });
  }

  const stillMissing = findUncoveredReferences(extractedText, rules);
  this.logger.info(
    { rules: rules.length, firstPass: rulesOf(first).length, followUpRequested: missing.length, stillUncovered: stillMissing },
    MESSAGES.EXTRACTION_SUMMARY_LOG
  );
  if (stillMissing.length > 0) {
    this.logger.warn({ uncovered: stillMissing }, MESSAGES.COVERAGE_GAP_LOG);
  }
  return rules;
}
