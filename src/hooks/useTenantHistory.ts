import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../contexts/AuthContext';
import { TenantHistory } from '../types';

export function useTenantHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useLocalStorage<TenantHistory[]>('gestionloc_tenant_history', []);

  const addHistoryEntry = (entry: Omit<TenantHistory, 'id' | 'tenantId' | 'createdAt'>) => {
    if (!user?.id) return;

    const newEntry: TenantHistory = {
      ...entry,
      id: Date.now().toString() + Math.random(),
      tenantId: user.id,
      createdAt: new Date(),
    };

    setHistory(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const getUserHistory = () => {
    return history.filter(entry => entry.tenantId === user?.id);
  };

  const getHistoryByType = (type: TenantHistory['type']) => {
    return getUserHistory().filter(entry => entry.type === type);
  };

  const getHistoryByProperty = (propertyId: string) => {
    return getUserHistory().filter(entry => entry.propertyId === propertyId);
  };

  const getRecentHistory = (limit: number = 10) => {
    return getUserHistory().slice(0, limit);
  };

  return {
    history: getUserHistory(),
    addHistoryEntry,
    getHistoryByType,
    getHistoryByProperty,
    getRecentHistory,
  };
}