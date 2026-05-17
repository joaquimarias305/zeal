import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/common/StarRating';
import AvatarUpload from '../../components/common/AvatarUpload';

const SKILLS = ['server','bartender','cook','dishwasher','host','housekeeping','event_staff','barback','busser','cashier','supervisor'];
const LANGUAGES = ['english','spanish','creole','portuguese'];

export default function WorkerProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/workers/me/dashboard'),
      api.get(`/reviews/worker/${user.id}`),
    ]).then(([dashRes, revRes]) => {
      setProfile(dashRes.data.profile);
      setReviews(revRes.data);
      setForm({
        name: dashRes.data.profile.name,
        bio: dashRes.data.profile.bio || '',
        skills: dashRes.data.profile.skills || [],
        languages: dashRes.data.profile.languages || [],
        years_experience: dashRes.data.profile.years_experience || 0,
        phone: user.phone || '',
      });
    }).catch(() => toast.error(t('common.error')));
  }, [user.id, user.phone, t]);

  const toggle = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch('/workers/me', form);
      setProfile(p => ({ ...p, ...updated.data }));
      updateUser({ name: form.name });
      setEditing(false);
      toast.success('Perfil actualizado ✅');
    } catch { toast.error(t('common.error')); }
    finally { setSaving(false); }
  };

  if (!profile) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s`}} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="card flex items-start gap-5 flex-wrap">
        <div className="flex-shrink-0">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            name={profile.name}
            endpoint="/uploads/avatar"
            size="lg"
            onUploaded={(url) => setProfile(p => ({ ...p, avatar_url: url }))}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StarRating rating={profile.avg_rating} size="md" />
                <span className="text-sm text-gray-500">({profile.total_reviews} reseñas)</span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
              {editing ? t('common.cancel') : '✏️ Editar'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {profile.miami_verified && (
              <span className="badge bg-miami-teal/10 text-miami-teal">✅ Miami Verified</span>
            )}
            {profile.top_worker && (
              <span className="badge bg-amber-100 text-amber-700">⭐ Top Worker</span>
            )}
            <span className="badge bg-gray-100 text-gray-600">
              🗂 {profile.total_shifts} turnos
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('worker.bio')}</label>
            <textarea rows={3} value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="input resize-none" placeholder="Cuéntanos sobre ti…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('worker.skills')}</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(s => (
                <button key={s} type="button" onClick={() => toggle('skills', s)}
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
                <button key={l} type="button" onClick={() => toggle('languages', l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize
                    ${form.languages.includes(l) ? 'bg-miami-teal text-white border-miami-teal' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('worker.experience')}</label>
            <input type="number" min="0" max="50" value={form.years_experience}
              onChange={e => setForm(f => ({ ...f, years_experience: parseInt(e.target.value) || 0 }))}
              className="input w-32" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="btn-ghost flex-1">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('worker.skills')}</p>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map(s => (
                <span key={s} className="badge bg-brand-50 text-brand-700">{t(`shifts.role_${s}`)}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('worker.languages')}</p>
            <div className="flex flex-wrap gap-2">
              {(profile.languages || []).map(l => (
                <span key={l} className="badge bg-teal-50 text-teal-700 capitalize">{l}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-gray-400 text-xs">{t('worker.experience')}</p>
              <p className="font-semibold">{profile.years_experience} años</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">{t('worker.total_earned')}</p>
              <p className="font-semibold text-miami-teal">${Number(profile.total_earnings || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('worker.reviews')}</h2>
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{r.company_name || r.reviewer_name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{r.role}</p>
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
