import React, { useState } from 'react';
import { Key, Users, Calendar, Gift, Copy, Check, Mail, Download } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface License {
  id: string;
  code: string;
  type: 'trial' | 'demo' | 'beta' | 'full';
  duration: number; // days
  maxUsers: number;
  features: string[];
  createdAt: Date;
  expiresAt: Date;
  usedBy?: string;
  usedAt?: Date;
  email?: string;
}

const LicenseManager: React.FC = () => {
  const [licenses, setLicenses] = useLocalStorage<License[]>('gestionloc_licenses', []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'trial' as License['type'],
    duration: 30,
    maxUsers: 5,
    quantity: 1,
    email: '',
  });

  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  const getFeaturesByType = (type: License['type']): string[] => {
    switch (type) {
      case 'trial':
        return ['Toutes les fonctionnalités', 'Support email', 'Jusqu\'à 5 propriétés'];
      case 'demo':
        return ['Fonctionnalités limitées', 'Mode démonstration', 'Données d\'exemple'];
      case 'beta':
        return ['Accès anticipé', 'Nouvelles fonctionnalités', 'Feedback prioritaire'];
      case 'full':
        return ['Accès complet', 'Support prioritaire', 'Propriétés illimitées'];
      default:
        return [];
    }
  };

  const createLicenses = () => {
    const newLicenses: License[] = [];
    
    for (let i = 0; i < formData.quantity; i++) {
      const license: License = {
        id: Date.now().toString() + i,
        code: generateLicenseCode(),
        type: formData.type,
        duration: formData.duration,
        maxUsers: formData.maxUsers,
        features: getFeaturesByType(formData.type),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + formData.duration * 24 * 60 * 60 * 1000),
        email: formData.email || undefined,
      };
      newLicenses.push(license);
    }
    
    setLicenses(prev => [...prev, ...newLicenses]);
    setShowCreateForm(false);
    setFormData({
      type: 'trial',
      duration: 30,
      maxUsers: 5,
      quantity: 1,
      email: '',
    });
    
    alert(`${newLicenses.length} licence(s) créée(s) avec succès !`);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportLicenses = () => {
    const data = licenses.map(license => ({
      code: license.code,
      type: license.type,
      duration: license.duration,
      expiresAt: license.expiresAt.toISOString(),
      used: !!license.usedBy
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestionloc-licenses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const sendLicenseByEmail = (license: License) => {
    const subject = `Votre licence GestionLoc Pro ${license.type.toUpperCase()}`;
    const body = `
Bonjour,

Voici votre licence d'accès à GestionLoc Pro :

🔑 Code de licence : ${license.code}
📋 Type : ${license.type.toUpperCase()}
⏰ Durée : ${license.duration} jours
👥 Utilisateurs max : ${license.maxUsers}
📅 Expire le : ${license.expiresAt.toLocaleDateString('fr-FR')}

🚀 Pour activer votre licence :
1. Rendez-vous sur https://gestionloc-pro.com
2. Créez votre compte
3. Entrez le code de licence dans les paramètres
4. Profitez de toutes les fonctionnalités !

Fonctionnalités incluses :
${license.features.map(f => `• ${f}`).join('\n')}

Support : support@gestionloc-pro.com

Cordialement,
L'équipe GestionLoc Pro
    `.trim();
    
    const mailtoLink = `mailto:${license.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const getTypeColor = (type: License['type']) => {
    switch (type) {
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'demo': return 'bg-gray-100 text-gray-800';
      case 'beta': return 'bg-purple-100 text-purple-800';
      case 'full': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (license: License) => {
    const now = new Date();
    if (license.usedBy) {
      return license.expiresAt > now ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    return license.expiresAt > now ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (license: License) => {
    const now = new Date();
    if (license.usedBy) {
      return license.expiresAt > now ? 'Utilisée' : 'Expirée';
    }
    return license.expiresAt > now ? 'Disponible' : 'Expirée';
  };

  const stats = {
    total: licenses.length,
    available: licenses.filter(l => !l.usedBy && l.expiresAt > new Date()).length,
    used: licenses.filter(l => l.usedBy).length,
    expired: licenses.filter(l => l.expiresAt <= new Date()).length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestionnaire de Licences</h1>
          <p className="text-gray-600">Créez et gérez les licences d'accès gratuites</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportLicenses}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Exporter
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Key className="w-5 h-5 mr-2" />
            Créer des licences
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total licences</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Key className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <Gift className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisées</p>
              <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expirées</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code de licence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune licence</h3>
                    <p className="text-gray-500 mb-4">Créez vos premières licences d'accès</p>
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {license.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(license.code)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === license.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(license.type)}`}>
                        {license.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.duration} jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(license)}`}>
                        {getStatusText(license)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.usedBy ? (
                        <div>
                          <p>{license.usedBy}</p>
                          <p className="text-xs text-gray-500">
                            {license.usedAt?.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Non utilisée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {license.email && !license.usedBy && (
                          <button
                            onClick={() => sendLicenseByEmail(license)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Envoyer par email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create License Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Créer des licences</h3>
              <p className="text-sm text-gray-600">Générez des codes d'accès gratuits</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de licence
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as License['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="trial">Trial (Essai complet)</option>
                  <option value="demo">Demo (Démonstration)</option>
                  <option value="beta">Beta (Accès anticipé)</option>
                  <option value="full">Full (Accès complet)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (jours)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max utilisateurs
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité à créer
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createLicenses}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer {formData.quantity} licence{formData.quantity > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManager;