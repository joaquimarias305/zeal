import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function WorkerSettings() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);

  useEffect(() => {
    if (params.get('stripe') === 'success') toast.success('¡Stripe Connect configurado!');
    if (params.get('stripe') === 'refresh') toast.info('Necesitas completar la verificación de Stripe.');
    api.get('/workers/me/dashboard').then(r => {
      setStripeStatus({
        onboarded: r.data.profile.stripe_onboarded,
        instant_pay: r.data.profile.instant_pay_enabled,
      });
    });
  }, [params]);

  const handleStripeConnect = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/stripe-connect');
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al conectar con Stripe');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* Stripe Connect */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pago Instantáneo (Stripe)</h3>
            <p className="text-sm text-gray-500">Recibe tu pago en menos de 30 minutos tras el turno</p>
          </div>
        </div>

        {stripeStatus?.onboarded ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <span className="text-green-600">✅</span>
            <p className="text-sm font-medium text-green-700">Stripe Connect activo</p>
          </div>
        ) : (
          <button onClick={handleStripeConnect} disabled={loading}
            className="btn-primary w-full py-3">
            {loading ? 'Redirigiendo…' : 'Conectar con Stripe'}
          </button>
        )}
      </div>

      {/* Account info */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">Cuenta</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Nombre:</span> {user?.name}</p>
          <p><span className="font-medium">Tipo:</span> Trabajador/a</p>
        </div>
      </div>
    </div>
  );
}
