import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, ScanLine, ShieldAlert,
  Puzzle, ToggleLeft, ToggleRight, Trash2
} from "lucide-react";
import {
  getStats, getUsers, getAllScans, getAllVulns,
  updateRole, toggleUser, deleteUser,
  getModules, toggleModule
} from "../services/adminService";
import Navbar from "../components/Navbar";
import "../styles/AdminPage.css";

const MENU = [
  { key: "dashboard",       label: "Tableau de bord", Icon: LayoutDashboard },
  { key: "users",           label: "Utilisateurs",    Icon: Users           },
  { key: "scans",           label: "Tous les scans",  Icon: ScanLine        },
  { key: "vulnerabilities", label: "Vulnérabilités",  Icon: ShieldAlert     },
  { key: "modules",         label: "Modules",         Icon: Puzzle          },
];

const SCORE_COLOR = (s) =>
  s === null ? "#9CB3CC" : s >= 80 ? "#16A34A" : s >= 50 ? "#EF9F27" : "#E24B4A";

export default function AdminPage() {
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const [page, setPage]   = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [vulns, setVulns] = useState([]);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user]);

  useEffect(() => {
    loadPage(page);
  }, [page]);

  const loadPage = async (p) => {
    try {
      if (p === "dashboard") {
        const r = await getStats();
        setStats(r.data);
      } else if (p === "users") {
        const r = await getUsers();
        setUsers(r.data.users);
      } else if (p === "scans") {
        const r = await getAllScans();
        setScans(r.data.scans);
      } else if (p === "vulnerabilities") {
        const r = await getAllVulns();
        setVulns(r.data.vulnerabilites);
      } else if (p === "modules") {
        const r = await getModules();
        setModules(r.data.modules);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUser = async (uid) => {
    await toggleUser(uid);
    loadPage("users");
  };

  const handleRole = async (uid, role) => {
    await updateRole(uid, role);
    loadPage("users");
  };

  const handleDelete = async (uid) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await deleteUser(uid);
    loadPage("users");
  };

  const handleToggleModule = async (key) => {
    await toggleModule(key);
    loadPage("modules");
  };

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-layout">

        {/* ── Sidebar ── */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">Administration</div>
          {MENU.map(({ key, label, Icon }) => (
            <div
              key={key}
              className={`admin-menu-item ${page === key ? "active" : ""}`}
              onClick={() => setPage(key)}
            >
              <Icon size={16} />
              {label}
            </div>
          ))}
        </aside>

        {/* ── Contenu ── */}
        <main className="admin-main">

          {/* ─── DASHBOARD ─── */}
          {page === "dashboard" && stats && (
  <>
    <div className="admin-page-title">Tableau de bord</div>
    <p className="admin-page-sub">Vue globale de l'activité</p>

    {/* ── KPIs ── */}
    <div className="admin-kpis">
      {[
        { label: "Utilisateurs",   value: stats.total_users,  Icon: Users       },
        { label: "Scans total",     value: stats.total_scans,  Icon: ScanLine    },
        { label: "Vulnérabilités", value: stats.total_vulns,  Icon: ShieldAlert },
        { label: "Users actifs",   value: stats.active_users, Icon: Users       },
      ].map((k, i) => (
        <div key={i} className="admin-kpi">
          <div className="admin-kpi-icon"><k.Icon size={18} /></div>
          <div>
            <div className="admin-kpi-val">{k.value}</div>
            <div className="admin-kpi-lbl">{k.label}</div>
          </div>
        </div>
      ))}
    </div>

    {/* ── Ligne 2 : Utilisateurs récents + Vulnérabilités par module ── */}
    <div className="admin-row-2">

      {/* Utilisateurs récents */}
      <div className="admin-box">
        <div className="admin-box-head">
          <span>Utilisateurs récents</span>
          <span className="admin-box-link" onClick={() => setPage("users")}>
            Voir tous →
          </span>
        </div>
        {stats.recent_users?.map((u, i) => {
          const COLORS = ["#185FA5","#16A34A","#9333EA","#EF9F27","#E24B4A"];
          const bg = COLORS[i % COLORS.length];
          return (
            <div key={u.id} className="admin-user-row">
              <div className="admin-avatar" style={{ background: bg }}>
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="admin-user-info">
                <div className="admin-user-name">{u.username}</div>
                <div className="admin-user-email">{u.email}</div>
              </div>
              <span className={`admin-badge ${u.role === "admin" ? "red" : "blue"}`}>
                {u.role === "admin" ? "Admin" : "User"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vulnérabilités par module */}
      <div className="admin-box">
        <div className="admin-box-head">Vulnérabilités par module</div>
        {(() => {
          const data   = stats.vulns_par_module || {};
          const max    = Math.max(...Object.values(data), 1);
          const COLORS = {
            sqli:    "#E24B4A",
            xss:     "#EF9F27",
            headers: "#185FA5",
            csrf:    "#16A34A",
          };
          return Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(([mod, count]) => (
              <div key={mod} className="admin-bar-row">
                <span className="admin-bar-lbl">{mod.toUpperCase()}</span>
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{
                    width: `${(count / max) * 100}%`,
                    background: COLORS[mod] || "#185FA5"
                  }} />
                </div>
                <span className="admin-bar-val">{count}</span>
              </div>
            ));
        })()}
      </div>
    </div>

    {/* ── Derniers scans ── */}
    <div className="admin-box" style={{ marginBottom: 14 }}>
      <div className="admin-box-head">
        <span>Derniers scans (tous utilisateurs)</span>
        <span className="admin-box-link" onClick={() => setPage("scans")}>
          Voir tous →
        </span>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>URL</th>
            <th>Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {(stats.recent_scans || []).map((s) => (
            <tr key={s.id}>
              <td className="admin-td-bold">{s.username}</td>
              <td className="admin-td-url">{s.url}</td>
              <td>
                <span style={{ color: SCORE_COLOR(s.score_global), fontWeight: 700 }}>
                  {s.score_global ?? "—"}/100
                </span>
              </td>
              <td className="admin-td-gray">{s.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ── Gestion des modules ── */}
    <div className="admin-box">
      <div className="admin-box-head">
        <span>Gestion des modules</span>
        <span className="admin-box-link" onClick={() => setPage("modules")}>
          Voir tous →
        </span>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Description</th>
            <th>Statut</th>
            <th>Activer</th>
          </tr>
        </thead>
        <tbody>
          {(stats.modules || []).map((m) => (
            <tr key={m.key}>
              <td className="admin-td-bold">{m.label}</td>
              <td className="admin-td-gray">{m.description}</td>
              <td>
                <span className={`admin-badge ${m.is_active ? "green" : "red"}`}>
                  {m.is_active ? "Actif" : "Désactivé"}
                </span>
              </td>
              <td>
                <button
                  className="admin-btn-icon"
                  onClick={async () => {
                    await toggleModule(m.key);
                    loadPage("dashboard");
                  }}
                >
                  {m.is_active
                    ? <ToggleRight size={24} color="#185FA5" />
                    : <ToggleLeft  size={24} color="#9CB3CC" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}
          {/* ─── UTILISATEURS ─── */}
          {page === "users" && (
            <>
              <div className="admin-page-title">Utilisateurs</div>
              <p className="admin-page-sub">{users.length} utilisateurs enregistrés</p>
              <div className="admin-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Scans</th>
                      <th>Statut</th>
                      <th>Inscrit le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="admin-td-bold">{u.username}</td>
                        <td className="admin-td-gray">{u.email}</td>
                        <td>
                          <select
                            className="admin-select"
                            value={u.role}
                            onChange={(e) => handleRole(u.id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="admin-td-gray">{u.total_scans}</td>
                        <td>
                          <span className={`admin-badge ${u.is_active ? "green" : "red"}`}>
                            {u.is_active ? "Actif" : "Désactivé"}
                          </span>
                        </td>
                        <td className="admin-td-gray">{u.created_at?.slice(0, 10)}</td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-btn-icon"
                              title={u.is_active ? "Désactiver" : "Activer"}
                              onClick={() => handleToggleUser(u.id)}
                            >
                              {u.is_active
                                ? <ToggleRight size={20} color="#185FA5" />
                                : <ToggleLeft  size={20} color="#9CB3CC" />}
                            </button>
                            <button
                              className="admin-btn-icon"
                              title="Supprimer"
                              onClick={() => handleDelete(u.id)}
                            >
                              <Trash2 size={16} color="#E24B4A" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── SCANS ─── */}
          {page === "scans" && (
            <>
              <div className="admin-page-title">Tous les scans</div>
              <p className="admin-page-sub">{scans.length} scans au total</p>
              <div className="admin-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Utilisateur</th>
                      <th>URL</th>
                      <th>Score global</th>
                      <th>Vulnérabilités</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((s) => (
                      <tr key={s.id}>
                        <td className="admin-td-gray">{s.id}</td>
                        <td className="admin-td-bold">{s.username}</td>
                        <td className="admin-td-url">{s.url}</td>
                        <td>
                          <span style={{ color: SCORE_COLOR(s.score_global), fontWeight: 700 }}>
                            {s.score_global ?? "—"}/100
                          </span>
                        </td>
                        <td className="admin-td-gray">{s.total_vulns}</td>
                        <td>
                          <span className={`admin-badge ${s.status === "termine" ? "green" : s.status === "erreur" ? "red" : "blue"}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="admin-td-gray">{s.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── VULNÉRABILITÉS ─── */}
          {page === "vulnerabilities" && (
            <>
              <div className="admin-page-title">Vulnérabilités</div>
              <p className="admin-page-sub">{vulns.length} vulnérabilités détectées</p>
              <div className="admin-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Type</th>
                      <th>Gravité</th>
                      <th>Détail</th>
                      <th>Solution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vulns.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <span className="admin-badge blue">{v.module}</span>
                        </td>
                        <td className="admin-td-bold">{v.type}</td>
                        <td>
                          <span className={`admin-badge ${v.gravite === "CRITIQUE" ? "red" : v.gravite === "ÉLEVÉE" ? "orange" : "blue"}`}>
                            {v.gravite}
                          </span>
                        </td>
                        <td className="admin-td-gray admin-td-sm">{v.detail}</td>
                        <td className="admin-td-gray admin-td-sm">{v.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── MODULES ─── */}
          {page === "modules" && (
            <>
              <div className="admin-page-title">Modules</div>
              <p className="admin-page-sub">
                Activez ou désactivez les modules disponibles pour les utilisateurs.
              </p>
              <div className="admin-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Description</th>
                      <th>Statut</th>
                      <th>Activer / Désactiver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m.key}>
                        <td className="admin-td-bold">{m.label}</td>
                        <td className="admin-td-gray">{m.description}</td>
                        <td>
                          <span className={`admin-badge ${m.is_active ? "green" : "red"}`}>
                            {m.is_active ? "Actif" : "Désactivé"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-btn-icon"
                            onClick={() => handleToggleModule(m.key)}
                            title={m.is_active ? "Désactiver" : "Activer"}
                          >
                            {m.is_active
                              ? <ToggleRight size={24} color="#185FA5" />
                              : <ToggleLeft  size={24} color="#9CB3CC" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}