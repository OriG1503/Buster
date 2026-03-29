/** Maps entity table name to its Excel template asset. */
export const FORMAT_OPTION_ASSET_PATHS: Record<string, { assetPath: string; filename: string }> = {
  robots: { assetPath: 'assets/templates/robot_template.xlsx', filename: 'robot_template.xlsx' },
  batteries: { assetPath: 'assets/templates/battery_template.xlsx', filename: 'battery_template.xlsx' },
  cardboards: { assetPath: 'assets/templates/cardboard_template.xlsx', filename: 'cardboard_template.xlsx' },
  sensors: { assetPath: 'assets/templates/sensor_template.xlsx', filename: 'sensor_template.xlsx' },
  wirings: { assetPath: 'assets/templates/wiring_template.xlsx', filename: 'wiring_template.xlsx' },
  communications: { assetPath: 'assets/templates/communication_template.xlsx', filename: 'communication_template.xlsx' },
  storages: { assetPath: 'assets/templates/storage_template.xlsx', filename: 'storage_template.xlsx' },
  plastics: { assetPath: 'assets/templates/plastic_template.xlsx', filename: 'plastic_template.xlsx' },
  irons: { assetPath: 'assets/templates/iron_template.xlsx', filename: 'iron_template.xlsx' },
};
