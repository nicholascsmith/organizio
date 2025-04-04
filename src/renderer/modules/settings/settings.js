/**
 * Settings Module
 * 
 * This module allows users to customize their app experience and manage premium features.
 * All settings are stored locally and respect privacy principles.
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'settings') {
    initSettingsModule();
  }
});

// Main initialization function
function initSettingsModule() {
  // DOM Elements
  const themeSelect = document.getElementById('theme-select');
  const analyticsToggle = document.getElementById('analytics-toggle');
  const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
  const clearAnalyticsBtn = document.getElementById('clear-analytics-btn');
  const exportDataBtn = document.getElementById('export-data-btn');
  const managePremiumBtn = document.getElementById('manage-premium-btn');
  const premiumStatusText = document.getElementById('premium-status-text');
  const premiumFeaturesList = document.getElementById('premium-features-list');
  const analyticsModal = document.getElementById('analytics-modal');
  const premiumModal = document.getElementById('premium-modal');
  const analyticsContainer = document.getElementById('analytics-container');
  const premiumFeaturesManager = document.getElementById('premium-features-manager');
  const savePremiumSettingsBtn = document.getElementById('save-premium-settings');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const appVersionElem = document.getElementById('app-version');
  
  // Initialize settings
  initSettings();
  
  // Initialize event listeners
  initEventListeners();
  
  // Initialize settings values
  async function initSettings() {
    try {
      // Load preferences
      const preferences = await window.api.preferences.getPreferences();
      
      // Set theme select value
      if (preferences && preferences.theme) {
        themeSelect.value = preferences.theme;
      }
      
      // Set analytics toggle
      if (preferences) {
        analyticsToggle.checked = preferences.analytics_enabled === 1;
      }
      
      // Load premium features
      await loadPremiumFeatures();
      
      // Set app version
      if (appVersionElem) {
        // In a real app, this would come from package.json or an API call
        appVersionElem.textContent = '0.1.0';
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // Theme select
    themeSelect.addEventListener('change', async () => {
      const theme = themeSelect.value;
      document.body.className = `theme-${theme}`;
      
      try {
        await window.api.preferences.savePreferences({
          theme
        });
        
        // Update store
        store.set('preferences.theme', theme);
        
        // Log theme change
        logAnalyticsEvent('theme_changed', { theme });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    });
    
    // Analytics toggle
    analyticsToggle.addEventListener('change', async () => {
      const analyticsEnabled = analyticsToggle.checked ? 1 : 0;
      
      try {
        await window.api.preferences.savePreferences({
          analytics_enabled: analyticsEnabled
        });
        
        // Update store
        store.set('preferences.analyticsEnabled', analyticsEnabled === 1);
        
        // Log analytics setting change (only if enabled)
        if (analyticsEnabled) {
          logAnalyticsEvent('analytics_setting_changed', { enabled: analyticsEnabled === 1 });
        }
      } catch (error) {
        console.error('Error saving analytics preference:', error);
      }
    });
    
    // View analytics button
    viewAnalyticsBtn.addEventListener('click', async () => {
      await loadAnalyticsData();
      analyticsModal.style.display = 'block';
      
      // Log view analytics
      logAnalyticsEvent('analytics_viewed', { timestamp: new Date().toISOString() });
    });
    
    // Clear analytics button
    clearAnalyticsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
        try {
          await window.api.analytics.clearAnalytics();
          alert('Analytics data cleared successfully.');
          
          // If the modal is open, refresh the data
          if (analyticsModal.style.display === 'block') {
            await loadAnalyticsData();
          }
        } catch (error) {
          console.error('Error clearing analytics data:', error);
          alert('Error clearing analytics data. Please try again.');
        }
      }
    });
    
    // Export data button
    exportDataBtn.addEventListener('click', async () => {
      try {
        // This would typically use a system file picker dialog
        // For simplicity, we'll just mock the export functionality
        alert('This would typically open a file picker. In a real app, this would export all your data to a JSON file.');
        
        // Log export data
        logAnalyticsEvent('data_exported', { timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
      }
    });
    
    // Manage premium button
    managePremiumBtn.addEventListener('click', async () => {
      await loadPremiumFeaturesManager();
      premiumModal.style.display = 'block';
    });
    
    // Save premium settings button
    savePremiumSettingsBtn.addEventListener('click', async () => {
      await savePremiumSettings();
      premiumModal.style.display = 'none';
      
      // Refresh premium features list
      await loadPremiumFeatures();
    });
    
    // Close modal buttons
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        analyticsModal.style.display = 'none';
        premiumModal.style.display = 'none';
      });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
      if (e.target === analyticsModal) {
        analyticsModal.style.display = 'none';
      }
      if (e.target === premiumModal) {
        premiumModal.style.display = 'none';
      }
    });
  }
  
  // Load premium features
  async function loadPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      
      // Check if any premium features are enabled
      const premiumFeatures = featureFlags.filter(flag => flag.is_premium === 1);
      const enabledPremiumFeatures = premiumFeatures.filter(flag => flag.is_enabled === 1);
      
      // Update premium status text
      if (enabledPremiumFeatures.length > 0) {
        premiumStatusText.textContent = 'Premium Enabled';
        managePremiumBtn.textContent = 'Manage Premium Features';
      } else {
        premiumStatusText.textContent = 'Free Version';
        managePremiumBtn.textContent = 'Unlock Premium Features';
      }
      
      // Update premium features list
      if (premiumFeaturesList) {
        if (premiumFeatures.length === 0) {
          premiumFeaturesList.innerHTML = '<p>No premium features available.</p>';
        } else {
          const featuresHTML = `
            <div class="premium-features-grid">
              ${premiumFeatures.map(feature => `
                <div class="premium-feature ${feature.is_enabled === 1 ? 'enabled' : 'disabled'}">
                  <h5>${formatFeatureName(feature.feature_name)}</h5>
                  <p>${getFeatureDescription(feature.feature_name)}</p>
                  <div class="feature-status">
                    ${feature.is_enabled === 1 ? 
                      '<span class="status-enabled">Enabled</span>' : 
                      '<span class="status-disabled">Disabled</span>'}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          
          premiumFeaturesList.innerHTML = featuresHTML;
        }
      }
    } catch (error) {
      console.error('Error loading premium features:', error);
      if (premiumFeaturesList) {
        premiumFeaturesList.innerHTML = '<p>Error loading premium features. Please try again.</p>';
      }
    }
  }
  
  // Load premium features manager
  async function loadPremiumFeaturesManager() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      
      // Filter premium features
      const premiumFeatures = featureFlags.filter(flag => flag.is_premium === 1);
      
      if (premiumFeaturesManager) {
        if (premiumFeatures.length === 0) {
          premiumFeaturesManager.innerHTML = '<p>No premium features available.</p>';
        } else {
          const featuresHTML = `
            <div class="premium-features-toggles">
              ${premiumFeatures.map(feature => `
                <div class="feature-toggle">
                  <div class="feature-toggle-info">
                    <h5>${formatFeatureName(feature.feature_name)}</h5>
                    <p>${getFeatureDescription(feature.feature_name)}</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" class="premium-feature-toggle" 
                      data-feature="${feature.feature_name}" 
                      ${feature.is_enabled === 1 ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              `).join('')}
            </div>
          `;
          
          premiumFeaturesManager.innerHTML = featuresHTML;
        }
      }
    } catch (error) {
      console.error('Error loading premium features manager:', error);
      if (premiumFeaturesManager) {
        premiumFeaturesManager.innerHTML = '<p>Error loading premium features. Please try again.</p>';
      }
    }
  }
  
  // Save premium settings
  async function savePremiumSettings() {
    try {
      const featureToggles = document.querySelectorAll('.premium-feature-toggle');
      
      for (const toggle of featureToggles) {
        const featureName = toggle.getAttribute('data-feature');
        const isEnabled = toggle.checked ? 1 : 0;
        
        await window.api.featureFlags.updateFeatureFlag(featureName, isEnabled);
      }
      
      alert('Premium settings saved successfully.');
      
      // Log premium settings saved
      logAnalyticsEvent('premium_settings_saved', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving premium settings:', error);
      alert('Error saving premium settings. Please try again.');
    }
  }
  
  // Load analytics data
  async function loadAnalyticsData() {
    try {
      const analyticsData = await window.api.analytics.getAnalytics();
      
      if (analyticsContainer) {
        if (analyticsData.length === 0) {
          analyticsContainer.innerHTML = '<p>No analytics data available.</p>';
        } else {
          // Group analytics data by event type
          const eventGroups = {};
          analyticsData.forEach(event => {
            if (!eventGroups[event.event_type]) {
              eventGroups[event.event_type] = [];
            }
            eventGroups[event.event_type].push(event);
          });
          
          // Create HTML for each event type
          let analyticsHTML = `
            <div class="analytics-summary">
              <p><strong>Total events:</strong> ${analyticsData.length}</p>
              <p><strong>Event types:</strong> ${Object.keys(eventGroups).length}</p>
              <p><strong>First event:</strong> ${formatTimestamp(analyticsData[analyticsData.length - 1].timestamp)}</p>
              <p><strong>Latest event:</strong> ${formatTimestamp(analyticsData[0].timestamp)}</p>
            </div>
            
            <div class="analytics-events">
              <h4>Events by Type</h4>
          `;
          
          // Add each event group
          for (const [eventType, events] of Object.entries(eventGroups)) {
            analyticsHTML += `
              <div class="event-group">
                <h5>${formatEventType(eventType)} (${events.length})</h5>
                <table class="events-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${events.slice(0, 5).map(event => `
                      <tr>
                        <td>${formatTimestamp(event.timestamp)}</td>
                        <td>${formatEventData(event.event_data)}</td>
                      </tr>
                    `).join('')}
                    ${events.length > 5 ? `
                      <tr>
                        <td colspan="2" class="more-events">
                          + ${events.length - 5} more events of this type
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            `;
          }
          
          analyticsHTML += `</div>`;
          
          analyticsContainer.innerHTML = analyticsHTML;
        }
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      if (analyticsContainer) {
        analyticsContainer.innerHTML = '<p>Error loading analytics data. Please try again.</p>';
      }
    }
  }
  
  // Helper functions
  
  // Format feature name
  function formatFeatureName(featureName) {
    return featureName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Get feature description
  function getFeatureDescription(featureName) {
    const descriptions = {
      'email_organizer_advanced': 'Advanced email organization tools, templates, and automation.',
      'account_manager_advanced': 'Enhanced account tracking, security scanning, and payment tracking.',
      'password_hygiene_basic': 'Basic password strength assessment and security recommendations.',
      'password_hygiene_advanced': 'Advanced password strength analysis and security tools.',
      'social_media_basic': 'Basic social media account management and decluttering.',
      'social_media_advanced': 'Advanced content cleanup tools and digital footprint analysis.',
      'privacy_coach_basic': 'Essential privacy recommendations and settings guidance.',
      'privacy_coach_advanced': 'Comprehensive privacy assessment and step-by-step guides.',
      'bulk_actions': 'Apply changes to multiple items at once across all modules.',
      'detailed_reports': 'Generate comprehensive reports about your digital organization.'
    };
    
    return descriptions[featureName] || 'Premium feature.';
  }
  
  // Format event type
  function formatEventType(eventType) {
    return eventType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Format timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }
  
  // Format event data
  function formatEventData(eventData) {
    if (!eventData) return 'No details';
    
    try {
      // If it's a JSON string, parse it
      const data = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
      
      // Create a formatted string of key-value pairs
      return Object.entries(data)
        .map(([key, value]) => {
          // Format timestamp values
          if (key === 'timestamp') {
            return `${key}: ${formatTimestamp(value)}`;
          }
          
          // Format arrays and objects
          if (Array.isArray(value)) {
            return `${key}: [${value.join(', ')}]`;
          } else if (typeof value === 'object' && value !== null) {
            return `${key}: ${JSON.stringify(value)}`;
          }
          
          // Format other values
          return `${key}: ${value}`;
        })
        .join(', ');
    } catch (error) {
      return eventData.toString();
    }
  }
}
