"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, KeyRound, Edit, Trash2, UserPlus, LogIn } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  companyName: string | null;
  tenantId: string | null;
}

interface Tenant {
  id: string;
  companyName: string;
}

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'reset' | 'edit' | 'delete' | 'create';
    userId: string;
    userName: string;
    userEmail?: string;
    userRole?: string;
    userTenantId?: string | null;
    newData?: string;
  }>({ show: false, type: 'reset', userId: '', userName: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, tenantsRes] = await Promise.all([
        fetch("/api/superadmin/users", { cache: "no-store" }),
        fetch("/api/superadmin/tenants", { cache: "no-store" })
      ]);
      
      const usersJson = await usersRes.json();
      const tenantsJson = await tenantsRes.json();

      if (usersRes.ok) setUsers(usersJson.data || []);
      if (tenantsRes.ok) setTenants(tenantsJson.data || []);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleResetPassword(u: User) {
    setModal({
      show: true,
      type: 'reset',
      userId: u.id,
      userName: u.name,
      newData: ''
    });
  }

  async function handleEditUser(u: User) {
    setModal({
      show: true,
      type: 'edit',
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      userRole: u.role,
      userTenantId: u.tenantId
    });
  }

  async function handleDeleteUser(u: User) {
    setModal({
      show: true,
      type: 'delete',
      userId: u.id,
      userName: u.name
    });
  }

  async function handleImpersonate(u: User) {
    try {
      const res = await fetch(`/api/superadmin/users/${u.id}/impersonate`, { method: "POST" });
      if (res.ok) {
        toast.success(`Entrando como ${u.name}...`);
        window.location.href = "/"; // Redirect to main app as the user
      } else {
        toast.error("No se pudo iniciar impersonación");
      }
    } catch {
      toast.error("Error de red");
    }
  }

  async function executeModalAction() {
    const { userId, type, newData, userName, userEmail, userRole, userTenantId } = modal;
    if (!userId) return;

    setModal(prev => ({ ...prev, show: false }));
    
    try {
      let url = `/api/superadmin/users/${userId}`;
      let method = "PATCH";
      let body: any = {};

      if (type === 'create') {
        url = `/api/superadmin/users`;
        method = "POST";
        body = { name: userName, email: userEmail, role: userRole, tenantId: userTenantId, password: newData };
      } else if (type === 'reset') {
        url = `/api/superadmin/users/${userId}/reset-password`;
        method = "POST";
        body = { newPassword: newData };
      } else if (type === 'edit') {
        body = { name: userName, email: userEmail, role: userRole, tenantId: userTenantId };
      } else if (type === 'delete') {
        method = "DELETE";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        toast.success("Operación realizada con éxito");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Error en la operación");
      }
    } catch {
      toast.error("Error de red");
    }
  }

  const filtered = users.filter((u) => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title text-blue-600">Usuarios Globales</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gestión completa de accesos y pertenencia a empresas
          </p>
        </div>
        <button 
          onClick={() => setModal({ show: true, type: 'create', userId: 'new', userName: '', userEmail: '', userRole: 'user', userTenantId: null, newData: '' })}
          className="btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="glass-card p-4 mb-5 flex gap-4">
        <div className="search-bar flex-1">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o empresa..."
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Empresa</th>
              <th>Rol</th>
              <th>Fecha de Reg.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
             {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No se encontraron usuarios</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-gray-600">{u.email}</td>
                  <td>
                    {u.companyName ? (
                       <span className="font-medium">{u.companyName}</span>
                    ) : (
                      <span className="text-gray-400 italic">Global (Sin Tenant)</span>
                    )}
                  </td>
                  <td>
                    {u.role === "superadmin" ? (
                      <span className="badge bg-red-100 text-red-700">SUPERADMIN</span>
                    ) : u.role === "admin" ? (
                      <span className="badge bg-blue-100 text-blue-700">ADMINISTRADOR</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-700">USUARIO</span>
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEditUser(u); }} 
                        className="btn-icon hover:bg-slate-100 text-slate-500" title="Editar / Trasladar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleResetPassword(u); }} 
                        className="btn-icon hover:bg-blue-50 text-blue-500" title="Cambiar Contraseña"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleImpersonate(u); }} 
                        className="btn-icon hover:bg-indigo-50 text-indigo-500" title="Entrar como este usuario"
                      >
                        <LogIn size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }} 
                        className="btn-icon hover:bg-red-50 text-red-500" title="Eliminar definitivamente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl relative">
            <h3 className={`text-xl font-bold mb-4 ${modal.type === 'delete' ? 'text-red-600' : 'text-slate-900'}`}>
              {modal.type === 'delete' ? 'Eliminar Usuario' : modal.type === 'reset' ? 'Cambiar Contraseña' : modal.type === 'create' ? 'Crear Nuevo Usuario' : 'Editar Perfil y Empresa'}
            </h3>
            
            {modal.type === 'delete' ? (
              <p className="text-gray-600 mb-8">
                Estás a punto de eliminar a <strong>{modal.userName}</strong>. Esta acción cerrará su sesión permanentemente y no se puede deshacer.
              </p>
            ) : (
              <div className="space-y-4 mb-8">
                {(modal.type === 'reset' || modal.type === 'create') && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                      {modal.type === 'create' ? 'Contraseña Inicial' : 'Nueva Contraseña'}
                    </label>
                    <input 
                      type="text" autoFocus value={modal.newData}
                      onChange={(e) => setModal(prev => ({ ...prev, newData: e.target.value }))}
                      placeholder="Mínimo 6 caracteres..." className="input-field"
                    />
                  </div>
                )}
                
                {modal.type !== 'reset' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nombre completo</label>
                      <input 
                        type="text" value={modal.userName}
                        onChange={(e) => setModal(prev => ({ ...prev, userName: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Correo electrónico</label>
                      <input 
                        type="email" value={modal.userEmail}
                        onChange={(e) => setModal(prev => ({ ...prev, userEmail: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Rol</label>
                        <select 
                          value={modal.userRole}
                          onChange={(e) => setModal(prev => ({ ...prev, userRole: e.target.value }))}
                          className="input-field"
                        >
                          <option value="user">Usuario Estándar</option>
                          <option value="admin">Administrador Empresa</option>
                          <option value="superadmin">Superadministrador</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Empresa</label>
                        <select 
                          value={modal.userTenantId || ""}
                          onChange={(e) => setModal(prev => ({ ...prev, userTenantId: e.target.value || null }))}
                          className="input-field"
                        >
                          <option value="">Global (SaaS)</option>
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.companyName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setModal(prev => ({ ...prev, show: false }))} className="btn-secondary">Cancelar</button>
              <button 
                onClick={executeModalAction}
                className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all ${
                  modal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modal.type === 'delete' ? 'Eliminar Definitivamente' : modal.type === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
