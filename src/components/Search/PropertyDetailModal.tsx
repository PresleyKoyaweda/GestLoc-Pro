import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, Square, Calendar, Clock, User, Eye, Home } from 'lucide-react';
import { Property, Unit, VisitSlot, VisitRequest } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import VisitRequestForm from './VisitRequestForm';

interface PropertyDetailModalProps {
  property: Property;
  units: Unit[];
  onClose: () => void;
  onJoinProperty: (property: Property, unit?: Unit) => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  property, 
  units, 
  onClose, 
  onJoinProperty 
}) => {
  const { user } = useAuth();
  const [visitRequests, setVisitRequests] = useLocalStorage<VisitRequest[]>('gestionloc_visit_requests', []);
  const { addNotification } = useNotifications(property.ownerId);
  const [requests] = useLocalStorage('gestionloc_requests', []);
  const [tenants] = useLocalStorage('gestionloc_tenants', []);
  const [showVisitRequestForm, setShowVisitRequestForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const availableUnits = units.filter(unit => unit.status === 'available');

  const handleVisitRequest = (unit?: Unit) => {
    setSelectedUnit(unit || null);
    setShowVisitRequestForm(true);
  };

  const hasUserVisitRequest = (property: Property, unit?: Unit) => {
    return visitRequests.some(req => 
      req.tenantId === user?.id &&
      req.propertyId === property.id &&
      (unit ? req.unitId === unit.id : !req.unitId) &&
      (req.status === 'confirmed' || req.status === 'completed')
    );
  };

  const hasUserRequested = (property: Property, unit?: Unit) => {
    return requests.some(req => 
      req.tenantId === user?.id &&
      ((unit && req.unitId === unit.id) || (!unit && req.propertyId === property.id))
    );
  };

  const isUserTenant = (property: Property, unit?: Unit) => {
    return tenants.some(tenant => 
      tenant.userId === user?.id &&
      tenant.propertyId === property.id &&
      (unit ? tenant.unitId === unit.id : !tenant.unitId)
    );
  };

  const canJoinProperty = (property: Property, unit?: Unit) => {
    const visitConfirmed = hasUserVisitRequest(property, unit);
    const notAlreadyRequested = !hasUserRequested(property, unit);
    const notAlreadyTenant = !isUserTenant(property, unit);
    
    return visitConfirmed && notAlreadyRequested && notAlreadyTenant;
  };

  const getRequestStatus = (property: Property, unit?: Unit) => {
    const request = requests.find(req => 
      req.tenantId === user?.id &&
      ((unit && req.unitId === unit.id) || (!unit && req.propertyId === property.id))
    );
    return request?.status;
  };

  const isRequestAccepted = (property: Property, unit?: Unit) => {
    return getRequestStatus(property, unit) === 'acceptee';
  };

  const isRequestRejected = (property: Property, unit?: Unit) => {
    return getRequestStatus(property, unit) === 'rejetee';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">{property.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center text-gray-500 mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{property.address.street}, {property.address.city}</span>
          </div>
        </div>

        <div className="p-6">
          {/* Property Images */}
          <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <div className="text-8xl">
              {property.type === 'entire' ? '🏠' : '🛏️'}
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du logement</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">
                    {property.type === 'entire' ? 'Logement entier' : 'Colocation'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Superficie totale</span>
                  <span className="font-medium flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    {property.totalArea} m²
                  </span>
                </div>
                {property.type === 'entire' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pièces</span>
                      <span className="font-medium flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {property.totalRooms}½
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Salles de bain</span>
                      <span className="font-medium flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        {property.totalBathrooms}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Loyer mensuel</span>
                      <span className="text-xl font-bold text-green-600">
                        {property.rent}$/mois
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600">
                {property.description || 'Aucune description disponible.'}
              </p>
            </div>
          </div>

          {/* Equipment and Amenities */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Équipements et commodités</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Equipment */}
              {property.equipment && property.equipment.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Équipements du logement</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {property.equipment.map((item, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Common Areas for shared properties */}
              {property.type === 'shared' && property.commonAreas && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Espaces communs</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(property.commonAreas).map(([key, value]) => {
                      if (!value) return null;
                      const labels = {
                        kitchen: 'Cuisine',
                        fridge: 'Réfrigérateur',
                        microwave: 'Micro-ondes',
                        oven: 'Four',
                        dishwasher: 'Lave-vaisselle',
                        bathroom: 'Salle de bain',
                        laundry: 'Buanderie',
                        livingRoom: 'Salon',
                        wifi: 'WiFi',
                        parking: 'Parking',
                        balcony: 'Balcon',
                        garden: 'Jardin',
                        storage: 'Rangement'
                      };
                      return (
                        <div key={key} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Units for shared properties */}
          {property.type === 'shared' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chambres disponibles ({availableUnits.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableUnits.map((unit) => (
                  <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                      <span className="text-lg font-bold text-green-600">{unit.rent}$/mois</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Square className="w-4 h-4 mr-1" />
                      {unit.area} m²
                    </div>
                    <div className="flex space-x-2">
                      {isUserTenant(property, unit) ? (
                        <button 
                          disabled
                          className="flex-1 bg-green-400 text-white py-2 px-3 rounded-lg cursor-not-allowed text-sm"
                        >
                          Votre chambre
                        </button>
                      ) : isRequestAccepted(property, unit) ? (
                        <button 
                          disabled
                          className="flex-1 bg-green-400 text-white py-2 px-3 rounded-lg cursor-not-allowed text-sm"
                        >
                          Demande acceptée
                        </button>
                      ) : isRequestRejected(property, unit) ? (
                        <button 
                          disabled
                          className="flex-1 bg-red-400 text-white py-2 px-3 rounded-lg cursor-not-allowed text-sm"
                        >
                          Demande refusée
                        </button>
                      ) : hasUserRequested(property, unit) ? (
                        <button 
                          disabled
                          className="flex-1 bg-gray-400 text-white py-2 px-3 rounded-lg cursor-not-allowed text-sm"
                        >
                          Demande envoyée
                        </button>
                      ) : canJoinProperty(property, unit) ? (
                        <>
                          <button
                            onClick={() => handleVisitRequest(unit)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Programmer visite
                          </button>
                          <button
                            onClick={() => onJoinProperty(property, unit)}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Rejoindre
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleVisitRequest(unit)}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Programmer une visite
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions for entire property */}
          {property.type === 'entire' && (
            <div className="flex space-x-4">
              {isUserTenant(property) ? (
                <button
                  disabled
                  className="flex-1 bg-green-400 text-white py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Votre logement
                </button>
              ) : isRequestAccepted(property) ? (
                <button
                  disabled
                  className="flex-1 bg-green-400 text-white py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  Demande acceptée
                </button>
              ) : isRequestRejected(property) ? (
                <button
                  disabled
                  className="flex-1 bg-red-400 text-white py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  Demande refusée
                </button>
              ) : hasUserRequested(property) ? (
                <button
                  disabled
                  className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Demande envoyée
                </button>
              ) : canJoinProperty(property) ? (
                <>
                  <button
                    onClick={() => handleVisitRequest()}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Programmer une visite
                  </button>
                  <button
                    onClick={() => onJoinProperty(property)}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Rejoindre ce logement
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleVisitRequest()}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Programmer une visite
                </button>
              )}
            </div>
          )}
        </div>

        {/* Visit Request Form */}
        {showVisitRequestForm && (
          <VisitRequestForm
            property={property}
            unit={selectedUnit}
            onClose={() => {
              setShowVisitRequestForm(false);
              setSelectedUnit(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PropertyDetailModal;