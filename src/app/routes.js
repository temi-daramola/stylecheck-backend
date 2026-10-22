import { modules } from '@modules/_index.js';
import { common } from '@common/_index.js';

const { auth, supervisor, styleManual, compliance } = modules;
const { ResponseUtils } = common.utilities;
const { messages } = common.constants;

const HEALTH_PATH = '/health';

export function registerRoutes(app, dependencies) {
  app.get(HEALTH_PATH, (req, res) => {
    res.json(ResponseUtils.success(messages.COMMON.HEALTH_OK, { uptime: process.uptime() }));
  });

  app.use(auth.constants.API.BASE, auth.routes.createAuthRoutes(dependencies.auth));
  app.use(supervisor.constants.API.BASE, supervisor.routes.createSupervisorRoutes(dependencies.supervisor));
  app.use(styleManual.constants.API.BASE, styleManual.routes.createStyleManualRoutes(dependencies.styleManual));
  app.use(compliance.constants.API.BASE, compliance.routes.createComplianceRoutes(dependencies.compliance));
}
