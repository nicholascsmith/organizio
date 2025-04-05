/**
 * Simple State Store for Organizio
 * 
 * This is a lightweight state management system that:
 * - Provides a central place to store application state
 * - Allows components to subscribe to state changes
 * - Persists state between app sessions using the main process
 * - Doesn't require complex libraries or setups
 */

// The store is a singleton
class Store {
  constructor() {
    // Initialize the store with default state
    this.state = {
      // User preferences
      preferences: {
        theme: 'light',
        analyticsEnabled: false
      },
      
      // Feature flags (premium features)
      featureFlags: {},
      
      // Module-specific state
      modules: {
        emailOrganizer: {
          emails: [],
          currentStep: 0,
          userResponses: {}
        },
        accountManager: {
          accounts: [],
          currentStep: 0,
          userResponses: {}
        },
        passwordHygiene: {
          passwords: [],
          currentStep: 0,
          userResponses: {}
        },
        socialMedia: {
          accounts: [],
          currentStep: 0,
          userResponses: {}
        },
        privacyCoach: {
          settings: [],
          currentStep: 0,
          userResponses: {}
        }
      }
    };
    
    // Subscribers map - key is the path, value is array of callback functions
    this.subscribers = new Map();
    
    // Initialize store with data from the main process
    this.initialize();
  }
  
  // Initialize the store with data from main process
  async initialize() {
    try {
      // Load preferences
      const preferences = await window.api.preferences.getPreferences();
      if (preferences) {
        this.state.preferences.theme = preferences.theme || 'light';
        this.state.preferences.analyticsEnabled = preferences.analytics_enabled === 1;
      }
      
      // Load feature flags
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      if (featureFlags && featureFlags.length) {
        const flags = {};
        featureFlags.forEach(flag => {
          flags[flag.feature_name] = {
            enabled: flag.is_enabled === 1,
            premium: flag.is_premium === 1
          };
        });
        this.state.featureFlags = flags;
      }
      
      // Notify subscribers that state has been initialized
      this.notifySubscribers('', this.state);
    } catch (error) {
      console.error('Error initializing store:', error);
    }
  }
  
  // Get a value from the store using a dot-notation path
  get(path) {
    if (!path) return this.state;
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.state);
  }
  
  // Set a value in the store using a dot-notation path
  async set(path, value) {
    if (!path) return false;
    
    // Split the path into parts
    const parts = path.split('.');
    
    // Navigate to the correct part of the state
    let current = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    // Handle special cases that need to be persisted to the main process
    if (path.startsWith('preferences')) {
      await this.persistPreferences();
    } else if (path.startsWith('featureFlags')) {
      await this.persistFeatureFlag(lastPart, value);
    }
    
    // Notify subscribers
    this.notifySubscribers(path, value);
    
    return true;
  }
  
  // Subscribe to changes in the store
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }
    
    const callbacks = this.subscribers.get(path);
    callbacks.push(callback);
    
    // Return an unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  // Notify subscribers of changes
  notifySubscribers(path, value) {
    // Notify subscribers to this exact path
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(callback => callback(value));
    }
    
    // Notify subscribers to parent paths
    const parts = path.split('.');
    while (parts.length > 0) {
      parts.pop();
      const parentPath = parts.join('.');
      
      if (this.subscribers.has(parentPath)) {
        const parentValue = this.get(parentPath);
        this.subscribers.get(parentPath).forEach(callback => callback(parentValue));
      }
    }
    
    // Notify subscribers to the root state
    if (this.subscribers.has('')) {
      this.subscribers.get('').forEach(callback => callback(this.state));
    }
  }
  
  // Persist preferences to the main process
  async persistPreferences() {
    try {
      await window.api.preferences.savePreferences({
        theme: this.state.preferences.theme,
        analytics_enabled: this.state.preferences.analyticsEnabled ? 1 : 0
      });
    } catch (error) {
      console.error('Error persisting preferences:', error);
    }
  }
  
  // Persist a feature flag to the main process
  async persistFeatureFlag(flagName, value) {
    try {
      // Only update if it's a valid feature flag
      if (this.state.featureFlags[flagName]) {
        await window.api.featureFlags.updateFeatureFlag(
          flagName,
          value.enabled ? 1 : 0
        );
      }
    } catch (error) {
      console.error('Error persisting feature flag:', error);
    }
  }
  
  // Reset module state
  resetModuleState(moduleName) {
    const moduleKey = moduleName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    
    if (this.state.modules[moduleKey]) {
      this.state.modules[moduleKey] = {
        ...this.state.modules[moduleKey],
        currentStep: 0,
        userResponses: {}
      };
      
      this.notifySubscribers(`modules.${moduleKey}`, this.state.modules[moduleKey]);
    }
  }
}

// Create and export the store singleton
const store = new Store();
export default store;
