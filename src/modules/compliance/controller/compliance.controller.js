import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ResponseUtils } = common.utilities;
const { NotFoundError, ValidationError } = common.errors;
const { Layer } = common.constants;

export class CreateCheckController {
  constructor(complianceDAO) {
    this.complianceDAO = complianceDAO;
  }

  async execute({ studentName, chapter, file, userId }) {
    if (!studentName || !studentName.trim()) {
      throw new ValidationError(ComplianceConstants.MESSAGES.STUDENT_NAME_REQUIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    if (!chapter || !chapter.trim()) {
      throw new ValidationError(ComplianceConstants.MESSAGES.CHAPTER_REQUIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    if (!file) {
      throw new ValidationError(ComplianceConstants.MESSAGES.FILE_REQUIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    const rulesBreakdown = ComplianceConstants.DEFAULT_RULES.map((rule) => ({
      ruleId: rule.ruleId,
      ruleName: rule.ruleName,
      status: rule.defaultStatus,
      description: rule.description,
    }));

    const passedCount = rulesBreakdown.filter((r) => r.status === 'Passed').length;
    const failedCount = rulesBreakdown.filter((r) => r.status === 'Failed').length;
    const totalRules = rulesBreakdown.length;
    const overallScore = Math.round((passedCount / totalRules) * 100);

    let status = 'Partial Compliance';
    if (overallScore >= 90) status = 'Full Compliance';
    else if (overallScore < 60) status = 'Non-Compliant';

    const checkRecord = await this.complianceDAO.create({
      studentName: studentName.trim(),
      chapter: chapter.trim(),
      documentName: file.originalname,
      documentSize: file.size,
      overallScore,
      status,
      passedCount,
      failedCount,
      totalRules,
      rulesBreakdown,
      checkedAt: new Date(),
      supervisorId: userId || null,
    });

    return ResponseUtils.success(ComplianceConstants.MESSAGES.CHECK_SUCCESS, checkRecord);
  }
}

export class GetRecentChecksController {
  constructor(complianceDAO) {
    this.complianceDAO = complianceDAO;
  }

  async execute() {
    const checks = await this.complianceDAO.findRecent(20);
    return ResponseUtils.success(ComplianceConstants.MESSAGES.FETCH_SUCCESS, checks);
  }
}

export class GetCheckByIdController {
  constructor(complianceDAO) {
    this.complianceDAO = complianceDAO;
  }

  async execute(id) {
    const check = await this.complianceDAO.findById(id);
    if (!check) {
      throw new NotFoundError(ComplianceConstants.MESSAGES.NOT_FOUND, {
        layer: Layer.CONTROLLER,
      });
    }
    return ResponseUtils.success(ComplianceConstants.MESSAGES.CHECK_DETAIL_SUCCESS, check);
  }
}

export class ShareReportController {
  constructor(complianceDAO) {
    this.complianceDAO = complianceDAO;
  }

  async execute(id, { studentEmail, additionalMessage }) {
    if (!studentEmail || !studentEmail.includes('@')) {
      throw new ValidationError(ComplianceConstants.MESSAGES.EMAIL_REQUIRED, {
        layer: Layer.CONTROLLER,
      });
    }

    const check = await this.complianceDAO.findById(id);
    if (!check) {
      throw new NotFoundError(ComplianceConstants.MESSAGES.NOT_FOUND, {
        layer: Layer.CONTROLLER,
      });
    }

    const updated = await this.complianceDAO.updateShare(id, {
      studentEmail,
      sharedMessage: additionalMessage || '',
      sharedAt: new Date(),
    });

    return ResponseUtils.success(ComplianceConstants.MESSAGES.SHARE_SUCCESS, updated);
  }
}
