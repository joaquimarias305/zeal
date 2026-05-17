import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export default function CheckoutForm({ amount, onSuccess, onCancel }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/business`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      toast.success('¡Pago realizado con éxito! ✅');
      onSuccess?.(paymentIntent);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Payment summary */}
      <div className="p-4 bg-gradient-to-r from-miami-teal/5 to-brand-50 rounded-xl">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total a pagar</span>
          <span className="text-2xl font-extrabold text-gray-900">${amount?.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Incluye tarifa de plataforma (15%). El 85% va directo al trabajador.
        </p>
      </div>

      {/* Stripe PaymentElement */}
      <div className="p-1">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-600">{errorMsg}</p>
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={processing}
            className="btn-ghost flex-1">
            {t('common.cancel')}
          </button>
        )}
        <button type="submit"
          disabled={!stripe || !elements || processing}
          className="btn-primary flex-1 py-3">
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Procesando…
            </span>
          ) : `💳 Pagar $${amount?.toFixed(2)}`}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Pago seguro con Stripe
      </p>
    </form>
  );
}
