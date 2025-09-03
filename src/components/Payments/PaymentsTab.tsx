import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Check, X, Clock, AlertTriangle, Filter, Download } from 'lucide-react';
import { Payment, Tenant, Property, Unit, PaymentStatus } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useTenantHistory } from '../../hooks/useTenantHistory';
import { usePaymentReminders } from '../../hooks/usePaymentReminders';
import PaymentReminderButton from './PaymentReminderButton';

interface PaymentsTabProps {
  onTabChange: (tab: string) => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useLocalStorage<Payment[]>('gestionloc_payments', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const { addNotification } = useNotifications('1');
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const { addHistoryEntry } = useTenantHistory();

  // Generate monthly payments for all tenants
  useEffect(() => {
    const generateMonthlyPayments = () => {
      if (user?.role !== 'owner') return; // Only owners generate payments
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      tenants.forEach(tenant => {
        const dueDate = new Date(currentYear, currentMonth, tenant.paymentDueDate);
        
        // Check if payment already exists for this month
        const existingPayment = payments.find(p => 
          p.tenantId === tenant.id &&
          new Date(p.dueDate).getMonth() === currentMonth &&
          new Date(p.dueDate).getFullYear() === currentYear
        );

        if (!existingPayment) {
          const newPayment: Payment = {
            id: Date.now().toString() + Math.random(),
            tenantId: tenant.id,
            amount: tenant.monthlyRent,
            dueDate,
            status: today > dueDate ? 'late' : 'pending',
            createdAt: new Date(),
          };

          setPayments(prev => [...prev, newPayment]);

          // Send notification 5 days before due date
          const notificationDate = new Date(dueDate);
          notificationDate.setDate(notificationDate.getDate() - 5);
          
          if (today >= notificationDate && today <= dueDate) {
            addNotification({
              userId: tenant.userId,
              type: 'payment_reminder',
              title: 'Rappel de paiement',
              message: `Votre loyer de ${tenant.monthlyRent}€ est dû le ${dueDate.toLocaleDateString('fr-FR')}`,
              read: false,
            });
          }
        }
      });
    };

    generateMonthlyPayments();
  }, [tenants, payments, setPayments, addNotification]);

  const getTenantInfo = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { name: 'Locataire supprimé', property: '' };
    
    const property = properties.find(p => p.id === tenant.propertyId);
    const unit = units.find(u => u.id === tenant.unitId);
    
    return {
      name: `Locataire #${tenant.id.slice(-4)}`,
      property: property ? `${property.name}${unit ? ` - ${unit.name}` : ''}` : 'Propriété supprimée'
    };
  };

  const markAsPaid = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status: 'paid' as PaymentStatus, paidDate: new Date() }
        : payment
    ));
    
    // Add to tenant history
    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (tenant) {
      addHistoryEntry({
        type: 'payment',
        title: `Paiement effectué - ${payment.amount}$`,
        description: `Paiement de loyer de ${payment.amount}$ effectué`,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId,
        relatedId: payment.id,
        metadata: {
          amount: payment.amount,
          status: 'paid',
          dueDate: payment.dueDate.toISOString()
        }
      });
    }
  };

  const markAsLate = (paymentId: string) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status: 'late' as PaymentStatus }
        : payment
    ));
  };

  const userPayments = (() => {
    const currentTenant = tenants.find(t => t.userId === user?.id);
    return currentTenant ? payments.filter(payment => payment.tenantId === currentTenant.id) : [];
  })();

  const filteredPayments = userPayments.filter(payment => 
    filter === 'all' || payment.status === filter
  );

  const stats = {
    total: userPayments.length,
    paid: userPayments.filter(p => p.status === 'paid').length,
    pending: userPayments.filter(p => p.status === 'pending').length,
    late: userPayments.filter(p => p.status === 'late').length,
    overdue: userPayments.filter(p => p.status === 'overdue').length,
    totalAmount: userPayments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: userPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'overdue':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'late':
        return 'En retard';
      case 'overdue':
        return 'Impayé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-600">Suivez les paiements de vos locataires</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total paiements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toLocaleString('fr-CA')}$</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paidAmount.toLocaleString('fr-CA')}$</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-gray-900">{stats.late + stats.overdue}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {(['all', 'pending', 'paid', 'late', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Tous' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriété
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
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
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paiement</h3>
                    <p className="text-gray-500">Les paiements apparaîtront ici automatiquement</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const tenantInfo = getTenantInfo(payment.tenantId);
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {tenantInfo.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tenantInfo.property}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.amount.toLocaleString('fr-CA')}$
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                        {payment.paidDate && (
                          <div className="text-xs text-gray-500">
                            Payé le {new Date(payment.paidDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{getStatusText(payment.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {user?.role === 'owner' && payment.status !== 'paid' && (
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Marquer comme payé"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'owner' && payment.status === 'pending' && (
                            <button
                              onClick={() => markAsLate(payment.id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Marquer en retard"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'tenant' && payment.status !== 'paid' && (
                            <button
                              onClick={() => {
                                if (confirm('Confirmer le paiement de ' + payment.amount + '$ ?')) {
                                  markAsPaid(payment.id);
                                  alert('✅ Paiement effectué avec succès !');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Payer
                            </button>
                          )}
                          {user?.role === 'owner' && payment.status !== 'paid' && (
                            <PaymentReminderButton payment={payment} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;