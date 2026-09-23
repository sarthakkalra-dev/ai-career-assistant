import sqlite3

DATABASE = "career_assistant.db"

connection = sqlite3.connect(DATABASE)
cursor = connection.cursor()

columns = [
    ("phone", "TEXT"),
    ("college", "TEXT"),
    ("degree", "TEXT"),
    ("skills", "TEXT"),
    ("graduation_year", "INTEGER")
]

for column_name, column_type in columns:
    try:
        cursor.execute(
            f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
        )
        print(f"Added column: {column_name}")
    except sqlite3.OperationalError:
        print(f"Column already exists: {column_name}")

connection.commit()
connection.close()

print("Database update completed successfully!")