import {
  createStyleManualDAO,
  findActiveStyleManualDAO,
  deactivateAllStyleManualsDAO,
} from './styleManual.dao.js';

export const dao = Object.freeze({
  create: createStyleManualDAO,
  findActive: findActiveStyleManualDAO,
  deactivateAll: deactivateAllStyleManualsDAO,
});
