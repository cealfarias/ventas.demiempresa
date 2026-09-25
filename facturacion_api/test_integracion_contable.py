import sys
import os
from datetime import datetime
from database import SessionLocal, engine, Base
from models import Empresa, Cliente, Producto, Factura, ItemFactura, Kardex
from models.integracion_contable import ConfiguracionIntegracionContable, BitacoraPartidaContable
from services.contabilidad_service import (
    generar_y_enviar_ccf_individual,
    generar_resumen_diario_consumidor_final
)

def test_suite():
    print("=== INICIANDO PRUEBAS DE INTEGRACION CONTABLE ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    empresa_id = "EMP-TEST-001"
    fecha_hoy = datetime.now().strftime("%Y-%m-%d")

    # 1. Crear o Configurar Empresa e Integración
    config = db.query(ConfiguracionIntegracionContable).filter_by(empresa_id=empresa_id).first()
    if not config:
        config = ConfiguracionIntegracionContable(
            empresa_id=empresa_id,
            url_api_contable="http://127.0.0.1:8000",
            api_key_empresa="test_api_key_12345",
            cuenta_caja_general="110101",
            cuenta_bancos="110201",
            cuenta_iva_debito="210201",
            cuenta_cxc_clientes="110301",
            cuenta_ventas_cf="410101",
            cuenta_ventas_ccf="410102",
            cuenta_inventario="110501",
            cuenta_costo_ventas="510101"
        )
        db.add(config)
        db.commit()

    # 2. Crear Cliente de Prueba
    cliente = db.query(Cliente).filter_by(empresa_id=empresa_id, codigo="CLI-TEST").first()
    if not cliente:
        cliente = Cliente(
            empresa_id=empresa_id,
            codigo="CLI-TEST",
            nombre="Comercial Cantua S.A. de C.V.",
            nit="0614-010190-101-1",
            nrc="123456-7"
        )
        db.add(cliente)
        db.commit()

    # 3. Crear Producto de Prueba
    prod = db.query(Producto).filter_by(empresa_id=empresa_id, codigo="PROD-TEST").first()
    if not prod:
        prod = Producto(
            empresa_id=empresa_id,
            codigo="PROD-TEST",
            nombre="Producto Ejemplo Integracion",
            precio_venta=10.00,
            costo_promedio=5.00,
            stock=100.0
        )
        db.add(prod)
        db.commit()

    # 4. Probar Partida Individual para CCF
    fac_ccf = Factura(
        empresa_id=empresa_id,
        usuario_id=1,
        numero="CCF-2026-00001",
        cliente_id=cliente.id_cliente,
        tipo_doc="CCF",
        condicion_operacion="CREDITO",
        subtotal=10000, # $100.00
        iva=1300,       # $13.00
        total=11300,     # $113.00
        fecha_emision=datetime.now()
    )
    db.add(fac_ccf)
    db.commit()

    res_ccf = generar_y_enviar_ccf_individual(db, empresa_id, fac_ccf.id)
    print(f"Result CCF Individual Partida: {res_ccf}")

    # Verificar Bitácora para CCF
    bit_ccf = db.query(BitacoraPartidaContable).filter_by(id=res_ccf.get("bitacora_id")).first()
    assert bit_ccf is not None
    payload_ccf = bit_ccf.payload_json
    print("Payload CCF Generado:")
    print(payload_ccf)

    sum_debe_ccf = sum(d["debe"] for d in payload_ccf["detalles"])
    sum_haber_ccf = sum(d["haber"] for d in payload_ccf["detalles"])
    print(f"Cuadre CCF -> Debe: ${sum_debe_ccf:.2f}, Haber: ${sum_haber_ccf:.2f}")
    assert round(sum_debe_ccf, 2) == round(sum_haber_ccf, 2), "¡ERROR DE CUADRE EN CCF!"

    # 5. Probar Resumen Diario para Consumidor Final (CF)
    # Crear varias facturas pequeñas de CF ($0.60, $1.50, $3.00)
    for i, monto_sub in enumerate([60, 150, 300], start=1):
        monto_iva = int(monto_sub * 0.13)
        monto_tot = monto_sub + monto_iva
        fac_cf = Factura(
            empresa_id=empresa_id,
            usuario_id=1,
            numero=f"FAC-2026-0000{i}",
            cliente_id=cliente.id_cliente,
            tipo_doc="FACTURA",
            condicion_operacion="CONTADO",
            subtotal=monto_sub,
            iva=monto_iva,
            total=monto_tot,
            fecha_emision=datetime.now()
        )
        db.add(fac_cf)
        db.commit()

        # Registrar Kardex para simulacion de costo de lo vendido
        k = Kardex(
            empresa_id=empresa_id,
            bodega_id=1,
            producto_id=prod.id_producto,
            tipo_movimiento="SALIDA_VENTA",
            referencia_tipo="factura",
            referencia_id=fac_cf.id,
            cantidad=1.0,
            costo_unitario=round(monto_sub / 200.0, 2), # 50% de costo
            costo_total=round(monto_sub / 200.0, 2),
            fecha=datetime.now()
        )
        db.add(k)
        db.commit()

    # Ejecutar Resumen Diario Consumidor Final
    res_diario = generar_resumen_diario_consumidor_final(db, empresa_id, fecha_hoy)
    print(f"Result Resumen Diario CF: {res_diario}")

    bit_diario = db.query(BitacoraPartidaContable).filter_by(id=res_diario.get("bitacora_id")).first()
    assert bit_diario is not None
    payload_diario = bit_diario.payload_json
    print("Payload Resumen Diario Generado:")
    print(payload_diario)

    sum_debe_cf = sum(d["debe"] for d in payload_diario["detalles"])
    sum_haber_cf = sum(d["haber"] for d in payload_diario["detalles"])
    print(f"Cuadre Resumen Diario -> Debe: ${sum_debe_cf:.2f}, Haber: ${sum_haber_cf:.2f}")
    assert round(sum_debe_cf, 2) == round(sum_haber_cf, 2), "¡ERROR DE CUADRE EN RESUMEN DIARIO!"

    print("\n=== TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE ===")

if __name__ == "__main__":
    test_suite()
