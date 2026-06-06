# services/pdf_generator.py

import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable, PageBreak,
    KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus.flowables import Flowable

# ============================================================
# DOSSIER DE SORTIE
# ============================================================
PDF_DIR = os.path.join(os.path.dirname(__file__), '..', 'generated_pdfs')
os.makedirs(PDF_DIR, exist_ok=True)

def hex_str(c):
    """Convertit une couleur ReportLab en string hex CSS ex: #185FA5"""
    return "{:02X}{:02X}{:02X}".format(
        int(c.red * 255), int(c.green * 255), int(c.blue * 255)
    )



# ============================================================
# PALETTE DE COULEURS — matching avec le site
# ============================================================
C_BLEU_FONCE   = colors.HexColor("#0C2A4A")   # navbar / sidebar
C_BLEU         = colors.HexColor("#185FA5")   # primaire
C_BLEU_CLAIR   = colors.HexColor("#EBF4FF")   # fond badge bleu
C_BLEU_BORDER  = colors.HexColor("#B5D4F4")

C_ROUGE        = colors.HexColor("#E24B4A")
C_ROUGE_BG     = colors.HexColor("#FCEBEB")
C_ROUGE_BORDER = colors.HexColor("#F09595")

C_ORANGE       = colors.HexColor("#EF9F27")
C_ORANGE_BG    = colors.HexColor("#FAEEDA")
C_ORANGE_BORDER= colors.HexColor("#F5C97A")

C_JAUNE        = colors.HexColor("#D69E2E")
C_JAUNE_BG     = colors.HexColor("#FEFCE8")

C_VERT         = colors.HexColor("#16A34A")
C_VERT_BG      = colors.HexColor("#EAF3DE")
C_VERT_BORDER  = colors.HexColor("#86EFAC")

C_GRIS         = colors.HexColor("#6B8CAE")
C_GRIS_CLAIR   = colors.HexColor("#F0F4F8")
C_GRIS_BORDER  = colors.HexColor("#DDE8F5")
C_GRIS_TEXTE   = colors.HexColor("#4A6A8A")

C_BLANC        = colors.white
C_NOIR         = colors.HexColor("#0C2A4A")

# ============================================================
# HELPERS COULEURS
# ============================================================
GRAVITE_MAP = {
    "CRITIQUE": (C_ROUGE,   C_ROUGE_BG,   C_ROUGE_BORDER),
    "ELEVEE":   (C_ORANGE,  C_ORANGE_BG,  C_ORANGE_BORDER),
    "ÉLEVÉE":   (C_ORANGE,  C_ORANGE_BG,  C_ORANGE_BORDER),
    "MOYENNE":  (C_JAUNE,   C_JAUNE_BG,   C_ORANGE_BORDER),
    "FAIBLE":   (C_VERT,    C_VERT_BG,    C_VERT_BORDER),
    "INFO":     (C_BLEU,    C_BLEU_CLAIR, C_BLEU_BORDER),
}

def couleurs_gravite(gravite):
    return GRAVITE_MAP.get((gravite or "").upper(), (C_GRIS, C_GRIS_CLAIR, C_GRIS_BORDER))

def couleur_score(score):
    if score is None: return C_GRIS
    if score >= 80:   return C_VERT
    if score >= 50:   return C_ORANGE
    return C_ROUGE

def label_score(score):
    if score is None: return "N/A"
    if score >= 80:   return "Securise"
    if score >= 50:   return "Moyen"
    return "Critique"

MODULE_LABELS = {
    "headers": "HTTP Headers",
    "csrf":    "CSRF",
    "xss":     "XSS",
    "sqli":    "SQL Injection",
}

# ============================================================
# FLOWABLE : LIGNE COLORÉE (barre de section)
# ============================================================
class ColorBar(Flowable):
    def __init__(self, width, height=4, color=C_BLEU, radius=2):
        super().__init__()
        self.bar_width  = width
        self.bar_height = height
        self.color      = color
        self.radius     = radius

    def wrap(self, *args):
        return (self.bar_width, self.bar_height + 4)

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 2, self.bar_width, self.bar_height,
                            self.radius, stroke=0, fill=1)


# ============================================================
# FLOWABLE : BADGE GRAVITE
# ============================================================
class GraviteBadge(Flowable):
    def __init__(self, gravite, width=70, height=18):
        super().__init__()
        self.gravite    = (gravite or "").upper()
        self.badge_w    = width
        self.badge_h    = height
        color, bg, border = couleurs_gravite(self.gravite)
        self.color      = color
        self.bg         = bg
        self.border_col = border

    def wrap(self, *args):
        return (self.badge_w, self.badge_h + 4)

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.setStrokeColor(self.border_col)
        c.setLineWidth(0.5)
        c.roundRect(0, 2, self.badge_w, self.badge_h, 5, stroke=1, fill=1)
        c.setFillColor(self.color)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(self.badge_w / 2, 2 + self.badge_h / 2 - 3.5, self.gravite)


# ============================================================
# CALLBACKS NUMÉROTATION PAGES
# ============================================================
def _header_footer(canvas, doc):
    """Dessine en-tête et pied de page sur chaque page."""
    canvas.saveState()
    w, h = A4

    # ── En-tête : barre bleu foncé ──
    canvas.setFillColor(C_BLEU_FONCE)
    canvas.rect(0, h - 40, w, 40, stroke=0, fill=1)

    canvas.setFillColor(C_BLANC)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(2*cm, h - 27, "MiniSec ")
    canvas.setFont("Helvetica", 9)
    canvas.drawString(2*cm + 85, h - 27, "— Rapport de Securite Web")

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#9CB3CC"))
    canvas.drawRightString(w - 2*cm, h - 27,
                           f"Page {doc.page}")

    # ── Pied de page ──
    canvas.setFillColor(C_GRIS_BORDER)
    canvas.rect(0, 0, w, 28, stroke=0, fill=1)
    canvas.setFillColor(C_GRIS_TEXTE)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(2*cm, 10,
        f"Genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')} — "
        "MiniSec  — Usage autorise uniquement sur les sites dont vous etes proprietaire.")
    canvas.restoreState()


# ============================================================
# STYLES
# ============================================================
def build_styles():
    base = getSampleStyleSheet()

    titre_page = ParagraphStyle(
        "TitrePage",
        parent    = base["Title"],
        fontSize  = 28,
        textColor = C_BLANC,
        alignment = TA_LEFT,
        fontName  = "Helvetica-Bold",
        spaceAfter= 4,
        leading   = 34,
    )
    sous_titre = ParagraphStyle(
        "SousTitre",
        parent    = base["Normal"],
        fontSize  = 11,
        textColor = colors.HexColor("#9CB3CC"),
        alignment = TA_LEFT,
        spaceAfter= 2,
    )
    section = ParagraphStyle(
        "Section",
        parent    = base["Normal"],
        fontSize  = 13,
        textColor = C_BLEU_FONCE,
        fontName  = "Helvetica-Bold",
        spaceBefore= 18,
        spaceAfter = 10,
    )
    normal = ParagraphStyle(
        "Normal2",
        parent    = base["Normal"],
        fontSize  = 9.5,
        textColor = C_NOIR,
        spaceAfter= 3,
        leading   = 14,
    )
    normal_gris = ParagraphStyle(
        "NormalGris",
        parent    = base["Normal"],
        fontSize  = 9,
        textColor = C_GRIS_TEXTE,
        spaceAfter= 3,
        leading   = 13,
    )
    small = ParagraphStyle(
        "Small",
        parent    = base["Normal"],
        fontSize  = 8,
        textColor = C_GRIS,
        leading   = 11,
    )
    code_style = ParagraphStyle(
        "Code",
        parent    = base["Normal"],
        fontSize  = 8,
        fontName  = "Courier",
        textColor = C_ROUGE,
        backColor = C_ROUGE_BG,
        spaceAfter= 2,
        leading   = 12,
        leftIndent= 4,
    )
    vuln_titre = ParagraphStyle(
        "VulnTitre",
        parent    = base["Normal"],
        fontSize  = 10,
        fontName  = "Helvetica-Bold",
        textColor = C_BLEU_FONCE,
        spaceAfter= 3,
    )
    label_style = ParagraphStyle(
        "Label",
        parent    = base["Normal"],
        fontSize  = 7.5,
        fontName  = "Helvetica-Bold",
        textColor = C_BLEU,
        spaceAfter= 1,
        spaceBefore=3,
    )
    solution_style = ParagraphStyle(
        "Solution",
        parent    = base["Normal"],
        fontSize  = 9,
        textColor = C_VERT,
        spaceAfter= 2,
        leading   = 13,
        leftIndent= 6,
    )
    return {
        "titre_page": titre_page,
        "sous_titre": sous_titre,
        "section":    section,
        "normal":     normal,
        "normal_gris":normal_gris,
        "small":      small,
        "code":       code_style,
        "vuln_titre": vuln_titre,
        "label":      label_style,
        "solution":   solution_style,
    }


# ============================================================
# SECTION COVER (page de garde)
# ============================================================
def build_cover(scan, username, styles, page_width):
    els = []

    score = scan.score_global

    # ── Titre principal ──
    style_titre_cover = ParagraphStyle(
        "TC", fontSize=26, fontName="Helvetica-Bold",
        textColor=C_BLEU_FONCE, leading=32, spaceAfter=10
    )
    style_sub_cover = ParagraphStyle(
        "SC", fontSize=10, textColor=C_GRIS_TEXTE, leading=14, spaceAfter=4
    )
    style_url_cover = ParagraphStyle(
        "UC", fontSize=11, fontName="Helvetica-Bold",
        textColor=C_BLEU, leading=15, spaceBefore=6, spaceAfter=4
    )
    style_score_cover = ParagraphStyle(
        "SCR", fontSize=40, fontName="Helvetica-Bold",
        textColor=couleur_score(score), alignment=TA_CENTER, spaceAfter=2
    )
    style_score_label = ParagraphStyle(
        "SCRL", fontSize=9, textColor=C_GRIS, alignment=TA_CENTER
    )

    inner_left = [
        Paragraph("Rapport de Securite Web", style_titre_cover),
        Paragraph(f"Analyse par : <b>{username}</b>", style_sub_cover),
        Paragraph(f"Date : {scan.date.strftime('%d/%m/%Y a %H:%M')}", style_sub_cover),
        Spacer(1, 6),
        Paragraph(scan.url, style_url_cover),
        Paragraph(
            f"Modules : {scan.modules.replace(',', ' | ').upper()}",
            style_sub_cover
        ),
    ]
    inner_right = [
        Spacer(1, 8),
        Paragraph(f"{score}/100", style_score_cover),
    ]

    cover_content = Table(
        [[inner_left, inner_right]],
        colWidths=[page_width * 0.68, page_width * 0.32]
    )
    cover_content.setStyle(TableStyle([
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("PADDING",     (0,0), (-1,-1), 0),
        ("LEFTPADDING", (1,0), (1,-1),  10),
    ]))
    els.append(Spacer(1, 0.4*cm))
    els.append(cover_content)
    els.append(Spacer(1, 0.5*cm))
    els.append(HRFlowable(width="100%", thickness=1.5, color=C_BLEU))
    els.append(Spacer(1, 0.4*cm))

    return els


# ============================================================
# SECTION : SCORES PAR MODULE
# ============================================================
def build_scores(scan, styles, page_width):
    els = []
    els.append(ColorBar(page_width))
    els.append(Spacer(1, 4))
    els.append(Paragraph("Scores de Securite par Module", styles["section"]))

    modules_scores = [
        ("headers", "HTTP Headers",  scan.score_headers),
        ("csrf",    "CSRF",          scan.score_csrf),
        ("xss",     "XSS",           scan.score_xss),
        ("sqli",    "SQL Injection",  scan.score_sqli),
    ]

    score_rows = []
    for key, label, score in modules_scores:
        if score is None:
            continue
        col = couleur_score(score)
        lbl = label_score(score)

        # Barre de progression simulée
        bar_width_total = 120
        bar_filled = int((score / 100) * bar_width_total)

        score_rows.append([
            Paragraph(f"<b>{label}</b>", styles["normal"]),
            Paragraph(f"<font color='#{hex_str(col)}' size='11'><b>{score}/100</b></font>",
                      ParagraphStyle("s", fontSize=11, fontName="Helvetica-Bold",
                                     textColor=col, alignment=TA_CENTER)),
            Paragraph(f"<font color='#{hex_str(col)}'>{lbl}</font>",
                      ParagraphStyle("s2", fontSize=9, textColor=col, alignment=TA_CENTER)),
        ])

    if score_rows:
        score_table = Table(
            score_rows,
            colWidths=[page_width*0.4, page_width*0.25, page_width*0.25]
        )
        score_table.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), C_BLANC),
            ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_BLANC, C_GRIS_CLAIR]),
            ("GRID",          (0,0), (-1,-1), 0.5, C_GRIS_BORDER),
            ("PADDING",       (0,0), (-1,-1), 10),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            
        ]))
        els.append(score_table)
    else:
        els.append(Paragraph("Aucun module scanné.", styles["normal_gris"]))

    return els


# ============================================================
# SECTION : RÉSUMÉ DES VULNÉRABILITÉS
# ============================================================
def build_resume_vulns(vulnerabilites, styles, page_width):
    els = []
    els.append(Spacer(1, 0.4*cm))
    els.append(ColorBar(page_width))
    els.append(Spacer(1, 4))
    els.append(Paragraph("Resume des Vulnerabilites", styles["section"]))

    if not vulnerabilites:
        box = Table(
            [[Paragraph("Aucune vulnerabilite detectee — site bien securise !", styles["normal"])]],
            colWidths=[page_width]
        )
        box.setStyle(TableStyle([
            ("BACKGROUND", (0,0),(-1,-1), C_VERT_BG),
            ("PADDING",    (0,0),(-1,-1), 12),
            ("GRID",       (0,0),(-1,-1), 0.5, C_VERT_BORDER),
        ]))
        els.append(box)
        return els

    # Comptage par gravité
    from collections import Counter
    gravite_count = Counter(v.gravite.upper() for v in vulnerabilites)
    module_count  = Counter(v.module for v in vulnerabilites)

    # Tableau synthèse gravité
    header_row = [
        Paragraph("<b>Gravite</b>", ParagraphStyle("h", fontSize=9, fontName="Helvetica-Bold",
                                                    textColor=C_BLANC, alignment=TA_CENTER)),
        Paragraph("<b>Nombre</b>", ParagraphStyle("h", fontSize=9, fontName="Helvetica-Bold",
                                                   textColor=C_BLANC, alignment=TA_CENTER)),
    ]
    rows = [header_row]
    order = ["CRITIQUE", "ÉLEVÉE", "ELEVEE", "MOYENNE", "FAIBLE", "INFO"]
    seen  = set()
    for g in order:
        count = gravite_count.get(g, 0)
        if count == 0 or g in seen:
            continue
        seen.add(g)
        col, bg, border = couleurs_gravite(g)
        rows.append([
            Paragraph(f"<font color='#{hex_str(col)}'><b>{g}</b></font>",
                      ParagraphStyle("gc", fontSize=9, fontName="Helvetica-Bold",
                                     textColor=col, alignment=TA_CENTER)),
            Paragraph(f"<b>{count}</b>",
                      ParagraphStyle("gn", fontSize=10, fontName="Helvetica-Bold",
                                     textColor=col, alignment=TA_CENTER)),
        ])

    # Tableau synthèse module
    header_mod = [
        Paragraph("<b>Module</b>", ParagraphStyle("hm", fontSize=9, fontName="Helvetica-Bold",
                                                   textColor=C_BLANC, alignment=TA_CENTER)),
        Paragraph("<b>Vulnerabilites</b>", ParagraphStyle("hm2", fontSize=9, fontName="Helvetica-Bold",
                                                           textColor=C_BLANC, alignment=TA_CENTER)),
    ]
    rows_mod = [header_mod]
    for mod, cnt in module_count.items():
        rows_mod.append([
            Paragraph(MODULE_LABELS.get(mod, mod.upper()),
                      ParagraphStyle("ml", fontSize=9, textColor=C_BLEU_FONCE)),
            Paragraph(str(cnt),
                      ParagraphStyle("mc", fontSize=9, fontName="Helvetica-Bold",
                                     textColor=C_BLEU, alignment=TA_CENTER)),
        ])

    col_w = (page_width - 0.5*cm) / 2

    t_gravite = Table(rows, colWidths=[col_w*0.6, col_w*0.4])
    t_gravite.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLEU_FONCE),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_BLANC, C_GRIS_CLAIR]),
        ("GRID",          (0,0), (-1,-1), 0.5, C_GRIS_BORDER),
        ("PADDING",       (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))

    t_module = Table(rows_mod, colWidths=[col_w*0.6, col_w*0.4])
    t_module.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLEU_FONCE),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_BLANC, C_GRIS_CLAIR]),
        ("GRID",          (0,0), (-1,-1), 0.5, C_GRIS_BORDER),
        ("PADDING",       (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))

    side_by_side = Table([[t_gravite, t_module]], colWidths=[col_w, col_w])
    side_by_side.setStyle(TableStyle([
        ("VALIGN",  (0,0), (-1,-1), "TOP"),
        ("PADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",  (1,0), (1,-1), 8),
    ]))
    els.append(side_by_side)

    return els


# ============================================================
# SECTION : DÉTAIL DE CHAQUE VULNÉRABILITÉ
# ============================================================
def build_vuln_detail(vulnerabilites, styles, page_width):
    els = []
    els.append(PageBreak())
    els.append(ColorBar(page_width))
    els.append(Spacer(1, 4))
    els.append(Paragraph("Detail des Vulnerabilites", styles["section"]))

    if not vulnerabilites:
        els.append(Paragraph(
            "Aucune vulnerabilite detectee.", styles["normal_gris"]
        ))
        return els

    # Regrouper par module
    from collections import defaultdict
    by_module = defaultdict(list)
    for v in vulnerabilites:
        by_module[v.module].append(v)

    module_order = ["headers", "csrf", "xss", "sqli"]
    sorted_modules = module_order + [m for m in by_module if m not in module_order]

    for mod in sorted_modules:
        vulns = by_module.get(mod)
        if not vulns:
            continue

        # ── Titre du module ──
        mod_label = MODULE_LABELS.get(mod, mod.upper())
        mod_header = Table(
            [[Paragraph(f"Module : {mod_label}", ParagraphStyle(
                "mh", fontSize=11, fontName="Helvetica-Bold",
                textColor=C_BLANC
            ))]],
            colWidths=[page_width]
        )
        mod_header.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_BLEU),
            ("PADDING",    (0,0), (-1,-1), 10),
        ]))
        els.append(Spacer(1, 0.3*cm))
        els.append(mod_header)
        els.append(Spacer(1, 0.2*cm))

        for idx, v in enumerate(vulns):
            col, bg, border = couleurs_gravite(v.gravite)
            card_elements = []

            # ── En-tête de la carte ──
            header_left = [
                Paragraph(
                    f"<font color='#{hex_str(C_BLEU_FONCE)}'>"
                    f"<b>#{idx+1} — {v.type}</b></font>",
                    ParagraphStyle("ct", fontSize=10, fontName="Helvetica-Bold",
                                   textColor=C_BLEU_FONCE, leading=14)
                )
            ]
            if v.parametre:
                header_left.append(
                    Paragraph(
                        f"Parametre : <font name='Courier' size='8'>{v.parametre}</font>",
                        ParagraphStyle("cp", fontSize=8.5, textColor=C_GRIS_TEXTE)
                    )
                )

            badge_text = (v.gravite or "").upper()
            header_right = Paragraph(
                f"<font color='#{hex_str(col)}'><b>{badge_text}</b></font>",
                ParagraphStyle("cb", fontSize=9, fontName="Helvetica-Bold",
                               textColor=col, alignment=TA_RIGHT,
                               backColor=bg)
            )

            card_header = Table(
                [[header_left, header_right]],
                colWidths=[page_width * 0.75, page_width * 0.25]
            )
            card_header.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,-1), bg),
                ("PADDING",     (0,0), (-1,-1), 10),
                ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
                ("LINEBELOW",   (0,0), (-1,-1), 1, border),
            ]))
            card_elements.append(card_header)

            # ── Corps de la carte ──
            body_rows = []

            # Description / détail
            if v.detail:
                body_rows.append([
                    Paragraph("DETAIL DE DETECTION", styles["label"]),
                    Paragraph(v.detail, styles["normal"]),
                ])

            # Payload
            if v.payload:
                body_rows.append([
                    Paragraph("PAYLOAD INJECTE", styles["label"]),
                    Paragraph(
                        f"<font name='Courier' size='8' color='#{hex_str(C_ROUGE)}'>"
                        f"{v.payload}</font>",
                        ParagraphStyle("pl", fontSize=8, fontName="Courier",
                                       textColor=C_ROUGE, backColor=C_ROUGE_BG,
                                       leading=11, leftIndent=2)
                    ),
                ])

            # URL de test
            if v.url_test:
                url_display = v.url_test if len(v.url_test) <= 100 else v.url_test[:97] + "..."
                body_rows.append([
                    Paragraph("URL DE TEST", styles["label"]),
                    Paragraph(
                        f"<font name='Courier' size='7.5' color='#{hex_str(C_BLEU)}'>"
                        f"{url_display}</font>",
                        ParagraphStyle("ul", fontSize=7.5, fontName="Courier",
                                       textColor=C_BLEU, leading=11)
                    ),
                ])

            # Extrait HTML
            if v.html_snippet:
                snippet = v.html_snippet.strip()
                if len(snippet) > 300:
                    snippet = snippet[:297] + "..."
                # Échapper les caractères XML
                snippet = snippet.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                body_rows.append([
                    Paragraph("EXTRAIT HTML", styles["label"]),
                    Paragraph(
                        f"<font name='Courier' size='7' color='#{hex_str(C_BLEU_FONCE)}'>"
                        f"{snippet}</font>",
                        ParagraphStyle("hl", fontSize=7, fontName="Courier",
                                       textColor=C_BLEU_FONCE, backColor=C_GRIS_CLAIR,
                                       leading=10, leftIndent=2)
                    ),
                ])

            # Solution
            if v.solution:
                body_rows.append([
                    Paragraph("RECOMMANDATION", styles["label"]),
                    Paragraph(
                        f"<font color='#{hex_str(C_VERT)}'>{v.solution}</font>",
                        ParagraphStyle("sol", fontSize=9, textColor=C_VERT,
                                       leading=13, leftIndent=2)
                    ),
                ])

            if body_rows:
                body_table = Table(
                    body_rows,
                    colWidths=[page_width * 0.18, page_width * 0.82]
                )
                body_table.setStyle(TableStyle([
                    ("BACKGROUND",    (0,0), (-1,-1), C_BLANC),
                    ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_BLANC, C_GRIS_CLAIR]),
                    ("VALIGN",        (0,0), (-1,-1), "TOP"),
                    ("PADDING",       (0,0), (-1,-1), 8),
                    ("GRID",          (0,0), (-1,-1), 0.4, C_GRIS_BORDER),
                    ("BACKGROUND",    (0,0), (0,-1), colors.HexColor("#F4F8FF")),
                ]))
                card_elements.append(body_table)

            # Bordure gauche colorée + ombre simulée via table wrapper
            card_wrapper = Table(
                [[ card_elements ]],
                colWidths=[page_width]
            )
            card_wrapper.setStyle(TableStyle([
                ("LINEBEFORE", (0,0), (0,-1), 3, col),
                ("PADDING",       (0,0), (-1,-1), 0),
                ("TOPPADDING",    (0,0), (-1,-1), 0),
                ("BOTTOMPADDING", (0,0), (-1,-1), 0),
            ]))

            els.append(KeepTogether(card_elements))
            els.append(Spacer(1, 0.35*cm))

    return els


# ============================================================
# SECTION : RECOMMANDATIONS GLOBALES
# ============================================================
def build_recommandations(vulnerabilites, styles, page_width):
    els = []
    els.append(Spacer(1, 0.3*cm))
    els.append(ColorBar(page_width, color=C_VERT))
    els.append(Spacer(1, 4))
    els.append(Paragraph("Recommandations Globales", styles["section"]))

    solutions_vues = {}
    for v in vulnerabilites:
        if v.solution and v.module not in solutions_vues:
            solutions_vues[v.module] = v.solution

    if not solutions_vues:
        box = Table(
            [[Paragraph("Aucune recommandation — site bien securise !", styles["normal"])]],
            colWidths=[page_width]
        )
        box.setStyle(TableStyle([
            ("BACKGROUND", (0,0),(-1,-1), C_VERT_BG),
            ("PADDING",    (0,0),(-1,-1), 12),
            ("GRID",       (0,0),(-1,-1), 0.5, C_VERT_BORDER),
        ]))
        els.append(box)
        return els

    rows = []
    for mod, sol in solutions_vues.items():
        rows.append([
            Paragraph(MODULE_LABELS.get(mod, mod.upper()),
                      ParagraphStyle("rm", fontSize=9, fontName="Helvetica-Bold",
                                     textColor=C_BLEU)),
            Paragraph(sol, styles["normal"]),
        ])

    reco_table = Table(rows, colWidths=[page_width*0.22, page_width*0.78])
    reco_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_BLANC),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_BLANC, C_VERT_BG]),
        ("GRID",          (0,0), (-1,-1), 0.5, C_GRIS_BORDER),
        ("PADDING",       (0,0), (-1,-1), 9),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("BACKGROUND",    (0,0), (0,-1), colors.HexColor("#F0FBF4")),
    ]))
    els.append(reco_table)
    return els


# ============================================================
# FONCTION PRINCIPALE
# ============================================================
def generer_pdf(scan, vulnerabilites, username):
    """
    Genere un rapport PDF complet pour un scan donne.
    Retourne le chemin du fichier PDF genere.
    """
    filename = f"rapport_scan_{scan.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    # Marges (haut/bas agrandis pour header/footer)
    doc = SimpleDocTemplate(
        filepath,
        pagesize    = A4,
        rightMargin = 1.8*cm,
        leftMargin  = 1.8*cm,
        topMargin   = 1.8*cm,
        bottomMargin= 1.5*cm,
    )

    page_width = A4[0] - 3.6*cm   # largeur utile

    styles  = build_styles()
    contenu = []

    # ── 1. Page de garde ──
    contenu += build_cover(scan, username, styles, page_width)
    contenu.append(Spacer(1, 0.3*cm))

    # ── 2. Informations générales ──
    contenu.append(ColorBar(page_width))
    contenu.append(Spacer(1, 4))
    contenu.append(Paragraph("Informations Generales", styles["section"]))

    info_rows = [
        ["Site analyse",   scan.url],
        ["Date du scan",   scan.date.strftime("%d/%m/%Y a %H:%M")],
        ["Analyse par",    username],
        ["Modules lances", scan.modules.replace(",", " | ").upper()],
        ["Statut",         scan.status.upper()],
    ]
    info_table_data = []
    for label, val in info_rows:
        info_table_data.append([
            Paragraph(label, ParagraphStyle("il", fontSize=9, fontName="Helvetica-Bold",
                                             textColor=C_BLEU)),
            Paragraph(str(val), styles["normal"]),
        ])

    info_table = Table(info_table_data, colWidths=[page_width*0.22, page_width*0.78])
    info_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_BLANC),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [C_BLANC, C_GRIS_CLAIR]),
        ("GRID",          (0,0), (-1,-1), 0.5, C_GRIS_BORDER),
        ("PADDING",       (0,0), (-1,-1), 9),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("BACKGROUND",    (0,0), (0,-1), C_BLEU_CLAIR),
    ]))
    contenu.append(info_table)

    # ── 3. Scores par module ──
    contenu += build_scores(scan, styles, page_width)

    # ── 4. Résumé des vulnérabilités ──
    contenu += build_resume_vulns(vulnerabilites, styles, page_width)

    # ── 5. Détail de chaque vulnérabilité ──
    contenu += build_vuln_detail(vulnerabilites, styles, page_width)

    # ── 6. Recommandations globales ──
    contenu += build_recommandations(vulnerabilites, styles, page_width)

    # ── Construction ──
    doc.build(
        contenu,
        onFirstPage = _header_footer,
        onLaterPages= _header_footer,
    )

    print(f"PDF genere : {filepath}")
    return filepath