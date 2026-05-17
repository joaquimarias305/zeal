import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          {!sent ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">¿Olvidaste tu contraseña?</h2>
              <p className="text-sm text-gray-500 mb-5">Te enviamos un link para resetearla.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input" placeholder="tu@email.com" />
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? t('common.loading') : 'Enviar link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">¡Revisa tu email!</h2>
              <p className="text-sm text-gray-500">Si esa dirección existe, te enviamos el link.</p>
            </div>
          )}
          <Link to="/login" className="block text-center mt-4 text-sm text-brand-600 hover:text-brand-700">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
