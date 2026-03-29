import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { IRON_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type IronInsertData = EntityInsertData<typeof IRON_CONFIG['columns']>;
