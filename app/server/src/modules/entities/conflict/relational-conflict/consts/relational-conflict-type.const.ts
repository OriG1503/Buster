export const RELATIONAL_CONFLICT_TYPE = {
  TWO_CHILDS: 'TWO_CHILDS',
  TWO_FATHERS: 'TWO_FATHERS',
} as const;

export type RelationalConflictType = (typeof RELATIONAL_CONFLICT_TYPE)[keyof typeof RELATIONAL_CONFLICT_TYPE];
