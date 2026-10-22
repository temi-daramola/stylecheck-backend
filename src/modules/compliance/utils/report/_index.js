import { toCheckSummaryDto, toCheckDetailDto } from '@modules/compliance/utils/report/toCheckDto.util.js';
import { buildReportData, buildReportFileName } from '@modules/compliance/utils/report/buildReportMeta.util.js';
import { buildShareEmailHtml, buildCompletionEmailHtml } from '@modules/compliance/utils/report/buildEmails.util.js';

export const report = Object.freeze({
  toCheckSummaryDto,
  toCheckDetailDto,
  buildReportData,
  buildReportFileName,
  buildShareEmailHtml,
  buildCompletionEmailHtml,
});
