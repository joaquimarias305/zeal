import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/common/StarRating';

const statusColors = {
  open:        'bg-blue-100 text-blue-700',
  filled:      'bg-amber-100 text-amber-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-700',
};
const statusLabels = {
  open:'Abierto', filled:'Cubierto', in_progress:'En curso', completed:'Completado', cancelled:'Cancelado',
};

export default function BusinessDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/businesses/me/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error(t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s`}} />)}
      </div>
    </div>
  );

  const { profile, active_shifts, spend_summary, recent_reviews } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.company_name} ðŸ¨
          </h1>
          <p className="text-gray-500 mt-0.5">{t('business.dashboard_title')}</p>
        </div>
        <Link to="/business/post-shift" className="btn-primary">
          + {t('business.post_shift')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{active_shifts?.length || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{t('business.active_shifts')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-miami-teal">${Number(spend_summary?.total_spent || 0).toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">{t('business.total_spend')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{profile?.total_shifts_posted || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Turnos publicados</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center">
            <StarRating rating={profile?.avg_rating || 0} size="lg" />
          </div>
          <p className="text-sm text-gray-500 mt-1">ValoraciÃ³n ({profile?.total_reviews || 0})</p>
        </div>
      </div>

      {/* Verification banner */}
      {!profile?.verified && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">âš ï¸</span>
            <div>
              <p className="font-semibold text-amber-800">VerificaciÃ³n pendiente</p>
              <p className="text-sm text-amber-700">Tu empresa estÃ¡ pendiente de verificaciÃ³n por ZEAL.</p>
            </div>
          </div>
        </div>
      )}

      {/* Active shifts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('business.active_shifts')}</h2>
          <Link to="/business/post-shift" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            + Publicar â†’
          </Link>
        </div>

        {active_shifts?.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">ðŸ“‹</p>
            <p className="text-gray-500 mb-4">{t('business.no_shifts')}</p>
            <Link to="/business/post-shift" className="btn-primary">
              {t('business.post_shift')}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {active_shifts?.map(shift => (
              <Link key={shift.id} to={`/business/shifts/${shift.id}`}
                className="card hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {shift.title || shift.role}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{shift.zone?.replace('_',' ')}</p>
                  </div>
                  <span className={`badge ${statusColors[shift.status]}`}>
                    {statusLabels[shift.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Fecha</p>
                    <p className="font-medium">{format(new Date(shift.shift_date+'T00:00:00'), 'EEE dd MMM')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Horario</p>
                    <p className="font-medium">{shift.start_time?.slice(0,5)} â€“ {shift.end_time?.slice(0,5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tarifa</p>
                    <p className="font-bold text-miami-teal">${shift.pay_rate}/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Trabajadores</p>
                    <p className="font-medium">
                      <span className="text-green-600">{shift.confirmed}</span>/{shift.workers_needed}
                      {shift.pending > 0 && <span className="text-brand-500 ml-1">({shift.pending} pendientes)</span>}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent reviews from workers */}
      {recent_reviews?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">ReseÃ±as recibidas</h2>
          <div className="space-y-3">
            {recent_reviews.map((r, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{r.worker_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{r.role}</p>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-2 italic">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
