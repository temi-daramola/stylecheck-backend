import { buildCompliancePrompt } from '@modules/compliance/utils/prompt/buildCompliancePrompt.util.js';
import { alignResults } from '@modules/compliance/utils/prompt/alignResults.util.js';

export const prompt = Object.freeze({
  buildCompliancePrompt,
  alignResults,
});
