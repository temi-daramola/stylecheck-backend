import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';

const { AppError } = common.errors;
const { Layer } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;
const { buildCompliancePrompt, alignResults } = utils.prompt;
const { computeScore } = utils.scoring;

/**
 * The AI step of a check, run on a saved (pending) check: ask Gemini, align the verdicts, store the
 * breakdown, then mark the check completed (which also discards the saved input). Safe to repeat:
 * it clears any earlier partial results first. Called with the controller as `this`.
 */
export async function analyseCheck(check, manual) {
  const { documentText, formattingProfile } = check.pendingInput;

  const prompt = buildCompliancePrompt({ rules: manual.rules, documentText, formattingProfile });
  const geminiResult = await this.adapters.geminiAdapter.generateJson(prompt);
  const results = alignResults(manual.rules, geminiResult);

  await this.ruleResultDAO.deleteByCheckId(check._id);
  const ruleResults = await this.ruleResultDAO.createMany(check._id, results);
  const completed = await this.checkDAO.complete(check._id, computeScore(results));

  return { completed, ruleResults };
}

/**
 * When the AI step fails, the check stays saved as pending. Tell the client its id (in the error's
 * `data`) so it can offer "Try again" without uploading the document again.
 */
export function withPendingReference(error, checkId) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(MESSAGES.CHECK_FAILED, { code: CODES.CHECK_FAILED, isOperational: false, layer: Layer.CONTROLLER, cause: error });
  appError.details = { pendingCheckId: checkId };
  return appError;
}
