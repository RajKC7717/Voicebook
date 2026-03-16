import sqlite3
import os

DB_PATH = "khata.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us return rows as dicts
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            party_name TEXT NOT NULL,
            amount REAL NOT NULL,
            transaction_type TEXT NOT NULL,  -- receivable | payable | expense | income
            item TEXT,
            due_date TEXT,
            confidence REAL,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()