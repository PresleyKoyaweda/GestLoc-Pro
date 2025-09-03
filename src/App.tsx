import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { checkSupabaseConnection } from './lib/supabase';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import PropertiesTab from './components/Properties/PropertiesTab';
import TenantsTab from './components/Tenants/TenantsTab';
import PaymentsTab from './components/Payments/PaymentsTab';
import ExpensesTab from './components/Expenses/ExpensesTab';
import IssuesTab from './components/Issues/IssuesTab';
import ReportsTab from './components/Reports/ReportsTab';
import AIAgentsTab from './components/AI/AIAgentsTab';
import SettingsTab from './components/Settings/SettingsTab';
import SubscriptionTab from './components/Subscription/SubscriptionTab';
import PropertySearch from './components/Search/PropertySearch';
import MyRentalTab from './components/Tenant/MyRentalTab';
import TenantHistoryTab from './components/Tenant/TenantHistoryTab';
import PropertyRequestsTab from './components/Properties/PropertyRequestsTab';
import VisitRequestsTab from './components/Properties/VisitRequestsTab';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [connectionChecked, setConnectionChecked] = React.useState(false);

  // Vérifier la connexion Supabase au démarrage
  React.useEffect(() => {
    const testConnection = async () => {
      console.log('🚀 Démarrage de l\'application GestionLoc Pro');
      
      try {
        const result = await checkSupabaseConnection();
        if (result.connected) {
          console.log('✅ Application prête - Connexion Supabase active');
        } else {
          console.error('❌ Erreur de connexion Supabase:', result.error);
          console.log('💡 Vérifiez votre configuration dans le fichier .env');
        }
      } catch (error) {
        console.error('⚠️ Erreur lors du test de connexion:', error);
      }
      
      setConnectionChecked(true);
    };
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {connectionChecked ? 'Chargement...' : 'Initialisation...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'owner' ? <OwnerDashboard /> : <PropertySearch />;
      case 'properties':
        return <PropertiesTab />;
      case 'tenants':
        return <TenantsTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'expenses':
        return <ExpensesTab />;
      case 'issues':
        return <IssuesTab />;
      case 'reports':
        return <ReportsTab />;
      case 'ai-agents':
        return <AIAgentsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'search':
        return <PropertySearch />;
      case 'my-rental':
        return <MyRentalTab />;
      case 'history':
        return <TenantHistoryTab />;
      case 'property-requests':
        return <PropertyRequestsTab />;
      case 'visit-requests':
        return <VisitRequestsTab />;
      default:
        return user.role === 'owner' ? <OwnerDashboard /> : <PropertySearch />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />
      
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={user.role}
        />
        
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;