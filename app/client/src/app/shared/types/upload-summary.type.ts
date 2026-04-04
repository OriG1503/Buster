export type UploadSummary = {
  conflictCount: number;
  conflictIds: number[];
  uploadPercentage: number;
  flyingFieldCount: number;
  reportFileName: string;
  unknownColumns: string[];
  totalColumnCount: number;
};
