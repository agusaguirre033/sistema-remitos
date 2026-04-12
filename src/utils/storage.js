// src/utils/storage.js

/**
 * Utilidad para manejo de localStorage
 * Simula la API de window.storage de Claude
 */

export const storage = {
  /**
   * Obtener un valor del localStorage
   * @param {string} key - La clave a buscar
   * @returns {Promise<{key: string, value: string}>}
   */
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        throw new Error(`Key "${key}" not found`);
      }
      return { key, value };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Guardar un valor en localStorage
   * @param {string} key - La clave
   * @param {string} value - El valor a guardar
   * @returns {Promise<{key: string, value: string}>}
   */
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return null;
    }
  },

  /**
   * Eliminar una clave del localStorage
   * @param {string} key - La clave a eliminar
   * @returns {Promise<{key: string, deleted: boolean}>}
   */
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return null;
    }
  },

  /**
   * Listar todas las claves, opcionalmente con un prefijo
   * @param {string} prefix - Prefijo opcional para filtrar claves
   * @returns {Promise<{keys: string[]}>}
   */
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    } catch (error) {
      console.error('Error listing keys:', error);
      return { keys: [] };
    }
  },

  /**
   * Limpiar todo el localStorage
   */
  async clear() {
    try {
      localStorage.clear();
      return { cleared: true };
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return { cleared: false };
    }
  }
};

// Hacer disponible globalmente (opcional)
if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;