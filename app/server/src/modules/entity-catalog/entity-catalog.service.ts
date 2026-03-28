import { Injectable } from '@nestjs/common';
import { ENTITY_CONFIGS, EntityCatalogConfig } from '../../shared/consts/entity-configs.const';

@Injectable()
export class EntityCatalogService {
  /** Returns the full entity catalog config to be served to the client. */
  public getConfigs(): EntityCatalogConfig {
    return ENTITY_CONFIGS;
  }

  /**
   * Builds a flat map from CSV column header → parser field name.
   * Used to translate user-facing CSV column headers back to the snake_case
   * names the Python parser expects. Uses csvHeader (not label) since CSV
   * templates use disambiguated headers (e.g., "מחוז רובוט" vs "מחוז").
   */
  public buildCsvHeaderToParserFieldMap(): Map<string, string> {
    const map = new Map<string, string>();
    Object.values(ENTITY_CONFIGS).forEach((entityConfig) => {
      Object.values(entityConfig.columns).forEach(({ csvHeader, parserFieldName }) => {
        map.set(csvHeader, parserFieldName);
      });
    });
    return map;
  }
}
