import { Injectable } from '@nestjs/common';
import { DISPLAY_NAMES_CONFIG } from './display-names.config';
import { DisplayNamesConfig } from './types/display-names-config.type';

@Injectable()
export class DisplayNamesService {
  /** Returns the full display-names config to be served to the client. */
  public getConfig(): DisplayNamesConfig {
    return DISPLAY_NAMES_CONFIG;
  }

  /**
   * Builds a flat reverse map from display label → parser field name.
   * Used to translate user-facing CSV column headers back to the snake_case
   * names the Python parser expects.
   */
  public buildLabelToParserFieldMap(): Map<string, string> {
    const map = new Map<string, string>();
    Object.values(DISPLAY_NAMES_CONFIG).forEach((entityConfig) => {
      Object.values(entityConfig.columns).forEach(({ label, parserFieldName }) => {
        map.set(label, parserFieldName);
      });
    });
    return map;
  }
}
