import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AvatarUpload from '../../components/common/AvatarUpload';

const ZONES = ['miami_beach','brickell','wynwood','doral','coral_gables','downtown','little_havana','hialeah','kendall','aventura','other'];

export default function BusinessProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/businesses/me/dashboard').then(r => {
      setProfile(r.data.profile);
      setForm({
        company_name: r.data.profile.company_name || '',
        description: r.data.profile.description || '',
        industry: r.data.profile.industry || '',
        zone: r.data.profile.zone || 'other',
        address: r.data.profile.address || '',
        website: r.data.profile.website || '',
      });
    }).catch(() => toast.error(t('common.error')));
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/businesses/me', form);
      setProfile(p => ({ ...p, ...res.data }));
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Perfil de Empresa</h1>
        <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
          {editing ? t('common.cancel') : '✏️ Editar'}
        </button>
      </div>

      {editing ? (
        <div className="card space-y-4">
          {[
            { key: 'company_name', label: 'Nombre de la empresa' },
            { key: 'description', label: 'Descripción', textarea: true },
            { key: 'industry', label: 'Industria' },
            { key: 'address', label: 'Dirección' },
            { key: 'website', label: 'Sitio web' },
          ].map(({ key, label, textarea }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {textarea
                ? <textarea rows={3} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input resize-none" />
                : <input value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input" />
              }
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona Miami</label>
            <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} className="input">
              {ZONES.map(z => <option key={z} value={z}>{t(`common.miami_zones.${z}`)}</option>)}
            </select>
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
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentUrl={profile.logo_url}
              name={profile.company_name}
              endpoint="/uploads/logo"
              size="md"
              onUploaded={(url) => setProfile(p => ({ ...p, logo_url: url }))}
            />
            <div>
              <h2 className="text-lg font-bold">{profile.company_name}</h2>
              <div className="flex gap-2 mt-1">
                {profile.verified && <span className="badge bg-miami-teal/10 text-miami-teal">✅ Verificado</span>}
              </div>
            </div>
          </div>
          {profile.description && <p className="text-gray-700">{profile.description}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-400 text-xs">Industria</p><p className="font-medium">{profile.industry || '-'}</p></div>
            <div><p className="text-gray-400 text-xs">Zona</p><p className="font-medium">{t(`common.miami_zones.${profile.zone}`)}</p></div>
            <div><p className="text-gray-400 text-xs">Dirección</p><p className="font-medium">{profile.address || '-'}</p></div>
            <div><p className="text-gray-400 text-xs">Web</p><p className="font-medium">{profile.website || '-'}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
