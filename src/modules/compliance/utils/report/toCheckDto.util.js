const toRuleDto = ({ ruleName, status, reasoning }) => ({ ruleName, status, reasoning });

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
    totalRules: check.rulesPassed + check.rulesFailed,
    sharedWithStudent: check.sharedWithStudent,
    studentEmail: check.studentEmail,
    rules: ruleResults.map(toRuleDto),
  };
}
