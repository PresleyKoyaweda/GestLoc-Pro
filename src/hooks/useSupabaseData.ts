import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSupabaseData<T>(
  table: string,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      try {
        let query = supabase.from(table).select('*');
      
        // Appliquer les filtres
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
      
        const { data: result, error } = await query;
      
        if (error) throw error;
      
        setData(result || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${table}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, table, JSON.stringify(filters)]);

  const insert = async (newItem: Partial<T>) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([newItem])
        .select()
        .single();
      
      if (error) throw error;
      
      setData(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error(`Error inserting into ${table}:`, err);
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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