export type UploadStatus = 'success' | 'warning' | 'pending' | 'error';

export type UploadedFile = {
  id: string;
  name: string;
  successRate: number;
  newConflictsCount: number;
  conflictIds: number[];
  status: UploadStatus;
  reportFileName?: string;
  errorMessage?: string;
};
