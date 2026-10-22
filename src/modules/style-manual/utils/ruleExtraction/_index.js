import { buildRuleExtractionPrompt } from '@modules/style-manual/utils/ruleExtraction/buildRuleExtractionPrompt.util.js';
import { normalizeRules } from '@modules/style-manual/utils/ruleExtraction/normalizeRules.util.js';

export const ruleExtraction = Object.freeze({
  buildRuleExtractionPrompt,
  normalizeRules,
});
