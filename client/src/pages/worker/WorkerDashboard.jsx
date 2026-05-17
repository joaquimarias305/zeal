import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/common/StarRating';

const StatCard = ({ label, value, icon, color = 'brand' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 flex-shrink-0`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers/me/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error(t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const { profile, upcoming_shifts, earnings_by_month, recent_reviews } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Hero greeting */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-0.5">{t('worker.dashboard_title')}</p>
        </div>
        <Link to="/shifts" className="btn-primary">
          {t('worker.find_shifts')} →
        </Link>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-3">
        {profile?.miami_verified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-miami-teal/10 text-miami-teal font-semibold text-sm">
            ✅ {t('worker.miami_verified')}
          </span>
        )}
        {profile?.top_worker && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
            ⭐ {t('worker.top_worker')}
          </span>
        )}
        {!profile?.stripe_onboarded && (
          <Link to="/worker/settings?stripe=setup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 font-semibold text-sm hover:bg-brand-100 transition-colors">
            💳 {t('worker.setup_stripe')}
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('worker.total_earned')} value={`$${Number(profile?.total_earnings || 0).toFixed(0)}`} icon="💰" color="green" />
        <StatCard label={t('worker.avg_rating')}   value={Number(profile?.avg_rating || 0).toFixed(1)} icon="⭐" color="amber" />
        <StatCard label={t('worker.total_shifts')} value={profile?.total_shifts || 0} icon="🗂️" color="blue" />
        <StatCard label={t('ratings.stars')}       value={profile?.total_reviews || 0} icon="💬" color="purple" />
      </div>

      {/* Upcoming shifts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('worker.upcoming')}</h2>
          <Link to="/shifts" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Ver todos →
          </Link>
        </div>

        {upcoming_shifts?.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500 mb-4">{t('worker.no_shifts')}</p>
            <Link to="/shifts" className="btn-primary">{t('worker.find_shifts')}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming_shifts?.map(shift => (
              <div key={shift.shift_id} className="card border-l-4 border-brand-500">
                <div className="flex items-center gap-3 mb-3">
                  {shift.logo_url
                    ? <img src={shift.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    : <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center font-bold text-brand-600">
                        {shift.company_name?.[0]}
                      </div>
                  }
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{shift.company_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{shift.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Fecha</p>
                    <p className="font-medium">{format(new Date(shift.shift_date + 'T00:00:00'), 'EEE dd MMM')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Horario</p>
                    <p className="font-medium">{shift.start_time?.slice(0,5)} - {shift.end_time?.slice(0,5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Pago</p>
                    <p className="font-bold text-miami-teal">${shift.pay_rate}/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Zona</p>
                    <p className="font-medium capitalize">{shift.zone?.replace('_',' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Earnings chart */}
      {earnings_by_month?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('worker.earnings')}</h2>
          <div className="card">
            <div className="flex items-end gap-3 h-32">
              {earnings_by_month.slice().reverse().map((m, i) => {
                const max = Math.max(...earnings_by_month.map(x => Number(x.earned)));
                const height = max > 0 ? Math.round((Number(m.earned) / max) * 100) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs font-semibold text-gray-600">${Number(m.earned).toFixed(0)}</p>
                    <div className="w-full bg-brand-500 rounded-t-md transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }} />
                    <p className="text-xs text-gray-400">
                      {format(new Date(m.month), 'MMM')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent reviews */}
      {recent_reviews?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('worker.reviews')}</h2>
          <div className="space-y-3">
            {recent_reviews.map((r, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{r.company_name || r.reviewer_name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{r.role} · {format(new Date(r.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
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
