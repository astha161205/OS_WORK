import sqlite3
from sqlite3 import Connection

DATABASE_NAME = "process_data.db"

def get_connection() -> Connection:
    conn = sqlite3.connect(DATABASE_NAME, check_same_thread=False)
    return conn

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processes (
        pid INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        cpu_percent REAL,
        memory_percent REAL,
        io_counters TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid INTEGER,
        alert_type TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()
