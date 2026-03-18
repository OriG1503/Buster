export type EntityFormatOption = {
  label: string;
  assetPath: string;
  filename: string;
};

export const ENTITY_FORMAT_OPTIONS: EntityFormatOption[] = [
  { label: 'פורמט רובוטים', assetPath: 'assets/templates/robot_template.xlsx', filename: 'robot_template.xlsx' },
  { label: 'פורמט סוללות', assetPath: 'assets/templates/battery_template.xlsx', filename: 'battery_template.xlsx' },
  {
    label: 'פורמט קרטונים',
    assetPath: 'assets/templates/cardboard_template.xlsx',
    filename: 'cardboard_template.xlsx',
  },
  { label: 'פורמט חיישנים', assetPath: 'assets/templates/sensor_template.xlsx', filename: 'sensor_template.xlsx' },
  { label: 'פורמט חיווט', assetPath: 'assets/templates/wiring_template.xlsx', filename: 'wiring_template.xlsx' },
  {
    label: 'פורמט תקשורת',
    assetPath: 'assets/templates/communication_template.xlsx',
    filename: 'communication_template.xlsx',
  },
  { label: 'פורמט אחסון', assetPath: 'assets/templates/storage_template.xlsx', filename: 'storage_template.xlsx' },
  {
    label: 'פורמט פלסטיקים',
    assetPath: 'assets/templates/plastic_template.xlsx',
    filename: 'plastic_template.xlsx',
  },
  { label: 'פורמט ברזלים', assetPath: 'assets/templates/iron_template.xlsx', filename: 'iron_template.xlsx' },
  { label: 'פורמט מכירות', assetPath: 'assets/templates/sale_template.xlsx', filename: 'sale_template.xlsx' },
];
