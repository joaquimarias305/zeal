import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const defaultSlot = () => ({ day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: true });

export default function WorkerAvailability() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState([defaultSlot()]);
  const [saving, setSaving] = useState(false);

  const updateSlot = (i, field, val) => {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [field]: val } : slot));
  };

  const addSlot = () => setSlots(s => [...s, defaultSlot()]);
  const removeSlot = (i) => setSlots(s => s.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/workers/me/availability', { slots });
      toast.success('Disponibilidad guardada ✅');
    } catch { toast.error(t('common.error')); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('worker.availability')}</h1>
        <button onClick={addSlot} className="btn-secondary text-sm">+ Agregar slot</button>
      </div>

      <div className="space-y-3">
        {slots.map((slot, i) => (
          <div key={i} className="card flex flex-wrap items-center gap-3">
            <select value={slot.day_of_week} onChange={e => updateSlot(i, 'day_of_week', parseInt(e.target.value))}
              className="input w-24">
              {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
            </select>
            <input type="time" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)}
              className="input w-32" />
            <span className="text-gray-400">-</span>
            <input type="time" value={slot.end_time} onChange={e => updateSlot(i, 'end_time', e.target.value)}
              className="input w-32" />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={slot.is_available}
                onChange={e => updateSlot(i, 'is_available', e.target.checked)}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              Disponible
            </label>
            <button onClick={() => removeSlot(i)} className="ml-auto text-red-400 hover:text-red-600 text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
        {saving ? t('common.loading') : t('common.save')}
      </button>
    </div>
  );
}
