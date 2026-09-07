import sys
with open('models/__init__.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_cliente = False
in_proveedor = False
in_config = False

new_lines = []
for line in lines:
    if line.startswith('class Cliente(Base):'):
        in_cliente = True
        in_proveedor = False
        in_config = False
    elif line.startswith('class Proveedor(Base):'):
        in_cliente = False
        in_proveedor = True
        in_config = False
    elif line.startswith('class ConfiguracionDTE(Base):'):
        in_cliente = False
        in_proveedor = False
        in_config = True
    elif line.startswith('class '):
        in_cliente = False
        in_proveedor = False
        in_config = False
        
    if 'es_predeterminado = Column(Boolean, default=False)' in line:
        if in_proveedor or in_config:
            continue # skip it
            
    new_lines.append(line)

with open('models/__init__.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print('Removed es_predeterminado from Proveedor and ConfiguracionDTE')