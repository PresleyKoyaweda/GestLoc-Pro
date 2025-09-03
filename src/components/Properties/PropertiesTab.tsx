import React, { useState } from 'react';
import { Plus, Building2, Users, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Property, Unit, Tenant } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useTranslation } from '../../hooks/useTranslation';
import PropertyForm from './PropertyForm';

interface PropertiesTabProps {
  onTabChange: (tab: string) => void;
}

const PropertiesTab: React.FC<PropertiesTabProps> = ({ onTabChange }) => {
  const { t, formatCurrency } = useTranslation();
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const { canAddProperty, currentPlan } = useSubscription();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDelete = (propertyId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    }
  };

  const getPropertyUnits = (propertyId: string) => {
    return units.filter(unit => unit.propertyId === propertyId);
  };

  const getPropertyTenants = (propertyId: string) => {
    return tenants.filter(tenant => tenant.propertyId === propertyId);
  };

  const getOccupancyStats = (property: Property) => {
    if (property.type === 'entire') {
      // For entire properties, check if there's a tenant
      const propertyTenants = getPropertyTenants(property.id);
      return {
        total: 1,
        occupied: propertyTenants.length > 0 ? 1 : 0,
        available: propertyTenants.length > 0 ? 0 : 1,
        pending: 0 // Could be enhanced to track pending applications
      };
    } else {
      // For shared properties, check each unit
      const propertyUnits = getPropertyUnits(property.id);
      const propertyTenants = getPropertyTenants(property.id);
      
      // Count occupied units based on tenants assigned to units
      const occupied = propertyTenants.length;
      const available = propertyUnits.length - occupied;
      const pending = 0; // Could be enhanced to track pending applications
      
      return {
        total: propertyUnits.length,
        occupied,
        available,
        pending
      };
    }
  };

  const handleAddProperty = () => {
    if (!canAddProperty(properties.length)) {
      alert(`Vous avez atteint la limite de ${currentPlan.features.maxProperties} propriété${currentPlan.features.maxProperties > 1 ? 's' : ''} pour votre plan ${currentPlan.name}. Veuillez mettre à niveau votre abonnement.`);
      return;
    }
    setEditingProperty(undefined);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propriétés</h1>
          <p className="text-gray-600">Gérez votre portefeuille immobilier</p>
        </div>
        <button
          onClick={handleAddProperty}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter une propriété
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune propriété</h3>
          <p className="text-gray-500 mb-4">Commencez par ajouter votre première propriété</p>
          <button
            onClick={handleAddProperty}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une propriété
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => {
            const propertyUnits = getPropertyUnits(property.id);
            const propertyTenants = getPropertyTenants(property.id);
            const occupancyStats = getOccupancyStats(property);
            const occupancyRate = occupancyStats.total > 0 ? (occupancyStats.occupied / occupancyStats.total) * 100 : 0;
            const totalRent = property.type === 'entire' 
              ? property.rent || 0
              : propertyUnits.reduce((sum, unit) => sum + unit.rent, 0);

            return (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-blue-500" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-500">
                        {property.address?.street}
                        {property.address?.apartment && `, ${property.address.apartment}`}
                        <br />
                        {property.address?.city}, {property.address?.province} {property.address?.postalCode}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-medium">
                        {property.type === 'entire' ? '🏠 Logement entier' : '🛏️ Colocation'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {property.type === 'entire' ? 'Statut' : 'Chambres'}
                      </span>
                      <span className="text-sm font-medium">
                        {property.type === 'entire' ? 
                          (occupancyStats.occupied > 0 ? 'Occupé' : 'Libre') : 
                          `${occupancyStats.total} chambre${occupancyStats.total > 1 ? 's' : ''}`
                        }
                      </span>
                    </div>

                    {property.type === 'shared' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Occupées</span>
                        <span className="text-sm font-medium text-red-600">{occupancyStats.occupied}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {property.type === 'entire' ? 'Disponible' : 'Libres'}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {property.type === 'entire' ? 
                          (occupancyStats.available > 0 ? 'Oui' : 'Non') : 
                          occupancyStats.available
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Superficie</span>
                      <span className="text-sm font-medium">{property.totalArea} m²</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Loyer total</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(totalRent)}/mois</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Locataires</span>
                      <button
                        onClick={() => onTabChange && onTabChange('tenants')}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {propertyTenants.length} locataire{propertyTenants.length !== 1 ? 's' : ''}
                      </button>
                    </div>

                    {/* Détail des chambres pour les colocations */}
                    {property.type === 'shared' && propertyUnits.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">Détail des chambres</h4>
                        {propertyUnits.map((unit) => {
                          const unitTenant = propertyTenants.find(t => t.unitId === unit.id);
                          const isOccupied = !!unitTenant;
                          return (
                            <div key={unit.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{unit.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{unit.rent}$</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isOccupied ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {isOccupied ? 'Occupée' : 'Libre'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <hr className="border-gray-200" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Occupation</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              occupancyRate === 100 ? 'bg-red-500' : 
                              occupancyRate >= 75 ? 'bg-orange-500' : 
                              occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${
                          occupancyRate === 100 ? 'text-red-600' : 
                          occupancyRate >= 75 ? 'text-orange-600' : 
                          occupancyRate >= 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.status === 'libre' ? 'bg-green-100 text-green-800' :
                        property.status === 'en_attente_validation' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {property.status === 'libre' ? 'Libre' :
                         property.status === 'en_attente_validation' ? 'En attente' : 'Occupé'}
                      </span>
                      
                      {property.status === 'en_attente_validation' && (
                        <button
                          onClick={() => onTabChange && onTabChange('property-requests')}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                        >
                          Voir demandes →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <PropertyForm
          property={editingProperty}
          onClose={() => {
            setShowForm(false);
            setEditingProperty(undefined);
          }}
        />
      )}
    </div>
  );
};

export default PropertiesTab;