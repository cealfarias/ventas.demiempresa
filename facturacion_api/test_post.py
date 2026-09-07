import requests
res = requests.post("http://127.0.0.1:8000/api/v1/facturacion/clientes/?empresa_id=CANTARES", json={
    "nombre": "Test POST",
    "es_gran_contribuyente": False,
    "es_predeterminado": True,
    "limite_credito": 0,
    "saldo_inicial": 0
})
print("Status:", res.status_code)
print("Text:", res.text)

