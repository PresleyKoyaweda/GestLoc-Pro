import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('gestionloc_notifications', []);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read && n.userId === userId).length;

  return {
    notifications: notifications.filter(n => n.userId === userId),
    addNotification,
    markAsRead,
    unreadCount,
  };
}