
with open("src/App.jsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    "} from 'lucide-react';",
    ", Wallet, DollarSign } from 'lucide-react';"
)

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Fixed App.jsx")

