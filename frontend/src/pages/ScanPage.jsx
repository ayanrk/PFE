import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, KeyRound, Zap, Database,
  Rocket, Loader2, FileText, CheckCircle2, Lightbulb
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/ScanPage.css";

const MODULES = [
  { id: "headers", Icon: Shield,   label: "HTTP Headers",  desc: "Headers de sécurité"      },
  { id: "csrf",    Icon: KeyRound, label: "CSRF",          desc: "Tokens et cookies"         },
  { id: "xss",     Icon: Zap,      label: "XSS",           desc: "Cross-Site Scripting"      },
  { id: "sqli",    Icon: Database, label: "SQL Injection", desc: "Injection SQL via sqlmap"  },
];

const MODULE_ICONS = { headers: Shield, csrf: KeyRound, xss: Zap, sqli: Database };

const GRAVITE_COLORS = {
  CRITIQUE: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  ÉLEVÉE:   { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
  MOYENNE:  { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  FAIBLE:   { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97" },
};

export default function ScanPage() {
  const [url, setUrl]             = useState("");
  const [cookie, setCookie]       = useState("");
  const [modules, setModules]     = useState(["headers", "csrf", "xss", "sqli"]);
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState(null);
  const [vulns, setVulns]         = useState([]);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("tous");
  const navigate                  = useNavigate();

  const toggleModule = (id) => {
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    if (modules.length === 0) { setError("Sélectionnez au moins un module"); return; }
    setLoading(true); setResults(null); setVulns([]); setError("");
    try {
      const res = await api.post("/scans/run", { url, modules, cookie: cookie || null });
      setResults(res.data.scan);
      const detail = await api.get(`/scans/${res.data.scan.id}`);
      setVulns(detail.data.vulnerabilites);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur durant le scan");
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!results) return;
    try {
      const res = await api.get(`/reports/${results.id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `rapport_scan_${results.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Erreur lors de la génération du PDF");
    }
  };

  const scoreColor = (s) => s >= 80 ? "#3B6D11" : s >= 50 ? "#854F0B" : "#A32D2D";
  const scoreBg    = (s) => s >= 80 ? "#EAF3DE" : s >= 50 ? "#FAEEDA" : "#FCEBEB";

  const filteredVulns = activeTab === "tous"
    ? vulns
    : vulns.filter((v) => v.module === activeTab);

  return (
    <div className="scan-page">
      <Navbar />

      <div className="scan-container">
        <div className="scan-header">
          <h1 className="scan-title">Scanner de vulnérabilités</h1>
          <p className="scan-subtitle">Entrez l'URL du site à analyser et sélectionnez les modules</p>
        </div>

        {/* Formulaire */}
        <div className="scan-card">
          <form onSubmit={handleScan}>

            <div className="scan-field">
              <label className="scan-label">URL cible *</label>
              <input
                type="text"
                placeholder="https://exemple.com ou http://localhost/dvwa"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="scan-input"
              />
            </div>

            <div className="scan-field">
              <label className="scan-label">
                Cookie d'authentification{" "}
                <span className="scan-label-optional">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="PHPSESSID=xxx; security=low"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                className="scan-input"
              />
            </div>

            <div className="scan-field">
              <label className="scan-label">Modules à lancer</label>
              <div className="scan-modules-grid">
                {MODULES.map((m) => {
                  const selected = modules.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`scan-module-card${selected ? " selected" : ""}`}
                    >
                      <div className="scan-module-icon-wrap">
                        <m.Icon size={20} color={selected ? "#185FA5" : "#718096"} />
                      </div>
                      <div>
                        <div className="scan-module-label">{m.label}</div>
                        <div className="scan-module-desc">{m.desc}</div>
                      </div>
                      <div className={`scan-checkbox${selected ? " checked" : ""}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <div className="scan-error-box">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="scan-submit-btn"
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Scan en cours...</>
              ) : (
                <><Rocket size={16} /> Lancer le scan</>
              )}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="scan-loading-card">
            <div className="scan-loading-spinner" />
            <div>
              <div className="scan-loading-title">Scan en cours...</div>
              <div className="scan-loading-desc">
                Analyse de {url} — Cela peut prendre 1 à 3 minutes selon les modules sélectionnés.
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div>
            <div className="scan-results-header">
              <h2 className="scan-results-title">Résultats du scan</h2>
              <button onClick={handlePDF} className="scan-pdf-btn">
                <FileText size={14} /> Télécharger PDF
              </button>
            </div>

            <div className="scan-scores-grid">
              {/* Score global */}
              <div className="scan-score-card" style={{ background: scoreBg(results.score_global) }}>
                <div className="scan-score-label">Score Global</div>
                <div className="scan-score-value" style={{ color: scoreColor(results.score_global) }}>
                  {results.score_global}/100
                </div>
              </div>

              {/* Scores par module */}
              {["headers", "csrf", "xss", "sqli"].map((key) => {
                const val = results[`score_${key}`];
                const MIcon = MODULE_ICONS[key];
                if (val === null || val === undefined) return null;
                return (
                  <div key={key} className="scan-score-card" style={{ background: scoreBg(val) }}>
                    <div className="scan-score-label">
                      <MIcon size={12} color={scoreColor(val)} />
                      {key === "sqli" ? "SQLi" : key.toUpperCase()}
                    </div>
                    <div className="scan-score-value" style={{ color: scoreColor(val) }}>
                      {val}/100
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vulnérabilités */}
            {vulns.length > 0 && (
              <div className="scan-card">
                <div className="scan-tabs-row">
                  {["tous", "headers", "csrf", "xss", "sqli"].map((tab) => {
                    const TIcon = MODULE_ICONS[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`scan-tab${activeTab === tab ? " active" : ""}`}
                      >
                        {TIcon && <TIcon size={12} />}
                        {tab.toUpperCase()}
                        {tab !== "tous" && (
                          <span className="scan-tab-count">
                            {vulns.filter((v) => v.module === tab).length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="scan-vuln-list">
                  {filteredVulns.length === 0 ? (
                    <div className="scan-no-vuln">
                      <CheckCircle2 size={16} /> Aucune vulnérabilité pour ce module
                    </div>
                  ) : (
                    filteredVulns.map((v, i) => {
                      const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                      return (
                        <div key={i} className="scan-vuln-card">
                          <div className="scan-vuln-top">
                            <span
                              className="scan-gravite-badge"
                              style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}
                            >
                              {v.gravite}
                            </span>
                            <span className="scan-vuln-module">{v.module.toUpperCase()}</span>
                            <span className="scan-vuln-type">{v.type}</span>
                          </div>
                          {v.detail   && <p className="scan-vuln-detail">{v.detail}</p>}
                          {v.solution && (
                            <p className="scan-vuln-solution">
                              <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                              {v.solution}
                            </p>
                          )}
                          {v.payload  && <code className="scan-vuln-payload">{v.payload}</code>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
