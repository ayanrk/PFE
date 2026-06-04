import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, KeyRound, Zap, Database, Rocket, ClipboardList } from "lucide-react";
import Navbar from "../components/Navbar";
import shieldImg from "../assets/cyber home.png"; // ← ton image
import "../styles/Home.css";
import Footer from "../components/Footer";

const STATS = [
  { value: "4",    label: "Modules de scan"        },
  { value: "100+", label: "Payloads XSS testés"    },
  { value: "PDF",  label: "Rapport téléchargeable" },
  { value: "100%", label: "Open Source"            },
];

const MODULES = [
  {
    Icon: Shield,
    title: "HTTP Headers",
    desc: "Vérifie la présence des headers de sécurité recommandés par l'OWASP.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
    iconColor: "#A32D2D",
    cardClass: "",
  },
  {
    Icon: KeyRound,
    title: "CSRF",
    desc: "Analyse les formulaires et cookies pour détecter les failles CSRF.",
    gravite: "ÉLEVÉE",
    color: "#FAEEDA",
    textColor: "#854F0B",
    iconColor: "#854F0B",
    cardClass: "elevee",
  },
  {
    Icon: Zap,
    title: "XSS",
    desc: "Injecte des payloads dans les paramètres URL et formulaires.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
    iconColor: "#A32D2D",
    cardClass: "",
  },
  {
    Icon: Database,
    title: "SQL Injection",
    desc: "Utilise sqlmap pour détecter les injections SQL automatiquement.",
    gravite: "CRITIQUE",
    color: "#FCEBEB",
    textColor: "#A32D2D",
    iconColor: "#A32D2D",
    cardClass: "",
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      {/* ── Hero : texte gauche / image droite ── */}
      <div className="home-hero">

        {/* Colonne gauche */}
        <div className="home-hero-left">
          <div className="home-hero-badge">
            <div className="home-badge-dot" />
            Scanner de Vulnérabilités Web
          </div>

          <div className="home-hero-tag">Cybersécurité · OWASP · Pentest</div>

          <h1 className="home-hero-title">
            Analysez la <span>sécurité</span><br />de vos applications web
          </h1>

          <p className="home-hero-sub">
            Entrez une URL et obtenez en quelques secondes un rapport complet
            sur les vulnérabilités de votre site — XSS, SQLi, CSRF, Headers HTTP.
          </p>

          <div className="home-hero-buttons">
            <button onClick={() => navigate("/scan")} className="home-btn-primary">
              <Rocket size={15} /> Lancer un scan
            </button>
            <button onClick={() => navigate("/history")} className="home-btn-secondary">
              <ClipboardList size={15} /> Voir l'historique
            </button>
          </div>

          <div className="home-tech-tags">
            {["XSS", "SQL Injection", "CSRF", "HTTP Headers", "sqlmap"].map((t) => (
              <span key={t} className="home-tech-tag">{t}</span>
            ))}
          </div>
        </div>

        {/* Colonne droite — image */}
        <div className="home-hero-right">
          <img
            className="home-hero-img"
            src={shieldImg}
            alt="Cybersecurity shield"
          />
          <div className="home-scan-overlay">
            <div className="home-scan-beam" />
          </div>
          <div className="home-img-badge">
            <div className="home-img-badge-dot" />
            <span className="home-img-badge-text">
              Scan actif — Score :{" "}
              <span className="home-img-badge-val">0/100 CRITIQUE</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Bande stats ── */}
      <div className="home-stats-band">
        {STATS.map((s, i) => (
          <div key={i} className="home-stat-card">
            <div className="home-stat-value">{s.value}</div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Modules ── */}
      <div className="home-section">
        <div className="home-section-inner">
          <h2 className="home-section-title">Modules de détection</h2>
          <p className="home-section-sub">
            Quatre modules indépendants pour une couverture maximale des vulnérabilités courantes.
          </p>
          <div className="home-modules-grid">
            {MODULES.map((m, i) => (
              <div key={i} className={`home-module-card ${m.cardClass}`}>
                <div className="home-module-icon-wrap" style={{ background: m.color }}>
                  <m.Icon size={24} color={m.iconColor} />
                </div>
                <div
                  className="home-module-badge"
                  style={{ background: m.color, color: m.textColor }}
                >
                  {m.gravite}
                </div>
                <h3 className="home-module-title">{m.title}</h3>
                <p className="home-module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="home-cta">
        <h2 className="home-cta-title">Prêt à analyser votre site ?</h2>
        <p className="home-cta-sub">Commencez maintenant — c'est gratuit et rapide.</p>
        <button onClick={() => navigate("/scan")} className="home-cta-btn">
          Lancer mon premier scan →
        </button>
      </div>

      <Footer />
    </div>
  );
}