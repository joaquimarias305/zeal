import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/common/StarRating';

export default function ShiftDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shift, setShift] = useState(null);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get(`/shifts/${id}`).then(r => {
      setShift(r.data);
      setLoading(false);
    }).catch(() => { toast.error(t('common.error')); navigate('/shifts'); });

    if (user?.type === 'worker') {
      api.get('/shifts/worker/mine').then(({ data }) => {
        setApplied(data.some(a => a.shift_id === id));
      }).catch(() => {});
    }
  }, [id, user, navigate, t]);

  const handleApply = async () => {
    if (!user) { toast.info('Inicia sesión para aplicar'); navigate('/login'); return; }
    setApplying(true);
    try {
      await api.post(`/shifts/${id}/apply`, { message });
      setApplied(true);
      toast.success('¡Aplicación enviada! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally { setApplying(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s`}} />)}
      </div>
    </div>
  );

  if (!shift) return null;

  const pay = Number(shift.pay_rate);
  const hours = Number(shift.hours);
  const gross = (pay * hours).toFixed(2);
  const workerGross = (pay * hours * 0.85).toFixed(2);
  const date = new Date(shift.shift_date + 'T00:00:00');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/shifts" className="text-sm text-brand-600 hover:text-brand-700">← Volver a turnos</Link>

      {/* Business info */}
      <div className="card flex items-center gap-4">
        {shift.logo_url
          ? <img src={shift.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl flex-shrink-0">
              {shift.company_name?.[0]}
            </div>
        }
        <div>
          <h2 className="text-lg font-bold text-gray-900">{shift.company_name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={shift.business_rating} size="sm" />
            {shift.business_verified && (
              <span className="badge bg-miami-teal/10 text-miami-teal text-xs">✅ Verificado</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">📍 {t(`common.miami_zones.${shift.zone}`)}</p>
        </div>
      </div>

      {/* Shift details */}
      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{shift.title || t(`shifts.role_${shift.role}`)}</h1>
            <p className="text-brand-500 font-semibold capitalize mt-0.5">{t(`shifts.role_${shift.role}`)}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-miami-teal">${pay}<span className="text-lg text-gray-400">/h</span></p>
            <p className="text-sm text-gray-500">Total: <span className="font-bold text-gray-700">${gross}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">📅 Fecha</p>
            <p className="font-semibold">{format(date, 'EEEE dd MMMM yyyy')}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">⏰ Horario</p>
            <p className="font-semibold">{shift.start_time?.slice(0,5)} – {shift.end_time?.slice(0,5)}</p>
            <p className="text-xs text-gray-400">{hours}h</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">👥 Personas</p>
            <p className="font-semibold">{shift.workers_needed} trabajador{shift.workers_needed > 1 ? 'es' : ''}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">🌐 Idioma</p>
            <p className="font-semibold">{shift.language_req === 'both' ? 'EN + ES' : shift.language_req === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</p>
          </div>
          {shift.dress_code && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">👔 Vestimenta</p>
              <p className="font-semibold">{shift.dress_code}</p>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">📍 Dirección</p>
            <p className="font-semibold text-xs leading-tight">{shift.address}</p>
          </div>
        </div>

        {shift.description && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Descripción</p>
            <p className="text-sm text-gray-600">{shift.description}</p>
          </div>
        )}

        {shift.notes && (
          <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-0.5">📝 Notas</p>
            <p>{shift.notes}</p>
          </div>
        )}
      </div>

      {/* Payment breakdown for workers */}
      {user?.type === 'worker' && (
        <div className="card bg-gradient-to-r from-miami-teal/5 to-brand-50 border-miami-teal/20">
          <h3 className="font-bold text-gray-900 mb-3">💰 Tu pago estimado</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pago bruto ({hours}h × ${pay})</span>
              <span className="font-semibold">${gross}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tarifa de plataforma (15%)</span>
              <span>-${(gross * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-miami-teal border-t pt-2">
              <span>{t('payment.worker_receives')}</span>
              <span>${workerGross}</span>
            </div>
          </div>
        </div>
      )}

      {/* Apply section */}
      {user?.type === 'worker' && shift.status === 'open' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900">Aplicar a este turno</h3>
          <textarea rows={3} value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Preséntate brevemente: experiencia, por qué eres el candidato ideal… (opcional)"
            className="input resize-none text-sm" />
          <button onClick={handleApply} disabled={applied || applying}
            className={`w-full py-3 text-base font-semibold ${applied ? 'btn-ghost cursor-not-allowed opacity-60' : 'btn-primary'}`}>
            {applied ? `✓ ${t('shifts.applied')}` : applying ? t('common.loading') : `🚀 ${t('shifts.apply')}`}
          </button>
        </div>
      )}

      {!user && (
        <div className="card text-center py-6">
          <p className="text-gray-600 mb-4">Crea una cuenta gratuita para aplicar a este turno</p>
          <div className="flex gap-3 justify-center">
            <Link to="/register" className="btn-primary">Registrarse</Link>
            <Link to="/login" className="btn-secondary">Iniciar sesión</Link>
          </div>
        </div>
      )}
    </div>
  );
}
