import sys
import re
with open('src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Modify SearchableSelect signature
old_sig = 'const SearchableSelect = ({ value, options, onChange, placeholder = "Buscar...", className="w-full px-3 py-2 border rounded-xl" }) => {'
new_sig = 'const SearchableSelect = ({ value, options, onChange, placeholder = "Buscar...", className="w-full px-3 py-2 border rounded-xl", autoFocus = false }) => {'
code = code.replace(old_sig, new_sig)

# Add autoFocus effect
old_effect = 'const wrapperRef = React.useRef(null);'
new_effect = old_effect + '\n  React.useEffect(() => { if (autoFocus) setOpen(true); }, [autoFocus]);'
code = code.replace(old_effect, new_effect)

# Find where it renders the input inside {open && ...}
old_input = '<input \n              type="text" \n              autoFocus\n              className="w-full px-2 py-1 text-sm border rounded bg-slate-50 focus:outline-none"'
new_input = '<input \n              type="text" \n              autoFocus\n              className="w-full px-2 py-1 text-sm border rounded bg-slate-50 focus:outline-none"'
# It already has autoFocus, so if it opens, it focuses! 

# Add autoFocus to the specific SearchableSelect in the table
old_select = '<SearchableSelect \n                        value={it.producto_id}'
new_select = '<SearchableSelect \n                        autoFocus={i === form.items.length - 1}\n                        value={it.producto_id}'
code = code.replace(old_select, new_select)

with open('src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched SearchableSelect successfully')