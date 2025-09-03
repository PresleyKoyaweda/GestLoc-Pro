import React, { useState } from 'react';
import { Send, MessageSquare, Mail, Smartphone, Clock } from 'lucide-react';
import { Payment, Tenant, User } from '../../types';
import { usePaymentReminders } from '../../hooks/usePaymentReminders';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface PaymentReminderButtonProps {
  payment: Payment;
  className?: string;
}

const PaymentReminderButton: React.FC<PaymentReminderButtonProps> = ({ payment, className = '' }) => {
  const { sendManualReminder } = usePaymentReminders();
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [users] = useLocalStorage<User[]>('gestionloc_users', []);
  const [showModal, setShowModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tenant = tenants.find(t => t.id === payment.tenantId);
  const tenantUser = users.find(u => u.id === tenant?.userId);

  const handleSendReminder = async () => {
    setIsLoading(true);
    try {
      const result = await sendManualReminder(payment.id, customMessage || undefined);
      if (result.success) {
        alert('✅ Rappel envoyé avec succès !');
        setShowModal(false);
        setCustomMessage('');
      } else {
        alert('❌ Erreur lors de l\'envoi du rappel');
      }
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi du rappel');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = () => {
    const days = getDaysUntilDue();
    if (days < 0) return 'text-red-600';
    if (days === 0) return 'text-orange-600';
    if (days <= 2) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getCommunicationIcon = () => {
    const preference = tenantUser?.preferences?.aiCommunication || 'email';
    return preference === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />;
  };

  if (payment.status === 'paid') return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${getUrgencyColor()} hover:bg-gray-100 ${className}`}
        title="Envoyer un rappel de paiement"
      >
        <Send className="w-4 h-4 mr-1" />
        Rappel
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Envoyer un rappel de paiement</h3>
              <p className="text-sm text-gray-600">
                À {tenantUser?.firstName} {tenantUser?.lastName} pour {payment.amount}$ CAD
              </p>
            </div>

            {/* Informations du paiement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Échéance</span>
                <span className="text-sm text-blue-800">
                  {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Jours restants</span>
                <span className={`text-sm font-bold ${getUrgencyColor()}`}>
                  {getDaysUntilDue() === 0 ? 'Aujourd\'hui' : 
                   getDaysUntilDue() < 0 ? `${Math.abs(getDaysUntilDue())} jour(s) de retard` :
                   `${getDaysUntilDue()} jour(s)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Envoi via</span>
                <div className="flex items-center text-sm text-blue-800">
                  {getCommunicationIcon()}
                  <span className="ml-1">
                    {tenantUser?.preferences?.aiCommunication === 'sms' ? 'SMS' : 'Email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message personnalisé */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message personnalisé (optionnel)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="L'IA générera un message professionnel automatiquement, ou ajoutez vos instructions spéciales ici..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 L'IA adaptera automatiquement le ton selon l'urgence et l'historique du locataire
              </p>
            </div>

            {/* Type de rappel automatique */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Type de rappel automatique</h4>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {getDaysUntilDue() === 0 ? (
                  <span className="text-orange-700 font-medium">Rappel urgent - Jour d'échéance</span>
                ) : getDaysUntilDue() < 0 ? (
                  <span className="text-red-700 font-medium">Rappel de retard - Paiement en souffrance</span>
                ) : (
                  <span className="text-blue-700 font-medium">Rappel préventif - {getDaysUntilDue()} jour(s) avant échéance</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSendReminder}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le rappel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentReminderButton;