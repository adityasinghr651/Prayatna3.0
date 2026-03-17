import psycopg2

conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/urbanrisk')
cur = conn.cursor()

cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = cur.fetchall()

print("Tables found:")
for t in tables:
    print(" -", t[0])

conn.close()