from database import engine; from sqlalchemy import text; conn = engine.connect(); res = conn.execute(text("SELECT * FROM kardex")); print(res.fetchall()); conn.close()
