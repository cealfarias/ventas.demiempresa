import requests

# test PUT against production
url = "https://ventas-demiempresa.onrender.com/api/v1/facturacion/clientes/48?empresa_id=CANTARES"
payload = {
    "codigo": "",
    "nombre": "Test Cliente PUT",
    "nombre_comercial": "",
    "nit": "",
    "nrc": "",
    "dui": "",
    "email": "",
    "telefono": "",
    "direccion": "",
    "es_gran_contribuyente": False,
    "es_predeterminado": True,
    "actividad_economica_cod": "",
    "limite_credito": 0,
    "saldo_inicial": 0
}
res = requests.put(url, json=payload)
print("PUT Status:", res.status_code)
print("PUT Response:", res.text)

