import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

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

export default function History() {
  const [activeTab, setActiveTab]   = useState("tous");
  const [scans, setScans]           = useState([]);
  const [moduleVulns, setModuleVulns] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanDetail, setScanDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const navigate = useNavigate();

  // Charger historique
  useEffect(() => {
    fetchScans();
  }, []);

  // Charger vulnérabilités par module
  useEffect(() => {
    if (activeTab !== "tous") fetchModuleVulns(activeTab);
  }, [activeTab]);

  const fetchScans = async () => {
    try {
      const res = await api.get("/scans/");
      setScans(res.data.scans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleVulns = async (module) => {
    try {
      const res = await api.get(`/scans/module/${module}`);
      setModuleVulns(res.data.vulnerabilites);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScanDetail = async (scan) => {
    setSelectedScan(scan);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/scans/${scan.id}`);
      setScanDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
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
    } catch {
      alert("Erreur lors de la génération du PDF");
    }
  };

  const scoreColor = (s) => s >= 80 ? "#3B6D11" : s >= 50 ? "#854F0B" : "#A32D2D";
  const scoreBg    = (s) => s >= 80 ? "#EAF3DE" : s >= 50 ? "#FAEEDA" : "#FCEBEB";
  const scoreLabel = (s) => s >= 80 ? "BON" : s >= 50 ? "MOYEN" : "FAIBLE";

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Historique des scans</h1>
          <p style={styles.subtitle}>
            {scans.length} scan{scans.length > 1 ? "s" : ""} effectué{scans.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Onglet TOUS ── */}
        {activeTab === "tous" && (
          <div style={styles.content}>
            {loading ? (
              <div style={styles.empty}>Chargement...</div>
            ) : scans.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>📋</div>
                <p style={styles.emptyText}>Aucun scan effectué</p>
                <button onClick={() => navigate("/scan")} style={styles.emptyBtn}>
                  Lancer mon premier scan
                </button>
              </div>
            ) : (
              <div style={styles.twoCol}>
                {/* Liste scans */}
                <div style={styles.scanList}>
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => fetchScanDetail(scan)}
                      style={{
                        ...styles.scanCard,
                        ...(selectedScan?.id === scan.id ? styles.scanCardSelected : {}),
                      }}
                    >
                      <div style={styles.scanTop}>
                        <div style={{
                          ...styles.scorePill,
                          background: scoreBg(scan.score_global),
                          color: scoreColor(scan.score_global),
                        }}>
                          {scan.score_global}/100
                        </div>
                        <span style={styles.scanDate}>{scan.date}</span>
                      </div>
                      <div style={styles.scanUrl}>{scan.url}</div>
                      <div style={styles.scanModules}>
                        {scan.modules.split(",").map((m) => (
                          <span key={m} style={styles.modulePill}>{m.toUpperCase()}</span>
                        ))}
                      </div>
                      <div style={styles.scanActions}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePDF(scan.id); }}
                          style={styles.pdfBtn}
                        >
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Détail scan */}
                <div style={styles.detailPanel}>
                  {!selectedScan ? (
                    <div style={styles.detailEmpty}>
                      <p>👈 Sélectionnez un scan pour voir les détails</p>
                    </div>
                  ) : loadingDetail ? (
                    <div style={styles.detailEmpty}>Chargement...</div>
                  ) : scanDetail ? (
                    <div>
                      <h3 style={styles.detailTitle}>Détail du scan #{selectedScan.id}</h3>
                      <div style={styles.detailUrl}>{selectedScan.url}</div>

                      {/* Scores */}
                      <div style={styles.scoresGrid}>
                        {[
                          { label: "🛡️ Headers", score: selectedScan.score_headers },
                          { label: "🔐 CSRF",    score: selectedScan.score_csrf    },
                          { label: "💉 XSS",     score: selectedScan.score_xss     },
                          { label: "🗄️ SQLi",    score: selectedScan.score_sqli    },
                        ].filter((s) => s.score !== null).map((s, i) => (
                          <div key={i} style={{ ...styles.scoreCard, background: scoreBg(s.score) }}>
                            <div style={styles.scoreLabel}>{s.label}</div>
                            <div style={{ ...styles.scoreValue, color: scoreColor(s.score) }}>
                              {s.score}/100
                            </div>
                            <div style={{ fontSize: "10px", color: scoreColor(s.score), fontWeight: "600" }}>
                              {scoreLabel(s.score)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vulnérabilités */}
                      <h4 style={styles.vulnTitle}>
                        Vulnérabilités ({scanDetail.total_vulns})
                      </h4>
                      {scanDetail.vulnerabilites.length === 0 ? (
                        <div style={styles.noVuln}>✅ Aucune vulnérabilité détectée</div>
                      ) : (
                        scanDetail.vulnerabilites.map((v, i) => {
                          const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                          return (
                            <div key={i} style={styles.vulnCard}>
                              <div style={styles.vulnTop}>
                                <span style={{
                                  ...styles.graviteBadge,
                                  background: g.bg,
                                  color: g.color,
                                  border: `1px solid ${g.border}`,
                                }}>
                                  {v.gravite}
                                </span>
                                <span style={styles.vulnType}>{v.type}</span>
                              </div>
                              {v.detail   && <p style={styles.vulnDetail}>{v.detail}</p>}
                              {v.solution && <p style={styles.vulnSolution}>💡 {v.solution}</p>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglets modules ── */}
        {activeTab !== "tous" && (
          <div style={styles.card}>
            <h3 style={styles.moduleTabTitle}>
              Vulnérabilités — {activeTab.toUpperCase()}
            </h3>
            {moduleVulns.length === 0 ? (
              <div style={styles.noVuln}>✅ Aucune vulnérabilité {activeTab.toUpperCase()} détectée</div>
            ) : (
              <div style={styles.vulnList}>
                {moduleVulns.map((v, i) => {
                  const g = GRAVITE_COLORS[v.gravite] || GRAVITE_COLORS["FAIBLE"];
                  return (
                    <div key={i} style={styles.vulnCard}>
                      <div style={styles.vulnTop}>
                        <span style={{
                          ...styles.graviteBadge,
                          background: g.bg,
                          color: g.color,
                          border: `1px solid ${g.border}`,
                        }}>
                          {v.gravite}
                        </span>
                        <span style={styles.vulnType}>{v.type}</span>
                      </div>
                      {v.detail   && <p style={styles.vulnDetail}>{v.detail}</p>}
                      {v.solution && <p style={styles.vulnSolution}>💡 {v.solution}</p>}
                      {v.payload  && <code style={styles.vulnPayload}>{v.payload}</code>}
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

const styles = {
  page:       { minHeight: "100vh", background: "#F7FAFC", fontFamily: "'Segoe UI', sans-serif" },
  container:  { maxWidth: "1100px", margin: "0 auto", padding: "2rem" },
  header:     { marginBottom: "1.5rem" },
  title:      { fontSize: "28px", fontWeight: "700", color: "#0C447C", marginBottom: "4px" },
  subtitle:   { fontSize: "14px", color: "#718096" },
  tabsRow:    { display: "flex", gap: "8px", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab:        { padding: "8px 18px", borderRadius: "10px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#718096", fontFamily: "'Segoe UI', sans-serif" },
  tabActive:  { background: "#0C447C", color: "white", border: "1.5px solid #0C447C" },
  content:    {},
  empty:      { textAlign: "center", color: "#718096", padding: "3rem" },
  emptyCard:  { background: "white", borderRadius: "14px", padding: "4rem 2rem", textAlign: "center", border: "1px solid #E2E8F0" },
  emptyIcon:  { fontSize: "48px", marginBottom: "1rem" },
  emptyText:  { fontSize: "16px", color: "#718096", marginBottom: "1.5rem" },
  emptyBtn:   { background: "#185FA5", color: "white", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif" },
  twoCol:     { display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem", alignItems: "start" },
  scanList:   { display: "flex", flexDirection: "column", gap: "10px" },
  scanCard:   { background: "white", borderRadius: "12px", padding: "1.25rem", border: "1.5px solid #E2E8F0", cursor: "pointer", transition: "all 0.2s" },
  scanCardSelected: { border: "1.5px solid #185FA5", boxShadow: "0 0 0 3px #E6F1FB" },
  scanTop:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" },
  scorePill:  { borderRadius: "8px", padding: "4px 10px", fontSize: "13px", fontWeight: "700" },
  scanDate:   { fontSize: "12px", color: "#A0AEC0" },
  scanUrl:    { fontSize: "13px", fontWeight: "600", color: "#1A202C", marginBottom: "8px", wordBreak: "break-all" },
  scanModules:{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" },
  modulePill: { fontSize: "10px", fontWeight: "700", background: "#E6F1FB", color: "#185FA5", borderRadius: "6px", padding: "2px 8px" },
  scanActions:{ display: "flex", justifyContent: "flex-end" },
  pdfBtn:     { background: "#0C447C", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif" },
  detailPanel:{ background: "white", borderRadius: "14px", padding: "1.5rem", border: "1px solid #E2E8F0", minHeight: "400px" },
  detailEmpty:{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#A0AEC0", fontSize: "15px" },
  detailTitle:{ fontSize: "18px", fontWeight: "700", color: "#0C447C", marginBottom: "4px" },
  detailUrl:  { fontSize: "13px", color: "#718096", marginBottom: "1.25rem", wordBreak: "break-all" },
  scoresGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "1.5rem" },
  scoreCard:  { borderRadius: "10px", padding: "1rem", textAlign: "center" },
  scoreLabel: { fontSize: "11px", color: "#4A5568", marginBottom: "4px", fontWeight: "500" },
  scoreValue: { fontSize: "22px", fontWeight: "700", marginBottom: "2px" },
  vulnTitle:  { fontSize: "15px", fontWeight: "700", color: "#1A202C", marginBottom: "10px" },
  vulnList:   { display: "flex", flexDirection: "column", gap: "10px" },
  noVuln:     { textAlign: "center", color: "#3B6D11", padding: "2rem", fontSize: "14px", background: "#EAF3DE", borderRadius: "10px" },
  card:       { background: "white", borderRadius: "14px", padding: "2rem", border: "1px solid #E2E8F0" },
  moduleTabTitle: { fontSize: "18px", fontWeight: "700", color: "#0C447C", marginBottom: "1.5rem" },
  vulnCard:   { border: "1px solid #E2E8F0", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "10px" },
  vulnTop:    { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" },
  graviteBadge: { borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" },
  vulnType:   { fontSize: "13px", fontWeight: "600", color: "#1A202C" },
  vulnDetail: { fontSize: "13px", color: "#4A5568", marginBottom: "6px" },
  vulnSolution: { fontSize: "12px", color: "#3B6D11", background: "#EAF3DE", borderRadius: "6px", padding: "6px 10px" },
  vulnPayload:{ display: "block", fontSize: "12px", background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "6px 10px", marginTop: "6px", wordBreak: "break-all", fontFamily: "monospace" },
};