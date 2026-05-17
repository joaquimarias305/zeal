import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import i18n from '../../i18n/i18n';

const SKILLS = ['server','bartender','cook','dishwasher','host','housekeeping','event_staff','barback','busser','cashier','supervisor'];
const LANGUAGES = ['english','spanish','creole','portuguese'];

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: 'worker', name: '', email: '', password: '', phone: '',
    language: i18n.language === 'es' ? 'es' : 'en',
    skills: [], languages: ['english','spanish'],
    company_name: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const toggleArr = (field, val) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(t('auth.verify_sent'));
      navigate(user.type === 'worker' ? '/worker' : '/business');
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-50 px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.register_title')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.register_subtitle')}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1,2].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${step === s ? 'w-8 bg-brand-500' : 'w-2 bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="card">
          <form onSubmit={step === 2 ? handleSubmit : e => { e.preventDefault(); setStep(2); }}>

            {step === 1 && (
              <div className="space-y-5">
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.iam')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{val:'worker', icon:'👷', label:t('auth.worker')}, {val:'business', icon:'🏨', label:t('auth.business')}].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => update('type', opt.val)}
                        className={`p-4 rounded-xl border-2 transition-all text-left
                          ${form.type === opt.val
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-2xl block mb-1">{opt.icon}</span>
                        <span className={`text-sm font-semibold ${form.type === opt.val ? 'text-brand-700' : 'text-gray-700'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
                  <input type="text" required value={form.name}
                    onChange={e => update('name', e.target.value)} className="input" placeholder="Carlos Mendez" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                  <input type="email" required value={form.email}
                    onChange={e => update('email', e.target.value)} className="input" placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                  <input type="password" required value={form.password}
                    onChange={e => update('password', e.target.value)} className="input" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.language')}</label>
                  <select value={form.language} onChange={e => update('language', e.target.value)} className="input">
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full py-3">
                  Continuar →
                </button>
              </div>
            )}

            {step === 2 && form.type === 'worker' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('worker.skills')}</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => (
                      <button key={s} type="button"
                        onClick={() => toggleArr('skills', s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                          ${form.skills.includes(s) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
                        {t(`shifts.role_${s}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('worker.languages')}</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(l => (
                      <button key={l} type="button"
                        onClick={() => toggleArr('languages', l)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize
                          ${form.languages.includes(l) ? 'bg-miami-teal text-white border-miami-teal' : 'bg-white text-gray-600 border-gray-200 hover:border-miami-teal'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
                  <input type="tel" value={form.phone}
                    onChange={e => update('phone', e.target.value)} className="input" placeholder="+1 (305) 000-0000" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">
                    ← {t('common.back')}
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                    {loading ? t('common.loading') : t('auth.register_btn')}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && form.type === 'business' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                  <input type="text" required value={form.company_name}
                    onChange={e => update('company_name', e.target.value)} className="input" placeholder="Ocean Drive Bistro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
                  <input type="tel" value={form.phone}
                    onChange={e => update('phone', e.target.value)} className="input" placeholder="+1 (305) 000-0000" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">
                    ← {t('common.back')}
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                    {loading ? t('common.loading') : t('auth.register_btn')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.sign_in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
