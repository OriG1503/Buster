import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { STORAGE_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type StorageInsertData = EntityInsertData<typeof STORAGE_CONFIG['columns']>;
