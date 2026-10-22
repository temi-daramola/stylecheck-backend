import { scoring } from '@modules/compliance/utils/scoring/_index.js';
import { prompt } from '@modules/compliance/utils/prompt/_index.js';
import { report } from '@modules/compliance/utils/report/_index.js';
import { upload } from '@modules/compliance/utils/upload/_index.js';

export const utils = Object.freeze({
  scoring,
  prompt,
  report,
  upload,
});
