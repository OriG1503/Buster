/** Maps each Excel row number to the sets of column names that need highlighting. */
export type FlyingCellMap = Map<number, { redCols: Set<string>; yellowCols: Set<string> }>;
