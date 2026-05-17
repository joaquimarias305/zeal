import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      toast.success('¡Contraseña actualizada!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Link inválido o expirado');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Nueva contraseña</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="input" placeholder="Nueva contraseña (mín. 8 chars)" />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
