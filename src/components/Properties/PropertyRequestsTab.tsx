import React, { useState } from 'react';
import { Check, X, User, Mail, Phone, FileText, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { PropertyRequest, Property, Unit, Tenant } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useNotifications } from '../../hooks/useNotifications';
import { useTenantHistory } from '../../hooks/useTenantHistory';

const PropertyRequestsTab: React.FC = () => {
  const [requests, setRequests] = useLocalStorage<PropertyRequest[]>('gestionloc_requests', []);
  const [properties, setProperties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units, setUnits] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const { addNotification } = useNotifications('1');
  const { addHistoryEntry } = useTenantHistory();
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'acceptee' | 'rejetee'>('en_attente');

  const pendingRequests = requests.filter(req => req.status === 'en_attente');
  const filteredRequests = requests.filter(req => filter === 'all' || req.status === filter);

  const getPropertyInfo = (request: PropertyRequest) => {
    const property = properties.find(p => p.id === request.propertyId);
    const unit = request.unitId ? units.find(u => u.id === request.unitId) : null;
    return { property, unit };
  };

  const handleAcceptRequest = (request: PropertyRequest) => {
    const { property, unit } = getPropertyInfo(request);
    if (!property) return;

    if (!confirm('Êtes-vous sûr de vouloir accepter cette demande de logement ?')) {
      return;
    }


    // Update request status
    setRequests(prev => prev.map(req => 
      req.id === request.id 
        ? { ...req, status: 'acceptee' as const, responseDate: new Date() }
        : req
    ));


    // Create tenant
    const newTenant: Tenant = {
      id: Date.now().toString(),
      userId: request.tenantId,
      propertyId: property.id,
      unitId: unit?.id,
      leaseStart: new Date(),
      leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year lease
      monthlyRent: unit?.rent || property.rent || 0,
      depositPaid: 0,
      paymentDueDate: 1,
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    };

    // Add tenant
    setTenants(prev => [...prev, newTenant]);

    // Update property/unit status to occupied
    if (unit) {
      setUnits(prev => prev.map(u => 
        u.id === unit.id 
          ? { ...u, status: 'occupied' as const }
          : u
      ));
    } else {
      setProperties(prev => prev.map(p => 
        p.id === property.id 
          ? { ...p, status: 'occupe' as const }
          : p
      ));
    }

    // Generate formal AI acceptance message
    const welcomeMessage = `
Cher(e) ${request.tenantInfo.firstName} ${request.tenantInfo.lastName},

🎉 Félicitations ! Nous avons le grand plaisir de vous informer que votre demande de logement a été ACCEPTÉE.

🏠 Votre nouveau logement :
${unit ? `Chambre ${unit.name}` : 'Logement entier'} - ${property.name}
📍 ${property.address.street}, ${property.address.city}
💰 Loyer mensuel : ${newTenant.monthlyRent}$ CAD
📅 Début du bail : ${newTenant.leaseStart.toLocaleDateString('fr-FR')}
📅 Fin du bail : ${newTenant.leaseEnd.toLocaleDateString('fr-FR')}

📋 Prochaines étapes :
1. ✅ Votre espace locataire est maintenant activé
2. 📄 Vous pouvez accéder à "Mon logement" dans votre tableau de bord
3. 💳 Les paiements mensuels seront générés automatiquement
4. 🔧 Vous pouvez signaler des problèmes directement via l'application
5. 📞 Contactez-nous pour toute question

📞 Informations de contact :
• Application : Section "Mon logement"
• Support : Via l'onglet "Mes signalements"

Nous vous souhaitons la bienvenue dans votre nouveau logement et espérons que vous vous y plairez !

Cordialement,
L'équipe GestionLoc Pro
    `.trim();

    addNotification({
      userId: request.tenantId,
      type: 'general',
      title: '🎉 DEMANDE ACCEPTÉE - Bienvenue chez vous !',
      message: welcomeMessage,
      read: false,
    });

    // Add to tenant history
    addHistoryEntry({
      type: 'lease_signed',
      title: `Bail signé - ${property.name}`,
      description: `Votre demande pour ${unit ? `la chambre ${unit.name}` : 'le logement entier'} a été acceptée et un bail a été créé`,
      propertyId: property.id,
      unitId: unit?.id,
      relatedId: newTenant.id,
      metadata: {
        status: 'accepted',
        monthlyRent: newTenant.monthlyRent,
        leaseStart: newTenant.leaseStart.toISOString(),
        leaseEnd: newTenant.leaseEnd.toISOString()
      }
    });
    
    // Add move-in history entry
    addHistoryEntry({
      type: 'move_in',
      title: `Emménagement - ${property.name}`,
      description: `Emménagement dans ${unit ? `la chambre ${unit.name}` : 'le logement entier'}`,
      propertyId: property.id,
      unitId: unit?.id,
      relatedId: newTenant.id,
      metadata: {
        moveInDate: newTenant.leaseStart.toISOString(),
        monthlyRent: newTenant.monthlyRent
      }
    });
    console.log('🔔 Notification sent to tenant');
    alert('🎉 Demande acceptée ! Un message de bienvenue détaillé a été envoyé au locataire.');
  };

  const handleRejectRequest = (request: PropertyRequest) => {
    const { property, unit } = getPropertyInfo(request);
    if (!property) return;

    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande de logement ?')) {
      return;
    }


    // Update request status
    setRequests(prev => prev.map(req => 
      req.id === request.id 
        ? { ...req, status: 'rejetee' as const, responseDate: new Date() }
        : req
    ));


    // Update property/unit status back to available
    if (unit) {
      setUnits(prev => prev.map(u => 
        u.id === unit.id 
          ? { ...u, status: 'available' as const }
          : u
      ));
    } else {
      setProperties(prev => prev.map(p => 
        p.id === property.id 
          ? { ...p, status: 'libre' as const }
          : p
      ));
    }

    // Generate formal AI rejection message
    const rejectionMessage = `
Cher(e) ${request.tenantInfo.firstName} ${request.tenantInfo.lastName},

Nous vous remercions de l'intérêt que vous avez porté à ${unit ? `la chambre ${unit.name}` : 'notre logement'} situé au ${property.name}.

Après examen attentif de votre dossier, nous regrettons de vous informer que nous ne pouvons pas donner suite favorable à votre demande pour ce logement spécifique.

Cette décision peut être due à :
• Un grand nombre de candidatures reçues
• Des critères spécifiques pour ce logement
• Une sélection basée sur l'ordre d'arrivée des dossiers complets

🔍 Nous vous encourageons vivement à :
• Consulter nos autres logements disponibles
• Programmer de nouvelles visites
• Soumettre de nouvelles demandes

Votre profil reste actif dans notre système et vous pouvez continuer à rechercher d'autres opportunités via l'application GestionLoc Pro.

Nous vous souhaitons bonne chance dans vos recherches et espérons pouvoir vous accompagner prochainement.

Cordialement,
L'équipe GestionLoc Pro
    `.trim();

    addNotification({
      userId: request.tenantId,
      type: 'general',
      title: '📋 Réponse à votre demande de logement',
      message: rejectionMessage,
      read: false,
    });

    // Add to tenant history
    addHistoryEntry({
      type: 'property_request',
      title: `Demande refusée - ${property.name}`,
      description: `Votre demande pour ${unit ? `la chambre ${unit.name}` : 'le logement entier'} a été refusée`,
      propertyId: property.id,
      unitId: unit?.id,
      relatedId: request.id,
      metadata: {
        status: 'rejected'
      }
    });
    console.log('🔔 Notification sent to tenant');
    alert('📋 Demande refusée. Un message professionnel a été envoyé au locataire.');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de logement</h1>
          <p className="text-gray-600">Gérez les demandes de vos locataires potentiels</p>
        </div>
        {pendingRequests.length > 0 && (
          <div className="flex items-center px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex space-x-2">
          {(['all', 'en_attente', 'acceptee', 'rejetee'] as const).map((status) => (
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
               status === 'en_attente' ? 'En attente' :
               status === 'acceptee' ? 'Acceptées' : 'Refusées'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
            <p className="text-gray-500">
              {filter === 'en_attente' ? 'Aucune demande en attente' : 'Aucune demande trouvée'}
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
                        request.status === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                        request.status === 'acceptee' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'en_attente' ? 'En attente' :
                         request.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
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
                        Demande envoyée le {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'en_attente' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🟢 Accept button clicked for request:', request.id);
                          handleAcceptRequest(request);
                        }}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accepter
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔴 Reject button clicked for request:', request.id);
                          handleRejectRequest(request);
                        }}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Refuser
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
                      Message du candidat
                    </h4>
                    <p className="text-sm text-gray-700">{request.tenantInfo.message}</p>
                  </div>
                )}

                {/* ID Document */}
                {request.tenantInfo.idDocument && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <button 
                      onClick={() => window.open(request.tenantInfo.idDocument, '_blank')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Voir la pièce d'identité
                    </button>
                  </div>
                )}

                {/* Response Date */}
                {request.responseDate && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Réponse envoyée le {new Date(request.responseDate).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PropertyRequestsTab;