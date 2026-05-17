import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ShiftCard from '../../components/common/ShiftCard';

const ROLES = ['','server','bartender','cook','dishwasher','host','housekeeping','event_staff','barback','busser','cashier','supervisor'];
const ZONES = ['','miami_beach','brickell','wynwood','doral','coral_gables','downtown','little_havana','hialeah','kendall','aventura','other'];

export default function ShiftBoard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [shifts, setShifts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());

  const [filters, setFilters] = useState({ role: '', zone: '', date: '', lang: '' });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12 });
      if (filters.role) params.append('role', filters.role);
      if (filters.zone) params.append('zone', filters.zone);
      if (filters.date) params.append('date', filters.date);
      if (filters.lang) params.append('lang', filters.lang);

      const { data } = await api.get(`/shifts?${params}`);
      setShifts(data.shifts);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  }, [filters, t]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (user?.type === 'worker') {
      api.get('/shifts/worker/mine').then(({ data }) => {
        setAppliedIds(new Set(data.map(a => a.shift_id)));
      }).catch(() => {});
    }
  }, [user]);

  const handleApply = async (shiftId) => {
    if (!user) { toast.info('Inicia sesión para aplicar'); return; }
    try {
      await api.post(`/shifts/${shiftId}/apply`);
      setAppliedIds(prev => new Set([...prev, shiftId]));
      toast.success('¡Aplicación enviada! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const updateFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ role: '', zone: '', date: '', lang: '' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          {t('shifts.title')}
        </h1>
        <p className="text-gray-500 mt-2 text-lg">{t('shifts.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('shifts.filter_role')}</label>
            <select value={filters.role} onChange={e => updateFilter('role', e.target.value)} className="input text-sm">
              <option value="">Todos los roles</option>
              {ROLES.filter(r => r).map(r => <option key={r} value={r}>{t(`shifts.role_${r}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('shifts.filter_zone')}</label>
            <select value={filters.zone} onChange={e => updateFilter('zone', e.target.value)} className="input text-sm">
              <option value="">Todas las zonas</option>
              {ZONES.filter(z => z).map(z => <option key={z} value={z}>{t(`common.miami_zones.${z}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('shifts.filter_date')}</label>
            <input type="date" value={filters.date} onChange={e => updateFilter('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('shifts.filter_lang')}</label>
            <select value={filters.lang} onChange={e => updateFilter('lang', e.target.value)} className="input text-sm">
              <option value="">Cualquier idioma</option>
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
        </div>
        {(filters.role || filters.zone || filters.date || filters.lang) && (
          <button onClick={clearFilters}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium">
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Buscando…' : `${total} turno${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(j => <div key={j} className="h-8 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-500 text-lg">{t('shifts.no_results')}</p>
          <button onClick={clearFilters} className="btn-secondary mt-4">Ver todos los turnos</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map(shift => (
            <ShiftCard key={shift.id} shift={shift}
              onApply={handleApply}
              applied={appliedIds.has(shift.id)}
              showApply={user?.type === 'worker'} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => load(page - 1)} disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-40">← Anterior</button>
          <span className="text-sm text-gray-500">{page} / {pages}</span>
          <button onClick={() => load(page + 1)} disabled={page === pages}
            className="btn-ghost text-sm disabled:opacity-40">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
