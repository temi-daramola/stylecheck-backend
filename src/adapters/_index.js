import { jwt } from './jwt/_index.js';
import { password } from './password/_index.js';
import { gemini } from './gemini/_index.js';
import { logging } from './logging/_index.js';
import { docxText } from './docx-text/_index.js';
import { docxFormatting } from './docx-formatting/_index.js';
import { pdf } from './pdf/_index.js';
import { brevo } from './brevo/_index.js';
import { rateLimit } from './rate-limit/_index.js';

export const adapters = Object.freeze({
  jwt,
  password,
  gemini,
  logging,
  docxText,
  docxFormatting,
  pdf,
  brevo,
  rateLimit,
});
