from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import productos, clientes, facturas, auth
import uvicorn

# Inicializar Tablas (Render / Local)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Facturación SaaS Multi-Tenant"
)

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://ventas.demiempresa.online",
        "https://ventas-demiempresa.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(productos.router, prefix="/api/v1/facturacion")
app.include_router(clientes.router, prefix="/api/v1/facturacion")
app.include_router(facturas.router, prefix="/api/v1/facturacion")

@app.get("/")
def read_root():
    return {"message": "API de Facturación Operativa en la Nube", "status": "online"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
