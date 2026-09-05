lines = open('facturacion_web/src/pages/Facturas.jsx').read().splitlines()
out = []
for idx, line in enumerate(lines):
    if line.strip() == ") : (" and lines[idx+1].strip().startswith("<div className=\"bg-white rounded-2xl"):
        out.append(line + ' <>')
    elif line.strip() == ")}":
        # Check if the next line is "    </div>" AND we are at the end of the file
        if idx > 300 and idx + 1 < len(lines) and lines[idx+1].strip() == "</div>":
            out.append("        </>")
            out.append(line)
        else:
            out.append(line)
    else:
        out.append(line)

open('facturacion_web/src/pages/Facturas.jsx', 'w').write('\n'.join(out))
