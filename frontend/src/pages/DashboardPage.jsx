import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import {
  ScanLine, ShieldAlert, TrendingUp, Target,
  LayoutDashboard, Trophy, AlertTriangle, Clock
} from "lucide-react";
import Navbar from "../components/Navbar";
import api   from "../services/api";
import "../styles/DashboardPage.css";

const MODULE_COLORS = {
  headers: "#185FA5",
  csrf:    "#16A34A",
  xss:     "#EF9F27",
  sqli:    "#E24B4A",
};

export default function DashboardPage() {
  const navigate            = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dash-page">
      <Navbar />
      <div className="dash-loading">
        <div className="dash-spinner" />
        <span>Chargement du tableau de bord...</span>
      </div>
    </div>
  );

  if (!data) return null;

  const scoreColor = (s) =>
    s >= 80 ? "#16A34A" : s >= 50 ? "#EF9F27" : "#E24B4A";

  const scoreBg = (s) =>
    s >= 80 ? "#EBFAF0" : s >= 50 ? "#FEF3E2" : "#FCEBEB";

  return (
    <div className="dash-page">
      <Navbar />
      <div className="dash-container">

        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              <LayoutDashboard size={22} /> Mon Tableau de bord
            </h1>
            <p className="dash-sub">Vue personnelle de votre activité de scan</p>
          </div>
          <button className="dash-scan-btn" onClick={() => navigate("/scan")}>
            <ScanLine size={15} /> Lancer un scan
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="dash-kpis">
          {[
            {
              label: "Scans effectués",
              value: data.total_scans,
              Icon:  ScanLine,
              bg:    "#EBF4FF",
              color: "#185FA5",
              trend: data.scans_ce_mois > 0 ? `+${data.scans_ce_mois} ce mois` : "Aucun ce mois",
              trendColor: data.scans_ce_mois > 0 ? "#16A34A" : "#9CB3CC",
            },
            {
              label: "Vulnérabilités",
              value: data.total_vulns,
              Icon:  ShieldAlert,
              bg:    "#FCEBEB",
              color: "#E24B4A",
              trend: `${data.vulns_critiques} critiques`,
              trendColor: "#E24B4A",
            },
            {
              label: "Meilleur score",
              value: data.meilleur_score ?? "—",
              Icon:  TrendingUp,
              bg:    "#EBFAF0",
              color: "#16A34A",
              trend: data.meilleur_url || "Aucun scan",
              trendColor: "#16A34A",
            },
            {
              label: "Score moyen",
              value: data.score_moyen ?? "—",
              Icon:  Target,
              bg:    scoreBg(data.score_moyen),
              color: scoreColor(data.score_moyen),
              trend: data.score_moyen >= 80 ? "Bon" : data.score_moyen >= 50 ? "Moyen" : "Faible",
              trendColor: scoreColor(data.score_moyen),
            },
          ].map((k, i) => (
            <div key={i} className="dash-kpi">
              <div className="dash-kpi-icon" style={{ background: k.bg, color: k.color }}>
                <k.Icon size={18} />
              </div>
              <div>
                <div className="dash-kpi-val" style={{ color: k.color }}>{k.value}</div>
                <div className="dash-kpi-lbl">{k.label}</div>
                <div className="dash-kpi-trend" style={{ color: k.trendColor }}>
                  {k.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Évolution scores (LineChart) ── */}
        <div className="dash-box" style={{ marginBottom: 14 }}>
          <div className="dash-box-head">
            Évolution du score global (par scan)
          </div>
          <div style={{ padding: "1rem", height: 220 }}>
            {data.evolution.length === 0 ? (
              <div className="dash-empty">Aucun scan pour le moment</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolution}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F6FF" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9CB3CC" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#9CB3CC" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const score = payload[0].value;
                        const url   = payload[0].payload.url;
                        const color = score >= 80 ? "#16A34A" : score >= 50 ? "#EF9F27" : "#E24B4A";
                        return (
                          <div style={{
                            background: "white", border: "1px solid #DDE8F5",
                            borderRadius: 8, padding: "10px 14px", fontSize: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxWidth: 220,
                          }}>
                            <div style={{ color: "#9CB3CC", marginBottom: 6, fontSize: 11 }}>
                              {label}
                            </div>
                            <div style={{ color, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                              Score : {score}/100
                            </div>
                            {url && (
                              <div style={{
                                color: "#185FA5", fontFamily: "monospace", fontSize: 11,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                borderTop: "1px solid #F0F6FF", paddingTop: 6, marginTop: 4,
                              }}>
                                {url}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#185FA5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#185FA5", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Score moyen par module (BarChart) ── */}
        <div className="dash-box" style={{ marginBottom: 14 }}>
          <div className="dash-box-head">Score moyen par module</div>
          <div style={{ padding: "1rem", height: 200 }}>
            {data.score_par_module.length === 0 ? (
              <div className="dash-empty">Aucun scan</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.score_par_module}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F6FF" />
                  <XAxis
                    dataKey="module"
                    tick={{ fontSize: 11, fill: "#9CB3CC" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#9CB3CC" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white", border: "1px solid #DDE8F5",
                      borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(val) => [`${val}/100`, "Score moyen"]}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {data.score_par_module.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={MODULE_COLORS[entry.module_key] || "#185FA5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Sites analysés + Derniers scans ── */}
        <div className="dash-row-3">

          {/* Sites analysés */}
          <div className="dash-box">
            <div className="dash-box-head">Sites analysés</div>
            {data.top_sites.length === 0 ? (
              <div className="dash-empty" style={{ padding: "1rem" }}>Aucun scan</div>
            ) : (
              data.top_sites.map((s, i) => (
                <div key={i} className="dash-site-row">
                  <div>
                    <div className="dash-site-label">
                      {i === 0 ? (
                        <><Trophy size={11} color="#16A34A" style={{ marginRight: 4 }} /> Meilleur score</>
                      ) : i === data.top_sites.length - 1 ? (
                        <><AlertTriangle size={11} color="#E24B4A" style={{ marginRight: 4 }} /> Score le plus bas</>
                      ) : (
                        <><Clock size={11} color="#185FA5" style={{ marginRight: 4 }} /> Récent</>
                      )}
                    </div>
                    <div className="dash-site-url">{s.url}</div>
                  </div>
                  <div className="dash-site-score" style={{ color: scoreColor(s.score) }}>
                    {s.score}/100
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Derniers scans */}
          <div className="dash-box">
            <div className="dash-box-head">
              <span>Derniers scans</span>
              <span className="dash-box-link" onClick={() => navigate("/history")}>
                Voir l'historique →
              </span>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.derniers_scans.map((s) => (
                  <tr key={s.id}>
                    <td className="dash-td-url">{s.url}</td>
                    <td>
                      <span style={{ color: scoreColor(s.score_global), fontWeight: 700 }}>
                        {s.score_global ?? "—"}/100
                      </span>
                    </td>
                    <td className="dash-td-gray">{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}