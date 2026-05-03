import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { CARDBOARD_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type CardboardInsertData = EntityInsertData<(typeof CARDBOARD_CONFIG)['columns']>;
