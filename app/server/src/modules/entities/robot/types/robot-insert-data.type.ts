import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { ROBOT_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type RobotInsertData = EntityInsertData<(typeof ROBOT_CONFIG)['columns']>;
