from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import productos, clientes, facturas, auth, bodegas, kardex, proveedores, ordenes_compra, cuentas_pagar, cuentas_cobrar, configuracion_dte, dte, despachos, dashboard, vendedores
from routers import cajas, gastos, usuarios, avatar_ai, acreedores, aportantes, backup, soporte, arrendamientos, integracion_contable
import uvicorn

from sqlalchemy import text

# Inicializar Tablas (Render / Local)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("Database create_all warning:", e)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE prestamos_acreedores ADD COLUMN IF NOT EXISTS unidad_plazo VARCHAR(10) DEFAULT 'meses';"))
        conn.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria_id INTEGER;"))
        conn.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(100);"))
        conn.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca VARCHAR(100);"))
        conn.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'BIEN';"))
        conn.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(50) DEFAULT 'UNIDAD';"))
        
        # Arrendamientos Mora & Periodos
        conn.execute(text("ALTER TABLE contratos_arrendamiento ADD COLUMN IF NOT EXISTS aplica_mora BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE contratos_arrendamiento ADD COLUMN IF NOT EXISTS tipo_mora VARCHAR(20) DEFAULT 'porcentaje';"))
        conn.execute(text("ALTER TABLE contratos_arrendamiento ADD COLUMN IF NOT EXISTS valor_mora FLOAT DEFAULT 0.0;"))
        conn.execute(text("ALTER TABLE contratos_arrendamiento ADD COLUMN IF NOT EXISTS dias_gracia INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE pagos_arrendamiento ADD COLUMN IF NOT EXISTS anio INTEGER;"))
        conn.execute(text("ALTER TABLE pagos_arrendamiento ADD COLUMN IF NOT EXISTS mes INTEGER;"))
        conn.execute(text("ALTER TABLE pagos_arrendamiento ADD COLUMN IF NOT EXISTS monto_mora INTEGER DEFAULT 0;"))
except Exception as e:
    print("Migration check note:", e)

app = FastAPI(
    title="Facturación SaaS Multi-Tenant"
)

# Habilitar CORS de forma explicita para credenciales y dominios permitidos
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ventas.demiempresa.online",
        "https://ventas-demiempresa.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[API ERROR] {request.method} {request.url.path}: {exc}")
    origin = request.headers.get("origin") or "*"
    headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
    }
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error en servidor: {str(exc)}"},
        headers=headers
    )

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(productos.router, prefix="/api/v1/facturacion")
app.include_router(clientes.router, prefix="/api/v1/facturacion")
app.include_router(facturas.router, prefix="/api/v1/facturacion")
app.include_router(bodegas.router, prefix="/api/v1/almacen")
app.include_router(kardex.router, prefix="/api/v1/almacen")
app.include_router(proveedores.router, prefix="/api/v1/compras")
app.include_router(ordenes_compra.router, prefix="/api/v1/compras")
app.include_router(cuentas_pagar.router, prefix="/api/v1/compras")
app.include_router(cuentas_cobrar.router, prefix="/api/v1/facturacion")

app.include_router(configuracion_dte.router, prefix="/api/v1/configuracion")
app.include_router(dte.router, prefix="/api/v1/facturacion")

app.include_router(despachos.router, prefix="/api/v1/logistica")
app.include_router(vendedores.router, prefix="/api/v1/logistica")
app.include_router(vendedores.router, prefix="/api/v1/facturacion")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(cajas.router, prefix="/api/v1")
app.include_router(gastos.router, prefix="/api/v1")
app.include_router(usuarios.router, prefix="/api/v1")
app.include_router(avatar_ai.router, prefix="/api/v1")
app.include_router(acreedores.router, prefix="/api/v1")
app.include_router(acreedores.router, prefix="/api/v1/finanzas")
app.include_router(aportantes.router, prefix="/api/v1")
app.include_router(aportantes.router, prefix="/api/v1/finanzas")
app.include_router(arrendamientos.router, prefix="/api/v1")
app.include_router(arrendamientos.router, prefix="/api/v1/finanzas")
app.include_router(backup.router, prefix="/api/v1/sistema/backup")
app.include_router(backup.router, prefix="/api/v1/backup")
app.include_router(soporte.router, prefix="/api/v1")
app.include_router(integracion_contable.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "API de Facturación Operativa en la Nube", "status": "online"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
