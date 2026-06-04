import { Link } from "react-router-dom";
import { ShieldCheck, Mail, GitBranch  } from "lucide-react";

import "../styles/Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  const navLinks = [
    { path: "/",          label: "Accueil"    },
    { path: "/scan",      label: "Scanner"    },
    { path: "/dashboard", label: "Dashboard"  },
    { path: "/history",   label: "Historique" },
  ];

  const modules = [
    "SQL Injection", "XSS", "CSRF", "Headers de sécurité",
  ];

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Marque */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            
            <span className="footer-logo-text">PFE Scanner</span>
          </Link>
          <p className="footer-tagline">
            Scanner de vulnérabilités web — analysez la sécurité de vos sites
            en quelques secondes.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-col">
          <h4 className="footer-col-title">Navigation</h4>
          {navLinks.map((l) => (
            <Link key={l.path} to={l.path} className="footer-link">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Modules */}
        <div className="footer-col">
          <h4 className="footer-col-title">Modules</h4>
          {modules.map((m) => (
            <span key={m} className="footer-link footer-link-static">{m}</span>
          ))}
        </div>

        {/* Contact / liens */}
        <div className="footer-col">
          <h4 className="footer-col-title">Liens</h4>
          
           <a href="https://github.com/ayanrk/PFE"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link footer-social"
                >
  <GitBranch size={14} /> Code source
</a>
          <a href="mailto:contact@pfescanner.local" className="footer-link footer-social">
            <Mail size={14} /> Contact
          </a>
        </div>

      </div>

      {/* Bas de page */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-bottom-brand">
            <ShieldCheck size={13} /> PFE Scanner
          </span>
          <span>
            © {year} — Projet de Fin d'Études 2025/2026 · Licence Développement Informatique
          </span>
        </div>
      </div>
    </footer>
  );
}