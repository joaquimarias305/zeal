import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function PaymentPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleInstantPay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/payments/instant-pay/${paymentId}`);
      setDone(true);
      toast.success(`¡Pago instantáneo solicitado! Estado: ${data.status}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar el pago');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card text-center py-8 space-y-4">
        <div className="text-5xl">{done ? '✅' : '💰'}</div>
        <h1 className="text-xl font-bold text-gray-900">
          {done ? '¡Pago enviado!' : 'Pago Instantáneo'}
        </h1>
        <p className="text-gray-500 text-sm">
          {done
            ? 'Tu pago llegará en menos de 30 minutos a tu cuenta Stripe.'
            : 'Recibe el 85% de tu pago en menos de 30 minutos tras el fin del turno.'
          }
        </p>
        {!done && (
          <button onClick={handleInstantPay} disabled={loading}
            className="btn-primary w-full py-3">
            {loading ? 'Procesando…' : 'Solicitar Pago Instantáneo'}
          </button>
        )}
        <button onClick={() => navigate('/worker')} className="btn-ghost w-full">
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
