# services/pdf_generator.py

import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Dossier de sortie des PDFs
PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'generated_pdfs')
os.makedirs(PDF_DIR, exist_ok=True)

# ============================================
# COULEURS
# ============================================
ROUGE    = colors.HexColor("#E53E3E")
ORANGE   = colors.HexColor("#DD6B20")
JAUNE    = colors.HexColor("#D69E2E")
VERT     = colors.HexColor("#38A169")
BLEU     = colors.HexColor("#2B6CB0")
GRIS     = colors.HexColor("#718096")
NOIR     = colors.HexColor("#1A202C")
BLANC    = colors.white
FOND     = colors.HexColor("#F7FAFC")

# ============================================
# COULEUR SELON GRAVITÉ
# ============================================
def couleur_gravite(gravite):
    mapping = {
        "CRITIQUE": ROUGE,
        "ÉLEVÉE":   ORANGE,
        "MOYENNE":  JAUNE,
        "FAIBLE":   VERT,
        "INFO":     BLEU
    }
    return mapping.get(gravite.upper(), GRIS)

# ============================================
# COULEUR SELON SCORE
# ============================================
def couleur_score(score):
    if score >= 80:
        return VERT
    elif score >= 50:
        return JAUNE
    else:
        return ROUGE

# ============================================
# FONCTION PRINCIPALE
# ============================================
def generer_pdf(scan, vulnerabilites, username):
    """
    Génère un rapport PDF pour un scan donné.
    Retourne le chemin du fichier PDF généré.
    """

    filename = f"rapport_scan_{scan.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles  = getSampleStyleSheet()
    contenu = []

    # ── Style titre principal ────────────────────────────────────
    style_titre = ParagraphStyle(
        "Titre",
        parent    = styles["Title"],
        fontSize  = 24,
        textColor = BLEU,
        alignment = TA_CENTER,
        spaceAfter= 6
    )

    style_sous_titre = ParagraphStyle(
        "SousTitre",
        parent    = styles["Normal"],
        fontSize  = 11,
        textColor = GRIS,
        alignment = TA_CENTER,
        spaceAfter= 2
    )

    style_section = ParagraphStyle(
        "Section",
        parent    = styles["Heading2"],
        fontSize  = 14,
        textColor = BLEU,
        spaceBefore = 16,
        spaceAfter  = 8
    )

    style_normal = ParagraphStyle(
        "Normal2",
        parent    = styles["Normal"],
        fontSize  = 10,
        textColor = NOIR,
        spaceAfter= 4
    )

    style_small = ParagraphStyle(
        "Small",
        parent    = styles["Normal"],
        fontSize  = 9,
        textColor = GRIS
    )

    # ════════════════════════════════════════
    # EN-TÊTE
    # ════════════════════════════════════════
    contenu.append(Paragraph("🔒 Rapport de Sécurité", style_titre))
    contenu.append(Paragraph("Scanner de Vulnérabilités Web — PFE 2025/2026", style_sous_titre))
    contenu.append(Spacer(1, 0.3*cm))
    contenu.append(HRFlowable(width="100%", thickness=2, color=BLEU))
    contenu.append(Spacer(1, 0.5*cm))

    # ════════════════════════════════════════
    # INFORMATIONS GÉNÉRALES
    # ════════════════════════════════════════
    contenu.append(Paragraph("Informations Générales", style_section))

    info_data = [
        ["Site analysé",   scan.url],
        ["Date du scan",   scan.date.strftime("%d/%m/%Y à %H:%M")],
        ["Analysé par",    username],
        ["Modules lancés", scan.modules.replace(",", " | ").upper()],
        ["Statut",         scan.status.upper()],
    ]

    table_info = Table(info_data, colWidths=[4.5*cm, 12*cm])
    table_info.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (0, -1), FOND),
        ("TEXTCOLOR",   (0, 0), (0, -1), BLEU),
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 10),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BLANC, FOND]),
        ("PADDING",     (0, 0), (-1, -1), 8),
    ]))
    contenu.append(table_info)
    contenu.append(Spacer(1, 0.5*cm))

    # ════════════════════════════════════════
    # SCORES PAR MODULE
    # ════════════════════════════════════════
    contenu.append(Paragraph("Scores de Sécurité", style_section))

    modules_info = [
        ("Headers HTTP", scan.score_headers),
        ("CSRF",         scan.score_csrf),
        ("XSS",          scan.score_xss),
        ("SQL Injection", scan.score_sqli),
    ]

    score_data = [["Module", "Score", "Niveau"]]
    for nom, score in modules_info:
        if score is not None:
            niveau = "🟢 BON" if score >= 80 else ("🟡 MOYEN" if score >= 50 else "🔴 FAIBLE")
            score_data.append([nom, f"{score}/100", niveau])

    # Score global
    score_data.append(["SCORE GLOBAL", f"{scan.score_global}/100",
                       "🟢 BON" if scan.score_global >= 80 else
                       ("🟡 MOYEN" if scan.score_global >= 50 else "🔴 FAIBLE")])

    table_scores = Table(score_data, colWidths=[6*cm, 4*cm, 6.5*cm])
    table_scores.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), BLEU),
        ("TEXTCOLOR",   (0, 0), (-1, 0), BLANC),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND",  (0, -1), (-1, -1), FOND),
        ("FONTSIZE",    (0, 0), (-1, -1), 10),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [BLANC, FOND]),
        ("ALIGN",       (1, 0), (1, -1), "CENTER"),
        ("ALIGN",       (2, 0), (2, -1), "CENTER"),
        ("PADDING",     (0, 0), (-1, -1), 8),
    ]))
    contenu.append(table_scores)
    contenu.append(Spacer(1, 0.5*cm))

    # ════════════════════════════════════════
    # VULNÉRABILITÉS DÉTECTÉES
    # ════════════════════════════════════════
    contenu.append(Paragraph("Vulnérabilités Détectées", style_section))

    if not vulnerabilites:
        contenu.append(Paragraph("✅ Aucune vulnérabilité détectée.", style_normal))
    else:
        contenu.append(Paragraph(
            f"Nombre total de vulnérabilités : <b>{len(vulnerabilites)}</b>",
            style_normal
        ))
        contenu.append(Spacer(1, 0.3*cm))

        vuln_data = [["Module", "Type", "Gravité", "Détail"]]
        for v in vulnerabilites:
            detail = (v.detail or "")[:60] + "..." if len(v.detail or "") > 60 else (v.detail or "")
            vuln_data.append([
                v.module.upper(),
                v.type,
                v.gravite,
                detail
            ])

        table_vulns = Table(vuln_data, colWidths=[2.5*cm, 4.5*cm, 2.5*cm, 7*cm])
        table_vulns.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), BLEU),
            ("TEXTCOLOR",   (0, 0), (-1, 0), BLANC),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 9),
            ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BLANC, FOND]),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
            ("PADDING",     (0, 0), (-1, -1), 6),
            ("WORDWRAP",    (0, 0), (-1, -1), True),
        ]))
        contenu.append(table_vulns)

    contenu.append(Spacer(1, 0.5*cm))

    # ════════════════════════════════════════
    # RECOMMANDATIONS
    # ════════════════════════════════════════
    contenu.append(Paragraph("Recommandations", style_section))

    solutions_vues = set()
    for v in vulnerabilites:
        if v.solution and v.solution not in solutions_vues:
            solutions_vues.add(v.solution)
            contenu.append(Paragraph(f"• {v.solution}", style_normal))

    if not solutions_vues:
        contenu.append(Paragraph("✅ Aucune recommandation — site bien sécurisé.", style_normal))

    contenu.append(Spacer(1, 1*cm))

    # ════════════════════════════════════════
    # PIED DE PAGE
    # ════════════════════════════════════════
    contenu.append(HRFlowable(width="100%", thickness=1, color=GRIS))
    contenu.append(Spacer(1, 0.3*cm))
    contenu.append(Paragraph(
        f"Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — "
        f"PFE Scanner — Usage autorisé uniquement sur les sites dont vous êtes propriétaire.",
        style_small
    ))

    # ════════════════════════════════════════
    # GÉNÉRATION
    # ════════════════════════════════════════
    doc.build(contenu)
    print(f"✅ PDF généré : {filepath}")
    return filepath