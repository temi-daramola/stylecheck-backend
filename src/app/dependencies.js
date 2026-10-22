import { modules } from '@modules/_index.js';

const { auth, styleManual, compliance } = modules;

export function createDependencies() {
  // Auth dependencies
  const userDAO = auth.dao.user;
  const refreshTokenDAO = auth.dao.refreshToken;
  const loginController = new auth.controller.LoginController(userDAO, refreshTokenDAO);
  const refreshController = new auth.controller.RefreshController(userDAO, refreshTokenDAO);
  const logoutController = new auth.controller.LogoutController(refreshTokenDAO);
  const meController = new auth.controller.MeController(userDAO);

  // Style manual dependencies
  const styleManualDAO = styleManual.dao;
  const getActiveManualController = new styleManual.controller.GetActiveManualController(styleManualDAO);
  const uploadManualController = new styleManual.controller.UploadManualController(styleManualDAO);

  // Compliance dependencies
  const complianceDAO = compliance.dao;
  const createCheckController = new compliance.controller.CreateCheckController(complianceDAO);
  const getRecentChecksController = new compliance.controller.GetRecentChecksController(complianceDAO);
  const getCheckByIdController = new compliance.controller.GetCheckByIdController(complianceDAO);
  const shareReportController = new compliance.controller.ShareReportController(complianceDAO);

  return Object.freeze({
    auth: {
      userDAO,
      refreshTokenDAO,
      loginController,
      refreshController,
      logoutController,
      meController,
    },
    styleManual: {
      styleManualDAO,
      getActiveManualController,
      uploadManualController,
    },
    compliance: {
      complianceDAO,
      createCheckController,
      getRecentChecksController,
      getCheckByIdController,
      shareReportController,
    },
  });
}
