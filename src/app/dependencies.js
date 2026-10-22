import { modules } from '@modules/_index.js';
import { adapters } from '@adapters/_index.js';

const { auth, supervisor, admin, styleManual, compliance } = modules;
const { jwtAdapter } = adapters.jwt;
const { passwordAdapter } = adapters.password;
const { geminiAdapter } = adapters.gemini;
const { docxTextAdapter } = adapters.docxText;
const { docxFormattingAdapter } = adapters.docxFormatting;
const { pdfAdapter } = adapters.pdf;
const { brevoAdapter } = adapters.brevo;
const { logger } = adapters.logging;

export function createDependencies() {
  // DAOs
  const supervisorDAO = new supervisor.dao.SupervisorDAO();
  const refreshTokenDAO = new auth.dao.RefreshTokenDAO();
  const passwordResetTokenDAO = new auth.dao.PasswordResetTokenDAO();
  const styleManualDAO = new styleManual.dao.StyleManualDAO();
  const checkDAO = new compliance.dao.ComplianceCheckDAO();
  const ruleResultDAO = new compliance.dao.RuleResultDAO();

  // Controllers
  const authController = new auth.controller.AuthController({
    supervisorDAO,
    refreshTokenDAO,
    passwordResetTokenDAO,
    passwordAdapter,
    jwtAdapter,
    brevoAdapter,
    logger,
  });
  const supervisorController = new supervisor.controller.SupervisorController(supervisorDAO);
  const adminController = new admin.controller.AdminController({
    supervisorDAO,
    refreshTokenDAO,
    passwordResetTokenDAO,
    passwordAdapter,
    jwtAdapter,
    brevoAdapter,
    logger,
  });
  const styleManualController = new styleManual.controller.StyleManualController(
    styleManualDAO,
    geminiAdapter
  );
  const complianceController = new compliance.controller.ComplianceController({
    checkDAO,
    ruleResultDAO,
    styleManualDAO,
    supervisorDAO,
    adapters: { docxTextAdapter, docxFormattingAdapter, geminiAdapter, pdfAdapter, brevoAdapter },
    logger,
  });

  return Object.freeze({
    auth: { authController },
    supervisor: { supervisorController },
    admin: { adminController, requireAdmin: admin.utils.createRequireAdmin(supervisorDAO) },
    styleManual: { styleManualController },
    compliance: { complianceController },
  });
}
