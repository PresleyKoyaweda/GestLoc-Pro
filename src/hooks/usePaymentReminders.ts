import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../contexts/AuthContext';
import { Payment, Tenant, User } from '../types';
import { paymentReminderService } from '../services/paymentReminderService';

export function usePaymentReminders() {
  const { user } = useAuth();
  const [payments] = useLocalStorage<Payment[]>('gestionloc_payments', []);
  const [tenants] = useLocalStorage<Tenant[]>('gestionloc_tenants', []);
  const [users] = useLocalStorage<User[]>('gestionloc_users', []);

  // Vérifier les rappels automatiquement
  useEffect(() => {
    if (!user || user.role !== 'owner') return;

    const checkReminders = async () => {
      try {
        await paymentReminderService.checkAndSendReminders(payments, tenants, users);
      } catch (error) {
        console.error('Erreur lors de la vérification des rappels:', error);
      }
    };

    // Vérifier immédiatement
    checkReminders();

    // Puis vérifier toutes les heures
    const interval = setInterval(checkReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [payments, tenants, users, user]);

  // Envoyer un rappel manuel
  const sendManualReminder = async (paymentId: string, customMessage?: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (!tenant) return;

    const tenantUser = users.find(u => u.id === tenant.userId);
    if (!tenantUser) return;

    try {
      // Utiliser le service de rappel avec message personnalisé
      if (customMessage) {
        paymentReminderService.setReminderConfig({ 
          enabled: true,
          customMessage 
        });
      }

      const today = new Date();
      const dueDate = new Date(payment.dueDate);
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      await paymentReminderService['sendPaymentReminder'](payment, tenants, users, daysDifference);
      
      return { success: true, message: 'Rappel envoyé avec succès' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel manuel:', error);
      return { success: false, message: 'Erreur lors de l\'envoi' };
    }
  };

  return {
    sendManualReminder,
    reminderConfig: paymentReminderService.getReminderConfig(),
    setReminderConfig: paymentReminderService.setReminderConfig.bind(paymentReminderService)
  };
}