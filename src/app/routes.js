import { modules } from '@modules/_index.js';
import { common } from '@common/_index.js';

const { auth, styleManual, compliance } = modules;
const { ResponseUtils } = common.utilities;

export function registerRoutes(app, dependencies) {
  // Health check
  app.get('/health', (req, res) => {
    res.json(ResponseUtils.success('StyleCheck backend service is healthy', { uptime: process.uptime() }));
  });

  // Mount API modules
  app.use('/api/auth', auth.routes.createAuthRoutes(dependencies.auth));
  app.use('/api/style-manual', styleManual.routes.createStyleManualRoutes(dependencies.styleManual));
  app.use('/api/compliance', compliance.routes.createComplianceRoutes(dependencies.compliance));
}
