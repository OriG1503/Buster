import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { WIRING_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type WiringInsertData = EntityInsertData<(typeof WIRING_CONFIG)['columns']>;
