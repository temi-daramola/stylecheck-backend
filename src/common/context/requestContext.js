import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const als = new AsyncLocalStorage();

export function requestContextMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', reqId);
  als.run({ reqId }, () => next());
}

export function currentReqId() {
  return als.getStore()?.reqId || randomUUID();
}
