import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

const MODULES = [
  { id: "headers", label: "HTTP Headers", icon: "🛡️", desc: "Headers de sécurité"     },
  { id: "csrf",    label: "CSRF",         icon: "🔐", desc: "Tokens et cookies"        },
  { id: "xss",     label: "XSS",          icon: "💉", desc: "Cross-Site Scripting"     },
  { id: "sqli",    label: "SQL Injection", icon: "🗄️", desc: "Injection SQL via sqlmap" },
];

const GRAVITE_COLORS = {
  CRITIQUE: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  ÉLEVÉE:   { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
  MOYENNE:   { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  FAIBLE:    { bg: "#EAF3DE", color: "#3B6D11", border: "#C0DD97" },
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
    if (modules.length === 0) {
      setError("Sélectionnez au moins un module");
      return;
    }

    setLoading(true);
    setResults(null);
    setVulns([]);
    setError("");

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
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
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
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Scanner de vulnérabilités</h1>
          <p style={styles.subtitle}>Entrez l'URL du site à analyser et sélectionnez les modules</p>
        </div>

        {/* Formulaire */}
        <div style={styles.card}>
          <form onSubmit={handleScan}>

            {/* URL */}
            <div style={styles.field}>
              <label style={styles.label}>URL cible *</label>
              <input
                type="text"
                placeholder="https://exemple.com ou http://localhost/dvwa"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {/* Cookie optionnel */}
            <div style={styles.field}>
              <label style={styles.label}>
                Cookie d'authentification <span style={styles.optional}>(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="PHPSESSID=xxx; security=low"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Modules */}
            <div style={styles.field}>
              <label style={styles.label}>Modules à lancer</label>
              <div style={styles.modulesGrid}>
                {MODULES.map((m) => {
                  const selected = modules.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      style={{
                        ...styles.moduleCard,
                        ...(selected ? styles.moduleSelected : {}),
                      }}
                    >
                      <span style={styles.moduleIcon}>{m.icon}</span>
                      <div>
                        <div style={styles.moduleLabel}>{m.label}</div>
                        <div style={styles.moduleDesc}>{m.desc}</div>
                      </div>
                      <div style={{
                        ...styles.checkbox,
                        ...(selected ? styles.checkboxSelected : {}),
                      }}>
                        {selected && "✓"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.scanBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "⏳ Scan en cours..." : "🚀 Lancer le scan"}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.loadingSpinner}/>
            <div>
              <div style={styles.loadingTitle}>Scan en cours...</div>
              <div style={styles.loadingDesc}>
                Analyse de {url} — Cela peut prendre 1 à 3 minutes selon les modules sélectionnés.
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div>
            {/* Scores */}
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Résultats du scan</h2>
              <button onClick={handlePDF} style={styles.pdfBtn}>
                📄 Télécharger PDF
              </button>
            </div>

            <div style={styles.scoresGrid}>
              <div style={{ ...styles.scoreCard, background: scoreBg(results.score_global) }}>
                <div style={styles.scoreLabel}>Score Global</div>
                <div style={{ ...styles.scoreValue, color: scoreColor(results.score_global) }}>
                  {results.score_global}/100
                </div>
              </div>
              {results.score_headers !== null && (
                <div style={{ ...styles.scoreCard, background: scoreBg(results.score_headers) }}>
                  <div style={styles.scoreLabel}>🛡️ Headers</div>
                  <div style={{ ...styles.scoreValue, color: scoreColor(results.score_headers) }}>
                    {results.score_headers}/100
                  </div>
                </div>
              )}
              {results.score_csrf !== null && (
                <div style={{ ...styles.scoreCard, background: scoreBg(results.score_csrf) }}>
                  <div style={styles.scoreLabel}>🔐 CSRF</div>
                  <div style={{ ...styles.scoreValue, color: scoreColor(results.score_csrf) }}>
                    {results.score_csrf}/100
                  </div>
                </div>
              )}
              {results.score_xss !== null && (
                <div style={{ ...styles.scoreCard, background: scoreBg(results.score_xss) }}>
                  <div style={styles.scoreLabel}>💉 XSS</div>
                  <div style={{ ...styles.scoreValue, color: scoreColor(results.score_xss) }}>
                    {results.score_xss}/100
                  </div>
                </div>
              )}
              {results.score_sqli !== null && (
                <div style={{ ...styles.scoreCard, background: scoreBg(results.score_sqli) }}>
                  <div style={styles.scoreLabel}>🗄️ SQLi</div>
                  <div style={{ ...styles.scoreValue, color: scoreColor(results.score_sqli) }}>
                    {results.score_sqli}/100
                  </div>
                </div>
              )}
            </div>

            {/* Vulnérabilités */}
            {vulns.length > 0 && (
              <div style={styles.card}>
                <div style={styles.tabsRow}>
                  {["tous", "headers", "csrf", "xss", "sqli"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        ...styles.tab,
                        ...(activeTab === tab ? styles.tabActive : {}),
                      }}
                    >
                      {tab.toUpperCase()}
                      {tab !== "tous" && (
                        <span style={styles.tabCount}>
                          {vulns.filter((v) => v.module === tab).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div style={styles.vulnList}>
                  {filteredVulns.length === 0 ? (
                    <div style={styles.noVuln}>✅ Aucune vulnérabilité pour ce module</div>
                  ) : (
                    filteredVulns.map((v, i) => {
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
                            <span style={styles.vulnModule}>{v.module.toUpperCase()}</span>
                            <span style={styles.vulnType}>{v.type}</span>
                          </div>
                          {v.detail && (
                            <p style={styles.vulnDetail}>{v.detail}</p>
                          )}
                          {v.solution && (
                            <p style={styles.vulnSolution}>💡 {v.solution}</p>
                          )}
                          {v.payload && (
                            <code style={styles.vulnPayload}>{v.payload}</code>
                          )}
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

const styles = {
  page: { minHeight: "100vh", background: "#F7FAFC", fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: "900px", margin: "0 auto", padding: "2rem" },
  header: { marginBottom: "2rem" },
  title: { fontSize: "28px", fontWeight: "700", color: "#0C447C", marginBottom: "6px" },
  subtitle: { fontSize: "15px", color: "#718096" },
  card: { background: "white", borderRadius: "14px", padding: "2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0", marginBottom: "1.5rem" },
  field: { marginBottom: "1.25rem" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#4A5568", marginBottom: "6px" },
  optional: { fontWeight: "400", color: "#A0AEC0" },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", color: "#1A202C", outline: "none", boxSizing: "border-box", fontFamily: "'Segoe UI', sans-serif" },
  modulesGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" },
  moduleCard: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" },
  moduleSelected: { border: "1.5px solid #185FA5", background: "#E6F1FB" },
  moduleIcon: { fontSize: "22px" },
  moduleLabel: { fontSize: "13px", fontWeight: "600", color: "#1A202C" },
  moduleDesc: { fontSize: "11px", color: "#718096" },
  checkbox: { marginLeft: "auto", width: "20px", height: "20px", border: "1.5px solid #CBD5E0", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "white", flexShrink: 0 },
  checkboxSelected: { background: "#185FA5", border: "1.5px solid #185FA5" },
  errorBox: { background: "#FCEBEB", border: "1px solid #F09595", color: "#A32D2D", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "1rem" },
  scanBtn: { width: "100%", background: "linear-gradient(135deg, #185FA5, #0C447C)", color: "white", border: "none", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif" },
  loadingCard: { background: "white", borderRadius: "14px", padding: "2rem", border: "1px solid #E2E8F0", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" },
  loadingSpinner: { width: "40px", height: "40px", border: "4px solid #E2E8F0", borderTop: "4px solid #185FA5", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 },
  loadingTitle: { fontSize: "16px", fontWeight: "600", color: "#0C447C", marginBottom: "4px" },
  loadingDesc: { fontSize: "13px", color: "#718096" },
  resultsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
  resultsTitle: { fontSize: "22px", fontWeight: "700", color: "#0C447C" },
  pdfBtn: { background: "#0C447C", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif" },
  scoresGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "1.5rem" },
  scoreCard: { borderRadius: "12px", padding: "1.25rem", textAlign: "center", border: "1px solid #E2E8F0" },
  scoreLabel: { fontSize: "12px", color: "#4A5568", marginBottom: "6px", fontWeight: "500" },
  scoreValue: { fontSize: "26px", fontWeight: "700" },
  tabsRow: { display: "flex", gap: "6px", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab: { padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: "#718096", fontFamily: "'Segoe UI', sans-serif", display: "flex", alignItems: "center", gap: "6px" },
  tabActive: { background: "#185FA5", color: "white", border: "1.5px solid #185FA5" },
  tabCount: { background: "rgba(255,255,255,0.3)", borderRadius: "10px", padding: "1px 6px", fontSize: "11px" },
  vulnList: { display: "flex", flexDirection: "column", gap: "10px" },
  noVuln: { textAlign: "center", color: "#3B6D11", padding: "2rem", fontSize: "15px" },
  vulnCard: { border: "1px solid #E2E8F0", borderRadius: "10px", padding: "1rem 1.25rem" },
  vulnTop: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" },
  graviteBadge: { borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" },
  vulnModule: { fontSize: "11px", fontWeight: "700", color: "#185FA5", background: "#E6F1FB", borderRadius: "6px", padding: "3px 8px" },
  vulnType: { fontSize: "13px", fontWeight: "600", color: "#1A202C" },
  vulnDetail: { fontSize: "13px", color: "#4A5568", marginBottom: "6px" },
  vulnSolution: { fontSize: "12px", color: "#3B6D11", background: "#EAF3DE", borderRadius: "6px", padding: "6px 10px" },
  vulnPayload: { display: "block", fontSize: "12px", background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "6px 10px", marginTop: "6px", wordBreak: "break-all", fontFamily: "monospace" },
};