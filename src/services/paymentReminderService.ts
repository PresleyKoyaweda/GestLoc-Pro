import { Payment, Tenant, User } from '../types';
import { aiService } from './aiService';

interface ReminderConfig {
  daysBefore: number[];
  enabled: boolean;
  customMessage?: string;
}

class PaymentReminderService {
  private defaultConfig: ReminderConfig = {
    daysBefore: [2, 0], // 2 jours avant et le jour même
    enabled: true
  };

  // Vérifier et envoyer les rappels automatiques
  async checkAndSendReminders(
    payments: Payment[], 
    tenants: Tenant[], 
    users: User[]
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const payment of payments) {
      // Seulement pour les paiements en attente
      if (payment.status !== 'pending') continue;

      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Vérifier si on doit envoyer un rappel
      if (this.defaultConfig.daysBefore.includes(daysDifference)) {
        await this.sendPaymentReminder(payment, tenants, users, daysDifference);
      }
    }
  }

  // Envoyer un rappel de paiement personnalisé
  private async sendPaymentReminder(
    payment: Payment, 
    tenants: Tenant[], 
    users: User[], 
    daysUntilDue: number
  ): Promise<void> {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (!tenant) return;

    const tenantUser = users.find(u => u.id === tenant.userId);
    if (!tenantUser) return;

    // Déterminer le type de rappel
    const reminderType = daysUntilDue === 0 ? 'same_day' : 'advance';
    
    // Préparer le contexte pour l'IA
    const context = {
      tenantName: `${tenantUser.firstName} ${tenantUser.lastName}`,
      tenantProfile: {
        paymentHistory: this.getPaymentHistory(payment.tenantId, []), // Historique simplifié
        communicationStyle: 'friendly',
        language: tenantUser.preferences.language || 'fr'
      },
      situation: this.buildSituationText(payment, daysUntilDue),
      urgency: daysUntilDue === 0 ? 'high' : 'medium',
      communicationPreference: tenantUser.preferences.aiCommunication || 'email'
    };

    try {
      // Générer le message avec l'IA
      const aiResponse = await aiService.generateCommunication(
        tenantUser.id,
        'payment_reminder',
        context,
        this.getCustomInstructions(reminderType, tenantUser.preferences.language || 'fr')
      );

      // Envoyer selon la préférence
      await this.sendMessage(
        tenantUser,
        aiResponse.message,
        aiResponse.subject,
        context.communicationPreference
      );

      console.log(`📧 Rappel de paiement envoyé à ${tenantUser.email} via ${context.communicationPreference}`);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      
      // Fallback avec message par défaut
      await this.sendFallbackReminder(tenantUser, payment, daysUntilDue);
    }
  }

  // Instructions personnalisées pour l'IA selon le type de rappel
  private getCustomInstructions(reminderType: string, language: string): string {
    const instructions = {
      fr: {
        advance: `
          Génère un rappel de paiement amical et professionnel pour dans 2 jours.
          - Ton bienveillant et courtois
          - Rappeler les détails du paiement
          - Proposer les moyens de paiement disponibles
          - Inclure les coordonnées en cas de question
          - Mentionner l'importance du respect des échéances
        `,
        same_day: `
          Génère un rappel urgent mais respectueux pour le jour même.
          - Ton plus direct mais toujours professionnel
          - Souligner que c'est le jour d'échéance
          - Proposer des solutions rapides de paiement
          - Mentionner les conséquences d'un retard
          - Offrir de l'aide en cas de difficulté
        `
      },
      en: {
        advance: `
          Generate a friendly and professional payment reminder for 2 days ahead.
          - Kind and courteous tone
          - Remind payment details
          - Suggest available payment methods
          - Include contact information for questions
          - Mention the importance of meeting deadlines
        `,
        same_day: `
          Generate an urgent but respectful same-day reminder.
          - More direct but still professional tone
          - Emphasize it's the due date
          - Suggest quick payment solutions
          - Mention consequences of late payment
          - Offer help in case of difficulty
        `
      }
    };

    return instructions[language as keyof typeof instructions]?.[reminderType as keyof typeof instructions.fr] || 
           instructions.fr[reminderType as keyof typeof instructions.fr];
  }

  // Construire le texte de situation pour l'IA
  private buildSituationText(payment: Payment, daysUntilDue: number): string {
    const dueDate = new Date(payment.dueDate).toLocaleDateString('fr-FR');
    
    if (daysUntilDue === 0) {
      return `Le loyer de ${payment.amount}$ est dû aujourd'hui (${dueDate}). Merci de procéder au paiement dans les plus brefs délais.`;
    } else {
      return `Le loyer de ${payment.amount}$ sera dû dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''} (${dueDate}). Pensez à préparer votre paiement.`;
    }
  }

  // Obtenir l'historique de paiement simplifié
  private getPaymentHistory(tenantId: string, allPayments: Payment[]): string {
    const tenantPayments = allPayments.filter(p => p.tenantId === tenantId);
    const paidOnTime = tenantPayments.filter(p => p.status === 'paid').length;
    const total = tenantPayments.length;
    
    if (total === 0) return 'new';
    if (paidOnTime / total > 0.9) return 'excellent';
    if (paidOnTime / total > 0.7) return 'good';
    return 'average';
  }

  // Envoyer le message selon la préférence
  private async sendMessage(
    user: User, 
    message: string, 
    subject: string, 
    method: 'email' | 'sms'
  ): Promise<void> {
    if (method === 'email') {
      await this.sendEmail(user.email, subject, message);
    } else if (method === 'sms' && user.phone) {
      await this.sendSMS(user.phone, message);
    }
  }

  // Envoyer un email
  private async sendEmail(email: string, subject: string, message: string): Promise<void> {
    // En mode démo, simuler l'envoi
    console.log(`📧 EMAIL envoyé à ${email}`);
    console.log(`📋 Sujet: ${subject}`);
    console.log(`💬 Message: ${message}`);
    
    // Dans un vrai système, utiliser un service comme SendGrid, Mailgun, etc.
    // await emailService.send({ to: email, subject, html: message });
  }

  // Envoyer un SMS
  private async sendSMS(phone: string, message: string): Promise<void> {
    // En mode démo, simuler l'envoi
    console.log(`📱 SMS envoyé au ${phone}`);
    console.log(`💬 Message: ${message}`);
    
    // Dans un vrai système, utiliser un service comme Twilio, etc.
    // await smsService.send({ to: phone, body: message });
  }

  // Message de secours si l'IA échoue
  private async sendFallbackReminder(
    user: User, 
    payment: Payment, 
    daysUntilDue: number
  ): Promise<void> {
    const dueDate = new Date(payment.dueDate).toLocaleDateString('fr-FR');
    const urgencyText = daysUntilDue === 0 ? 'aujourd\'hui' : `dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`;
    
    const fallbackMessage = `
Bonjour ${user.firstName},

Rappel de paiement de loyer :
💰 Montant : ${payment.amount}$ CAD
📅 Échéance : ${urgencyText} (${dueDate})

Merci de procéder au paiement selon les modalités convenues.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
GestionLoc Pro
    `.trim();

    await this.sendMessage(
      user,
      fallbackMessage,
      `Rappel de loyer - ${payment.amount}$ dû ${urgencyText}`,
      user.preferences.aiCommunication || 'email'
    );
  }

  // Configurer les rappels personnalisés
  setReminderConfig(config: Partial<ReminderConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  // Obtenir la configuration actuelle
  getReminderConfig(): ReminderConfig {
    return { ...this.defaultConfig };
  }
}

export const paymentReminderService = new PaymentReminderService();