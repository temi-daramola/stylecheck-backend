import { currentReqId } from '../context/requestContext.js';

export const ResponseUtils = Object.freeze({
  success: (message, data = null, code = null) => ({
    status: 'success',
    message,
    data,
    code,
    requestId: currentReqId(),
  }),

  error: (message, code = 'INTERNAL_ERROR', data = null) => ({
    status: 'error',
    message,
    data,
    code,
    requestId: currentReqId(),
  }),
});
