import psycopg2
conn = psycopg2.connect('postgresql://demiempresa_online_user:qPQ3Dt6qquqpOzRKESgTGf9NjefSeISK@dpg-d9uabv6417fc7383k650-a.virginia-postgres.render.com/demiempresa_online')
cur = conn.cursor()
cur.execute("UPDATE empresas SET usuario_creacion = 'cealfarias' WHERE id = 'CANTARES'")
conn.commit()
print("Linked CANTARES to cealfarias")
