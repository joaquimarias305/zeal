import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import StarRating from '../../components/common/StarRating';

export default function ManageShift() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shift, setShift] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    const [shiftRes, appsRes] = await Promise.all([
      api.get(`/shifts/${id}`),
      api.get(`/shifts/${id}/applications`),
    ]);
    setShift(shiftRes.data);
    setApplications(appsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleDecision = async (appId, status) => {
    setActionLoading(appId);
    try {
      await api.patch(`/shifts/${id}/applications/${appId}`, { status });
      toast.success(status === 'accepted' ? '¡Trabajador aceptado!' : 'Candidato rechazado');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s`}} />)}
      </div>
    </div>
  );

  const accepted = applications.filter(a => a.status === 'accepted');
  const pending  = applications.filter(a => a.status === 'pending');
  const justPaid = searchParams.get('paid') === 'true';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <Link to="/business" className="text-sm text-brand-600 hover:text-brand-700">← Dashboard</Link>

      {/* Shift summary */}
      {shift && (
        <div className="card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{shift.title || shift.role}</h1>
              <p className="text-gray-500 mt-0.5">
                {format(new Date(shift.shift_date+'T00:00:00'), 'EEEE dd MMMM yyyy')} · {shift.start_time?.slice(0,5)} - {shift.end_time?.slice(0,5)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-miami-teal">${shift.pay_rate}/h</p>
              <p className="text-sm text-gray-500">{shift.hours}h · {shift.workers_needed} trabajador(es)</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            <span>📍 {shift.address}</span>
            <span className="text-green-600 font-medium">
              ✓ {accepted.length}/{shift.workers_needed} confirmados
            </span>
            {pending.length > 0 && (
              <span className="text-brand-600 font-medium">{pending.length} pendientes</span>
            )}
          </div>
        </div>
      )}

      {/* Payment success banner */}
      {justPaid && (
        <div className="card bg-green-50 border-green-200 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">¡Pago confirmado!</p>
            <p className="text-sm text-green-700">El pago fue procesado. El trabajador recibirá su parte automáticamente.</p>
          </div>
        </div>
      )}

      {/* Accepted workers */}
      {accepted.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">✅ Trabajadores confirmados</h2>
          <div className="space-y-3">
            {accepted.map(app => (
              <div key={app.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-600 flex-shrink-0">
                  {app.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <StarRating rating={app.avg_rating} size="sm" />
                    {app.miami_verified && <span className="badge bg-miami-teal/10 text-miami-teal text-xs">✅ Miami Verified</span>}
                    {app.top_worker && <span className="badge bg-amber-100 text-amber-700 text-xs">⭐ Top</span>}
                  </div>
                  {app.skills?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{app.skills.slice(0,3).join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending applications */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {t('business.applicants')} ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(app => (
              <div key={app.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center font-bold text-brand-600 flex-shrink-0">
                    {app.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{app.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StarRating rating={app.avg_rating} size="sm" />
                      <span className="text-xs text-gray-500">{app.total_shifts} turnos</span>
                      {app.miami_verified && <span className="badge bg-miami-teal/10 text-miami-teal text-xs">✅ Miami Verified</span>}
                      {app.top_worker && <span className="badge bg-amber-100 text-amber-700 text-xs">⭐ Top</span>}
                    </div>
                    {app.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.skills.slice(0,4).map(s => (
                          <span key={s} className="badge bg-gray-100 text-gray-600 text-xs">{t(`shifts.role_${s}`)}</span>
                        ))}
                      </div>
                    )}
                    {app.languages?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 capitalize">{app.languages.join(' · ')}</p>
                    )}
                    {app.message && (
                      <p className="text-sm text-gray-600 mt-2 italic border-l-2 border-gray-200 pl-2">"{app.message}"</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleDecision(app.id, 'rejected')}
                    disabled={actionLoading === app.id}
                    className="btn-ghost flex-1 text-sm text-red-500 hover:bg-red-50">
                    {t('business.reject')}
                  </button>
                  <button onClick={() => handleDecision(app.id, 'accepted')}
                    disabled={actionLoading === app.id || accepted.length >= (shift?.workers_needed || 0)}
                    className="btn-primary flex-1 text-sm">
                    {actionLoading === app.id ? '…' : t('business.accept')}
                  </button>
                </div>

                {/* Pay button  -  shown after accepting */}
                {app.status === 'accepted' && (
                  <button
                    onClick={() => navigate(`/business/shifts/${id}/pay/${app.id}`)}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-miami-teal text-white hover:bg-teal-600 transition-colors">
                    💳 Pagar a este trabajador
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {applications.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">👀</p>
          <p className="text-gray-500">Aún no hay candidatos para este turno.</p>
        </div>
      )}
    </div>
  );
}
