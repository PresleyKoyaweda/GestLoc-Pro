import { Property, Unit, Payment, Expense, Tenant } from '../types';

export interface PropertyProfitAnalysis {
  propertyId: string;
  propertyName: string;
  period: {
    month: number;
    year: number;
  };
  revenues: {
    totalRent: number;
    paidRent: number;
    pendingRent: number;
    occupancyRate: number;
  };
  expenses: {
    mortgage: number;
    fixedCharges: number;
    maintenance: number;
    other: number;
    total: number;
  };
  netProfit: {
    gross: number; // Revenus - hypothèque - charges fixes
    net: number; // Revenus - toutes les dépenses
    margin: number; // Pourcentage de marge
  };
  cashFlow: number; // Flux de trésorerie mensuel
  roi: {
    monthly: number; // ROI mensuel
    annual: number; // ROI annuel projeté
  };
}

export interface PortfolioProfitSummary {
  period: {
    month: number;
    year: number;
  };
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  averageMargin: number;
  totalCashFlow: number;
  properties: PropertyProfitAnalysis[];
  topPerformers: PropertyProfitAnalysis[];
  underPerformers: PropertyProfitAnalysis[];
}

class ProfitCalculationService {
  
  /**
   * Calcule l'analyse de profit pour une propriété donnée
   */
  calculatePropertyProfit(
    property: Property,
    units: Unit[],
    tenants: Tenant[],
    payments: Payment[],
    expenses: Expense[],
    month: number,
    year: number
  ): PropertyProfitAnalysis {
    
    // Filtrer les données pour la période
    const periodPayments = payments.filter(p => {
      const paymentDate = new Date(p.dueDate);
      return paymentDate.getMonth() === month && 
             paymentDate.getFullYear() === year &&
             this.isPaymentForProperty(p, property, tenants);
    });

    const periodExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === month && 
             expenseDate.getFullYear() === year &&
             e.propertyId === property.id;
    });

    // Calcul des revenus
    const totalRent = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidRent = periodPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingRent = totalRent - paidRent;

    // Calcul du taux d'occupation
    const occupancyRate = this.calculateOccupancyRate(property, units, tenants);

    // Calcul des dépenses
    const mortgage = property.monthlyMortgage || 0;
    const fixedCharges = property.monthlyFixedCharges || 0;
    const maintenanceExpenses = periodExpenses
      .filter(e => e.type === 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0);
    const otherExpenses = periodExpenses
      .filter(e => e.type !== 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = mortgage + fixedCharges + maintenanceExpenses + otherExpenses;

    // Calcul des profits
    const grossProfit = paidRent - mortgage - fixedCharges;
    const netProfit = paidRent - totalExpenses;
    const margin = paidRent > 0 ? (netProfit / paidRent) * 100 : 0;
    const cashFlow = netProfit;

    // Calcul du ROI
    const monthlyROI = property.purchasePrice && property.purchasePrice > 0 
      ? (netProfit / property.purchasePrice) * 100 
      : 0;
    const annualROI = monthlyROI * 12;

    return {
      propertyId: property.id,
      propertyName: property.name,
      period: { month, year },
      revenues: {
        totalRent,
        paidRent,
        pendingRent,
        occupancyRate
      },
      expenses: {
        mortgage,
        fixedCharges,
        maintenance: maintenanceExpenses,
        other: otherExpenses,
        total: totalExpenses
      },
      netProfit: {
        gross: grossProfit,
        net: netProfit,
        margin
      },
      cashFlow,
      roi: {
        monthly: monthlyROI,
        annual: annualROI
      }
    };
  }

  /**
   * Calcule le résumé de profit pour tout le portefeuille
   */
  calculatePortfolioProfit(
    properties: Property[],
    units: Unit[],
    tenants: Tenant[],
    payments: Payment[],
    expenses: Expense[],
    month: number,
    year: number
  ): PortfolioProfitSummary {
    
    const propertyAnalyses = properties.map(property => 
      this.calculatePropertyProfit(property, units, tenants, payments, expenses, month, year)
    );

    const totalRevenues = propertyAnalyses.reduce((sum, p) => sum + p.revenues.paidRent, 0);
    const totalExpenses = propertyAnalyses.reduce((sum, p) => sum + p.expenses.total, 0);
    const netProfit = totalRevenues - totalExpenses;
    const averageMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;
    const totalCashFlow = propertyAnalyses.reduce((sum, p) => sum + p.cashFlow, 0);

    // Identifier les meilleures et moins bonnes performances
    const sortedByMargin = [...propertyAnalyses].sort((a, b) => b.netProfit.margin - a.netProfit.margin);
    const topPerformers = sortedByMargin.slice(0, 3).filter(p => p.netProfit.margin > 0);
    const underPerformers = sortedByMargin.slice(-3).filter(p => p.netProfit.margin < 10);

    return {
      period: { month, year },
      totalRevenues,
      totalExpenses,
      netProfit,
      averageMargin,
      totalCashFlow,
      properties: propertyAnalyses,
      topPerformers,
      underPerformers
    };
  }

  /**
   * Vérifie si un paiement appartient à une propriété
   */
  private isPaymentForProperty(payment: Payment, property: Property, tenants: Tenant[]): boolean {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    return tenant?.propertyId === property.id;
  }

  /**
   * Calcule le taux d'occupation d'une propriété
   */
  private calculateOccupancyRate(property: Property, units: Unit[], tenants: Tenant[]): number {
    if (property.type === 'entire') {
      const propertyTenants = tenants.filter(t => t.propertyId === property.id);
      return propertyTenants.length > 0 ? 100 : 0;
    } else {
      const propertyUnits = units.filter(u => u.propertyId === property.id);
      const occupiedUnits = tenants.filter(t => t.propertyId === property.id).length;
      return propertyUnits.length > 0 ? (occupiedUnits / propertyUnits.length) * 100 : 0;
    }
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  generateRecommendations(analysis: PropertyProfitAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.netProfit.margin < 5) {
      recommendations.push("Marge très faible - Considérez augmenter le loyer ou réduire les dépenses");
    }

    if (analysis.revenues.occupancyRate < 90) {
      recommendations.push("Taux d'occupation faible - Améliorez la commercialisation");
    }

    if (analysis.expenses.maintenance > analysis.revenues.paidRent * 0.1) {
      recommendations.push("Coûts de maintenance élevés - Planifiez une maintenance préventive");
    }

    if (analysis.netProfit.margin > 20) {
      recommendations.push("Excellente rentabilité - Considérez l'expansion du portefeuille");
    }

    if (analysis.revenues.pendingRent > 0) {
      recommendations.push("Paiements en attente - Activez les rappels automatiques");
    }

    return recommendations;
  }

  /**
   * Calcule les projections pour les mois suivants
   */
  calculateProjections(
    analysis: PropertyProfitAnalysis,
    monthsAhead: number = 12
  ): Array<{ month: number; year: number; projectedProfit: number; projectedCashFlow: number }> {
    const projections = [];
    const baseDate = new Date(analysis.period.year, analysis.period.month);

    for (let i = 1; i <= monthsAhead; i++) {
      const projectionDate = new Date(baseDate);
      projectionDate.setMonth(baseDate.getMonth() + i);

      // Projection simple basée sur la performance actuelle
      // Dans un vrai système, on pourrait inclure la saisonnalité, l'inflation, etc.
      const projectedProfit = analysis.netProfit.net * (1 + (analysis.revenues.occupancyRate / 100));
      const projectedCashFlow = analysis.cashFlow * (1 + (analysis.revenues.occupancyRate / 100));

      projections.push({
        month: projectionDate.getMonth(),
        year: projectionDate.getFullYear(),
        projectedProfit,
        projectedCashFlow
      });
    }

    return projections;
  }
}

export const profitCalculationService = new ProfitCalculationService();