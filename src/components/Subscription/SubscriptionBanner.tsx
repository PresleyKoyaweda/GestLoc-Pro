import React from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

interface SubscriptionBannerProps {
  onDismiss?: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onDismiss }) => {
  const { subscription, isPaymentOverdue, getDaysUntilRenewal } = useSubscription();

  if (!subscription || !isPaymentOverdue()) return null;

  const daysOverdue = Math.abs(getDaysUntilRenewal());

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Paiement en retard
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Votre paiement est en retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}. 
              Certaines fonctionnalités sont désactivées.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <CreditCard className="w-4 h-4 mr-2" />
            Mettre à jour le paiement
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner;