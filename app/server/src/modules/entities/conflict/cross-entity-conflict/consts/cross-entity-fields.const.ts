/** Fields that are shared between Robot and Wiring and must remain consistent. */
export const CROSS_ENTITY_FIELDS = ['district', 'storeName'] as const;

export type CrossEntityField = (typeof CROSS_ENTITY_FIELDS)[number];
