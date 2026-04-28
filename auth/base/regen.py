import sqlite3

DB_NAME = "auth.db"

conn = sqlite3.connect(DB_NAME)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    apiKey TEXT NOT NULL,
    allowed TEXT NOT NULL
);
""")

conn.commit()
conn.close()

print(f"{DB_NAME} created successfully.")

