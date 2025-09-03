import React from 'react';
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, Calendar, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from '../../hooks/useTranslation';
import { useProfitCalculation } from '../../hooks/useProfitCalculation';
import { Property, Tenant, Payment, Issue, Unit, PropertyRequest } from '../../types';

interface OwnerDashboardProps {
  onTabChange: (tab: string) => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onTabChange }) => {
  const { t, formatCurrency } = useTranslation();
  const { currentAnalysis, isCalculating } = useProfitCalculation();
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [payments] = useLocalStorage<Payment[]>('gestionloc_payments', []);
  const [issues] = useLocalStorage<Issue[]>('gestionloc_issues', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [requests] = useLocalStorage<PropertyRequest[]>('gestionloc_requests', []);

  // Calculs pour le mois en cours
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Paiements du mois en cours
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.dueDate);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });
  
  // Revenus potentiels du mois (tous les loyers dus)
  const potentialMonthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Revenus réellement perçus ce mois
  const actualMonthlyRevenue = currentMonthPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Taux de complétude des paiements
  const paymentCompletionRate = currentMonthPayments.length > 0 
    ? (currentMonthPayments.filter(p => p.status === 'paid').length / currentMonthPayments.length) * 100 
    : 0;
  
  // Revenus en attente
  const pendingRevenue = currentMonthPayments
    .filter(p => p.status === 'pending' || p.status === 'late' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Revenus par propriété
  const revenueByProperty = properties.map(property => {
    const propertyTenants = tenants.filter(t => t.propertyId === property.id);
    const propertyPayments = currentMonthPayments.filter(p => 
      propertyTenants.some(t => t.id === p.tenantId)
    );
    const totalRevenue = propertyPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidRevenue = propertyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const completionRate = propertyPayments.length > 0 
      ? (propertyPayments.filter(p => p.status === 'paid').length / propertyPayments.length) * 100 
      : 0;
    
    return {
      property,
      totalRevenue,
      paidRevenue,
      completionRate,
      tenantsCount: propertyTenants.length
    };
  });

  const stats = {
    totalProperties: properties.length,
    actualRevenue: actualMonthlyRevenue,
    potentialRevenue: potentialMonthlyRevenue,
    paymentCompletionRate,
    pendingIssues: issues.filter(issue => issue.status === 'pending').length,
  };

  // Calculate total units across all properties
  const totalUnits = properties.reduce((sum, property) => {
    if (property.type === 'entire') {
      return sum + 1;
    } else {
      const propertyUnits = units.filter(unit => unit.propertyId === property.id);
      return sum + propertyUnits.length;
    }
  }, 0);

  // Calculate occupied units based on tenants
  const occupiedUnits = properties.reduce((sum, property) => {
    if (property.type === 'entire') {
      // For entire properties, check if there are tenants
      const propertyTenants = tenants.filter(tenant => tenant.propertyId === property.id);
      return sum + (propertyTenants.length > 0 ? 1 : 0);
    } else {
      // For shared properties, count tenants assigned to this property
      const propertyTenants = tenants.filter(tenant => tenant.propertyId === property.id);
      return sum + propertyTenants.length;
    }
  }, 0);

  // Calculate available units
  const availableUnits = totalUnits - occupiedUnits;

  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const recentPayments = payments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const urgentIssues = issues.filter(issue => issue.priority === 'urgent' && issue.status !== 'resolved');
  const latePayments = payments.filter(p => p.status === 'late' || p.status === 'overdue');
  const pendingRequests = requests.filter(r => r.status === 'en_attente');
  
  // Nouveaux indicateurs
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const openIssues = issues.filter(i => i.status !== 'resolved');
  const overduePayments = payments.filter(p => p.status === 'overdue');
  const leaseExpiringSoon = tenants.filter(t => {
    const endDate = new Date(t.leaseEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0;
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre portefeuille immobilier</p>
      </div>

      {/* Urgent Alerts */}
      {(urgentIssues.length > 0 || latePayments.length > 0 || pendingRequests.length > 0) && (
        <div className="mb-8 space-y-4">
          {pendingRequests.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      {pendingRequests.length} nouvelle{pendingRequests.length > 1 ? 's' : ''} demande{pendingRequests.length > 1 ? 's' : ''} de logement
                    </h3>
                    <p className="text-sm text-blue-700">Des candidats souhaitent rejoindre vos propriétés</p>
                  </div>
                </div>
                <button
                  onClick={() => onTabChange('property-requests')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Voir les demandes →
                </button>
              </div>
            </div>
          )}
          
          {urgentIssues.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      {urgentIssues.length} problème{urgentIssues.length > 1 ? 's' : ''} urgent{urgentIssues.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-red-700">Nécessite une attention immédiate</p>
                  </div>
                </div>
                <button
                  onClick={() => onTabChange('issues')}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Voir les problèmes →
                </button>
              </div>
            </div>
          )}
          
          {latePayments.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-orange-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">
                      {latePayments.length} paiement{latePayments.length > 1 ? 's' : ''} en retard
                    </h3>
                    <p className="text-sm text-orange-700">Relances nécessaires</p>
                  </div>
                </div>
                <button
                  onClick={() => onTabChange('payments')}
                  className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                >
                  Voir les paiements →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('properties')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propriétés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('tenants')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unités occupées</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedUnits}/{totalUnits}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus perçus ce mois</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.actualRevenue)}</p>
              <p className="text-xs text-gray-500">sur {formatCurrency(stats.potentialRevenue)} attendus</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('reports')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de paiement</p>
              <p className="text-2xl font-bold text-blue-600">{stats.paymentCompletionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{currentMonthPayments.filter(p => p.status === 'paid').length}/{currentMonthPayments.length} paiements</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paiements en attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paiements en retard</p>
              <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('issues')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Problèmes ouverts</p>
              <p className="text-2xl font-bold text-orange-600">{openIssues.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('tenants')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Baux expirant</p>
              <p className="text-2xl font-bold text-purple-600">{leaseExpiringSoon.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Troisième rangée d'indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('properties')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unités disponibles</p>
              <p className="text-2xl font-bold text-green-600">{availableUnits}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('payments')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus en attente</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingRevenue)}</p>
              <p className="text-xs text-gray-500">à percevoir ce mois</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('reports')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
              <p className="text-2xl font-bold text-purple-600">{occupancyRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{occupiedUnits}/{totalUnits} unités</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('property-requests')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Demandes en attente</p>
              <p className="text-2xl font-bold text-indigo-600">{pendingRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Détail des revenus par propriété */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse financière détaillée - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          {isCalculating && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">Calcul en cours...</span>
            </div>
          )}
        </div>
        
        {/* Résumé du portefeuille */}
        {currentAnalysis && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">📊 Résumé du portefeuille</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(currentAnalysis.totalRevenues)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Dépenses totales</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(currentAnalysis.totalExpenses)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Bénéfice net</p>
                <p className={`text-xl font-bold ${currentAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentAnalysis.netProfit)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Marge moyenne</p>
                <p className={`text-xl font-bold ${currentAnalysis.averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentAnalysis.averageMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentAnalysis ? currentAnalysis.properties.map((analysis) => {
            const property = properties.find(p => p.id === analysis.propertyId);
            if (!property) return null;
            
            return (
            <div key={analysis.propertyId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 truncate">{analysis.propertyName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analysis.netProfit.margin >= 15 ? 'bg-green-100 text-green-800' :
                  analysis.netProfit.margin >= 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analysis.netProfit.margin.toFixed(1)}% marge
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                {/* Revenus */}
                <div className="bg-green-50 rounded-lg p-3">
                  <h5 className="font-medium text-green-900 mb-2">💰 Revenus</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-700">Loyers perçus</span>
                      <span className="font-semibold text-green-800">{formatCurrency(analysis.revenues.paidRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Taux d'occupation</span>
                      <span className="font-medium text-green-700">{analysis.revenues.occupancyRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Dépenses */}
                <div className="bg-red-50 rounded-lg p-3">
                  <h5 className="font-medium text-red-900 mb-2">💸 Dépenses</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-red-700">Hypothèque</span>
                      <span className="font-semibold text-red-800">{formatCurrency(analysis.expenses.mortgage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Charges fixes</span>
                      <span className="font-semibold text-red-800">{formatCurrency(analysis.expenses.fixedCharges)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Maintenance</span>
                      <span className="font-semibold text-red-800">{formatCurrency(analysis.expenses.maintenance)}</span>
                    </div>
                    <div className="flex justify-between border-t border-red-200 pt-1">
                      <span className="text-red-800 font-medium">Total</span>
                      <span className="font-bold text-red-900">{formatCurrency(analysis.expenses.total)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Bénéfice net */}
                <div className={`rounded-lg p-3 ${
                  analysis.netProfit.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  <h5 className={`font-medium mb-2 ${
                    analysis.netProfit.net >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    📈 Bénéfice net
                  </h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={analysis.netProfit.net >= 0 ? 'text-blue-700' : 'text-orange-700'}>
                        Cash-flow mensuel
                      </span>
                      <span className={`font-bold text-lg ${
                        analysis.netProfit.net >= 0 ? 'text-blue-800' : 'text-orange-800'
                      }`}>
                        {formatCurrency(analysis.cashFlow)}
                      </span>
                    </div>
                    {analysis.roi.monthly > 0 && (
                      <div className="flex justify-between">
                        <span className={analysis.netProfit.net >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                          ROI mensuel
                        </span>
                        <span className={`font-medium ${
                          analysis.netProfit.net >= 0 ? 'text-blue-700' : 'text-orange-700'
                        }`}>
                          {analysis.roi.monthly.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Indicateur de performance */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Performance</span>
                  <span>
                    {analysis.netProfit.margin >= 15 ? '🟢 Excellente' :
                     analysis.netProfit.margin >= 5 ? '🟡 Correcte' : '🔴 À améliorer'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      analysis.netProfit.margin >= 15 ? 'bg-green-500' :
                      analysis.netProfit.margin >= 5 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(analysis.netProfit.margin, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
            );
          }) : revenueByProperty.map(({ property, totalRevenue, paidRevenue, completionRate, tenantsCount }) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 truncate">{property.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  completionRate === 100 ? 'bg-green-100 text-green-800' :
                  completionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {completionRate.toFixed(0)}%
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenus perçus</span>
                  <span className="font-semibold text-green-600">{formatCurrency(paidRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenus attendus</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locataires</span>
                  <span className="font-medium">{tenantsCount}</span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progression</span>
                  <span>{formatCurrency(paidRevenue)} / {formatCurrency(totalRevenue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      completionRate === 100 ? 'bg-green-500' :
                      completionRate >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(completionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Assistant Summary */}
        <div 
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange('ai-agents')}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Assistant IA - Analyse financière</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bénéfice net total</span>
              <span className={`font-semibold ${
                currentAnalysis && currentAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentAnalysis ? formatCurrency(currentAnalysis.netProfit) : formatCurrency(actualMonthlyRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Marge moyenne</span>
              <span className="font-semibold text-blue-600">
                {currentAnalysis ? `${currentAnalysis.averageMargin.toFixed(1)}%` : `${paymentCompletionRate.toFixed(1)}%`}
                {currentAnalysis ? `${currentAnalysis.averageMargin.toFixed(1)}%` : `${stats.paymentCompletionRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cash-flow total</span>
              <span className="font-semibold text-purple-600">
                {currentAnalysis ? formatCurrency(currentAnalysis.totalCashFlow) : formatCurrency(pendingRevenue)}
              </span>
            </div>
          </div>
          <button className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Voir analyses détaillées
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
          <div className="space-y-4">
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              recentPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => onTabChange('payments')}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      payment.status === 'paid' ? 'bg-green-500' :
                      payment.status === 'late' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">Paiement {formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payment.status === 'late' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status === 'paid' ? 'Payé' :
                     payment.status === 'late' ? 'En retard' : 'En attente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onTabChange('properties')}
            className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-6 h-6 mb-2" />
            <span className="font-medium">Ajouter une propriété</span>
          </button>
          <button 
            onClick={() => onTabChange('tenants')}
            className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Users className="w-6 h-6 mb-2" />
            <span className="font-medium">Nouveau locataire</span>
          </button>
          <button 
            onClick={() => onTabChange('expenses')}
            className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-6 h-6 mb-2" />
            <span className="font-medium">Ajouter une dépense</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;