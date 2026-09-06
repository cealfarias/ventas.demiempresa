import sys
with open("src/App.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Imports
code = code.replace(
    "import Facturas from './pages/Facturas';",
    "import Facturas from './pages/Facturas';\nimport Cajas from './pages/Cajas';\nimport Gastos from './pages/Gastos';"
)

# Routes
code = code.replace(
    "<Route path=\"/cuentas-pagar\" element={<CuentasPagar />} />",
    "<Route path=\"/cuentas-pagar\" element={<CuentasPagar />} />\n            <Route path=\"/cajas\" element={<Cajas />} />\n            <Route path=\"/gastos\" element={<Gastos />} />"
)

# Sidebar
old_sidebar = """          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}"""

from lucide_icons_import import string_here
new_sidebar = """          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}
          
          <SidebarSection label="Finanzas" expanded={expanded}>
            <SidebarLink to="/cajas" icon={Wallet} label="Control de Caja" expanded={expanded} />
            <SidebarLink to="/gastos" icon={DollarSign} label="Gastos" expanded={expanded} />
          </SidebarSection>"""

code = code.replace(old_sidebar, new_sidebar)

# Need to import Wallet, DollarSign in App.jsx
code = code.replace(
    "import { LayoutDashboard, Receipt, Users, LogOut, ChevronLeft, ChevronRight, Truck, ShoppingCart, CreditCard, Warehouse, Package, TrendingUp } from 'lucide-react';",
    "import { LayoutDashboard, Receipt, Users, LogOut, ChevronLeft, ChevronRight, Truck, ShoppingCart, CreditCard, Warehouse, Package, TrendingUp, Wallet, DollarSign } from 'lucide-react';"
)

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched App.jsx")

