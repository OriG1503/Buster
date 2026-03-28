export type RobotInsertData = {
  id: string;
  cardboardId: string | null;
  sensorId: string | null;
  communicationId: string | null;
  wiringId: string | null;
  carrier: string | null;
  isPurchased: boolean | null;
  district: string | null;
  storeName: string | null;
  isStockAshdod: boolean | null;
  isStockTelAviv: boolean | null;
  isStockRehovot: boolean | null;
  isStockNetanya: boolean | null;
  isStockAfula: boolean | null;
};
