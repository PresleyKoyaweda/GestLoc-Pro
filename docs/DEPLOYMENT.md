# 🚀 Guide de Déploiement - GestionLoc Pro

## 📋 Options de Déploiement Recommandées

### 1. **Vercel** (Recommandé pour le front-end)
```bash
# Installation
npm i -g vercel

# Déploiement
vercel

# Variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
```

**Avantages :**
- ✅ Déploiement automatique depuis Git
- ✅ CDN global ultra-rapide
- ✅ SSL automatique
- ✅ Preview deployments
- ✅ Plan gratuit généreux

### 2. **Netlify** (Alternative excellente)
```bash
# Build et déploiement
npm run build
# Glisser-déposer le dossier dist/ sur netlify.com

# Ou via CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Avantages :**
- ✅ Interface simple
- ✅ Formulaires intégrés
- ✅ Functions serverless
- ✅ Plan gratuit

### 3. **Railway** (Full-stack avec base de données)
```bash
# Installation
npm i -g @railway/cli

# Déploiement
railway login
railway init
railway up
```

**Avantages :**
- ✅ PostgreSQL inclus
- ✅ Déploiement automatique
- ✅ Monitoring intégré
- ✅ Plan gratuit avec $5/mois

### 4. **Supabase + Vercel** (Recommandé pour production)
- **Front-end** → Vercel
- **Back-end** → Supabase
- **Edge Functions** → Supabase
- **Base de données** → PostgreSQL Supabase

## 🏗️ Architecture de Déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel/Netlify│    │    Supabase     │    │     OpenAI      │
│   (Front-end)   │◄──►│  (Back-end)     │◄──►│   (IA APIs)     │
│                 │    │                 │    │                 │
│ • React App     │    │ • PostgreSQL    │    │ • GPT-4         │
│ • Static Assets │    │ • Auth          │    │ • Assistants    │
│ • CDN Global    │    │ • Edge Functions│    │ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration Production

### Variables d'environnement requises :
```env
# Supabase (Obligatoire)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (Pour IA)
OPENAI_API_KEY=sk-your-openai-key

# Google Maps (Optionnel)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe (Pour paiements)
STRIPE_PUBLISHABLE_KEY=pk_your-stripe-key
STRIPE_SECRET_KEY=sk_your-stripe-key

# Production
NODE_ENV=production
```

## 📊 Coûts Estimés

### **Plan Gratuit (0$/mois) :**
- Vercel : 100GB bandwidth
- Supabase : 500MB DB + 2GB bandwidth
- Utilisateurs : ~1000/mois

### **Plan Starter (25$/mois) :**
- Vercel Pro : 1TB bandwidth
- Supabase Pro : 8GB DB + 250GB bandwidth
- Utilisateurs : ~10,000/mois

### **Plan Scale (100$/mois) :**
- Infrastructure complète
- Support prioritaire
- Utilisateurs illimités

## 🚀 Commandes de Déploiement

```bash
# 1. Build de production
npm run build

# 2. Test local du build
npm run preview

# 3. Déploiement Vercel
vercel --prod

# 4. Déploiement Netlify
netlify deploy --prod --dir=dist

# 5. Vérification
curl https://your-domain.com/health
```