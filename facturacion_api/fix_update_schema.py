import sys
with open('routers/clientes.py', 'r', encoding='utf-8') as f:
    code = f.read()

old_str = 'es_gran_contribuyente: Optional[bool] = None'
new_str = 'es_gran_contribuyente: Optional[bool] = None\n    es_predeterminado: Optional[bool] = None'
code = code.replace(old_str, new_str)

with open('routers/clientes.py', 'w', encoding='utf-8') as f:
    f.write(code)
print('Patched ClienteUpdate')