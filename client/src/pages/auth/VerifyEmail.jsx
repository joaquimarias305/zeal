import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-sm w-full text-center py-10">
        {status === 'loading' && <p className="text-gray-500">Verificando…</p>}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Email verificado!</h2>
            <p className="text-gray-500 mb-6">Tu cuenta está lista.</p>
            <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link inválido</h2>
            <p className="text-gray-500 mb-6">El link expiró o ya fue usado.</p>
            <Link to="/login" className="btn-primary">Volver al Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
