import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
      ${active ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
    {children}
  </button>
);

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/shifts'),
    ]).then(([statsRes, shiftsRes]) => {
      setStats(statsRes.data);
      setShifts(shiftsRes.data);
      setLoading(false);
    }).catch(() => toast.error(t('common.error')));
  }, [t]);

  const loadUsers = async (type = '') => {
    const params = new URLSearchParams({ limit: 100 });
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    const { data } = await api.get(`/admin/users?${params}`);
    setUsers(data);
  };

  useEffect(() => {
    if (tab === 'workers')    loadUsers('worker');
    if (tab === 'businesses') loadUsers('business');
  }, [tab, search]);

  const toggleStatus = async (userId, is_active) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !is_active });
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: !is_active } : x));
      toast.success('Estado actualizado');
    } catch { toast.error(t('common.error')); }
  };

  const verifyWorker = async (id) => {
    try {
      await api.patch(`/admin/workers/${id}/verify`);
      setUsers(u => u.map(x => x.id === id ? { ...x, miami_verified: true } : x));
      toast.success('Trabajador verificado âœ…');
    } catch { toast.error(t('common.error')); }
  };

  const verifyBusiness = async (id) => {
    try {
      await api.patch(`/admin/businesses/${id}/verify`);
      toast.success('Empresa verificada âœ…');
    } catch { toast.error(t('common.error')); }
  };

  const completeShift = async (id) => {
    try {
      await api.patch(`/admin/shifts/${id}/complete`);
      setShifts(s => s.map(x => x.id === id ? { ...x, status: 'completed' } : x));
      toast.success('Turno completado');
    } catch { toast.error(t('common.error')); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s`}} />)}
      </div>
    </div>
  );

  const totalUsers = stats?.users?.reduce((s, r) => s + parseInt(r.count), 0) || 0;
  const totalRevenue = stats?.payments?.find(p => p.status === 'succeeded')?.fees || 0;
  const totalPayments = stats?.payments?.find(p => p.status === 'succeeded')?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">ZEAL Control Center</p>
        </div>
        <span className="badge bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5">ADMIN</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-sm text-gray-500">Usuarios totales</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{shifts.length}</p>
          <p className="text-sm text-gray-500">Turnos publicados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-miami-teal">${Number(totalRevenue).toFixed(0)}</p>
          <p className="text-sm text-gray-500">Comisiones generadas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">${Number(totalPayments).toFixed(0)}</p>
          <p className="text-sm text-gray-500">Volumen total</p>
        </div>
      </div>

      {/* User breakdown */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Usuarios por tipo</h3>
        <div className="flex gap-4 flex-wrap">
          {stats?.users?.map(r => (
            <div key={r.type} className="px-4 py-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-gray-900">{r.count}</p>
              <p className="text-sm text-gray-500 capitalize">{r.type}s</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview',   label: 'Turnos' },
          { key: 'workers',    label: 'Trabajadores' },
          { key: 'businesses', label: 'Empresas' },
        ].map(tab_ => (
          <TabBtn key={tab_.key} active={tab === tab_.key} onClick={() => setTab(tab_.key)}>
            {tab_.label}
          </TabBtn>
        ))}
      </div>

      {/* Search (users tabs) */}
      {(tab === 'workers' || tab === 'businesses') && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o emailâ€¦"
          className="input max-w-sm" />
      )}

      {/* Shifts table */}
      {tab === 'overview' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-3 pr-4">Empresa</th>
                <th className="pb-3 pr-4">Rol</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Apps</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shifts.slice(0, 30).map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">{s.company_name}</td>
                  <td className="py-3 pr-4 capitalize">{s.role}</td>
                  <td className="py-3 pr-4 text-gray-500">{s.shift_date}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-xs ${
                      s.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      s.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      s.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>{s.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{s.total_apps}</td>
                  <td className="py-3">
                    {!['completed','cancelled'].includes(s.status) && (
                      <button onClick={() => completeShift(s.id)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                        Completar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users table */}
      {(tab === 'workers' || tab === 'businesses') && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Registrado</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{u.created_at?.slice(0,10)}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleStatus(u.id, u.is_active)}
                        className={`text-xs font-medium ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                        {u.is_active ? 'Suspender' : 'Activar'}
                      </button>
                      {tab === 'workers' && (
                        <button onClick={() => verifyWorker(u.id)}
                          className="text-xs font-medium text-miami-teal hover:text-teal-700">
                          Verificar
                        </button>
                      )}
                      {tab === 'businesses' && (
                        <button onClick={() => verifyBusiness(u.id)}
                          className="text-xs font-medium text-miami-teal hover:text-teal-700">
                          Verificar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">No se encontraron resultados</p>
          )}
        </div>
      )}
    </div>
  );
}
