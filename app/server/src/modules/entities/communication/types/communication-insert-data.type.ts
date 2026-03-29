import { EntityInsertData } from '../../../../shared/types/entity-config.type';
import { COMMUNICATION_CONFIG } from '../../../../shared/consts/entity-configs.const';

export type CommunicationInsertData = EntityInsertData<typeof COMMUNICATION_CONFIG['columns']>;
