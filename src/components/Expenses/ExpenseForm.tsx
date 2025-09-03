import React, { useState } from 'react';
import { X, Upload, Receipt, AlertTriangle } from 'lucide-react';
import { Expense, ExpenseType, Property, Unit, Issue, Tenant } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface ExpenseFormProps {
  onClose: () => void;
  expense?: Expense;
  linkedIssue?: Issue;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose, expense, linkedIssue }) => {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('gestionloc_expenses', []);
  const [issues, setIssues] = useLocalStorage<Issue[]>('gestionloc_issues', []);
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  
  const [formData, setFormData] = useState({
    description: expense?.description || linkedIssue?.title || '',
    amount: expense?.amount || 0,
    type: expense?.type || 'maintenance' as ExpenseType,
    propertyId: expense?.propertyId || linkedIssue?.propertyId || '',
    unitId: expense?.unitId || linkedIssue?.unitId || '',
    issueId: expense?.issueId || linkedIssue?.id || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    receiptFile: null as File | null,
    markIssueStatus: 'no_change' as 'no_change' | 'in_progress' | 'resolved',
  });

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const availableUnits = units.filter(u => u.propertyId === formData.propertyId);
  const pendingIssues = issues.filter(i => i.status !== 'resolved');
  const selectedIssue = issues.find(i => i.id === formData.issueId);

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return 'Locataire inconnu';
    return `Locataire #${tenant.id.slice(-4)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newExpense: Expense = {
      id: expense?.id || Date.now().toString(),
      ownerId: '1', // Current user ID
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      propertyId: formData.propertyId || undefined,
      unitId: formData.unitId || undefined,
      issueId: formData.issueId || undefined,
      date: new Date(formData.date),
      receiptUrl: formData.receiptFile ? URL.createObjectURL(formData.receiptFile) : expense?.receiptUrl,
      createdAt: expense?.createdAt || new Date(),
    };

    if (expense) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? newExpense : e));
    } else {
      setExpenses(prev => [...prev, newExpense]);
    }

    // Update issue status if selected
    if (formData.issueId && formData.markIssueStatus !== 'no_change') {
      setIssues(prev => prev.map(issue => 
        issue.id === formData.issueId 
          ? { 
              ...issue, 
              status: formData.markIssueStatus as 'in_progress' | 'resolved',
              resolvedAt: formData.markIssueStatus === 'resolved' ? new Date() : issue.resolvedAt
            }
          : issue
      ));
    }
    
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, receiptFile: file }));
    }
  };

  const expenseTypes = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'renovation', label: 'Rénovation' },
    { value: 'utilities', label: 'Services publics' },
    { value: 'insurance', label: 'Assurance' },
    { value: 'taxes', label: 'Taxes' },
    { value: 'other', label: 'Autre' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {expense ? 'Modifier la dépense' : 'Ajouter une dépense'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ex: Réparation plomberie"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de dépense *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ExpenseType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {expenseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Property Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Association (optionnel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriété
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value, unitId: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Aucune propriété spécifique</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address.street}, {property.address.city}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProperty?.type === 'shared' && availableUnits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chambre
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toute la propriété</option>
                    {availableUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Issue Association */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Association avec un problème (optionnel)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problème signalé
                </label>
                <select
                  value={formData.issueId}
                  onChange={(e) => {
                    const issueId = e.target.value;
                    const issue = issues.find(i => i.id === issueId);
                    setFormData(prev => ({ 
                      ...prev, 
                      issueId,
                      propertyId: issue?.propertyId || prev.propertyId,
                      unitId: issue?.unitId || prev.unitId,
                      description: issue?.title || prev.description
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Aucun problème associé</option>
                  {pendingIssues.map(issue => {
                    const property = properties.find(p => p.id === issue.propertyId);
                    const unit = units.find(u => u.id === issue.unitId);
                    return (
                      <option key={issue.id} value={issue.id}>
                        {issue.title} - {property?.name}{unit ? ` (${unit.name})` : ''} - {getTenantName(issue.tenantId)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedIssue && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">{selectedIssue.title}</h4>
                      <p className="text-sm text-blue-800 mt-1">{selectedIssue.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-blue-700">
                        <span className={`px-2 py-1 rounded-full ${
                          selectedIssue.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          selectedIssue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedIssue.priority === 'urgent' ? 'Urgent' :
                           selectedIssue.priority === 'high' ? 'Élevée' : 
                           selectedIssue.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                        <span>Signalé le {new Date(selectedIssue.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.issueId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mettre à jour le statut du problème
                  </label>
                  <select
                    value={formData.markIssueStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, markIssueStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no_change">Ne pas modifier</option>
                    <option value="in_progress">Marquer en cours</option>
                    <option value="resolved">Marquer comme résolu</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificatif
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Télécharger un fichier</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF jusqu'à 10MB
                </p>
                {formData.receiptFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Fichier sélectionné: {formData.receiptFile.name}
                  </p>
                )}
                {expense?.receiptUrl && !formData.receiptFile && (
                  <p className="text-sm text-blue-600 mt-2">
                    Justificatif existant disponible
                  </p>
                )}
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
              {expense ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;