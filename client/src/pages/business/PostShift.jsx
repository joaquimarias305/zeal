import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const ROLES = ['server','bartender','cook','dishwasher','host','housekeeping','event_staff','barback','busser','cashier','supervisor'];
const ZONES = ['miami_beach','brickell','wynwood','doral','coral_gables','downtown','little_havana','hialeah','kendall','aventura','other'];

export default function PostShift() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: 'server', title: '', description: '', zone: 'miami_beach',
    address: '', shift_date: '', start_time: '09:00', end_time: '17:00',
    pay_rate: '', workers_needed: 1, language_req: 'both',
    dress_code: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.address.trim()) e.address = 'La dirección es requerida';
    if (!form.shift_date) e.shift_date = 'La fecha es requerida';
    if (!form.pay_rate || parseFloat(form.pay_rate) < 7.98) e.pay_rate = 'Tarifa mínima: $7.98/h';
    if (form.start_time >= form.end_time) e.end_time = 'El horario de fin debe ser posterior al inicio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/shifts', form);
      toast.success('¡Turno publicado! ✅');
      navigate(`/business/shifts/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally { setLoading(false); }
  };

  const hours = form.start_time && form.end_time && form.start_time < form.end_time
    ? ((new Date(`2000-01-01T${form.end_time}`) - new Date(`2000-01-01T${form.start_time}`)) / 3600000).toFixed(1)
    : null;
  const gross = hours && form.pay_rate ? (hours * parseFloat(form.pay_rate) * (form.workers_needed || 1)).toFixed(2) : null;

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('business.post_shift')}</h1>
        <p className="text-gray-500 mt-1">Publica un turno y recibe candidatos en minutos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Role + Title */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">📋 Detalles del puesto</h3>
          <Field label={t('business.role')}>
            <select value={form.role} onChange={e => update('role', e.target.value)} className="input">
              {ROLES.map(r => <option key={r} value={r}>{t(`shifts.role_${r}`)}</option>)}
            </select>
          </Field>
          <Field label="Título del turno (opcional)">
            <input value={form.title} onChange={e => update('title', e.target.value)}
              className="input" placeholder="ej. Brunch de fin de semana" />
          </Field>
          <Field label="Descripción">
            <textarea rows={2} value={form.description}
              onChange={e => update('description', e.target.value)}
              className="input resize-none" placeholder="Responsabilidades, experiencia requerida…" />
          </Field>
        </div>

        {/* Date + Time */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">🗓 Fecha y horario</h3>
          <Field label={t('business.shift_date')} error={errors.shift_date}>
            <input type="date" value={form.shift_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => update('shift_date', e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio">
              <input type="time" value={form.start_time}
                onChange={e => update('start_time', e.target.value)} className="input" />
            </Field>
            <Field label="Fin" error={errors.end_time}>
              <input type="time" value={form.end_time}
                onChange={e => update('end_time', e.target.value)} className="input" />
            </Field>
          </div>
          {hours && <p className="text-sm text-gray-500">Duración: <strong>{hours} horas</strong></p>}
        </div>

        {/* Location */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">📍 Ubicación</h3>
          <Field label="Zona Miami">
            <select value={form.zone} onChange={e => update('zone', e.target.value)} className="input">
              {ZONES.map(z => <option key={z} value={z}>{t(`common.miami_zones.${z}`)}</option>)}
            </select>
          </Field>
          <Field label={t('business.location')} error={errors.address}>
            <input value={form.address} onChange={e => update('address', e.target.value)}
              className="input" placeholder="800 Ocean Drive, Miami Beach, FL" />
          </Field>
        </div>

        {/* Pay + Workers */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">💰 Pago y personal</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t('business.pay_rate')} ($/h)`} error={errors.pay_rate}>
              <input type="number" step="0.01" min="7.98" value={form.pay_rate}
                onChange={e => update('pay_rate', e.target.value)} className="input" placeholder="18.00" />
            </Field>
            <Field label="N° de trabajadores">
              <input type="number" min="1" max="50" value={form.workers_needed}
                onChange={e => update('workers_needed', parseInt(e.target.value) || 1)} className="input" />
            </Field>
          </div>

          {gross && (
            <div className="p-3 bg-brand-50 rounded-lg text-sm">
              <p className="text-brand-700 font-semibold">Costo estimado total: <span className="text-lg">${gross}</span></p>
              <p className="text-brand-500 text-xs mt-0.5">Incluye la tarifa del trabajador ({hours}h × ${form.pay_rate} × {form.workers_needed} persona(s))</p>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">✅ Requisitos</h3>
          <Field label="Idioma requerido">
            <select value={form.language_req} onChange={e => update('language_req', e.target.value)} className="input">
              <option value="both">🌐 Ambos (EN + ES)</option>
              <option value="en">🇺🇸 Inglés</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </Field>
          <Field label="Vestimenta">
            <input value={form.dress_code} onChange={e => update('dress_code', e.target.value)}
              className="input" placeholder="ej. Camisa blanca, pantalón negro" />
          </Field>
          <Field label="Notas adicionales">
            <textarea rows={2} value={form.notes}
              onChange={e => update('notes', e.target.value)}
              className="input resize-none" placeholder="Estacionamiento disponible, traer propio uniforme…" />
          </Field>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
          {loading ? t('common.loading') : `🚀 Publicar Turno`}
        </button>
      </form>
    </div>
  );
}
