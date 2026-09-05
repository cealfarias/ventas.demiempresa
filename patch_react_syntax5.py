lines = open('facturacion_web/src/pages/Facturas.jsx').read().splitlines()
out = []
found_start = False
for idx, line in enumerate(lines):
    if line.strip() == ") : (":
        out.append(line + ' <>')
        found_start = True
    elif line.strip() == "</>":
        pass # remove all existing </>
    else:
        out.append(line)

# Add one </> right before the last )}
for i in range(len(out)-1, -1, -1):
    if out[i].strip() == ")}":
        out.insert(i, "        </>")
        break

open('facturacion_web/src/pages/Facturas.jsx', 'w').write('\n'.join(out))
