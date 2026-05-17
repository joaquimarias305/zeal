import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../../utils/api';
import CheckoutForm from '../../components/common/CheckoutForm';

// Lazy-load Stripe — never initialise with undefined key
const getStripe = () =>
  loadStripe(process.env.REACT_APP_STRIPE_PK || '');

export default function ShiftPayment() {
  const { shiftId, appId } = useParams();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [shift, setShift] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [stripePromise] = useState(() => getStripe());

  useEffect(() => {
    const init = async () => {
      try {
        const [shiftRes, intentRes] = await Promise.all([
          api.get(`/shifts/${shiftId}`),
          api.post('/payments/intent', {
            shift_id: shiftId,
            application_id: appId,
          }),
        ]);
        setShift(shiftRes.data);
        setClientSecret(intentRes.data.clientSecret);
        setPaymentId(intentRes.data.payment_id);
        setAmounts({
          gross:   intentRes.data.gross_amount,
          fee:     intentRes.data.platform_fee,
          worker:  intentRes.data.worker_amount,
        });
      } catch (err) {
        toast.error(err.response?.data?.error || 'Error al inicializar el pago');
        navigate('/business');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [shiftId, appId, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i*0.15}s`}} />
        ))}
      </div>
    </div>
  );

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#f97316',
      colorBackground: '#ffffff',
      colorText: '#111827',
      borderRadius: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Confirmar pago</h1>
        <p className="text-gray-500 mt-1">Paga de forma segura para confirmar el turno</p>
      </div>

      {/* Shift info */}
      {shift && (
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center font-bold text-brand-600 flex-shrink-0 text-lg">
              {shift.company_name?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{shift.title || shift.role}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {format(new Date(shift.shift_date + 'T00:00:00'), 'EEEE dd MMMM')} ·{' '}
                {shift.start_time?.slice(0,5)} – {shift.end_time?.slice(0,5)}
              </p>
              <p className="text-xs text-gray-400 mt-1">📍 {shift.address}</p>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="mt-4 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Pago trabajador ({shift.hours}h × ${shift.pay_rate})</span>
              <span>${amounts.worker?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tarifa plataforma (15%)</span>
              <span>${amounts.fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base">
              <span>Total</span>
              <span className="text-brand-600">${amounts.gross?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Elements */}
      {clientSecret && (
        <div className="card">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm
              amount={amounts.gross}
              onSuccess={(pi) => {
                navigate(`/business/shifts/${shiftId}?paid=true`);
              }}
              onCancel={() => navigate(`/business/shifts/${shiftId}`)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
