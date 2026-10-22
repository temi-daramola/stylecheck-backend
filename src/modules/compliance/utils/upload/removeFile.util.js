import fs from 'node:fs/promises';

/** Deletes a temporary upload. Already-gone files are fine: cleanup may run twice. */
export async function removeFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
