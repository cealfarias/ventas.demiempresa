import os
import json
import jsonschema

BASE_SCHEMAS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "svfe-json-schemas"))

SCHEMA_MAP = {
    "01": os.path.join(BASE_SCHEMAS_DIR, "v2", "fe-f-v2.json"),
    "03": os.path.join(BASE_SCHEMAS_DIR, "v4", "fe-ccf-v4.json"),
    "05": os.path.join(BASE_SCHEMAS_DIR, "v4", "fe-nc-v4.json"),
    "06": os.path.join(BASE_SCHEMAS_DIR, "v4", "fe-nd-v4.json"),
    "11": os.path.join(BASE_SCHEMAS_DIR, "v3", "fe-fex-v3.json"),
    "14": os.path.join(BASE_SCHEMAS_DIR, "v2", "fe-fse-v2.json"),
    "invalidacion": os.path.join(BASE_SCHEMAS_DIR, "v3", "invalidacion-schema-v3.json"),
    "contingencia": os.path.join(BASE_SCHEMAS_DIR, "v4", "contingencia-schema-v4.json")
}

def validar_json_contra_esquema_oficial_mh(dte_json: dict, tipo_doc_o_evento: str) -> tuple[bool, str]:
    """
    Valida la estructura JSON DTE emitida contra los JSON Schemas oficiales del Ministerio de Hacienda (svfe-json-schemas).
    Returns: (valido, mensaje_error)
    """
    schema_path = SCHEMA_MAP.get(tipo_doc_o_evento)
    if not schema_path or not os.path.exists(schema_path):
        return True, "Esquema no encontrado localmente, se omitió pre-validación sintáctica."

    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_data = json.load(f)

        jsonschema.validate(instance=dte_json, schema=schema_data)
        return True, "JSON DTE Estructuralmente Válido según Esquema Oficial MH."
    except jsonschema.exceptions.ValidationError as err:
        campo_error = ".".join([str(p) for p in err.path])
        mensaje = f"Error en campo '{campo_error}': {err.message}"
        return False, mensaje
    except Exception as ex:
        return False, f"Error validando esquema: {str(ex)}"
