import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { profitCalculationService, PropertyProfitAnalysis, PortfolioProfitSummary } from '../services/profitCalculationService';
import { Property, Unit, Tenant, Payment, Expense } from '../types';

export function useProfitCalculation() {
  const [properties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [payments] = useLocalStorage<Payment[]>('gestionloc_payments', []);
  const [expenses] = useLocalStorage<Expense[]>('gestionloc_expenses', []);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<PortfolioProfitSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcul automatique pour le mois en cours
  useEffect(() => {
    const calculateCurrentMonth = async () => {
      setIsCalculating(true);
      try {
        const now = new Date();
        const analysis = profitCalculationService.calculatePortfolioProfit(
          properties,
          units,
          tenants,
          payments,
          expenses,
          now.getMonth(),
          now.getFullYear()
        );
        setCurrentAnalysis(analysis);
      } catch (error) {
        console.error('Erreur lors du calcul des profits:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    if (properties.length > 0) {
      calculateCurrentMonth();
    }
  }, [properties, units, tenants, payments, expenses]);

  // Calcul pour une période spécifique
  const calculateForPeriod = (month: number, year: number): PortfolioProfitSummary => {
    return profitCalculationService.calculatePortfolioProfit(
      properties,
      units,
      tenants,
      payments,
      expenses,
      month,
      year
    );
  };

  // Calcul pour une propriété spécifique
  const calculateForProperty = (propertyId: string, month: number, year: number): PropertyProfitAnalysis | null => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    return profitCalculationService.calculatePropertyProfit(
      property,
      units,
      tenants,
      payments,
      expenses,
      month,
      year
    );
  };

  // Générer des recommandations
  const getRecommendations = (propertyId: string): string[] => {
    if (!currentAnalysis) return [];
    
    const propertyAnalysis = currentAnalysis.properties.find(p => p.propertyId === propertyId);
    if (!propertyAnalysis) return [];

    return profitCalculationService.generateRecommendations(propertyAnalysis);
  };

  // Calculer les projections
  const getProjections = (propertyId: string, monthsAhead: number = 12) => {
    if (!currentAnalysis) return [];
    
    const propertyAnalysis = currentAnalysis.properties.find(p => p.propertyId === propertyId);
    if (!propertyAnalysis) return [];

    return profitCalculationService.calculateProjections(propertyAnalysis, monthsAhead);
  };

  // Obtenir le top/bottom performers
  const getTopPerformers = () => currentAnalysis?.topPerformers || [];
  const getUnderPerformers = () => currentAnalysis?.underPerformers || [];

  // Calculer l'évolution sur plusieurs mois
  const calculateTrend = (propertyId: string, monthsBack: number = 6) => {
    const trends = [];
    const now = new Date();
    
    for (let i = monthsBack; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      const analysis = calculateForProperty(propertyId, date.getMonth(), date.getFullYear());
      if (analysis) {
        trends.push({
          month: date.getMonth(),
          year: date.getFullYear(),
          netProfit: analysis.netProfit.net,
          margin: analysis.netProfit.margin,
          cashFlow: analysis.cashFlow
        });
      }
    }
    
    return trends;
  };

  return {
    currentAnalysis,
    isCalculating,
    calculateForPeriod,
    calculateForProperty,
    getRecommendations,
    getProjections,
    getTopPerformers,
    getUnderPerformers,
    calculateTrend
  };
}