const toPendingDto = (pending) =>
  pending
    ? { fileName: pending.fileName, fileType: pending.fileType, fileSize: pending.fileSize, uploadDate: pending.uploadDate }
    : null;

/** What a client may see: never the saved text. `pending` is a replacement waiting to be processed. */
export const toManualDto = (manual) => ({
  id: manual._id,
  fileName: manual.fileName,
  fileType: manual.fileType,
  fileSize: manual.fileSize,
  uploadDate: manual.uploadDate,
  status: manual.status,
  rules: manual.rules,
  pending: toPendingDto(manual.pending),
});
