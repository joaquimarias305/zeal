import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import StarRating from './StarRating';

const roleColors = {
  server: 'bg-blue-100 text-blue-700',
  bartender: 'bg-purple-100 text-purple-700',
  cook: 'bg-red-100 text-red-700',
  dishwasher: 'bg-gray-100 text-gray-700',
  host: 'bg-pink-100 text-pink-700',
  housekeeping: 'bg-green-100 text-green-700',
  event_staff: 'bg-yellow-100 text-yellow-700',
  barback: 'bg-indigo-100 text-indigo-700',
  busser: 'bg-orange-100 text-orange-700',
  cashier: 'bg-teal-100 text-teal-700',
  supervisor: 'bg-brand-100 text-brand-700',
};

export default function ShiftCard({ shift, onApply, applied = false, showApply = false }) {
  const { t } = useTranslation();

  const pay = Number(shift.pay_rate);
  const hours = Number(shift.hours);
  const gross = (pay * hours).toFixed(2);
  const date = new Date(shift.shift_date + 'T00:00:00');

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {shift.logo_url
            ? <img src={shift.logo_url} alt={shift.company_name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-600 font-bold text-lg">{shift.company_name?.[0]}</span>
              </div>
          }
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{shift.company_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <StarRating rating={shift.business_rating} size="sm" />
              {shift.business_verified && (
                <span className="badge bg-miami-teal/10 text-miami-teal ml-1">
                  ✓ {t('common.verified')}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className={`badge flex-shrink-0 ${roleColors[shift.role] || 'bg-gray-100 text-gray-700'}`}>
          {t(`shifts.role_${shift.role}`)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Fecha</p>
          <p className="text-sm font-semibold text-gray-900">
            {format(date, 'EEE dd MMM')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Horario</p>
          <p className="text-sm font-semibold text-gray-900">
            {shift.start_time?.slice(0,5)} - {shift.end_time?.slice(0,5)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Pago total</p>
          <p className="text-sm font-bold text-miami-teal">${gross}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">${pay}{t('shifts.per_hour')}</p>
          <p className="text-sm text-gray-600">{hours}h</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          📍 {t(`common.miami_zones.${shift.zone}`)}
        </span>
        {shift.language_req && shift.language_req !== 'both' && (
          <span className="badge bg-gray-100 text-gray-600">
            {shift.language_req === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/shifts/${shift.id}`} className="btn-secondary text-sm flex-1 text-center">
          {t('shifts.details')}
        </Link>
        {showApply && (
          <button
            onClick={() => onApply?.(shift.id)}
            disabled={applied}
            className={`flex-1 text-sm ${applied ? 'btn-ghost opacity-60 cursor-not-allowed' : 'btn-primary'}`}>
            {applied ? `✓ ${t('shifts.applied')}` : t('shifts.apply')}
          </button>
        )}
      </div>
    </div>
  );
}
