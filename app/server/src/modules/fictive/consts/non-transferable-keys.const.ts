/** Field keys that are metadata/infrastructure and must never be transferred between entities. */
export const NON_TRANSFERABLE_KEYS = new Set(['id', 'source', 'notes', 'sourceTime', 'createdAt', 'updatedAt', 'deletedAt']);
