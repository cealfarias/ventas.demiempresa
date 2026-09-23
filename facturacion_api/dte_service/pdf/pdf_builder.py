import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from models import Factura, ConfiguracionDTE
from dte_service.pdf.qr_generator import generar_qr_bytes

def generar_pdf_representacion_grafica(factura: Factura, config: ConfiguracionDTE) -> bytes:
    """
    Genera la Representación Gráfica PDF oficial del Documento Tributario Electrónico (DTE).
    Conforme estándar normativo del Ministerio de Hacienda de El Salvador.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=14,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'),
        fontName='Helvetica-Bold'
    )
    bold_style = ParagraphStyle('BoldStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9)
    normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontSize=8, leading=10)
    small_style = ParagraphStyle('SmallStyle', parent=styles['Normal'], fontSize=7, leading=9)

    elements = []

    # 1. ENCABEZADO (Emisor & Datos del DTE)
    tipo_dte_label = "FACTURA ELECTRÓNICA" if factura.tipo_doc == "FACTURA" else "COMPROBANTE DE CRÉDITO FISCAL"
    
    header_data = [
        [
            Paragraph(f"<b>{config.nombre_comercial or 'EMPRESA EMISORA'}</b><br/>NIT: {config.nit or 'N/A'} | NRC: {config.nrc or 'N/A'}<br/>{config.direccion_complemento or ''}<br/>Tel: {config.telefono or ''} | Email: {config.email or ''}", normal_style),
            Paragraph(f"<b>DOCUMENTO TRIBUTARIO ELECTRÓNICO</b><br/><font color='#1E3A8A'><b>{tipo_dte_label}</b></font><br/><b>Nº Control:</b> {factura.numero_control or 'DTE-00-00000000-000000000000000'}<br/><b>Cód. Generación:</b><br/>{factura.codigo_generacion or 'PENDIENTE'}<br/><b>Sello Recepción:</b><br/>{factura.sello_recepcion or 'EN PROCESO'}", small_style)
        ]
    ]

    header_table = Table(header_data, colWidths=[3.8 * inch, 3.7 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))

    # 2. DATOS RECEPTOR / CLIENTE
    cliente = factura.cliente
    nombre_cliente = cliente.nombre if cliente else "Consumidor Final"
    doc_cliente = cliente.nit or cliente.dui or "00000000000000" if cliente else "N/A"
    
    fecha_str = factura.fecha_emision.strftime("%Y-%m-%d %H:%M:%S")

    receptor_data = [
        [
            Paragraph(f"<b>Cliente / Receptor:</b> {nombre_cliente}", normal_style),
            Paragraph(f"<b>Fecha / Hora Emisión:</b> {fecha_str}", normal_style)
        ],
        [
            Paragraph(f"<b>Doc. Identidad / NIT:</b> {doc_cliente}", normal_style),
            Paragraph(f"<b>Condición de Pago:</b> {factura.condicion_operacion or 'CONTADO'}", normal_style)
        ]
    ]

    receptor_table = Table(receptor_data, colWidths=[4.2 * inch, 3.3 * inch])
    receptor_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(receptor_table)
    elements.append(Spacer(1, 10))

    # 3. TABLA DE ÍTEMS
    items_headers = [
        Paragraph("<b>Nº</b>", bold_style),
        Paragraph("<b>Cant</b>", bold_style),
        Paragraph("<b>Descripción</b>", bold_style),
        Paragraph("<b>P. Unitario</b>", bold_style),
        Paragraph("<b>Ventas Gravadas</b>", bold_style)
    ]

    items_data = [items_headers]
    num = 1

    for item in factura.items:
        nombre_prod = item.producto.nombre if item.producto else "Producto/Servicio"
        precio = (item.precio_unitario or 0) / 100.0
        subtotal = (item.subtotal or 0) / 100.0

        items_data.append([
            Paragraph(str(num), normal_style),
            Paragraph(str(item.cantidad or 1), normal_style),
            Paragraph(nombre_prod, normal_style),
            Paragraph(f"${precio:.2f}", normal_style),
            Paragraph(f"${subtotal:.2f}", normal_style)
        ])
        num += 1

    items_table = Table(items_data, colWidths=[0.5 * inch, 0.8 * inch, 4.0 * inch, 1.1 * inch, 1.1 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 10))

    # 4. RESUMEN Y CÓDIGO QR
    fecha_emi_iso = factura.fecha_emision.strftime("%Y-%m-%d")
    codigo_gen = factura.codigo_generacion or "00000000-0000-0000-0000-000000000000"
    
    qr_bytes = generar_qr_bytes(codigo_gen, fecha_emi_iso)
    qr_img = Image(io.BytesIO(qr_bytes), width=1.4 * inch, height=1.4 * inch)

    subtotal_val = (factura.subtotal or 0) / 100.0
    iva_val = (factura.iva or 0) / 100.0
    total_val = (factura.total or 0) / 100.0

    resumen_text = f"""
    <b>Subtotal Ventas:</b> ${subtotal_val:.2f}<br/>
    <b>IVA 13%:</b> ${iva_val:.2f}<br/>
    <font size=11 color='#1E3A8A'><b>TOTAL A PAGAR: ${total_val:.2f}</b></font>
    """

    footer_data = [
        [
            qr_img,
            Paragraph("<b>Consulta Pública DGII / MH:</b><br/>Escanee este código QR para validar la autenticidad de este documento en el portal del Ministerio de Hacienda de El Salvador.<br/><br/><i>Documento emitido según normativa de Facturación Electrónica DTE.</i>", small_style),
            Paragraph(resumen_text, normal_style)
        ]
    ]

    footer_table = Table(footer_data, colWidths=[1.5 * inch, 3.8 * inch, 2.2 * inch])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#F8FAFC')),
        ('BOX', (2, 0), (2, 0), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(footer_table)

    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
