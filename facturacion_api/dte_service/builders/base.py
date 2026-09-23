import uuid
from typing import Any, Dict, List

def generar_codigo_generacion() -> str:
    """Genera un UUID v4 en MAYÚSCULAS de 36 caracteres."""
    return str(uuid.uuid4()).upper()

def generar_numero_control(
    tipo_dte: str, 
    establecimiento_cod: str, 
    punto_venta_cod: str, 
    correlativo: int
) -> str:
    """
    Construye el Número de Control DTE con el formato estricto de 31 caracteres exigido por el MH:
    DTE-[Tipo2Dígitos]-[Establecimiento4Dígitos][PuntoVenta4Dígitos]-[Secuencial15Dígitos]
    Ejemplo: DTE-01-00000000-000000000000001 (31 caracteres exactos)
    """
    tipo = str(tipo_dte).zfill(2)
    estab = str(establecimiento_cod or "0000").zfill(4)[-4:]
    pv = str(punto_venta_cod or "0000").zfill(4)[-4:]
    seq = str(correlativo).zfill(15)[-15:]
    
    numero_control = f"DTE-{tipo}-{estab}{pv}-{seq}"
    return numero_control

def remove_nulls(d: Any) -> Any:
    """Elimina claves con valores None de diccionarios/listas para cumplir norma MH."""
    if isinstance(d, dict):
        return {k: remove_nulls(v) for k, v in d.items() if v is not None}
    elif isinstance(d, list):
        return [remove_nulls(i) for i in d if i is not None]
    return d

def numero_a_letras(monto: float) -> str:
    """Convierte un monto numérico a letras en español para el campo totalLetras de MH."""
    UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
    DECENAS = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCOENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
    DIEZ_Y = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
    CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

    entero = int(monto)
    centavos = int(round((monto - entero) * 100))

    if entero == 0:
        texto_entero = "CERO"
    elif entero == 100:
        texto_entero = "CIEN"
    else:
        partes = []
        # Miles
        if entero >= 1000:
            miles = entero // 1000
            entero %= 1000
            if miles == 1:
                partes.append("MIL")
            else:
                partes.append(f"{UNIDADES[miles]} MIL")

        # Centenas
        if entero >= 100:
            c = entero // 100
            entero %= 100
            if c == 1 and entero == 0:
                partes.append("CIEN")
            else:
                partes.append(CENTENAS[c])

        # Decenas y Unidades
        if entero >= 10 and entero < 20:
            partes.append(DIEZ_Y[entero - 10])
        elif entero >= 20:
            d = entero // 10
            u = entero % 10
            if u == 0:
                partes.append(DECENAS[d])
            else:
                partes.append(f"{DECENAS[d]} Y {UNIDADES[u]}")
        elif entero > 0:
            partes.append(UNIDADES[entero])

        texto_entero = " ".join(partes)

    return f"{texto_entero} {str(centavos).zfill(2)}/100 USD"
