import { useState, useEffect } from 'react';

// Fonction pour détecter et convertir les chaînes de date ISO 8601 en objets Date
const dateReviver = (key: string, value: any) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
    return new Date(value);
  }
  return value;
};

// Fonction utilitaire pour nettoyer les données corrompues
const cleanStorageData = (key: string, data: any) => {
  try {
    if (Array.isArray(data)) {
      return data.filter(item => item && typeof item === 'object' && item.id);
    }
    return data;
  } catch (error) {
    console.warn(`Cleaning corrupted data for key "${key}":`, error);
    return null;
  }
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item, dateReviver);
        const cleaned = cleanStorageData(key, parsed);
        return cleaned !== null ? cleaned : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const cleanedValue = cleanStorageData(key, valueToStore);
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(cleanedValue || valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}