export const SupervisorConstants = Object.freeze({
  RESOURCE: 'Supervisor',
  PREFERENCE_KEYS: Object.freeze(['emailNotifications', 'showScoreOnDashboard']),
  MESSAGES: Object.freeze({
    PROFILE_FETCHED: 'Supervisor profile retrieved',
    PREFERENCES_UPDATED: 'Preferences updated',
    PREFERENCE_MUST_BE_BOOLEAN: 'Preference value must be true or false',
    NO_PREFERENCES_PROVIDED: 'At least one preference must be provided',
    GET_PROFILE_FAILED: 'Failed to retrieve supervisor profile',
    UPDATE_PREFERENCES_FAILED: 'Failed to update preferences',
  }),
  CODES: Object.freeze({
    GET_PROFILE_FAILED: 'GET_PROFILE_FAILED',
    UPDATE_PREFERENCES_FAILED: 'UPDATE_PREFERENCES_FAILED',
  }),
  API: Object.freeze({
    BASE: '/api/supervisors',
    ME: '/me',
    ME_PREFERENCES: '/me/preferences',
  }),
});
