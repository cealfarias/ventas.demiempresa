import psycopg2
from database import engine
from models import Base
from sqlalchemy import inspect

conn = psycopg2.connect('postgresql://demiempresa_online_user:qPQ3Dt6qquqpOzRKESgTGf9NjefSeISK@dpg-d9uabv6417fc7383k650-a.virginia-postgres.render.com/demiempresa_online')
cur = conn.cursor()

inspector = inspect(engine)

for table_name in Base.metadata.tables.keys():
    # If table doesn't exist, SQLAlchemy create_all will handle it
    if not inspector.has_table(table_name):
        continue
        
    db_columns = [col['name'] for col in inspector.get_columns(table_name)]
    
    table = Base.metadata.tables[table_name]
    for column in table.columns:
        if column.name not in db_columns:
            # Generate column type
            col_type = column.type.compile(engine.dialect)
            # Add constraints
            nullable = "" if column.nullable else ""
            default = f" DEFAULT {column.default.arg}" if column.default and isinstance(column.default.arg, (int, str, bool, float)) else ""
            
            sql = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}{default}"
            print(f"Executing: {sql}")
            try:
                cur.execute(sql)
                conn.commit()
                print("  Success")
            except Exception as e:
                print("  Failed:", e)
                conn.rollback()
print("Auto-patch complete")
