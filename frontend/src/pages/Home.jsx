import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/Home.css";

const STATS = [
  { value: "4",    label: "Modules de scan"        },
  { value: "100+", label: "Payloads XSS testés"    },
  { value: "PDF",  label: "Rapport téléchargeable" },
  { value: "100%", label: "Open Source"            },
];

const MODULES = [
  { icon: "🛡️", title: "HTTP Headers",  desc: "Vérifie la présence des headers de sécurité recommandés par l'OWASP.", gravite: "CRITIQUE", color: "#FCEBEB", textColor: "#A32D2D" },
  { icon: "🔐", title: "CSRF",          desc: "Analyse les formulaires et cookies pour détecter les failles CSRF.",    gravite: "ÉLEVÉE",  color: "#FAEEDA", textColor: "#854F0B" },
  { icon: "💉", title: "XSS",           desc: "Injecte des payloads dans les paramètres URL et formulaires.",          gravite: "CRITIQUE", color: "#FCEBEB", textColor: "#A32D2D" },
  { icon: "🗄️", title: "SQL Injection", desc: "Utilise sqlmap pour détecter les injections SQL automatiquement.",     gravite: "CRITIQUE", color: "#FCEBEB", textColor: "#A32D2D" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      <div className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🔒 Scanner de Vulnérabilités Web</div>
          <h1 className="home-hero-title">Analysez la sécurité<br />de vos applications web</h1>
          <p className="home-hero-sub">
            Entrez une URL et obtenez en quelques secondes un rapport complet sur les vulnérabilités de votre site.
          </p>
          <div className="home-hero-buttons">
            <button onClick={() => navigate("/scan")} className="home-btn-primary">🚀 Lancer un scan</button>
            <button onClick={() => navigate("/history")} className="home-btn-secondary">📋 Voir l'historique</button>
          </div>
        </div>

        <div className="home-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="home-stat-card">
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-inner">
          <h2 className="home-section-title">Modules de détection</h2>
          <p className="home-section-sub">Quatre modules indépendants pour une couverture maximale des vulnérabilités courantes.</p>
          <div className="home-modules-grid">
            {MODULES.map((m, i) => (
              <div key={i} className="home-module-card">
                <div className="home-module-icon">{m.icon}</div>
                <div className="home-module-badge" style={{ background: m.color, color: m.textColor }}>{m.gravite}</div>
                <h3 className="home-module-title">{m.title}</h3>
                <p className="home-module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="home-cta">
        <h2 className="home-cta-title">Prêt à analyser votre site ?</h2>
        <p className="home-cta-sub">Commencez maintenant — c'est gratuit et rapide.</p>
        <button onClick={() => navigate("/scan")} className="home-cta-btn">Lancer mon premier scan →</button>
      </div>

      <footer className="home-footer">
        <p>PFE Scanner — Projet de Fin d'Études 2025/2026 — Licence Développement Informatique</p>
      </footer>
    </div>
  );
}
