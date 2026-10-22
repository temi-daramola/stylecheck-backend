import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';
import { utils } from '@modules/compliance/utils/_index.js';

const { ResponseUtils } = common.utilities;
const { AppError } = common.errors;
const { Layer, PaginationConstants } = common.constants;
const { MESSAGES, CODES } = ComplianceConstants;
const { toCheckSummaryDto } = utils.report;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export async function listChecks(supervisorId, query) {
  try {
    const page = toPositiveInt(query.page, PaginationConstants.DEFAULT_PAGE);
    const pageSize = Math.min(
      toPositiveInt(query.pageSize, PaginationConstants.DEFAULT_PAGE_SIZE),
      PaginationConstants.MAX_PAGE_SIZE
    );

    const [checks, totalCount] = await Promise.all([
      this.checkDAO.findPaginatedBySupervisor(supervisorId, { page, pageSize }),
      this.checkDAO.countBySupervisor(supervisorId),
    ]);

    return ResponseUtils.success(MESSAGES.LIST_SUCCESS, {
      items: checks.map(toCheckSummaryDto),
      totalCount,
      pageSize,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(MESSAGES.LIST_FAILED, {
      code: CODES.LIST_FAILED,
      isOperational: false,
      layer: Layer.CONTROLLER,
      cause: error,
    });
  }
}
