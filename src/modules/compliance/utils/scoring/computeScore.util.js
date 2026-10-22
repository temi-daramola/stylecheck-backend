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
 * score = passed / total * 100, rounded to the nearest whole number.
 */
export function computeScore(results) {
  const rulesPassed = results.filter((result) => result.status === STATUS.PASSED).length;
  const rulesFailed = results.length - rulesPassed;
  const complianceScore = results.length === 0 ? 0 : Math.round((rulesPassed / results.length) * PERCENT);

  return {
    complianceScore,
    complianceBand: bandForScore(complianceScore),
    rulesPassed,
    rulesFailed,
  };
}
