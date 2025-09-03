import React, { useState } from 'react';
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Invoice, SubscriptionPlan } from '../../types';
import PlanCard from './PlanCard';

const SubscriptionTab: React.FC = () => {
  const { user, subscription, updateSubscription } = useAuth();
  const { currentPlan, getDaysUntilRenewal, isPaymentOverdue } = useSubscription();
  const { t, formatCurrency } = useTranslation();
  const [invoices] = useLocalStorage<Invoice[]>('gestionloc_invoices', [
    {
      id: 'inv_1',
      userId: '1',
      subscriptionId: 'sub_1',
      amount: 19,
      currency: 'CAD',
      status: 'paid',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-01'),
      paidDate: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'inv_2',
      userId: '1',
      subscriptionId: 'sub_1',
      amount: 19,
      currency: 'CAD',
      status: 'paid',
      invoiceNumber: 'INV-2024-002',
      invoiceDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-01'),
      paidDate: new Date('2024-02-01'),
      createdAt: new Date('2024-02-01')
    }
  ]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showBillingAddressModal, setShowBillingAddressModal] = useState(false);
  const [paymentMethodData, setPaymentMethodData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [billingAddressData, setBillingAddressData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    street: user?.address?.street || '',
    apartment: user?.address?.apartment || '',
    city: user?.address?.city || '',
    province: user?.address?.province || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'Canada'
  });

  const [showPlans, setShowPlans] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  const handleUpdatePaymentMethod = () => {
    // Simulate payment method update
    alert('Méthode de paiement mise à jour avec succès !');
    setShowPaymentMethodModal(false);
    setPaymentMethodData({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: ''
    });
  };

  const handleUpdateBillingAddress = () => {
    // Update user address
    updateUser({
      firstName: billingAddressData.firstName,
      lastName: billingAddressData.lastName,
      address: {
        street: billingAddressData.street,
        apartment: billingAddressData.apartment,
        city: billingAddressData.city,
        province: billingAddressData.province,
        postalCode: billingAddressData.postalCode,
        country: billingAddressData.country
      }
    });
    alert('Adresse de facturation mise à jour avec succès !');
    setShowBillingAddressModal(false);
  };

  const handlePlanChange = async (newPlan: SubscriptionPlan) => {
    setIsProcessing(true);
    
    // Simulate Stripe checkout process
    try {
      // In a real app, this would redirect to Stripe Checkout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          plan: newPlan,
          updatedAt: new Date()
        };
        updateSubscription(updatedSubscription);
      }
      
      setShowPlans(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        };
        updateSubscription(updatedSubscription);
      }
    }
  };

  const getStatusIcon = () => {
    if (!subscription) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    
    switch (subscription.status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!subscription) return 'Aucun abonnement';
    
    switch (subscription.status) {
      case 'active':
        return 'Actif';
      case 'past_due':
        return 'Paiement en retard';
      case 'pending':
        return 'En attente';
      case 'suspended':
        return 'Suspendu';
      case 'canceled':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-500">La gestion d'abonnement est réservée aux propriétaires</p>
        </div>
      </div>
    );
  }

  if (showPlans) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Choisir un plan</h1>
              <p className="text-gray-600">Sélectionnez le plan qui correspond à vos besoins</p>
            </div>
            <button
              onClick={() => setShowPlans(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          {(['free', 'pro', 'business'] as SubscriptionPlan[]).map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              isCurrentPlan={subscription?.plan === plan}
              onSelectPlan={handlePlanChange}
              disabled={isProcessing}
            />
          ))}
        </div>

        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Traitement en cours</h3>
                <p className="text-gray-500">Redirection vers Stripe...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon abonnement</h1>
        <p className="text-gray-600">Gérez votre abonnement et votre facturation</p>
      </div>

      {/* Payment Overdue Banner */}
      {isPaymentOverdue() && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Paiement en retard</h3>
              <p className="text-sm text-red-700 mt-1">
                Votre paiement est en retard. Certaines fonctionnalités sont désactivées.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Subscription */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Plan actuel</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{currentPlan.name}</h4>
                <p className="text-gray-500">{currentPlan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{currentPlan.price}$ CAD</div>
                <div className="text-sm text-gray-500">par mois</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(currentPlan.price)}</div>
                  <span className="ml-2 text-sm font-medium">{getStatusText()}</span>
                </div>
              </div>
              
              {subscription && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prochain prélèvement</span>
                    <span className="text-sm font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jours restants</span>
                    <span className="text-sm font-medium">{getDaysUntilRenewal()} jours</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowPlans(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Changer de plan
              </button>
              
              {subscription?.plan !== 'free' && !subscription?.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Annuler l'abonnement
                </button>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Votre abonnement sera annulé le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Informations de facturation</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-500">Expire 12/25</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPaymentMethodModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Modifier
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Adresse de facturation</h4>
                <p className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}<br />
                  {user?.address?.street}{user?.address?.apartment && `, ${user.address.apartment}`}<br />
                  {user?.address?.city}, {user?.address?.province} {user?.address?.postalCode}<br />
                  {user?.address?.country}
                </p>
                <button 
                  onClick={() => setShowBillingAddressModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des factures</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.invoiceDate.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Payée' : 
                       invoice.status === 'pending' ? 'En attente' : 'Échec'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Modifier la méthode de paiement</h3>
              <p className="text-sm text-gray-600">Mettez à jour vos informations de carte</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  value={paymentMethodData.cardholderName}
                  onChange={(e) => setPaymentMethodData(prev => ({ ...prev, cardholderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={paymentMethodData.cardNumber}
                  onChange={(e) => setPaymentMethodData(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois
                  </label>
                  <select
                    value={paymentMethodData.expiryMonth}
                    onChange={(e) => setPaymentMethodData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année
                  </label>
                  <select
                    value={paymentMethodData.expiryYear}
                    onChange={(e) => setPaymentMethodData(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">AAAA</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentMethodData.cvv}
                    onChange={(e) => setPaymentMethodData(prev => ({ ...prev, cvv: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePaymentMethod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Modal */}
      {showBillingAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Modifier l'adresse de facturation</h3>
              <p className="text-sm text-gray-600">Mettez à jour votre adresse de facturation</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={billingAddressData.firstName}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={billingAddressData.lastName}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={billingAddressData.street}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Rue de la Paix"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appartement
                </label>
                <input
                  type="text"
                  value={billingAddressData.apartment}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, apartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="App 4B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={billingAddressData.city}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Montréal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  value={billingAddressData.province}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, province: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une province</option>
                  <option value="AB">Alberta</option>
                  <option value="BC">Colombie-Britannique</option>
                  <option value="MB">Manitoba</option>
                  <option value="NB">Nouveau-Brunswick</option>
                  <option value="NL">Terre-Neuve-et-Labrador</option>
                  <option value="NS">Nouvelle-Écosse</option>
                  <option value="ON">Ontario</option>
                  <option value="PE">Île-du-Prince-Édouard</option>
                  <option value="QC">Québec</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="NT">Territoires du Nord-Ouest</option>
                  <option value="NU">Nunavut</option>
                  <option value="YT">Yukon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={billingAddressData.postalCode}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="H1A 1A1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <select
                  value={billingAddressData.country}
                  onChange={(e) => setBillingAddressData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Canada">Canada</option>
                  <option value="États-Unis">États-Unis</option>
                  <option value="France">France</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBillingAddressModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateBillingAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;