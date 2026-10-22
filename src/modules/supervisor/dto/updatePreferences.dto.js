import { common } from '@common/_index.js';
import { SupervisorConstants } from '@modules/supervisor/constants/supervisor.constants.js';

const { body } = common.utilities.validation;
const { validateRequest } = common.middleware;
const { MESSAGES, PREFERENCE_KEYS } = SupervisorConstants;

const preferenceChains = PREFERENCE_KEYS.map((key) =>
  body(key).optional().isBoolean({ strict: true }).withMessage(MESSAGES.PREFERENCE_MUST_BE_BOOLEAN)
);

const atLeastOnePreference = body().custom((value, { req }) => {
  if (!PREFERENCE_KEYS.some((key) => key in req.body)) {
    throw new Error(MESSAGES.NO_PREFERENCES_PROVIDED);
  }
  return true;
});

export const updatePreferencesValidation = [...preferenceChains, atLeastOnePreference, validateRequest];
