import api from "./api";

export const getStats        = ()         => api.get("/admin/stats");
export const getUsers        = ()         => api.get("/admin/users");
export const getAllScans      = ()         => api.get("/admin/scans");
export const getAllVulns      = (filters)  => api.get("/admin/vulnerabilities", { params: filters });
export const updateRole      = (uid, role)=> api.put(`/admin/users/${uid}/role`, { role });
export const toggleUser      = (uid)      => api.put(`/admin/users/${uid}/toggle`);
export const deleteUser      = (uid)      => api.delete(`/admin/users/${uid}`);
export const getModules      = ()         => api.get("/admin/modules");
export const toggleModule    = (key)      => api.put(`/admin/modules/${key}/toggle`);