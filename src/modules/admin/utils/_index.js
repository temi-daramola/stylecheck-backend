import { generateTempPassword } from '@modules/admin/utils/tempPassword.util.js';
import { buildInviteLink, buildInviteEmailHtml } from '@modules/admin/utils/buildInviteEmail.util.js';
import { toSupervisorDto } from '@modules/admin/utils/toSupervisorDto.util.js';
import { createRequireAdmin } from '@modules/admin/utils/requireAdmin.middleware.js';

export const utils = Object.freeze({
  generateTempPassword,
  buildInviteLink,
  buildInviteEmailHtml,
  toSupervisorDto,
  createRequireAdmin,
});
