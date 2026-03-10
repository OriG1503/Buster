from dataclasses import dataclass
from typing import Optional


@dataclass
class Sale:
    sale_UUID: str
    carrier: Optional[str] = None
    online_store_name: Optional[str] = None
    salesperson: Optional[str] = None
    is_purchased: Optional[bool] = None
    is_stock_ashdod: Optional[bool] = None
    is_stock_telaviv: Optional[bool] = None
    is_stock_rehovot: Optional[bool] = None
    notes: Optional[str] = None
    data_source: Optional[str] = None
    source: Optional[str] = None
