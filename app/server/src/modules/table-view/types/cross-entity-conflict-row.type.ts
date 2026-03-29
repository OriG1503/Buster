export type CrossEntityConflictRow = {
  id: number;
  robotId: string;
  wiringId: string;
  fieldName: string;
  isSolved: boolean | null;
};
