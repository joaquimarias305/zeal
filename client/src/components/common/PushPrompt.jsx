import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function PushPrompt() {
  const { t } = useTranslation();
  const { isSupported, permission, subscribed, loading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('push_dismissed') === '1'
  );

  // Only show after 5 seconds, once, if not already subscribed/denied/dismissed
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isSupported || subscribed || permission === 'denied' || dismissed) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, [isSupported, subscribed, permission, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem('push_dismissed', '1');
    setDismissed(true);
    setVisible(false);
  };

  const handleSubscribe = async () => {
    await subscribe();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom">
      <div className="card shadow-xl border-brand-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">
              {t('push.title', 'Activar notificaciones')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {t('push.desc', 'Recibe avisos cuando se confirme un turno o llegue una oferta.')}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleDismiss} className="btn-ghost flex-1 text-sm py-2">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubscribe} disabled={loading} className="btn-primary flex-1 text-sm py-2">
            {loading ? '…' : t('push.enable', 'Activar')}
          </button>
        </div>
      </div>
    </div>
  );
}
