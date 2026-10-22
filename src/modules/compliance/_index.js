import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { routes } from './routes/_index.js';
import { ComplianceConstants } from './constants/compliance.constants.js';

export const compliance = Object.freeze({
  controller,
  dao,
  routes,
  constants: ComplianceConstants,
});
