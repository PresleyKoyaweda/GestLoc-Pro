import React, { useState } from 'react';
import { Plus, Users, Edit, Trash2, Phone, Mail, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Tenant, Property, Unit } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import TenantForm from './TenantForm';

interface TenantsTabProps {
  onTabChange: (tab: string) => void;
}

const TenantsTab: React.FC<TenantsTabProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [payments] = useLocalStorage('gestionloc_payments', []);
  const [issues] = useLocalStorage('gestionloc_issues', []);
  const { canAddTenant, currentPlan } = useSubscription();
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>();

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleDelete = (tenantId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce locataire ?')) {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  };

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'Non assigné';
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Propriété supprimée';
  };

  const getUnitName = (unitId?: string) => {
    if (!unitId) return '';
    const unit = units.find(u => u.id === unitId);
    return unit ? ` - ${unit.name}` : '';
  };

  const getTenantPaymentStatus = (tenantId: string) => {
    const tenantPayments = payments.filter(p => p.tenantId === tenantId);
    const latePayments = tenantPayments.filter(p => p.status === 'late' || p.status === 'overdue');
    return latePayments.length;
  };

  const getTenantIssues = (tenantId: string) => {
    return issues.filter(i => i.tenantId === tenantId && i.status !== 'resolved').length;
  };
  const isLeaseExpiringSoon = (leaseEnd: Date) => {
    const today = new Date();
    const endDate = new Date(leaseEnd);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isLeaseExpired = (leaseEnd: Date) => {
    const today = new Date();
    const endDate = new Date(leaseEnd);
    return endDate < today;
  };

  const handleAddTenant = () => {
    if (!canAddTenant(tenants.length)) {
      alert(`Vous avez atteint la limite de ${currentPlan.features.maxTenants} locataire${currentPlan.features.maxTenants > 1 ? 's' : ''} pour votre plan ${currentPlan.name}. Veuillez mettre à niveau votre abonnement.`);
      return;
    }
    setEditingTenant(undefined);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
          <p className="text-gray-600">Gérez vos locataires et leurs baux</p>
        </div>
        <button
          onClick={handleAddTenant}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un locataire
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange && onTabChange('dashboard')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total locataires</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange && onTabChange('payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus mensuels</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.reduce((sum, tenant) => sum + tenant.monthlyRent, 0).toLocaleString('fr-CA')}$
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Baux expirant</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => isLeaseExpiringSoon(t.leaseEnd)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Baux expirés</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => isLeaseExpired(t.leaseEnd)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun locataire</h3>
          <p className="text-gray-500 mb-4">Commencez par ajouter votre premier locataire</p>
          <button
            onClick={handleAddTenant}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un locataire
          </button>
        </div>
      ) : (
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
                    Bail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alertes
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
                {tenants.map((tenant) => {
                  const latePayments = getTenantPaymentStatus(tenant.id);
                  const activeIssues = getTenantIssues(tenant.id);
                  
                  return (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Locataire #{tenant.id.slice(-4)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Échéance le {tenant.paymentDueDate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <button
                          onClick={() => onTabChange && onTabChange('properties')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {getPropertyName(tenant.propertyId)}{getUnitName(tenant.unitId)}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(tenant.leaseStart).toLocaleDateString('fr-FR')} - {new Date(tenant.leaseEnd).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <button
                          onClick={() => onTabChange && onTabChange('payments')}
                          className="text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          {tenant.monthlyRent.toLocaleString('fr-CA')}$
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {latePayments > 0 && (
                            <button
                              onClick={() => onTabChange && onTabChange('payments')}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                            >
                              {latePayments} paiement{latePayments > 1 ? 's' : ''} en retard
                            </button>
                          )}
                          {activeIssues > 0 && (
                            <button
                              onClick={() => onTabChange && onTabChange('issues')}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200"
                            >
                              {activeIssues} problème{activeIssues > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isLeaseExpired(tenant.leaseEnd)
                          ? 'bg-red-100 text-red-800'
                          : isLeaseExpiringSoon(tenant.leaseEnd)
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {isLeaseExpired(tenant.leaseEnd)
                          ? 'Expiré'
                          : isLeaseExpiringSoon(tenant.leaseEnd)
                            ? 'Expire bientôt'
                            : 'Actif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tenant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <TenantForm
          tenant={editingTenant}
          onClose={() => {
            setShowForm(false);
            setEditingTenant(undefined);
          }}
        />
      )}
    </div>
  );
};

export default TenantsTab;