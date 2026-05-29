import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Shield, KeyRound, Zap, Database,
  FileText, CheckCircle2, Lightbulb
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/History.css";

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

export default function History() {
  const [activeTab, setActiveTab]       = useState("tous");
  const [scans, setScans]               = useState([]);
  const [moduleVulns, setModuleVulns]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanDetail, setScanDetail]     = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
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
  const scoreLabel = (s) => s >= 80 ? "BON"     : s >= 50 ? "MOYEN"   : "FAIBLE";

  return (
    <div className="history-page">
      <Navbar />

      <div className="history-container">
        <div className="history-header">
          <h1 className="history-title">Historique des scans</h1>
          <p className="history-subtitle">
            {scans.length} scan{scans.length > 1 ? "s" : ""} effectué{scans.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Tabs */}
        <div className="history-tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`history-tab${activeTab === tab.id ? " active" : ""}`}
            >
              <tab.Icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Onglet TOUS ── */}
        {activeTab === "tous" && (
          <div>
            {loading ? (
              <div className="history-empty">Chargement...</div>
            ) : scans.length === 0 ? (
              <div className="history-empty-card">
                <div className="history-empty-icon-wrap">
                  <ClipboardList size={40} color="#A0AEC0" />
                </div>
                <p className="history-empty-text">Aucun scan effectué</p>
                <button onClick={() => navigate("/scan")} className="history-empty-btn">
                  Lancer mon premier scan
                </button>
              </div>
            ) : (
              <div className="history-two-col">
                {/* Liste scans */}
                <div className="history-scan-list">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => fetchScanDetail(scan)}
                      className={`history-scan-card${selectedScan?.id === scan.id ? " selected" : ""}`}
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
                          <FileText size={12} /> Télécharger PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Panneau de détail */}
                <div className="history-detail-panel">
                  {!selectedScan ? (
                    <div className="history-detail-empty">
                      ← Sélectionnez un scan pour voir les détails
                    </div>
                  ) : loadingDetail ? (
                    <div className="history-detail-empty">Chargement...</div>
                  ) : scanDetail ? (
                    <div>
                      <h2 className="history-detail-title">Détail du scan #{selectedScan.id}</h2>
                      <p className="history-detail-url">{selectedScan.url}</p>

                      {/* Scores */}
                      <div className="history-scores-grid">
                        {["headers", "csrf", "xss", "sqli"].map((key) => {
                          const val   = scanDetail.scan[`score_${key}`];
                          const SIcon = SCORE_ICONS[key];
                          if (val === null || val === undefined) return null;
                          return (
                            <div key={key} className="history-score-card" style={{ background: scoreBg(val) }}>
                              <div className="history-score-label">
                                <SIcon size={11} color={scoreColor(val)} />
                                {key === "sqli" ? "SQLi" : key.toUpperCase()}
                              </div>
                              <div className="history-score-value" style={{ color: scoreColor(val) }}>
                                {val}/100
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vulnérabilités */}
                      <h3 className="history-vuln-title">
                        Vulnérabilités ({scanDetail.total_vulns})
                      </h3>
                      {scanDetail.vulnerabilites.length === 0 ? (
                        <div className="history-no-vuln">
                          <CheckCircle2 size={15} /> Aucune vulnérabilité détectée
                        </div>
                      ) : (
                        <div className="history-vuln-list">
                          {scanDetail.vulnerabilites.map((v, i) => {
                            const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                            return (
                              <div key={i} className="history-vuln-card">
                                <div className="history-vuln-top">
                                  <span
                                    className="history-gravite-badge"
                                    style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}
                                  >
                                    {v.gravite}
                                  </span>
                                  <span className="history-vuln-module-tag">
                                    {v.module.toUpperCase()}
                                  </span>
                                  <span className="history-vuln-type">{v.type}</span>
                                </div>
                                {v.detail   && <p className="history-vuln-detail">{v.detail}</p>}
                                {v.solution && (
                                  <p className="history-vuln-solution">
                                    <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                                    {v.solution}
                                  </p>
                                )}
                                {v.payload  && <code className="history-vuln-payload">{v.payload}</code>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglets par module ── */}
        {activeTab !== "tous" && (
          <div className="history-card">
            {(() => {
              const currentTab = TABS.find((t) => t.id === activeTab);
              return (
                <h2 className="history-module-tab-title">
                  {currentTab && <currentTab.Icon size={20} color="#0C447C" />}
                  {currentTab?.label}
                </h2>
              );
            })()}

            {moduleVulns.length === 0 ? (
              <div className="history-no-vuln">
                <CheckCircle2 size={15} /> Aucune vulnérabilité pour ce module
              </div>
            ) : (
              <div className="history-vuln-list">
                {moduleVulns.map((v, i) => {
                  const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                  return (
                    <div key={i} className="history-vuln-card">
                      <div className="history-vuln-top">
                        <span
                          className="history-gravite-badge"
                          style={{ background: g.bg, color: g.color, border: `1px solid ${g.border}` }}
                        >
                          {v.gravite}
                        </span>
                        <span className="history-vuln-type">{v.type}</span>
                      </div>
                      {v.detail   && <p className="history-vuln-detail">{v.detail}</p>}
                      {v.solution && (
                        <p className="history-vuln-solution">
                          <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                          {v.solution}
                        </p>
                      )}
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
