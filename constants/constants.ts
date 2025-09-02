export const MAX_UPLOAD_SIZE = 1024 * 1024 * 10;
export const MAX_DOWNLOAD_SIZE = 1024 * 1024 * 10;
export const UPLOAD_STRATEGY = {
  SINGLE: "single",
  MULTIPART: "multipart"
}
export enum FileUploadStatus {
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
  Canceled = "canceled",
  Stopped = "stopped"
}
