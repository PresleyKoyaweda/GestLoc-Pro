import React, { useState } from 'react';
import { Calendar, Clock, Check, X, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { VisitRequest, Property, Unit } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useNotifications } from '../../hooks/useNotifications';

const VisitRequestsTab: React.FC = () => {
  const [visitRequests, setVisitRequests] = useLocalStorage<VisitRequest[]>('gestionloc_visit_requests', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const { addNotification } = useNotifications('1');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('pending');

  const pendingRequests = visitRequests.filter(req => req.status === 'pending');
  const filteredRequests = visitRequests.filter(req => filter === 'all' || req.status === filter);

  const getPropertyInfo = (request: VisitRequest) => {
    const property = properties.find(p => p.id === request.propertyId);
    const unit = request.unitId ? units.find(u => u.id === request.unitId) : null;
    return { property, unit };
  };

  const handleConfirmVisit = (request: VisitRequest) => {
    if (!confirm('Êtes-vous sûr de vouloir confirmer cette visite ?')) {
      return;
    }

    setVisitRequests(prev => prev.map(req => 
      req.id === request.id 
        ? { ...req, status: 'confirmed' }
        : req
    ));


    // Generate formal AI confirmation message
    const { property, unit } = getPropertyInfo(request);
    const formalMessage = `
Cher(e) ${request.tenantInfo.firstName} ${request.tenantInfo.lastName},

Nous avons le plaisir de vous confirmer votre demande de visite pour ${unit ? `la chambre ${unit.name}` : 'notre logement'} situé au ${property?.name}, ${property?.address.street}, ${property?.address.city}.

📅 Date et heure confirmées :
${formatDate(request.visitDate)} à ${request.visitTime}

📍 Adresse de la visite :
${property?.address.street}${property?.address.apartment ? `, ${property.address.apartment}` : ''}
${property?.address.city}, ${property?.address.province} ${property?.address.postalCode}

📋 Informations importantes :
• Veuillez arriver à l'heure convenue
• Munissez-vous d'une pièce d'identité
• N'hésitez pas à poser toutes vos questions
• Suite à cette visite, vous pourrez faire une demande de logement

En cas d'empêchement, merci de nous prévenir au plus tôt.

Nous nous réjouissons de vous rencontrer !

Cordialement,
L'équipe GestionLoc Pro
    `.trim();

    addNotification({
      userId: request.tenantId,
      type: 'general',
      title: '✅ Visite confirmée - Détails importants',
      message: formalMessage,
      read: false,
    });

    // console.log('🔔 Notification sent to tenant');
    alert('✅ Visite confirmée ! Un message de confirmation détaillé a été envoyé au locataire.');
  };

  const handleCancelVisit = (request: VisitRequest) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) {
      return;
    }

    setVisitRequests(prev => prev.map(req => 
      req.id === request.id 
        ? { ...req, status: 'cancelled' }
        : req
    ));

    // Notify tenant
    addNotification({
      userId: request.tenantId,
      type: 'general',
      title: 'Visite annulée',
      message: `Votre visite du ${new Date(request.visitDate).toLocaleDateString('fr-FR')} à ${request.visitTime} a été annulée.`,
      read: false,
    });

    alert('Visite annulée. Le locataire a été notifié.');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de visite</h1>
          <p className="text-gray-600">Gérez les demandes de visite de vos propriétés</p>
        </div>
        {pendingRequests.length > 0 && (
          <div className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <Calendar className="w-5 h-5 mr-2" />
            {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex space-x-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Toutes' :
               status === 'pending' ? 'En attente' :
               status === 'confirmed' ? 'Confirmées' : 'Annulées'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de visite</h3>
            <p className="text-gray-500">
              {filter === 'pending' ? 'Aucune demande en attente' : 'Aucune demande trouvée'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const { property, unit } = getPropertyInfo(request);
            
            return (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.tenantInfo.firstName} {request.tenantInfo.lastName}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? 'En attente' :
                         request.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {request.tenantInfo.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {request.tenantInfo.phone}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(request.visitDate)} à {request.visitTime}
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleConfirmVisit(request);
                        }}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirmer
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCancelVisit(request);
                        }}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Annuler
                      </button>
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {unit ? `Chambre ${unit.name}` : 'Logement entier'} - {property?.name}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {property?.address.street}, {property?.address.city}
                  </p>
                  {unit && (
                    <div className="flex items-center space-x-4 text-sm text-blue-700 mt-2">
                      <span>{unit.area} m²</span>
                      <span className="font-semibold">{unit.rent}$/mois</span>
                    </div>
                  )}
                </div>

                {/* Message */}
                {request.tenantInfo.message && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message du visiteur
                    </h4>
                    <p className="text-sm text-gray-700">{request.tenantInfo.message}</p>
                  </div>
                )}

                {/* Visit Details */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Détails de la visite</h4>
                      <p className="text-sm text-yellow-800">
                        {formatDate(request.visitDate)} à {request.visitTime}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Demande envoyée le {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VisitRequestsTab;