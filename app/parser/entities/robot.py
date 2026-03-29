from dataclasses import dataclass
from typing import Optional


@dataclass
class Robot:
    robot_UUID: str
    cardboard_UUID: Optional[str] = None
    sensor_UUID: Optional[str] = None
    communication_UUID: Optional[str] = None
    wiring_UUID: Optional[str] = None
    carrier: Optional[str] = None
    is_purchased: Optional[bool] = None
    robot_district: Optional[str] = None
    robot_store_name: Optional[str] = None
    robot_is_stock_ashdod: Optional[bool] = None
    robot_is_stock_tel_aviv: Optional[bool] = None
    robot_is_stock_rehovot: Optional[bool] = None
    robot_is_stock_netanya: Optional[bool] = None
    robot_is_stock_afula: Optional[bool] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    source_time: Optional[str] = None
