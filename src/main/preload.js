const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Database operations
    database: {
      // Email organizer operations
      getEmails: () => ipcRenderer.invoke('get-emails'),
      saveEmail: (email) => ipcRenderer.invoke('save-email', email),
      updateEmail: (id, email) => ipcRenderer.invoke('update-email', id, email),
      deleteEmail: (id) => ipcRenderer.invoke('delete-email', id),
      
      // Account manager operations
      getAccounts: () => ipcRenderer.invoke('get-accounts'),
      saveAccount: (account) => ipcRenderer.invoke('save-account', account),
      updateAccount: (id, account) => ipcRenderer.invoke('update-account', id, account),
      deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
      
      // Password hygiene operations
      getPasswords: () => ipcRenderer.invoke('get-passwords'),
      savePassword: (password) => ipcRenderer.invoke('save-password', password),
      updatePassword: (id, password) => ipcRenderer.invoke('update-password', id, password),
      deletePassword: (id) => ipcRenderer.invoke('delete-password', id),
      
      // Social media operations
      getSocialAccounts: () => ipcRenderer.invoke('get-social-accounts'),
      saveSocialAccount: (account) => ipcRenderer.invoke('save-social-account', account),
      updateSocialAccount: (id, account) => ipcRenderer.invoke('update-social-account', id, account),
      deleteSocialAccount: (id) => ipcRenderer.invoke('delete-social-account', id),
      
      // Privacy coach operations
      getPrivacySettings: () => ipcRenderer.invoke('get-privacy-settings'),
      savePrivacySetting: (setting) => ipcRenderer.invoke('save-privacy-setting', setting),
      updatePrivacySetting: (id, setting) => ipcRenderer.invoke('update-privacy-setting', id, setting),
      deletePrivacySetting: (id) => ipcRenderer.invoke('delete-privacy-setting', id),
    },
    
    // User preferences
    preferences: {
      getPreferences: () => ipcRenderer.invoke('get-preferences'),
      savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences),
    },
    
    // Feature flags for premium features
    featureFlags: {
      getFeatureFlags: () => ipcRenderer.invoke('get-feature-flags'),
      updateFeatureFlag: (flag, value) => ipcRenderer.invoke('update-feature-flag', flag, value),
    },
    
    // Analytics (opt-in only)
    analytics: {
      getAnalytics: () => ipcRenderer.invoke('get-analytics'),
      saveAnalyticsEvent: (event) => ipcRenderer.invoke('save-analytics-event', event),
      clearAnalytics: () => ipcRenderer.invoke('clear-analytics'),
    }
  }
);
