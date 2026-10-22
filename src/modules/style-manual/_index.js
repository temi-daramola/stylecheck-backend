import { controller } from './controller/_index.js';
import { dao } from './dao/_index.js';
import { routes } from './routes/_index.js';
import { StyleManualConstants } from './constants/styleManual.constants.js';

export const styleManual = Object.freeze({
  controller,
  dao,
  routes,
  constants: StyleManualConstants,
});
