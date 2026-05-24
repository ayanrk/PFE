import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const STATS = [
  { value: "4",    label: "Modules de scan"        },
  { value: "100+", label: "Payloads XSS testés"    },
  { value: "PDF",  label: "Rapport téléchargeable" },
  { value: "100%", label: "Open Source"            },
];

const MODULES = [
  {
    icon: "🛡️",
    title: "HTTP Headers",
    desc: "Vérifie la présence des headers de sécurité recommandés par l'OWASP.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
  },
  {
    icon: "🔐",
    title: "CSRF",
    desc: "Analyse les formulaires et cookies pour détecter les failles CSRF.",
    gravite: "ÉLEVÉE",
    color: "#FAEEDA",
    textColor: "#854F0B",
  },
  {
    icon: "💉",
    title: "XSS",
    desc: "Injecte des payloads dans les paramètres URL et formulaires.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
  },
  {
    icon: "🗄️",
    title: "SQL Injection",
    desc: "Utilise sqlmap pour détecter les injections SQL automatiquement.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
  },
];

export default function Home() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  return (
    <div style={styles.page}>
      <Navbar />

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>🔒 Scanner de Vulnérabilités Web</div>
          <h1 style={styles.heroTitle}>
            Analysez la sécurité<br />de vos applications web
          </h1>
          <p style={styles.heroSub}>
            Entrez une URL et obtenez en quelques secondes un rapport complet sur les vulnérabilités de votre site — XSS, SQLi, CSRF, Headers HTTP.
          </p>
          <div style={styles.heroButtons}>
            <button
              onClick={() => navigate("/scan")}
              style={styles.btnPrimary}
            >
              🚀 Lancer un scan
            </button>
            <button
              onClick={() => navigate("/history")}
              style={styles.btnSecondary}
            >
              📋 Voir l'historique
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>Modules de détection</h2>
          <p style={styles.sectionSub}>
            Quatre modules indépendants pour une couverture maximale des vulnérabilités courantes.
          </p>
          <div style={styles.modulesGrid}>
            {MODULES.map((m, i) => (
              <div key={i} style={styles.moduleCard}>
                <div style={styles.moduleIcon}>{m.icon}</div>
                <div style={{ ...styles.moduleBadge, background: m.color, color: m.textColor }}>
                  {m.gravite}
                </div>
                <h3 style={styles.moduleTitle}>{m.title}</h3>
                <p style={styles.moduleDesc}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={styles.cta}>
        <h2 style={styles.ctaTitle}>Prêt à analyser votre site ?</h2>
        <p style={styles.ctaSub}>Commencez maintenant — c'est gratuit et rapide.</p>
        <button onClick={() => navigate("/scan")} style={styles.ctaBtn}>
          Lancer mon premier scan →
        </button>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>PFE Scanner — Projet de Fin d'Études 2025/2026 — Licence Développement Informatique</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7FAFC",
    fontFamily: "'Segoe UI', sans-serif",
  },
  hero: {
    background: "linear-gradient(135deg, #0C447C 0%, #185FA5 100%)",
    padding: "5rem 2rem 4rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "700px",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    borderRadius: "20px",
    padding: "6px 18px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "1.5rem",
  },
  heroTitle: {
    fontSize: "48px",
    fontWeight: "700",
    color: "white",
    lineHeight: "1.2",
    marginBottom: "1.25rem",
  },
  heroSub: {
    fontSize: "17px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: "1.7",
    marginBottom: "2rem",
  },
  heroButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  btnPrimary: {
    background: "white",
    color: "#0C447C",
    border: "none",
    borderRadius: "10px",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginTop: "4rem",
    maxWidth: "800px",
    width: "100%",
  },
  statCard: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "1.25rem",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "white",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
  },
  section: {
    padding: "5rem 2rem",
  },
  sectionInner: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0C447C",
    textAlign: "center",
    marginBottom: "0.75rem",
  },
  sectionSub: {
    fontSize: "16px",
    color: "#718096",
    textAlign: "center",
    marginBottom: "3rem",
  },
  modulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  moduleCard: {
    background: "white",
    borderRadius: "14px",
    padding: "1.75rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #E2E8F0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  moduleIcon: {
    fontSize: "32px",
  },
  moduleBadge: {
    display: "inline-block",
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "700",
    width: "fit-content",
  },
  moduleTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1A202C",
  },
  moduleDesc: {
    fontSize: "13px",
    color: "#718096",
    lineHeight: "1.6",
  },
  cta: {
    background: "linear-gradient(135deg, #0C447C, #185FA5)",
    padding: "5rem 2rem",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "36px",
    fontWeight: "700",
    color: "white",
    marginBottom: "1rem",
  },
  ctaSub: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "2rem",
  },
  ctaBtn: {
    background: "white",
    color: "#0C447C",
    border: "none",
    borderRadius: "10px",
    padding: "14px 32px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
  footer: {
    background: "#1A202C",
    color: "#718096",
    textAlign: "center",
    padding: "1.5rem",
    fontSize: "13px",
  },
};