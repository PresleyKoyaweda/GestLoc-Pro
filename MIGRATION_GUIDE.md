# 🔄 Guide de Migration v1 → v2 - GestionLoc Pro

## 📋 Résumé des Changements

### Changements majeurs
- ✅ **Suppression du mode démo** : Application 100% production
- ✅ **Configuration IA centralisée** : Plus de clés API utilisateur
- ✅ **Persistance de session** : Connexion maintenue après rafraîchissement
- ✅ **Plans d'abonnement avec limites IA** : Contrôle granulaire des fonctionnalités

### Impacts
- **Base de données** : Nouvelle table `ai_plan_features` et `ai_usage_tracking`
- **Interface** : Suppression des éléments "démo" et configuration IA
- **Authentification** : Session persistante obligatoire
- **IA** : Configuration centralisée selon l'abonnement

## 🗄️ Migration Base de Données

### 1. Nouvelle migration à appliquer
```bash
# Appliquer la nouvelle migration
supabase db push

# Vérifier que la migration s'est bien passée
supabase db diff
```

### 2. Nettoyage des données existantes
```sql
-- Supprimer la colonne openai_api_key (si elle existe)
ALTER TABLE profiles DROP COLUMN IF EXISTS openai_api_key;

-- Nettoyer les préférences utilisateur obsolètes
UPDATE profiles SET preferences = preferences - 'aiEmailAccess' - 'aiSmsAccess' - 'aiBankAccess' - 'aiMessagingAccess' - 'aiAutoValidation' - 'aiConfidenceThreshold';
```

### 3. Vérifier la configuration des plans
```sql
-- Vérifier que les plans IA sont configurés
SELECT * FROM ai_plan_features ORDER BY plan, agent_type;

-- Vérifier que tous les utilisateurs ont un abonnement
SELECT p.email, s.plan, s.status 
FROM profiles p 
LEFT JOIN subscriptions s ON p.id = s.user_id 
WHERE p.role = 'owner';
```

## 🔧 Configuration Serveur

### 1. Variables d'environnement
```bash
# Supprimer les variables obsolètes
unset DEMO_MODE
unset VITE_DEMO_MODE

# Vérifier les variables requises
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: $VITE_SUPABASE_ANON_KEY"
echo "OPENAI_API_KEY: $OPENAI_API_KEY"
```

### 2. Edge Functions
```bash
# Redéployer toutes les Edge Functions avec la nouvelle configuration
supabase functions deploy ai-payment-assistant
supabase functions deploy ai-fiscal-assistant
supabase functions deploy ai-communication-assistant
supabase functions deploy ai-problem-diagnostic
supabase functions deploy ai-contract-generator
supabase functions deploy ai-monthly-summary

# Configurer les secrets
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
```

## 🎯 Tests de Migration

### 1. Tests d'authentification
```bash
# Tester la connexion
curl -X POST "$VITE_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Tests des fonctionnalités IA
```bash
# Tester l'assistant de paiement
curl -X POST "$VITE_SUPABASE_URL/functions/v1/ai-payment-assistant" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "payments": [], "tenants": []}'
```

### 3. Tests de persistance de session
- Connexion utilisateur
- Rafraîchissement de la page
- Vérifier que l'utilisateur reste connecté
- Vérifier que l'onglet actif est maintenu

## 📊 Validation des Plans d'Abonnement

### 1. Vérifier les limites par plan
```sql
-- Plan gratuit (aucune IA)
SELECT * FROM ai_plan_features WHERE plan = 'free' AND enabled = true;
-- Résultat attendu : 0 ligne

-- Plan Pro (IA de base)
SELECT agent_type, monthly_limit FROM ai_plan_features 
WHERE plan = 'pro' AND enabled = true;
-- Résultat attendu : payment(50), fiscal(20), communication(100), summary(10)

-- Plan Business (toutes les IA)
SELECT agent_type, monthly_limit FROM ai_plan_features 
WHERE plan = 'business' AND enabled = true;
-- Résultat attendu : tous les agents avec limite 0 (illimité)
```

### 2. Tester les fonctions de vérification
```sql
-- Tester la fonction de vérification IA
SELECT can_use_ai_agent('user-uuid', 'payment');

-- Tester l'enregistrement d'utilisation
SELECT track_ai_usage('user-uuid', 'payment', 100, 0.05);
```

## 🔄 Déploiement Frontend

### 1. Build et test
```bash
# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install

# Build de production
npm run build

# Test local
npm run preview
```

### 2. Vérifications avant déploiement
- [ ] Aucune référence au "mode démo" dans l'interface
- [ ] Configuration IA supprimée des paramètres utilisateur
- [ ] Session persistante après rafraîchissement
- [ ] Fonctionnalités IA selon le plan d'abonnement

### 3. Déploiement
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

## 🚨 Points d'Attention

### 1. Données utilisateur existantes
- Les utilisateurs existants conservent leurs données
- Les préférences IA obsolètes sont supprimées automatiquement
- Les abonnements existants restent valides

### 2. Compatibilité descendante
- L'API reste compatible
- Les URLs ne changent pas
- Les fonctionnalités existantes fonctionnent toujours

### 3. Performance
- Suppression du localStorage pour l'authentification
- Utilisation exclusive de Supabase Auth
- Amélioration des temps de chargement

## 📋 Checklist de Migration

### Avant la migration
- [ ] Sauvegarde complète de la base de données
- [ ] Test de la nouvelle version en staging
- [ ] Communication aux utilisateurs (si nécessaire)
- [ ] Plan de rollback préparé

### Pendant la migration
- [ ] Appliquer les migrations de base de données
- [ ] Déployer les nouvelles Edge Functions
- [ ] Mettre à jour les variables d'environnement
- [ ] Déployer le nouveau frontend

### Après la migration
- [ ] Vérifier l'authentification
- [ ] Tester les fonctionnalités IA
- [ ] Contrôler les métriques de performance
- [ ] Surveiller les logs d'erreur
- [ ] Valider avec quelques utilisateurs test

## 🆘 Rollback d'Urgence

En cas de problème critique :

### 1. Rollback frontend
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

### 2. Rollback base de données
```bash
# Revenir à la migration précédente
supabase db reset --db-url "postgresql://..."
```

### 3. Restaurer les Edge Functions
```bash
# Redéployer les anciennes versions
git checkout v1.0
supabase functions deploy
```

## 📞 Support Migration

### En cas de problème
1. Vérifier les logs Supabase
2. Contrôler les variables d'environnement
3. Tester les Edge Functions individuellement
4. Valider les politiques RLS

### Contacts
- Documentation : [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Issues : GitHub Issues
- Support : support@gestionloc-pro.com

---

**Migration v1 → v2 terminée avec succès ! 🎉**
## 🔧 Tests Post-Migration Obligatoires

### **Vérification Authentification (CRITIQUE)**

Après chaque migration, testez impérativement :

#### **1. Tests de Connexion**
```bash
# Ouvrir l'application
http://localhost:5173

# Tester les comptes pré-configurés
Propriétaire: owner@test.com / password123
Locataire: tenant@test.com / password123
```

#### **2. Tests d'Inscription**
- Créer un nouveau compte propriétaire
- Créer un nouveau compte locataire  
- Vérifier la validation des champs
- Confirmer la redirection après inscription

#### **3. Tests de Session**
- Connexion → Rafraîchissement page → Vérifier session maintenue
- Navigation entre onglets → Vérifier onglet actif conservé
- Déconnexion → Vérifier redirection vers login

#### **4. Tests de Navigation**
- **Propriétaire** : Accès à tous les onglets de gestion
- **Locataire** : Accès limité aux onglets appropriés
- **Mobile** : Sidebar avec overlay fonctionnel
- **Desktop** : Sidebar fixe fonctionnelle

### **Commandes de Vérification**

```bash
# Vérifier les dépendances
npm list react react-dom @supabase/supabase-js lucide-react

# Vérifier la compilation TypeScript
npm run type-check

# Vérifier le build de production
npm run build

# Tester le build localement
npm run preview
```

### **Indicateurs de Succès**
- ✅ Aucune erreur console
- ✅ Authentification fluide
- ✅ Session persistante
- ✅ Navigation par rôle
- ✅ Interface responsive
- ✅ Mode hybride fonctionnel

### **En Cas d'Échec**
1. Vérifier les imports React dans AuthContext.tsx
2. Vérifier la configuration Supabase
3. Nettoyer le cache navigateur
4. Redémarrer le serveur de développement
5. Consulter les logs détaillés
