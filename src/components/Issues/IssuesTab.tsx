import React, { useState } from 'react';
import { Plus, AlertTriangle, Edit, Trash2, Check, Clock, Filter, Image, DollarSign, ExternalLink, User, Home } from 'lucide-react';
import type { Issue, IssueStatus, IssuePriority, Property, Unit, Expense, Tenant, User as UserType } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import IssueForm from './IssueForm';

interface IssuesTabProps {
  onTabChange?: (tab: string) => void;
}

const IssuesTab: React.FC<IssuesTabProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useLocalStorage<Issue[]>('gestionloc_issues', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('gestionloc_expenses', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | undefined>();
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all');

  const isOwner = user?.role === 'owner';

  // For tenants, find their tenant record to get associated issues
  const currentTenant = tenants.find(t => t.userId === user?.id);
  
  const canReportIssue = isOwner || currentTenant;

  // Filter issues based on user role
  const userIssues = isOwner 
    ? issues 
    : issues.filter(issue => issue.tenantId === currentTenant?.id || issue.tenantId === user?.id);
  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setShowForm(true);
  };

  const handleDelete = (issueId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce problème ?')) {
      setIssues(prev => prev.filter(i => i.id !== issueId));
    }
  };

  const handleStatusChange = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowStatusModal(true);
  };

  const updateIssueStatus = (newStatus: IssueStatus) => {
    if (!selectedIssue) return;
    
    setIssues(prev => prev.map(issue => 
      issue.id === selectedIssue.id 
        ? { 
            ...issue, 
            status: newStatus,
            resolvedAt: newStatus === 'resolved' ? new Date() : undefined
          }
        : issue
    ));
    
    setShowStatusModal(false);
    setSelectedIssue(undefined);
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return 'Locataire inconnu';
    return `Locataire #${tenant.id.slice(-4)}`;
  };
  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'Non spécifié';
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Propriété supprimée';
  };

  const getUnitName = (unitId?: string) => {
    if (!unitId) return '';
    const unit = units.find(u => u.id === unitId);
    return unit ? ` - ${unit.name}` : '';
  };

  const getLinkedExpenses = (issueId: string) => {
    return expenses.filter(e => e.issueId === issueId);
  };

  const getTotalExpenseAmount = (issueId: string) => {
    return getLinkedExpenses(issueId).reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: IssuePriority) => {
    switch (priority) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'urgent':
        return 'Urgente';
      default:
        return 'Inconnue';
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: IssueStatus) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      default:
        return 'Inconnu';
    }
  };

  const getStatusIcon = (status: IssueStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <Check className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredIssues = issues.filter(issue => 
    filter === 'all' || issue.status === filter
  );

  const filteredUserIssues = userIssues.filter(issue => 
    filter === 'all' || issue.status === filter
  );
  const stats = {
    total: userIssues.length,
    pending: userIssues.filter(i => i.status === 'pending').length,
    inProgress: userIssues.filter(i => i.status === 'in_progress').length,
    resolved: userIssues.filter(i => i.status === 'resolved').length,
    urgent: userIssues.filter(i => i.priority === 'urgent').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isOwner ? 'Problèmes signalés' : 'Signaler un problème'}
          </h1>
          <p className="text-gray-600">
            {isOwner ? 'Gérez les problèmes signalés par vos locataires' : 'Signalez les problèmes dans votre logement'}
          </p>
        </div>
        <button
          onClick={() => {
            if (!canReportIssue) {
              alert('Vous devez être assigné à un logement pour signaler un problème. Recherchez et rejoignez d\'abord un logement.');
              return;
            }
            setEditingIssue(undefined);
            setShowForm(true);
          }}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            canReportIssue 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
          disabled={!canReportIssue}
        >
          <Plus className="w-5 h-5 mr-2" />
          {isOwner ? 'Ajouter un problème' : 'Signaler un problème'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total problèmes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {(isOwner || userIssues.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex space-x-2">
              {(['all', 'pending', 'in_progress', 'resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Tous' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {filteredUserIssues.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun problème</h3>
            <p className="text-gray-500 mb-4">
              {isOwner 
                ? 'Aucun problème signalé pour le moment' 
                : !canReportIssue 
                  ? 'Vous devez être assigné à un logement pour signaler des problèmes'
                  : 'Vous n\'avez encore signalé aucun problème'
              }
            </p>
            {canReportIssue ? (
              <button
                onClick={() => {
                  setEditingIssue(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isOwner ? 'Ajouter un problème' : 'Signaler un problème'}
              </button>
            ) : (
              <button
                onClick={() => onTabChange?.('search')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Rechercher un logement
              </button>
            )}
          </div>
        ) : (
          filteredUserIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {getPriorityLabel(issue.priority)}
                    </span>
                    <button
                      onClick={() => isOwner ? handleStatusChange(issue) : null}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${getStatusColor(issue.status)} ${
                        isOwner ? 'hover:opacity-80 cursor-pointer' : ''
                      }`}
                      disabled={!isOwner}
                    >
                      {getStatusIcon(issue.status)}
                      <span className="ml-1">{getStatusLabel(issue.status)}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Signalé par: {getTenantName(issue.tenantId)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{issue.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      📍 {getPropertyName(issue.propertyId)}{getUnitName(issue.unitId)}
                    </span>
                    <span>
                      📅 {new Date(issue.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {issue.resolvedAt && (
                      <span>
                        ✅ Résolu le {new Date(issue.resolvedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  
                  {/* Linked Expenses */}
                  {getLinkedExpenses(issue.id).length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">
                            Dépenses associées ({getLinkedExpenses(issue.id).length})
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-800">
                          {getTotalExpenseAmount(issue.id).toLocaleString('fr-CA')}$
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {getLinkedExpenses(issue.id).map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between text-xs text-green-700">
                            <span className="flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {expense.description}
                            </span>
                            <span className="font-medium">{expense.amount.toLocaleString('fr-CA')}$</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {(isOwner || issue.tenantId === user?.id || issue.tenantId === currentTenant?.id) && (
                  <div className="flex space-x-2 ml-4">
                    {isOwner && (
                      <button
                        onClick={() => handleStatusChange(issue)}
                        className="p-2 text-purple-600 hover:text-purple-800"
                        title="Changer le statut"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => isOwner ? handleEdit(issue) : null}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      disabled={!isOwner}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isOwner && (
                      <button
                      onClick={() => handleDelete(issue.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                )}
              </div>

              {/* Photos */}
              {issue.photos.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Image className="w-4 h-4 mr-1" />
                    Photos ({issue.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {issue.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                    {issue.photos.length > 4 && (
                      <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        +{issue.photos.length - 4} autres
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Owner Notes */}
              {issue.ownerNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Notes du propriétaire</h4>
                  <p className="text-sm text-blue-800">{issue.ownerNotes}</p>
                </div>
              )}
              
              {/* Status for tenants */}
              {!isOwner && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut actuel :</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span className="ml-1">{getStatusLabel(issue.status)}</span>
                    </span>
                  </div>
                  {issue.status === 'resolved' && issue.resolvedAt && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ Résolu le {new Date(issue.resolvedAt).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Changer le statut</h3>
              <p className="text-sm text-gray-600">{selectedIssue.title}</p>
            </div>
            
            <div className="space-y-3">
              {(['pending', 'in_progress', 'resolved'] as IssueStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateIssueStatus(status)}
                  className={`w-full flex items-center p-3 rounded-lg border-2 transition-all ${
                    selectedIssue.status === status
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{getStatusLabel(status)}</div>
                    <div className="text-xs text-gray-500">
                      {status === 'pending' && 'En attente de traitement'}
                      {status === 'in_progress' && 'Travaux en cours'}
                      {status === 'resolved' && 'Problème résolu'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <IssueForm
          issue={editingIssue}
          isOwner={isOwner}
          onClose={() => {
            setShowForm(false);
            setEditingIssue(undefined);
          }}
        />
      )}
    </div>
  );
};

export default IssuesTab;