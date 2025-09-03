import React, { useState } from 'react';
import { Building2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const { login, signup, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<'owner' | 'tenant'>('owner');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (!isLogin && !isResetPassword) {
      if (!formData.firstName || !formData.lastName) {
        setError('Veuillez remplir tous les champs obligatoires');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      if (isResetPassword) {
        setSuccess('Un email de réinitialisation a été envoyé à votre adresse');
        setIsResetPassword(false);
      } else if (isLogin) {
        const result = await login(formData.email, formData.password, accountType);
        if (!result.success) {
          setError(result.error || 'Erreur de connexion');
        }
      } else {
        const result = await signup({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: accountType
        });
        
        if (result.success) {
          setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: ''
          });
        } else {
          setError(result.error || 'Erreur lors de la création du compte');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    setError('');
    setSuccess('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setIsResetPassword(false);
    resetForm();
  };

  const switchToSignUp = () => {
    setIsLogin(false);
    setIsResetPassword(false);
    resetForm();
  };

  const switchToResetPassword = () => {
    setIsResetPassword(true);
    setIsLogin(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GestionLoc Pro</h1>
          <p className="text-gray-600">Gestion locative intelligente</p>
        </div>

        {/* Titre de la section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isResetPassword ? 'Réinitialiser le mot de passe' : isLogin ? 'Se connecter' : 'S\'inscrire'}
          </h2>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Type de compte - pour connexion et inscription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className={`flex flex-col items-center justify-center px-4 py-4 border rounded-lg transition-colors ${
                  accountType === 'owner'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Propriétaire</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('tenant')}
                className={`flex flex-col items-center justify-center px-4 py-4 border rounded-lg transition-colors ${
                  accountType === 'tenant'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Locataire</span>
              </button>
            </div>
          </div>


          {/* Champs prénom et nom - uniquement pour l'inscription */}
          {!isLogin && !isResetPassword && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre nom"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre.email@exemple.com"
              />
            </div>
          </div>

          {/* Mot de passe - pas affiché pour la réinitialisation */}
          {!isResetPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation mot de passe - uniquement pour l'inscription */}
          {!isLogin && !isResetPassword && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Chargement...
              </div>
            ) : isResetPassword ? (
              'Envoyer le lien de réinitialisation'
            ) : isLogin ? (
              'Se connecter'
            ) : (
              'S\'inscrire'
            )}
          </button>
        </form>

        {/* Liens de navigation */}
        <div className="text-center space-y-2">
          {isResetPassword ? (
            <button
              onClick={switchToLogin}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Retour à la connexion
            </button>
          ) : isLogin ? (
            <>
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={switchToSignUp}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  S'inscrire
                </button>
              </p>
              <button
                onClick={switchToResetPassword}
                className="block text-blue-600 hover:text-blue-500 text-sm font-medium mx-auto"
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <button
                onClick={switchToLogin}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Se connecter
              </button>
            </p>
          )}
        </div>
       
        
      </div>
    </div>
  );
};

export default LoginForm;