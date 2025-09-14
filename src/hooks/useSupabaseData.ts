import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSupabaseData<T>(
  table: string,
  filters?: Record<string, any>,
  select?: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      let query = supabase.from(table).select(select || '*');
      
      // Appliquer les filtres
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      
      setData(result || []);
      setError(null);
    } catch (err) {
      console.warn(`⚠️ ${table}:`, err instanceof Error ? err.message : 'Erreur inconnue');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Délai pour éviter les requêtes simultanées au démarrage
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user, table, JSON.stringify(filters)]);

  const insert = async (newItem: Partial<T>) => {
    try {
      console.log(`📝 Inserting into ${table}:`, JSON.stringify(newItem, null, 2));
      
      const { data: result, error } = await supabase
        .from(table)
        .insert([newItem])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erreur Supabase insert ${table}:`, error);
        throw error;
      }
      
      console.log(`✅ Successfully inserted into ${table}:`, JSON.stringify(result, null, 2));
      setData(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error(`❌ Error inserting into ${table}:`, err);
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    try {
      console.log(`📝 Updating ${table} id ${id}:`, updates);
      
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Successfully updated ${table}:`, result);
      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      return result;
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      console.log(`🗑️ Deleting from ${table} id:`, id);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`✅ Successfully deleted from ${table}`);
      setData(prev => prev.filter(item => (item as any).id !== id));
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    insert,
    update,
    remove,
    refetch: fetchData
  };
}