import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/History.css";

const TABS = [
  { id: "tous",    label: "Tous les scans", icon: "📋" },
  { id: "headers", label: "Headers",        icon: "🛡️" },
  { id: "csrf",    label: "CSRF",           icon: "🔐" },
  { id: "xss",     label: "XSS",            icon: "💉" },
  { id: "sqli",    label: "SQL Injection",  icon: "🗄️" },
];

const GRAVITE_COLORS = {
  CRITIQUE: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  ÉLEVÉE:   { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
  MOYENNE:  { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  FAIBLE:   { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97" },
};

const scoreColor = (s) => s >= 80 ? "#3B6D11" : s >= 50 ? "#854F0B" : "#A32D2D";
const scoreBg    = (s) => s >= 80 ? "#EAF3DE" : s >= 50 ? "#FAEEDA" : "#FCEBEB";
const scoreLabel = (s) => s >= 80 ? "BON"     : s >= 50 ? "MOYEN"   : "FAIBLE";

export default function History() {
  const [activeTab, setActiveTab]         = useState("tous");
  const [scans, setScans]                 = useState([]);
  const [moduleVulns, setModuleVulns]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedScan, setSelectedScan]   = useState(null);
  const [scanDetail, setScanDetail]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchScans(); }, []);
  useEffect(() => { if (activeTab !== "tous") fetchModuleVulns(activeTab); }, [activeTab]);

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

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-container">

        <div className="history-header">
          <h1 className="history-title">Historique des scans</h1>
          <p className="history-subtitle">{scans.length} scan{scans.length > 1 ? "s" : ""} effectué{scans.length > 1 ? "s" : ""}</p>
        </div>

        {/* Tabs */}
        <div className="history-tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`history-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Onglet TOUS */}
        {activeTab === "tous" && (
          <>
            {loading ? (
              <div className="history-empty">Chargement...</div>
            ) : scans.length === 0 ? (
              <div className="history-empty-card">
                <div className="history-empty-icon">📋</div>
                <p className="history-empty-text">Aucun scan effectué</p>
                <button onClick={() => navigate("/scan")} className="history-empty-btn">
                  Lancer mon premier scan
                </button>
              </div>
            ) : (
              <div className="history-two-col">
                {/* Liste */}
                <div className="history-scan-list">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => fetchScanDetail(scan)}
                      className={`history-scan-card ${selectedScan?.id === scan.id ? "selected" : ""}`}
                    >
                      <div className="history-scan-top">
                        <div className="history-score-pill" style={{ background: scoreBg(scan.score_global), color: scoreColor(scan.score_global) }}>
                          {scan.score_global}/100
                        </div>
                        <span className="history-scan-date">{scan.date}</span>
                      </div>
                      <div className="history-scan-url">{scan.url}</div>
                      <div className="history-scan-modules">
                        {scan.modules.split(",").map((m) => (
                          <span key={m} className="history-module-pill">{m.toUpperCase()}</span>
                        ))}
                      </div>
                      <div className="history-scan-actions">
                        <button onClick={(e) => { e.stopPropagation(); handlePDF(scan.id); }} className="history-pdf-btn">
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Détail */}
                <div className="history-detail-panel">
                  {!selectedScan ? (
                    <div className="history-detail-empty">👈 Sélectionnez un scan pour voir les détails</div>
                  ) : loadingDetail ? (
                    <div className="history-detail-empty">Chargement...</div>
                  ) : scanDetail ? (
                    <div>
                      <h3 className="history-detail-title">Détail du scan #{selectedScan.id}</h3>
                      <div className="history-detail-url">{selectedScan.url}</div>

                      <div className="history-scores-grid">
                        {[
                          { label: "🛡️ Headers", score: selectedScan.score_headers },
                          { label: "🔐 CSRF",    score: selectedScan.score_csrf    },
                          { label: "💉 XSS",     score: selectedScan.score_xss     },
                          { label: "🗄️ SQLi",    score: selectedScan.score_sqli    },
                        ].filter((s) => s.score !== null).map((s, i) => (
                          <div key={i} className="history-score-card" style={{ background: scoreBg(s.score) }}>
                            <div className="history-score-label">{s.label}</div>
                            <div className="history-score-value" style={{ color: scoreColor(s.score) }}>{s.score}/100</div>
                            <div className="history-score-level" style={{ color: scoreColor(s.score) }}>{scoreLabel(s.score)}</div>
                          </div>
                        ))}
                      </div>

                      <h4 className="history-vuln-title">Vulnérabilités ({scanDetail.total_vulns})</h4>
                      {scanDetail.vulnerabilites.length === 0 ? (
                        <div className="history-no-vuln">✅ Aucune vulnérabilité détectée</div>
                      ) : (
                        scanDetail.vulnerabilites.map((v, i) => {
                          const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                          return (
                            <div key={i} className="history-vuln-card">
                              <div className="history-vuln-top">
                                <span className="history-gravite-badge" style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}>
                                  {v.gravite}
                                </span>
                                <span className="history-vuln-type">{v.type}</span>
                              </div>
                              {v.detail   && <p className="history-vuln-detail">{v.detail}</p>}
                              {v.solution && <p className="history-vuln-solution">💡 {v.solution}</p>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        {/* Onglets modules */}
        {activeTab !== "tous" && (
          <div className="history-card">
            <h3 className="history-module-tab-title">Vulnérabilités — {activeTab.toUpperCase()}</h3>
            {moduleVulns.length === 0 ? (
              <div className="history-no-vuln">✅ Aucune vulnérabilité {activeTab.toUpperCase()} détectée</div>
            ) : (
              <div className="history-vuln-list">
                {moduleVulns.map((v, i) => {
                  const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                  return (
                    <div key={i} className="history-vuln-card">
                      <div className="history-vuln-top">
                        <span className="history-gravite-badge" style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}>
                          {v.gravite}
                        </span>
                        <span className="history-vuln-type">{v.type}</span>
                      </div>
                      {v.detail   && <p className="history-vuln-detail">{v.detail}</p>}
                      {v.solution && <p className="history-vuln-solution">💡 {v.solution}</p>}
                      {v.payload  && <code className="history-vuln-payload">{v.payload}</code>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
