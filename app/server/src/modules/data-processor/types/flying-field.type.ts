export type FlyingField = {
  entity: string;
  rowIndex: number;
  /** camelCase data fields whose values exist in the CSV but couldn't be saved → colored red */
  redFields: string[];
  /** camelCase data fields that are empty but should be filled for the row to be saved → colored yellow */
  yellowFields: string[];
  /** true → UUID cell is red (entity was skipped despite having a UUID); false → UUID cell is yellow (UUID is missing) */
  isUuidRed: boolean;
};
