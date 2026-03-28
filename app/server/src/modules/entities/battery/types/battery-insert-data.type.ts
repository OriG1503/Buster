import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { BATTERY_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type BatteryInsertData = EntityInsertData<typeof BATTERY_CONFIG['columns']>;
