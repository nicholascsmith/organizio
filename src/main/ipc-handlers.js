/**
 * IPC Handlers for database operations
 * This file sets up all the IPC handlers that allow the renderer process
 * to communicate with the main process for database operations
 */

module.exports = function(ipcMain, db) {
  // ==== Email Organizer Handlers ====
  ipcMain.handle('get-emails', async () => {
    try {
      return db.getAll('emails');
    } catch (error) {
      console.error('Error getting emails:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-email', async (event, email) => {
    try {
      return db.insert('emails', email);
    } catch (error) {
      console.error('Error saving email:', error);
      return null;
    }
  });
  
  ipcMain.handle('update-email', async (event, id, email) => {
    try {
      return db.update('emails', id, email);
    } catch (error) {
      console.error('Error updating email:', error);
      return null;
    }
  });
  
  ipcMain.handle('delete-email', async (event, id) => {
    try {
      return db.delete('emails', id);
    } catch (error) {
      console.error('Error deleting email:', error);
      return null;
    }
  });
  
  // ==== Account Manager Handlers ====
  ipcMain.handle('get-accounts', async () => {
    try {
      return db.getAll('accounts');
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-account', async (event, account) => {
    try {
      return db.insert('accounts', account);
    } catch (error) {
      console.error('Error saving account:', error);
      return null;
    }
  });
  
  ipcMain.handle('update-account', async (event, id, account) => {
    try {
      return db.update('accounts', id, account);
    } catch (error) {
      console.error('Error updating account:', error);
      return null;
    }
  });
  
  ipcMain.handle('delete-account', async (event, id) => {
    try {
      return db.delete('accounts', id);
    } catch (error) {
      console.error('Error deleting account:', error);
      return null;
    }
  });
  
  // ==== Password Hygiene Handlers ====
  ipcMain.handle('get-passwords', async () => {
    try {
      return db.getAll('password_hygiene');
    } catch (error) {
      console.error('Error getting password info:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-password', async (event, password) => {
    try {
      return db.insert('password_hygiene', password);
    } catch (error) {
      console.error('Error saving password info:', error);
      return null;
    }
  });
  
  ipcMain.handle('update-password', async (event, id, password) => {
    try {
      return db.update('password_hygiene', id, password);
    } catch (error) {
      console.error('Error updating password info:', error);
      return null;
    }
  });
  
  ipcMain.handle('delete-password', async (event, id) => {
    try {
      return db.delete('password_hygiene', id);
    } catch (error) {
      console.error('Error deleting password info:', error);
      return null;
    }
  });
  
  // ==== Social Media Handlers ====
  ipcMain.handle('get-social-accounts', async () => {
    try {
      return db.getAll('social_media');
    } catch (error) {
      console.error('Error getting social accounts:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-social-account', async (event, account) => {
    try {
      return db.insert('social_media', account);
    } catch (error) {
      console.error('Error saving social account:', error);
      return null;
    }
  });
  
  ipcMain.handle('update-social-account', async (event, id, account) => {
    try {
      return db.update('social_media', id, account);
    } catch (error) {
      console.error('Error updating social account:', error);
      return null;
    }
  });
  
  ipcMain.handle('delete-social-account', async (event, id) => {
    try {
      return db.delete('social_media', id);
    } catch (error) {
      console.error('Error deleting social account:', error);
      return null;
    }
  });
  
  // ==== Privacy Coach Handlers ====
  ipcMain.handle('get-privacy-settings', async () => {
    try {
      return db.getAll('privacy_settings');
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-privacy-setting', async (event, setting) => {
    try {
      return db.insert('privacy_settings', setting);
    } catch (error) {
      console.error('Error saving privacy setting:', error);
      return null;
    }
  });
  
  ipcMain.handle('update-privacy-setting', async (event, id, setting) => {
    try {
      return db.update('privacy_settings', id, setting);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      return null;
    }
  });
  
  ipcMain.handle('delete-privacy-setting', async (event, id) => {
    try {
      return db.delete('privacy_settings', id);
    } catch (error) {
      console.error('Error deleting privacy setting:', error);
      return null;
    }
  });
  
  // ==== Preferences Handlers ====
  ipcMain.handle('get-preferences', async () => {
    try {
      return db.getPreferences();
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  });
  
  ipcMain.handle('save-preferences', async (event, preferences) => {
    try {
      return db.updatePreferences(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      return null;
    }
  });
  
  // ==== Feature Flags Handlers ====
  ipcMain.handle('get-feature-flags', async () => {
    try {
      return db.getFeatureFlags();
    } catch (error) {
      console.error('Error getting feature flags:', error);
      return [];
    }
  });
  
  ipcMain.handle('update-feature-flag', async (event, flag, value) => {
    try {
      return db.updateFeatureFlag(flag, value);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return null;
    }
  });
  
  // ==== Analytics Handlers (opt-in only) ====
  ipcMain.handle('get-analytics', async () => {
    try {
      return db.getAnalytics();
    } catch (error) {
      console.error('Error getting analytics:', error);
      return [];
    }
  });
  
  ipcMain.handle('save-analytics-event', async (event, analyticsEvent) => {
    try {
      return db.addAnalyticsEvent(analyticsEvent.type, analyticsEvent.data);
    } catch (error) {
      console.error('Error saving analytics event:', error);
      return null;
    }
  });
  
  ipcMain.handle('clear-analytics', async () => {
    try {
      return db.clearAnalytics();
    } catch (error) {
      console.error('Error clearing analytics:', error);
      return null;
    }
  });
};
