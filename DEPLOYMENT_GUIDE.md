# 🚀 Guide de Déploiement - GestionLoc Pro

## ✅ Vérification Pré-Déploiement

### **Tests d'Authentification Obligatoires**
Avant tout déploiement, vérifiez ces fonctionnalités critiques :

#### **1. Connexion**
- [ ] Connexion propriétaire : `owner@test.com` / `password123`
- [ ] Connexion locataire : `tenant@test.com` / `password123`
- [ ] Validation des champs (email invalide, mot de passe court)
- [ ] Messages d'erreur appropriés
- [ ] Redirection vers le bon tableau de bord selon le rôle

#### **2. Inscription**
- [ ] Création compte propriétaire avec tous les champs
- [ ] Création compte locataire avec tous les champs
- [ ] Validation confirmation mot de passe
- [ ] Vérification unicité email
- [ ] Message de succès et redirection vers connexion

#### **3. Session Persistante**
- [ ] Connexion maintenue après rafraîchissement page
- [ ] Onglet actif conservé après rafraîchissement
- [ ] Déconnexion propre avec nettoyage session
- [ ] Redirection vers login si session expirée

#### **4. Navigation par Rôle**
- [ ] **Propriétaire** : Dashboard, Propriétés, Locataires, Paiements, Dépenses, Problèmes, Rapports, IA, Abonnement, Paramètres
- [ ] **Locataire** : Recherche, Mon logement, Historique, Paiements, Signalements, Paramètres
- [ ] Sidebar responsive (mobile/desktop)
- [ ] Header avec profil utilisateur

#### **5. Mode Hybride (Supabase + Démo)**
- [ ] Fonctionnement avec Supabase configuré
- [ ] Fallback automatique en mode démo si Supabase indisponible
- [ ] Sauvegarde locale des comptes créés en mode démo
- [ ] Transition transparente entre les modes

## 📋 Prérequis

### Services externes requis
- **Supabase** : Base de données PostgreSQL + Auth + Storage
- **OpenAI** : API pour les fonctionnalités IA
- **Vercel/Netlify** : Hébergement du frontend
- **Stripe** (optionnel) : Paiements en ligne
- **Google Maps** (optionnel) : Cartes interactives

### Outils de développement
- Node.js 18+
- npm ou yarn
- Git

## 🔧 Configuration Supabase

### 1. Créer un projet Supabase
```bash
# Aller sur https://supabase.com
# Créer un nouveau projet
# Noter l'URL et la clé anonyme
```

### 2. Configurer l'authentification
Dans le dashboard Supabase > Authentication > Settings :
- **Site URL** : `https://votre-domaine.com`
- **Redirect URLs** : `https://votre-domaine.com/**`
- **Email confirmation** : Désactivé (pour simplifier)
- **Enable signup** : Activé

### 3. Exécuter les migrations
```bash
# Cloner le projet
git clone <repository-url>
cd gestionloc-pro

# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Appliquer les migrations
supabase db push
```

### 4. Configurer les Edge Functions
```bash
# Déployer les fonctions IA
supabase functions deploy ai-payment-assistant
supabase functions deploy ai-fiscal-assistant
supabase functions deploy ai-communication-assistant
supabase functions deploy ai-problem-diagnostic
supabase functions deploy ai-contract-generator
supabase functions deploy ai-monthly-summary

# Configurer les secrets
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
```

## 🔑 Configuration des Variables d'Environnement

### 1. Copier le fichier d'exemple
```bash
cp .env.example .env
```

### 2. Remplir les variables
```env
# Supabase (OBLIGATOIRE)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (OBLIGATOIRE pour IA)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Maps (OPTIONNEL)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe (OPTIONNEL)
STRIPE_PUBLISHABLE_KEY=pk_your-stripe-key
STRIPE_SECRET_KEY=sk_your-stripe-key

# Environment
NODE_ENV=production
```

## 🏗️ Build et Déploiement

### 1. Installation des dépendances
```bash
npm install
```

### 2. Build de production
```bash
npm run build
```

### 3. Test local du build
```bash
npm run preview
```

### 4. Déploiement Vercel
```bash
# Installation CLI
npm i -g vercel

# Déploiement
vercel

# Configuration des variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
```

### 5. Déploiement Netlify
```bash
# Build
npm run build

# Déployer le dossier dist/ sur netlify.com
# Ou via CLI :
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🔒 Configuration de Sécurité

### 1. Row Level Security (RLS)
Toutes les tables ont RLS activé automatiquement via les migrations.

### 2. Politiques d'accès
- **Propriétaires** : Accès à leurs propriétés et locataires
- **Locataires** : Accès à leurs données uniquement
- **Isolation complète** entre utilisateurs

### 3. Variables d'environnement
- Jamais de clés API côté client
- OpenAI configuré côté serveur uniquement
- Validation des entrées utilisateur

## 📊 Configuration des Plans d'Abonnement

### Plans disponibles
- **Gratuit** : 1 propriété, 1 locataire, pas d'IA
- **Pro** : 10 propriétés, 50 locataires, IA de base
- **Business** : Illimité, toutes les IA

### Limites IA par plan
```sql
-- Voir la table ai_plan_features pour les détails
SELECT * FROM ai_plan_features;
```

## 🧪 Tests de Production

### 1. Tests fonctionnels
```bash
# Authentification
# - Inscription propriétaire/locataire
# - Connexion/déconnexion
# - Persistance de session

# CRUD de base
# - Créer/modifier propriétés
# - Ajouter locataires
# - Générer paiements
# - Signaler problèmes

# Fonctionnalités IA (selon plan)
# - Analyse des paiements
# - Génération de messages
# - Résumés mensuels
```

### 2. Tests de performance
```bash
# Lighthouse audit
npx lighthouse https://votre-domaine.com

# Objectifs :
# - Performance : >90
# - Accessibility : >95
# - Best Practices : >90
# - SEO : >90
```

## 📈 Monitoring et Maintenance

### 1. Logs Supabase
- Dashboard > Logs
- Surveiller les erreurs d'authentification
- Vérifier l'utilisation des Edge Functions

### 2. Métriques importantes
- Nombre d'utilisateurs actifs
- Utilisation des fonctionnalités IA
- Taux d'erreur des API
- Performance des requêtes

### 3. Sauvegardes
- Supabase : Sauvegardes automatiques
- Code : Git + GitHub/GitLab
- Configuration : Documentation à jour

## 🔄 Mise à jour

### 1. Nouvelles migrations
```bash
# Créer une nouvelle migration
supabase migration new nom_de_la_migration

# Appliquer en production
supabase db push
```

### 2. Nouvelles fonctionnalités
```bash
# Développement local
npm run dev

# Tests
npm run build && npm run preview

# Déploiement
git push origin main
# (déploiement automatique via Vercel/Netlify)
```

## 🆘 Dépannage

### Problèmes courants

#### 1. Erreur de connexion Supabase
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Tester la connexion
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     "$VITE_SUPABASE_URL/rest/v1/profiles?select=count"
```

#### 2. Fonctionnalités IA non disponibles
```bash
# Vérifier la configuration OpenAI
supabase secrets list

# Tester une Edge Function
curl -X POST "$VITE_SUPABASE_URL/functions/v1/ai-payment-assistant" \
     -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

#### 3. Problèmes d'authentification
- Vérifier les URL de redirection dans Supabase
- Contrôler les politiques RLS
- Valider les rôles utilisateur

### Support
- Documentation Supabase : https://supabase.com/docs
- Documentation OpenAI : https://platform.openai.com/docs
- Issues GitHub : Créer un ticket avec logs détaillés

## ✅ Checklist de Déploiement

### Avant le déploiement
- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase appliquées
- [ ] Edge Functions déployées
- [ ] Build de production testé
- [ ] Tests fonctionnels passés

### Après le déploiement
- [ ] Authentification fonctionnelle
- [ ] Création de comptes testée
- [ ] Fonctionnalités IA testées
- [ ] Performance vérifiée
- [ ] Monitoring activé

### Maintenance continue
- [ ] Sauvegardes vérifiées
- [ ] Logs surveillés
- [ ] Métriques suivies
- [ ] Documentation à jour