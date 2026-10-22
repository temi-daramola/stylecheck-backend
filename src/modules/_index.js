import { auth } from './auth/_index.js';
import { supervisor } from './supervisor/_index.js';
import { styleManual } from './style-manual/_index.js';
import { compliance } from './compliance/_index.js';

export const modules = Object.freeze({
  auth,
  supervisor,
  styleManual,
  compliance,
});
