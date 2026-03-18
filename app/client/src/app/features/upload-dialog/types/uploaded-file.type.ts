export type UploadStatus = 'success' | 'warning' | 'pending' | 'error';

export type UploadedFile = {
  name: string;
  successRate: number;
  newConflictsCount: number;
  status: UploadStatus;
  reportFileName?: string;
  errorMessage?: string;
};
