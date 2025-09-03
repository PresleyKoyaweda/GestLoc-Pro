import React, { useState } from 'react';
import { Plus, X, User, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import { Tenant, Property, Unit } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';

interface TenantFormProps {
  onClose: () => void;
  tenant?: Tenant;
}

const TenantForm: React.FC<TenantFormProps> = ({ onClose, tenant }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const { canAddTenant } = useSubscription();
  
  const [formData, setFormData] = useState({
    userId: tenant?.userId || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: tenant?.propertyId || '',
    unitId: tenant?.unitId || '',
    leaseStart: tenant?.leaseStart ? new Date(tenant.leaseStart).toISOString().split('T')[0] : '',
    leaseEnd: tenant?.leaseEnd ? new Date(tenant.leaseEnd).toISOString().split('T')[0] : '',
    monthlyRent: tenant?.monthlyRent || 0,
    depositPaid: tenant?.depositPaid || 0,
    paymentDueDate: tenant?.paymentDueDate || 1,
    emergencyContact: {
      name: tenant?.emergencyContact?.name || '',
      phone: tenant?.emergencyContact?.phone || '',
      relationship: tenant?.emergencyContact?.relationship || '',
    }
  });

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const availableUnits = units.filter(u => u.propertyId === formData.propertyId && u.status === 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.propertyId) {
      alert('Veuillez sélectionner une propriété.');
      return;
    }
    
    if (selectedProperty?.type === 'shared' && !formData.unitId) {
      alert('Veuillez sélectionner une chambre pour cette colocation.');
      return;
    }
    
    if (new Date(formData.leaseEnd) <= new Date(formData.leaseStart)) {
      alert('La date de fin du bail doit être postérieure à la date de début.');
      return;
    }
    
    if (!tenant && !canAddTenant(tenants.length)) {
      alert('Vous avez atteint la limite de locataires pour votre plan. Veuillez mettre à niveau votre abonnement.');
      return;
    }
    
    const tenantData: Tenant = {
      id: tenant?.id || Date.now().toString(),
      userId: user?.id || '1', // Temporary - should be actual tenant user ID
      propertyId: formData.propertyId || undefined,
      unitId: formData.unitId || undefined,
      leaseStart: new Date(formData.leaseStart),
      leaseEnd: new Date(formData.leaseEnd),
      monthlyRent: formData.monthlyRent,
      depositPaid: formData.depositPaid,
      paymentDueDate: formData.paymentDueDate,
      emergencyContact: formData.emergencyContact,
    };

    if (tenant) {
      setTenants(prev => prev.map(t => t.id === tenant.id ? tenantData : t));
    } else {
      setTenants(prev => [...prev, tenantData]);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {tenant ? 'Modifier le locataire' : 'Ajouter un locataire'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Property Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Logement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriété *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value, unitId: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une propriété</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address?.street}, {property.address?.city}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProperty?.type === 'shared' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chambre *
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une chambre</option>
                    {availableUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} - {unit.rent}€/mois
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Lease Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bail</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Début du bail *
                </label>
                <input
                  type="date"
                  value={formData.leaseStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaseStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin du bail *
                </label>
                <input
                  type="date"
                  value={formData.leaseEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaseEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyer mensuel ($) *
                </label>
                <input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dépôt de garantie ($)
                </label>
                <input
                  type="number"
                  value={formData.depositPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositPaid: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance mensuelle
                </label>
                <select
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact d'urgence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relation
                </label>
                <select
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  <option value="parent">Parent</option>
                  <option value="conjoint">Conjoint(e)</option>
                  <option value="ami">Ami(e)</option>
                  <option value="collegue">Collègue</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tenant ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantForm;