/**
 * Storage Service - localStorage helpers
 */
const storageService = {
  /**
   * Get item from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  /**
   * Clear all localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Get study filter state
   */
  getStudyFilter(entityType, entityId) {
    const key = `study_filter_${entityType}_${entityId}`;
    return this.get(key, 'all');
  },

  /**
   * Set study filter state
   */
  setStudyFilter(entityType, entityId, filter) {
    const key = `study_filter_${entityType}_${entityId}`;
    this.set(key, filter);
  }
};

export default storageService;
