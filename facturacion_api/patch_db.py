import psycopg2

conn = psycopg2.connect('postgresql://demiempresa_online_user:qPQ3Dt6qquqpOzRKESgTGf9NjefSeISK@dpg-d9uabv6417fc7383k650-a.virginia-postgres.render.com/demiempresa_online')
cur = conn.cursor()

def patch(table, col, typ):
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typ}")
        conn.commit()
        print(f"Added {col} to {table}")
    except Exception as e:
        print(f"Skipping {col} on {table}")
        conn.rollback()

patch('facturas', 'codigo_generacion', 'VARCHAR(100)')
patch('facturas', 'numero_control', 'VARCHAR(100)')
patch('facturas', 'sello_recepcion', 'VARCHAR(200)')
patch('facturas', 'estado_dte', "VARCHAR(20) DEFAULT 'pendiente'")
patch('facturas', 'json_firmado', "TEXT")
patch('facturas', 'condicion_operacion', "VARCHAR(20) DEFAULT 'CONTADO'")
patch('facturas', 'bodega_salida_id', "INTEGER")

patch('clientes', 'nrc', 'VARCHAR(20)')
patch('clientes', 'dui', 'VARCHAR(20)')
patch('clientes', 'es_gran_contribuyente', 'BOOLEAN DEFAULT false')
patch('clientes', 'actividad_economica_cod', 'VARCHAR(10)')

patch('productos', 'stock', 'FLOAT DEFAULT 0.0')

print("Patch complete")

