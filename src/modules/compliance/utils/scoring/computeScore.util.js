import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { STATUS, BANDS, BAND_THRESHOLDS } = ComplianceConstants;
const PERCENT = 100;

export function bandForScore(score) {
  if (score >= BAND_THRESHOLDS.FULL_MIN) return BANDS.FULL;
  if (score >= BAND_THRESHOLDS.PARTIAL_MIN) return BANDS.PARTIAL;
  return BANDS.NON_COMPLIANT;
}

/**
 * The score is always computed here, never by the AI:
 * score = passed / (passed + failed) * 100, rounded. "Not verifiable" rules are left out entirely.
 */
export function computeScore(results) {
  const rulesPassed = results.filter((result) => result.status === STATUS.PASSED).length;
  const rulesFailed = results.filter((result) => result.status === STATUS.FAILED).length;
  const rulesNotVerifiable = results.length - rulesPassed - rulesFailed;
  const checked = rulesPassed + rulesFailed;
  const complianceScore = checked === 0 ? 0 : Math.round((rulesPassed / checked) * PERCENT);

  return {
    complianceScore,
    complianceBand: bandForScore(complianceScore),
    rulesPassed,
    rulesFailed,
    rulesNotVerifiable,
  };
}
