import { currentReqId } from '@common/context/requestContext.js';
import { http } from '@common/constants/http.constants.js';

export const ResponseUtils = Object.freeze({
  success: (message, data = null, code = null) => ({
    status: http.STATUS.SUCCESS,
    message,
    data,
    code,
    requestId: currentReqId(),
  }),

  error: (message, code = http.CODES.INTERNAL_ERROR, data = null) => ({
    status: http.STATUS.ERROR,
    message,
    data,
    code,
    requestId: currentReqId(),
  }),
});
