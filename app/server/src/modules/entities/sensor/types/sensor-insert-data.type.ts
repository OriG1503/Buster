import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { SENSOR_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type SensorInsertData = EntityInsertData<typeof SENSOR_CONFIG['columns']>;
