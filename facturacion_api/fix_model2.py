with open("models/__init__.py", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("nrc = Column(String(20))\\n    es_predeterminado = Column(Boolean, default=False)", "nrc = Column(String(20))\\n    es_predeterminado = Column(Boolean, default=False)")

with open("models/__init__.py", "w", encoding="utf-8") as f:
    f.write(code.replace("\\n", "\n"))

