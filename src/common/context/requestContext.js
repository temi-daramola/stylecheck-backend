import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';
const als = new AsyncLocalStorage();

export function requestContextMiddleware(req, res, next) {
  const reqId = req.headers[REQUEST_ID_HEADER] || randomUUID();
  res.setHeader(REQUEST_ID_HEADER, reqId);
  als.run({ reqId }, () => next());
}

export function currentReqId() {
  return als.getStore()?.reqId || randomUUID();
}
