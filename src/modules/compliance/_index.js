import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { dto } from './dto/_index.js';
import { routes } from './routes/_index.js';
import { utils } from './utils/_index.js';
import { ComplianceConstants } from './constants/compliance.constants.js';

export const compliance = Object.freeze({
  controller,
  dao,
  dto,
  routes,
  utils,
  constants: ComplianceConstants,
});
