import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("{!cargando && vista === 'lista' && (", "{!cargando && vista === 'lista' && ( <>")

content = content.replace("          </div>\n        )}\\n      )}\\n    </div>\\n  );\\n}", "          </div>\n        )}\n        </>\n      )}\n    </div>\n  );\n}")

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
