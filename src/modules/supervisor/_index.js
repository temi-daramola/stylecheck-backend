import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { dto } from './dto/_index.js';
import { routes } from './routes/_index.js';
import { SupervisorConstants } from './constants/supervisor.constants.js';

export const supervisor = Object.freeze({
  controller,
  dao,
  dto,
  routes,
  constants: SupervisorConstants,
});
