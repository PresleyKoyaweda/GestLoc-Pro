import React from 'react';
import { Users, Key, BarChart3, Settings, Database, Zap } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import LicenseManager from './LicenseManager';

interface AdminDashboardProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeSection, onSectionChange }) => {
  const [users] = useLocalStorage('gestionloc_users', []);
  const [licenses] = useLocalStorage('gestionloc_licenses', []);
  const [properties] = useLocalStorage('gestionloc_properties', []);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    totalLicenses: licenses.length,
    activeLicenses: licenses.filter((l: any) => l.usedBy && l.expiresAt > new Date()).length,
    totalProperties: properties.length,
  };

  if (activeSection === 'licenses') {
    return <LicenseManager />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration GestionLoc Pro</h1>
        <p className="text-gray-600">Tableau de bord administrateur</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
            </div>
            <Zap className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Licences actives</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeLicenses}</p>
            </div>
            <Key className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propriétés gérées</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalProperties}</p>
            </div>
            <Database className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => onSectionChange('licenses')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Key className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Gestionnaire de Licences</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Créez et gérez les licences d'accès gratuites pour les tests utilisateurs
          </p>
          <div className="flex items-center text-blue-600">
            <span className="text-sm font-medium">Gérer les licences →</span>
          </div>
        </button>

        <button
          onClick={() => onSectionChange('analytics')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Analysez l'utilisation de la plateforme et les métriques d'engagement
          </p>
          <div className="flex items-center text-green-600">
            <span className="text-sm font-medium">Voir les stats →</span>
          </div>
        </button>

        <button
          onClick={() => onSectionChange('settings')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Paramètres globaux de la plateforme et configuration système
          </p>
          <div className="flex items-center text-purple-600">
            <span className="text-sm font-medium">Configurer →</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;