import { controller } from './controller/_index.js';
import { dto } from './dto/_index.js';
import { routes } from './routes/_index.js';
import { utils } from './utils/_index.js';
import { AdminConstants } from './constants/admin.constants.js';

export const admin = Object.freeze({
  controller,
  dto,
  routes,
  utils,
  constants: AdminConstants,
});
