import requests

url = "https://ventas-demiempresa.onrender.com/api/v1/facturacion/clientes/?empresa_id=CANTARES"
payload = {
    "codigo": "",
    "nombre": "Test Cliente 123",
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

try:
    res = requests.post(url, json=payload)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)

