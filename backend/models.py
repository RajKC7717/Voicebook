from pydantic import BaseModel
from typing import Optional

class TransactionCreate(BaseModel):
    party_name: str
    amount: float
    transaction_type: str   # receivable | payable | expense | income
    item: Optional[str] = None
    due_date: Optional[str] = None
    confidence: Optional[float] = None
    raw_text: Optional[str] = None

class TransactionResponse(TransactionCreate):
    id: int
    created_at: str