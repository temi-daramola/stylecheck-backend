import {
  createComplianceCheckDAO,
  findRecentChecksDAO,
  findCheckByIdDAO,
  updateCheckShareDAO,
} from './compliance.dao.js';

export const dao = Object.freeze({
  create: createComplianceCheckDAO,
  findRecent: findRecentChecksDAO,
  findById: findCheckByIdDAO,
  updateShare: updateCheckShareDAO,
});
