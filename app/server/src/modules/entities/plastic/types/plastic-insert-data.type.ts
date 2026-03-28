import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { PLASTIC_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type PlasticInsertData = EntityInsertData<typeof PLASTIC_CONFIG['columns']>;
