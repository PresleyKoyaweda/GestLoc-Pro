import React, { useState } from 'react';
import { Search, MapPin, Filter, Calendar, Bed, Bath, Users, Home, Eye, Clock } from 'lucide-react';
import { Property, Unit, PropertyRequest } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import PropertyRequestForm from './PropertyRequestForm';
import PropertyDetailModal from './PropertyDetailModal';
import VisitRequestForm from './VisitRequestForm';
import GoogleMap from './GoogleMap';
import { useNotifications } from '../../hooks/useNotifications';

const PropertySearch: React.FC = () => {
  const { user } = useAuth();
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [requests] = useLocalStorage<PropertyRequest[]>('gestionloc_requests', []);
  const [visitRequests] = useLocalStorage('gestionloc_visit_requests', []);
  const [tenants] = useLocalStorage('gestionloc_tenants', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    type: 'all',
    minArea: '',
  });

  const availableProperties = properties.filter(property => {
    if (property.type === 'entire') {
      return property.status === 'libre';
    }
    // For shared properties, check if any units are available
    const propertyUnits = units.filter(unit => unit.propertyId === property.id);
    return propertyUnits.some(unit => unit.status === 'available');
  });

  const filteredProperties = availableProperties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filters.type !== 'all' && property.type !== filters.type) return false;
    if (filters.minArea && property.totalArea < Number(filters.minArea)) return false;

    // Price filtering
    if (property.type === 'entire') {
      const rent = property.rent || 0;
      if (filters.minPrice && rent < Number(filters.minPrice)) return false;
      if (filters.maxPrice && rent > Number(filters.maxPrice)) return false;
    } else {
      const propertyUnits = units.filter(unit => unit.propertyId === property.id && unit.status === 'available');
      if (propertyUnits.length === 0) return false;
      
      const minRent = Math.min(...propertyUnits.map(unit => unit.rent));
      const maxRent = Math.max(...propertyUnits.map(unit => unit.rent));
      
      if (filters.minPrice && maxRent < Number(filters.minPrice)) return false;
      if (filters.maxPrice && minRent > Number(filters.maxPrice)) return false;
    }

    return true;
  });

  const handleJoinProperty = (property: Property, unit?: Unit) => {
    setSelectedProperty(property);
    setSelectedUnit(unit || null);
    setShowRequestForm(true);
  };

  const handleVisitRequest = (property: Property, unit?: Unit) => {
    setSelectedProperty(property);
    setSelectedUnit(unit || null);
    setShowVisitForm(true);
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  const getPropertyStatus = (property: Property) => {
    if (property.type === 'entire') {
      return property.status;
    }
    const propertyUnits = units.filter(unit => unit.propertyId === property.id);
    const availableUnits = propertyUnits.filter(unit => unit.status === 'available');
    const pendingUnits = propertyUnits.filter(unit => unit.status === 'occupied');
    
    if (availableUnits.length === 0) return 'occupe';
    if (pendingUnits.length > 0) return 'en_attente_validation';
    return 'libre';
  };

  const hasUserRequested = (property: Property, unit?: Unit) => {
    return requests.some(req => 
      req.tenantId === user?.id &&
      req.status === 'en_attente' &&
      ((unit && req.unitId === unit.id) || (!unit && req.propertyId === property.id))
    );
  };

  const hasUserVisitRequest = (property: Property, unit?: Unit) => {
    return visitRequests.some(req => 
      req.tenantId === user?.id &&
      req.propertyId === property.id &&
      (unit ? req.unitId === unit.id : !req.unitId) &&
      (req.status === 'confirmed' || req.status === 'completed')
    );
  };

  const isUserTenant = (property: Property, unit?: Unit) => {
    return tenants.some(tenant => 
      tenant.userId === user?.id &&
      tenant.propertyId === property.id &&
      (unit ? tenant.unitId === unit.id : !tenant.unitId)
    );
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

  const canJoinProperty = (property: Property, unit?: Unit) => {
    const visitConfirmed = hasUserVisitRequest(property, unit);
    const notAlreadyRequested = !hasUserRequested(property, unit);
    const notAlreadyTenant = !isUserTenant(property, unit);
    const notAcceptedOrRejected = !isRequestAccepted(property, unit) && !isRequestRejected(property, unit);
    
    return visitConfirmed && notAlreadyRequested && notAlreadyTenant && notAcceptedOrRejected;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recherche de logement</h1>
        <p className="text-gray-600">Trouvez votre prochain logement</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom ou adresse..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="entire">Logement entier</option>
              <option value="shared">Colocation</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex space-x-2">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              placeholder="Prix min"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              placeholder="Prix max"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.length === 0 ? (
          <div className="lg:col-span-3 text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun logement trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          filteredProperties.map((property) => {
            const propertyUnits = units.filter(unit => unit.propertyId === property.id && unit.status === 'available');
            const allPropertyUnits = units.filter(unit => unit.propertyId === property.id);
            const propertyStatus = getPropertyStatus(property);
            
            return (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-6xl">
                    {property.type === 'entire' ? '🏠' : '🛏️'}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {property.address?.street}, {property.address?.city}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-medium">
                        {property.type === 'entire' ? 'Logement entier' : 'Colocation'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Superficie</span>
                      <span className="text-sm font-medium">{property.totalArea} m²</span>
                    </div>

                    {property.type === 'entire' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pièces</span>
                          <span className="text-sm font-medium">{property.totalRooms}½</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Loyer</span>
                          <span className="text-lg font-bold text-green-600">{property.rent}$/mois</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Statut</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            property.status === 'libre' ? 'bg-green-100 text-green-800' :
                            property.status === 'en_attente_validation' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {property.status === 'libre' ? 'Libre' :
                             property.status === 'en_attente_validation' ? 'En attente' : 'Occupé'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total chambres</span>
                          <span className="text-sm font-medium">{allPropertyUnits.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Libres</span>
                          <span className="text-sm font-medium">{propertyUnits.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">À partir de</span>
                          <span className="text-lg font-bold text-green-600">
                            {Math.min(...propertyUnits.map(unit => unit.rent))}$/mois
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {property.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="flex space-x-3">
                    {property.type === 'entire' ? (
                      // Logement entier
                      <div className="flex-1 space-y-2">
                        <button
                          onClick={() => handleViewDetails(property)}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </button>
                        <button
                          onClick={() => handleVisitRequest(property)}
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Programmer visite
                        </button>
                        
                        {isUserTenant(property) ? (
                          <button 
                            disabled
                            className="w-full bg-green-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Votre logement
                          </button>
                        ) : isRequestAccepted(property) ? (
                          <button 
                            disabled
                            className="w-full bg-green-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            Demande acceptée
                          </button>
                        ) : isRequestRejected(property) ? (
                          <button 
                            disabled
                            className="w-full bg-red-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            Demande refusée
                          </button>
                        ) : hasUserRequested(property) ? (
                          <button 
                            disabled
                            className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Demande envoyée
                          </button>
                        ) : canJoinProperty(property) ? (
                          <button 
                            onClick={() => handleJoinProperty(property)}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Rejoindre
                          </button>
                        ) : property.status === 'libre' ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800 text-center">
                              Programmez d'abord une visite pour pouvoir rejoindre ce logement
                            </p>
                          </div>
                        ) : (
                          <button 
                            disabled
                            className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            {property.status === 'en_attente_validation' ? 'En attente' : 'Occupé'}
                          </button>
                        )}
                      </div>
                    ) : (
                      // Colocation - afficher les chambres disponibles
                      <div className="flex-1 space-y-2">
                        <button
                          onClick={() => handleViewDetails(property)}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </button>
                        <button
                          onClick={() => handleVisitRequest(property)}
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Programmer visite
                        </button>
                        {propertyUnits.length > 0 ? (
                          propertyUnits.slice(0, 2).map((unit) => {
                            const userTenant = isUserTenant(property, unit);
                            const requestStatus = getRequestStatus(property, unit);
                            const canJoin = canJoinProperty(property, unit);
                            const hasRequested = hasUserRequested(property, unit);
                            const isAccepted = isRequestAccepted(property, unit);
                            const isRejected = isRequestRejected(property, unit);
                            
                            return (
                              <div key={unit.id} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{unit.name} - {unit.rent}$</span>
                                {userTenant ? (
                                  <button 
                                    disabled
                                    className="px-3 py-1 bg-green-400 text-white text-xs rounded cursor-not-allowed"
                                  >
                                    Votre chambre
                                  </button>
                                ) : isAccepted ? (
                                  <button 
                                    disabled
                                    className="px-3 py-1 bg-green-400 text-white text-xs rounded cursor-not-allowed"
                                  >
                                    Accepté
                                  </button>
                                ) : isRejected ? (
                                  <button 
                                    disabled
                                    className="px-3 py-1 bg-red-400 text-white text-xs rounded cursor-not-allowed"
                                  >
                                    Refusé
                                  </button>
                                ) : hasRequested ? (
                                  <button 
                                    disabled
                                    className="px-3 py-1 bg-gray-400 text-white text-xs rounded cursor-not-allowed"
                                  >
                                    Demandé
                                  </button>
                                ) : canJoin ? (
                                  <button 
                                    onClick={() => handleJoinProperty(property, unit)}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Rejoindre
                                  </button>
                                ) : (
                                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Visite requise
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-sm text-gray-500">Aucune chambre libre</span>
                        )}
                        {propertyUnits.length > 2 && (
                          <p className="text-xs text-gray-500">+{propertyUnits.length - 2} autres chambres</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showDetailModal && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          units={units.filter(u => u.propertyId === selectedProperty.id)}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProperty(null);
          }}
          onJoinProperty={handleJoinProperty}
        />
      )}

      {showVisitForm && selectedProperty && (
        <VisitRequestForm
          property={selectedProperty}
          unit={selectedUnit}
          onClose={() => {
            setShowVisitForm(false);
            setSelectedProperty(null);
            setSelectedUnit(null);
          }}
        />
      )}

      {/* Map placeholder */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Carte interactive</h3>
        <GoogleMap 
          properties={filteredProperties}
          height="400px"
        />
      </div>

      {showRequestForm && selectedProperty && (
        <PropertyRequestForm
          property={selectedProperty}
          unit={selectedUnit}
          onClose={() => {
            setShowRequestForm(false);
            setSelectedProperty(null);
            setSelectedUnit(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertySearch;