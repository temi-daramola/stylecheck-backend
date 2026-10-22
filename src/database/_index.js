import { database } from './database.js';
import { models } from './models/_index.js';

export const db = Object.freeze({
  database,
  models,
});

