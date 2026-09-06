import sys
with open("src/App.jsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("import Facturas from \"./pages/Facturas\";", "import Facturas from \"./pages/Facturas\";\\nimport Cajas from \"./pages/Cajas\";\\nimport Gastos from \"./pages/Gastos\";")

code = code.replace("<Route path=\"/cuentas-pagar\" element={<CuentasPagar />} />", "<Route path=\"/cuentas-pagar\" element={<CuentasPagar />} />\\n            <Route path=\"/cajas\" element={<Cajas />} />\\n            <Route path=\"/gastos\" element={<Gastos />} />")

old_sidebar = """          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}"""

new_sidebar = """          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}

          <SidebarSection label="Finanzas" expanded={expanded}>
            <SidebarLink to="/cajas" icon={Wallet} label="Control de Caja" expanded={expanded} />
            <SidebarLink to="/gastos" icon={DollarSign} label="Gastos Operativos" expanded={expanded} />
          </SidebarSection>"""

code = code.replace(old_sidebar, new_sidebar)

code = code.replace("TrendingUp }", "TrendingUp, Wallet, DollarSign }")

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched App.jsx")

