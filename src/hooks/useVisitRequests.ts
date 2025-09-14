import { useSupabaseData } from './useSupabaseData';
import { useAuth } from '../contexts/AuthContext';

interface VisitRequest {
  id: string;
  property_id: string;
  unit_id?: string;
  tenant_id: string;
  slot_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tenant_info: any;
  request_date: string;
  visit_date: string;
  visit_time: string;
  owner_notes?: string;
}

export function useVisitRequests() {
  const { user } = useAuth();
  
  const {
    data: visitRequests,
    loading,
    error,
    insert,
    update,
    remove,
    refetch
  } = useSupabaseData<VisitRequest>('visit_requests');

  const addVisitRequest = async (requestData: Omit<VisitRequest, 'id' | 'request_date'>) => {
    console.log('🔄 Hook addVisitRequest - Données reçues:', requestData);
    
    // Validation des données
    if (!requestData.property_id) {
      throw new Error('ID de propriété manquant');
    }
    
    if (!requestData.tenant_id) {
      throw new Error('ID de locataire manquant');
    }
    
    if (!requestData.visit_date || !requestData.visit_time) {
      throw new Error('Date et heure de visite manquantes');
    }
    
    const newRequest = {
      ...requestData,
      request_date: new Date().toISOString()
    };
    
    console.log('📝 Données finales pour insertion:', newRequest);
    
    try {
      const result = await insert(newRequest);
      console.log('✅ Demande de visite insérée:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur insertion demande de visite:', error);
      throw error;
    }
  };

  const updateVisitRequest = async (id: string, updates: Partial<VisitRequest>) => {
    return await update(id, updates);
  };

  const confirmVisit = async (id: string, ownerNotes?: string) => {
    return await updateVisitRequest(id, {
      status: 'confirmed',
      owner_notes: ownerNotes
    });
  };

  const cancelVisit = async (id: string, ownerNotes?: string) => {
    return await updateVisitRequest(id, {
      status: 'cancelled',
      owner_notes: ownerNotes
    });
  };

  return {
    visitRequests,
    loading,
    error,
    addVisitRequest,
    updateVisitRequest,
    confirmVisit,
    cancelVisit,
    refetch
  };
}