import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification des variables d'environnement au démarrage
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables Supabase manquantes - Mode démo activé');
  console.log('Pour activer Supabase, configurez dans .env:');
  console.log('VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=votre-cle-anonyme');
} else {
  console.log('✅ Supabase configuré - Connexion directe activée');
  console.log(`📡 URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Variables Supabase manquantes - Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
    }
    
    console.log('🔍 Test de connexion Supabase...');
    
    // Test de connexion plus simple et robuste
    const { data, error } = await Promise.race([
      supabase.from('profiles').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de connexion')), 5000)
      )
    ]) as any;
    
    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message);
      return { connected: false, error: error.message };
    }
    
    console.log('✅ Connexion Supabase réussie !');
    return { connected: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Connexion Supabase échouée:', errorMessage);
    
    return { connected: false, error: errorMessage };
  }
}


// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          role: 'owner' | 'tenant'
          avatar_url: string | null
          address: any
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: 'owner' | 'tenant'
          avatar_url?: string | null
          address?: any
          preferences?: any
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          address?: any
          preferences?: any
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: any
          type: 'entire' | 'shared'
          total_rooms: number | null
          total_bathrooms: number
          total_area: number | null
          description: string | null
          images: string[]
          status: 'libre' | 'en_attente_validation' | 'occupe'
          rent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          name: string
          address: any
          type: 'entire' | 'shared'
          total_rooms?: number | null
          total_bathrooms?: number
          total_area?: number | null
          description?: string | null
          images?: string[]
          status?: 'libre' | 'en_attente_validation' | 'occupe'
          rent?: number | null
        }
        Update: {
          name?: string
          address?: any
          type?: 'entire' | 'shared'
          total_rooms?: number | null
          total_bathrooms?: number
          total_area?: number | null
          description?: string | null
          images?: string[]
          status?: 'libre' | 'en_attente_validation' | 'occupe'
          rent?: number | null
          updated_at?: string
        }
      }
    }
  }
}