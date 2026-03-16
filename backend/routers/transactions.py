from fastapi import APIRouter, HTTPException
from database import get_connection
from models import TransactionCreate, TransactionResponse
from typing import List

router = APIRouter()

@router.get("/transactions", response_model=List[dict])
def get_transactions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("/transactions", response_model=dict)
def create_transaction(data: TransactionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions 
        (party_name, amount, transaction_type, item, due_date, confidence, raw_text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data.party_name,
        data.amount,
        data.transaction_type,
        data.item,
        data.due_date,
        data.confidence,
        data.raw_text
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "id": new_id,
        "party_name": data.party_name,
        "amount": data.amount,
        "transaction_type": data.transaction_type,
        "item": data.item,
        "due_date": data.due_date,
        "confidence": data.confidence,
        "raw_text": data.raw_text,
        "message": "Transaction created successfully"
    }


@router.get("/transactions/summary")
def get_summary():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type IN ('receivable','income') THEN amount ELSE 0 END), 0) as total_in,
            COALESCE(SUM(CASE WHEN transaction_type IN ('payable','expense') THEN amount ELSE 0 END), 0) as total_out
        FROM transactions
    """)
    row = dict(cursor.fetchone())
    row["net_balance"] = row["total_in"] - row["total_out"]

    # Party-wise breakdown
    cursor.execute("""
        SELECT party_name,
               SUM(CASE WHEN transaction_type IN ('receivable','income') THEN amount ELSE 0 END) as they_owe,
               SUM(CASE WHEN transaction_type IN ('payable','expense') THEN amount ELSE 0 END) as you_owe
        FROM transactions
        GROUP BY party_name
    """)
    parties = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"summary": row, "parties": parties}