from dataclasses import dataclass
from typing import Optional


@dataclass
class Sales:
    sales_UUID: str
    carrier: Optional[str] = None
    online_store_name: Optional[str] = None
    sales_person: Optional[str] = None
    is_purchased: Optional[bool] = None
    is_stock_ashdod: Optional[bool] = None
    is_stock_telaviv: Optional[bool] = None
    is_stock_rehovot: Optional[bool] = None
    notes: Optional[str] = None
    data_source: Optional[str] = None
    last_update_date: Optional[str] = None
    source: Optional[str] = None
