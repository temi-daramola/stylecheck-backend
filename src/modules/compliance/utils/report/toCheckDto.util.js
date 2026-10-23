const toRuleDto = ({ ruleId, ruleName, sourceRef, status, reasoning }) => ({ ruleId, ruleName, sourceRef, status, reasoning });

export function toCheckSummaryDto(check) {
  return {
    id: check._id,
    studentName: check.studentName,
    chapterSection: check.chapterSection,
    complianceScore: check.complianceScore,
    complianceBand: check.complianceBand,
    checkDate: check.checkDate,
  };
}

export function toCheckDetailDto(check, ruleResults) {
  return {
    ...toCheckSummaryDto(check),
    documentFileName: check.documentFileName,
    rulesPassed: check.rulesPassed,
    rulesFailed: check.rulesFailed,
    rulesNotVerifiable: check.rulesNotVerifiable ?? 0,
    totalRules: check.rulesPassed + check.rulesFailed + (check.rulesNotVerifiable ?? 0),
    sharedWithStudent: check.sharedWithStudent,
    studentEmail: check.studentEmail,
    rules: ruleResults.map(toRuleDto),
  };
}
