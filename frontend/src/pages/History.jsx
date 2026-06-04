import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Shield, KeyRound, Zap, Database,
  FileText, CheckCircle2, Lightbulb, Code2, Link2,
  ChevronDown, ChevronUp, AlertTriangle, Info, Terminal,
  Globe, Clock, Hash, Bug , Search   
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/History.css";
import Footer from "../components/Footer";

const TABS = [
  { id: "tous",    label: "Tous les scans", Icon: ClipboardList },
  { id: "headers", label: "Headers",        Icon: Shield        },
  { id: "csrf",    label: "CSRF",           Icon: KeyRound      },
  { id: "xss",     label: "XSS",            Icon: Zap           },
  { id: "sqli",    label: "SQL Injection",  Icon: Database      },
];

const GRAVITE_COLORS = {
  CRITIQUE: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  ÉLEVÉE:   { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
  MOYENNE:  { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  FAIBLE:   { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97" },
};

const SCORE_ICONS = { headers: Shield, csrf: KeyRound, xss: Zap, sqli: Database };

// Références OWASP / CWE par module
const OWASP_REFS = {
  xss:     { owasp: "A03:2021", cwe: "CWE-79",  label: "Cross-Site Scripting",    link: "https://owasp.org/Top10/A03_2021-Injection/" },
  sqli:    { owasp: "A03:2021", cwe: "CWE-89",  label: "SQL Injection",           link: "https://owasp.org/Top10/A03_2021-Injection/" },
  csrf:    { owasp: "A01:2021", cwe: "CWE-352", label: "Cross-Site Request Forgery", link: "https://owasp.org/www-community/attacks/csrf" },
  headers: { owasp: "A05:2021", cwe: "CWE-16",  label: "Security Misconfiguration", link: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/" },
};

// Descriptions techniques par type de vuln
const VULN_DESCRIPTIONS = {
  "XSS Reflected": "Un XSS Réfléchi (Reflected XSS) se produit lorsque des données fournies par l'utilisateur sont immédiatement renvoyées par le serveur sans encodage. Un attaquant peut forger une URL malveillante et la partager pour voler des sessions ou rediriger des utilisateurs.",
  "XSS Stored/Reflected (formulaire)": "Vulnérabilité XSS détectée via un formulaire. Le payload injecté dans un champ est réfléchi ou stocké, permettant l'exécution de code JavaScript dans le navigateur de la victime.",
  "SQL Injection": "Une injection SQL permet à un attaquant de manipuler les requêtes SQL envoyées à la base de données, pouvant entraîner une exfiltration de données, une modification ou une suppression d'enregistrements.",
  "Token CSRF absent": "L'absence de token CSRF sur un formulaire permet à un attaquant d'effectuer des actions non autorisées au nom d'un utilisateur authentifié.",
};

// ── Composant : carte de vulnérabilité détaillée ──────────────────────
function VulnDetailCard({ vuln, index }) {
  const [expanded, setExpanded] = useState(false);
  const colors = GRAVITE_COLORS[vuln.gravite] || GRAVITE_COLORS["MOYENNE"];
  const ref    = OWASP_REFS[vuln.module] || null;
  const desc   = VULN_DESCRIPTIONS[vuln.type] || null;

  const ModuleIcon = SCORE_ICONS[vuln.module] || Bug;

  return (
    <div
      className="vuln-detail-card"
      style={{ borderLeft: `4px solid ${colors.border}` }}
    >
      {/* ── En-tête ── */}
      <div className="vuln-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="vuln-card-left">
          <span className="vuln-card-index">#{index + 1}</span>
          <div className="vuln-card-icon" style={{ background: colors.bg, color: colors.color }}>
            <ModuleIcon size={14} />
          </div>
          <div>
            <div className="vuln-card-type">{vuln.type}</div>
            {vuln.parametre && (
              <div className="vuln-card-param">
                <Hash size={11} /> Paramètre : <code>{vuln.parametre}</code>
              </div>
            )}
          </div>
        </div>
        <div className="vuln-card-right">
          <span
            className="vuln-gravite-badge"
            style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
          >
            {vuln.gravite}
          </span>
          <button className="vuln-expand-btn">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── Corps étendu ── */}
      {expanded && (
        <div className="vuln-card-body">

          {/* Description technique */}
          {desc && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <Info size={13} /> Description technique
              </div>
              <p className="vuln-section-text">{desc}</p>
            </div>
          )}

          {/* Détail du scanner */}
          {vuln.detail && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <AlertTriangle size={13} /> Détail de détection
              </div>
              <p className="vuln-section-text">{vuln.detail}</p>
            </div>
          )}

          {/* Payload injecté */}
          {vuln.payload && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <Terminal size={13} /> Payload injecté
              </div>
              <div className="vuln-code-block vuln-payload-block">
                <span className="vuln-code-label">PAYLOAD</span>
                <code>{vuln.payload}</code>
              </div>
            </div>
          )}

          {/* URL de test */}
          {vuln.url_test && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <Link2 size={13} /> URL de test utilisée
              </div>
              <div className="vuln-url-block">
                <Globe size={12} />
                <a
                  href={vuln.url_test}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vuln-url-link"
                >
                  {vuln.url_test.length > 120
                    ? vuln.url_test.slice(0, 120) + "…"
                    : vuln.url_test}
                </a>
              </div>
            </div>
          )}

          {/* Extrait HTML */}
          {vuln.html_snippet && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <Code2 size={13} /> Extrait HTML — contexte de la vulnérabilité
              </div>
              <div className="vuln-code-block vuln-html-block">
                <span className="vuln-code-label">HTML SOURCE</span>
                <pre><code>{vuln.html_snippet}</code></pre>
              </div>
              <p className="vuln-snippet-note">
                ↑ Le payload a été détecté dans ce fragment de la réponse HTTP du serveur.
              </p>
            </div>
          )}

          {/* Références OWASP / CWE */}
          {ref && (
            <div className="vuln-section">
              <div className="vuln-section-title">
                <Hash size={13} /> Références
              </div>
              <div className="vuln-refs-row">
                <a href={ref.link} target="_blank" rel="noopener noreferrer" className="vuln-ref-badge owasp">
                  OWASP {ref.owasp}
                </a>
                <span className="vuln-ref-badge cwe">{ref.cwe}</span>
                <span className="vuln-ref-badge label">{ref.label}</span>
              </div>
            </div>
          )}

          {/* Solution */}
          {vuln.solution && (
            <div className="vuln-section vuln-solution-section">
              <div className="vuln-section-title">
                <Lightbulb size={13} /> Recommandation de correction
              </div>
              <p className="vuln-solution-text">{vuln.solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────
export default function History() {
  const [activeTab, setActiveTab]         = useState("tous");
  const [scans, setScans]                 = useState([]);
  const [moduleVulns, setModuleVulns]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedScan, setSelectedScan]   = useState(null);
  const [scanDetail, setScanDetail]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [vulnFilter, setVulnFilter]       = useState("tous");
  const navigate = useNavigate();

  useEffect(() => { fetchScans(); }, []);
  useEffect(() => {
    if (activeTab !== "tous") fetchModuleVulns(activeTab);
  }, [activeTab]);

  const fetchScans = async () => {
    try {
      const res = await api.get("/scans/");
      setScans(res.data.scans);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchModuleVulns = async (module) => {
    try {
      const res = await api.get(`/scans/module/${module}`);
      setModuleVulns(res.data.vulnerabilites);
    } catch (err) { console.error(err); }
  };

  const fetchScanDetail = async (scan) => {
    setSelectedScan(scan);
    setLoadingDetail(true);
    setVulnFilter("tous");
    try {
      const res = await api.get(`/scans/${scan.id}`);
      setScanDetail(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  };

  const handlePDF = async (scanId) => {
    try {
      const res  = await api.get(`/reports/${scanId}`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `rapport_scan_${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert("Erreur lors de la génération du PDF"); }
  };

  const scoreColor = (s) => s >= 80 ? "#3B6D11" : s >= 50 ? "#854F0B" : "#A32D2D";
  const scoreBg    = (s) => s >= 80 ? "#EAF3DE" : s >= 50 ? "#FAEEDA" : "#FCEBEB";
  const scoreLabel = (s) => s >= 80 ? "Sécurisé" : s >= 50 ? "Moyen" : "Critique";

  // Vulnérabilités filtrées dans le détail
  const vulnsInDetail = scanDetail?.vulnerabilites || [];
  const vulnModules   = [...new Set(vulnsInDetail.map(v => v.module))];
  const filteredVulns = vulnFilter === "tous"
    ? vulnsInDetail
    : vulnsInDetail.filter(v => v.module === vulnFilter);

  // Stats rapides pour le détail
  const vulnsByCriticite = vulnsInDetail.reduce((acc, v) => {
    acc[v.gravite] = (acc[v.gravite] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="history-page">
      <Navbar />

      <div className="history-layout">
        {/* ── Sidebar gauche ── */}
        <div className="history-sidebar">
          <div className="history-sidebar-header">
            <ClipboardList size={1} />
            <h1 className="history-sidebar-title">Historique des scans</h1>
          </div>

          {/* Tabs modules */}
          <div className="history-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSelectedScan(null); setScanDetail(null); }}
                className={`history-tab${activeTab === id ? " active" : ""}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Liste des scans */}
          {loading ? (
            <div className="history-detail-empty">Chargement...</div>
          ) : activeTab === "tous" ? (
            <div className="history-scan-list">
              {scans.length === 0 && (
                <div className="history-detail-empty">Aucun scan effectué.</div>
              )}
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => fetchScanDetail(scan)}
                  className={`history-scan-item${selectedScan?.id === scan.id ? " selected" : ""}`}
                >
                  <div className="history-scan-top">
                    <div
                      className="history-score-pill"
                      style={{ background: scoreBg(scan.score_global), color: scoreColor(scan.score_global) }}
                    >
                      {scoreLabel(scan.score_global)} — {scan.score_global}/100
                    </div>
                    <span className="history-scan-date">
                      {new Date(scan.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="history-scan-url">{scan.url}</p>
                  <div className="history-scan-modules">
                    {scan.modules?.split(",").map((m) => (
                      <span key={m} className="history-module-pill">{m.toUpperCase()}</span>
                    ))}
                  </div>
                  <div className="history-scan-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePDF(scan.id); }}
                      className="history-pdf-btn"
                    >
                      <FileText size={12} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vue par module */
            <div className="history-module-vulns">
              {moduleVulns.length === 0 && (
                <div className="history-detail-empty">Aucune vulnérabilité détectée pour ce module.</div>
              )}
              {moduleVulns.map((v, i) => {
                const colors = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["MOYENNE"];
                return (
                  <div key={i} className="history-module-vuln-item" style={{ borderLeft: `3px solid ${colors.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span className="vuln-card-type" style={{ fontSize: 13 }}>{v.type}</span>
                      <span className="vuln-gravite-badge" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                        {v.gravite}
                      </span>
                    </div>
                    {v.detail && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{v.detail}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Panneau de détail ── */}
        <div className="history-detail-panel">
          {!selectedScan ? (
            <div className="history-detail-empty">
              <div className="history-empty-icon">
  <Search size={48} color="#CBD5E1" />
</div>
              <div className="history-empty-text">Sélectionnez un scan pour voir les détails complets</div>
            </div>
          ) : loadingDetail ? (
            <div className="history-detail-empty">
              <div className="history-loading-spinner" />
              Chargement des détails...
            </div>
          ) : scanDetail ? (
            <div className="history-detail-content">

              {/* ── En-tête du scan ── */}
              <div className="history-detail-top">
                <div>
                  <h2 className="history-detail-title">
                    Scan #{selectedScan.id}
                  </h2>
                  <div className="history-detail-meta">
                    <span><Globe size={13} /> {selectedScan.url}</span>
                    <span><Clock size={13} /> {new Date(selectedScan.date).toLocaleString("fr-FR")}</span>
                    <span><Hash size={13} /> {vulnsInDetail.length} vulnérabilité(s) détectée(s)</span>
                  </div>
                </div>
                <button onClick={() => handlePDF(selectedScan.id)} className="history-pdf-btn-large">
                  <FileText size={14} /> Télécharger PDF
                </button>
              </div>

              {/* ── Scores ── */}
              <div className="history-scores-grid">
                <div className="history-score-card global" style={{ background: scoreBg(scanDetail.scan.score_global) }}>
                  <div className="history-score-label">Score Global</div>
                  <div className="history-score-value" style={{ color: scoreColor(scanDetail.scan.score_global) }}>
                    {scanDetail.scan.score_global}/100
                  </div>
                  <div className="history-score-level" style={{ color: scoreColor(scanDetail.scan.score_global) }}>
                    {scoreLabel(scanDetail.scan.score_global)}
                  </div>
                </div>
                {["headers", "csrf", "xss", "sqli"].map((key) => {
                  const val   = scanDetail.scan[`score_${key}`];
                  const SIcon = SCORE_ICONS[key];
                  if (val === null || val === undefined) return null;
                  return (
                    <div key={key} className="history-score-card" style={{ background: scoreBg(val) }}>
                      <div className="history-score-label">
                        <SIcon size={11} color={scoreColor(val)} />
                        {key === "sqli" ? "SQL Injection" : key.toUpperCase()}
                      </div>
                      <div className="history-score-value" style={{ color: scoreColor(val) }}>
                        {val}/100
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Résumé des vulnérabilités ── */}
              {vulnsInDetail.length > 0 && (
                <div className="history-vuln-summary">
                  <div className="history-summary-title">
                    <Bug size={14} /> Résumé des vulnérabilités
                  </div>
                  <div className="history-summary-pills">
                    {Object.entries(vulnsByCriticite).map(([gravite, count]) => {
                      const colors = GRAVITE_COLORS[gravite] || GRAVITE_COLORS["MOYENNE"];
                      return (
                        <span key={gravite} className="history-summary-pill"
                          style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                          {count} {gravite}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Filtres par module ── */}
              {vulnsInDetail.length > 0 && (
                <div className="history-vuln-filters">
                  <button
                    className={`history-filter-btn${vulnFilter === "tous" ? " active" : ""}`}
                    onClick={() => setVulnFilter("tous")}
                  >
                    Tous ({vulnsInDetail.length})
                  </button>
                  {vulnModules.map(m => {
                    const MIcon = SCORE_ICONS[m] || Bug;
                    return (
                      <button
                        key={m}
                        className={`history-filter-btn${vulnFilter === m ? " active" : ""}`}
                        onClick={() => setVulnFilter(m)}
                      >
                        <MIcon size={12} />
                        {m.toUpperCase()} ({vulnsInDetail.filter(v => v.module === m).length})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Liste des vulnérabilités ── */}
              {vulnsInDetail.length === 0 ? (
                <div className="history-no-vulns">
                  <CheckCircle2 size={32} color="#3B6D11" />
                  <div>Aucune vulnérabilité détectée — le site semble sécurisé !</div>
                </div>
              ) : (
                <div className="history-vulns-list">
                  <div className="history-vulns-header">
                    <span className="history-vulns-count">
                      {filteredVulns.length} vulnérabilité(s)
                      {vulnFilter !== "tous" ? ` — module ${vulnFilter.toUpperCase()}` : ""}
                    </span>
                    <span className="history-vulns-hint">Cliquez sur une vulnérabilité pour les détails</span>
                  </div>
                  {filteredVulns.map((vuln, i) => (
                    <VulnDetailCard key={vuln.id || i} vuln={vuln} index={i} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <Footer/>
    </div>
  );
}