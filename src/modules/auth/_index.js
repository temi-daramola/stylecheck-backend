import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { dto } from './dto/_index.js';
import { routes } from './routes/_index.js';
import { AuthConstants } from './constants/auth.constants.js';

export const auth = Object.freeze({
  controller,
  dao,
  dto,
  routes,
  constants: AuthConstants,
});
