// Import module scripts
import './modules/email-organizer/email-organizer.js';
import './modules/account-manager/account-manager.js';
import './modules/password-hygiene/password-hygiene.js';
import './modules/social-media/social-media.js';
import './modules/privacy-coach/privacy-coach.js';
import './state/store.js'; // Import the state store

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links a');
const moduleContainer = document.getElementById('module-container');
const pageTitle = document.getElementById('page-title');
const themeSwitch = document.getElementById('theme-switch');
const premiumBtn = document.getElementById('premium-btn');
const premiumModal = document.getElementById('premium-modal');
const closeModal = document.querySelector('.close-modal');
const unlockPremiumBtn = document.getElementById('unlock-premium');

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
  // Load user preferences
  await loadPreferences();
  
  // Load modules
  loadModules();
  
  // Initialize event listeners
  initEventListeners();
  
  // Check for premium features
  checkPremiumFeatures();
  
  // Log app start for analytics (if enabled)
  logAnalyticsEvent('app_start', { timestamp: new Date().toISOString() });
});

// Load user preferences
async function loadPreferences() {
  try {
    const preferences = await window.api.preferences.getPreferences();
    
    // Apply theme
    if (preferences && preferences.theme) {
      document.body.className = `theme-${preferences.theme}`;
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

// Load module HTML dynamically
function loadModules() {
  const modules = [
    'email-organizer', 
    'account-manager', 
    'password-hygiene', 
    'social-media', 
    'privacy-coach',
    'settings'
  ];
  
  // Create module placeholders
  modules.forEach(moduleName => {
    if (!document.getElementById(moduleName)) {
      const moduleDiv = document.createElement('div');
      moduleDiv.id = moduleName;
      moduleDiv.className = 'module';
      moduleDiv.innerHTML = `<div class="loading-module">Loading ${moduleName.replace('-', ' ')}...</div>`;
      moduleContainer.appendChild(moduleDiv);
    }
  });
}

// Initialize event listeners
function initEventListeners() {
  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const module = this.getAttribute('data-module');
      navigateTo(module);
    });
  });
  
  // Card navigation buttons
  document.querySelectorAll('[data-navigate]').forEach(button => {
    button.addEventListener('click', function() {
      const module = this.getAttribute('data-navigate');
      navigateTo(module);
    });
  });
  
  // Theme switcher
  themeSwitch.addEventListener('click', toggleTheme);
  
  // Premium button
  premiumBtn.addEventListener('click', () => {
    premiumModal.style.display = 'block';
  });
  
  // Close modal
  closeModal.addEventListener('click', () => {
    premiumModal.style.display = 'none';
  });
  
  // Click outside modal to close
  window.addEventListener('click', (e) => {
    if (e.target === premiumModal) {
      premiumModal.style.display = 'none';
    }
  });
  
  // Unlock premium button
  unlockPremiumBtn.addEventListener('click', unlockPremiumFeatures);
}

// Navigation function
function navigateTo(module) {
  // Hide all modules
  document.querySelectorAll('.module').forEach(mod => {
    mod.classList.remove('active');
  });
  
  // Show selected module
  const selectedModule = document.getElementById(module);
  if (selectedModule) {
    selectedModule.classList.add('active');
    
    // If the module hasn't been loaded yet, load it
    if (selectedModule.querySelector('.loading-module')) {
      loadModuleContent(module);
    }
  }
  
  // Update active link in navbar
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-module') === module) {
      link.classList.add('active');
    }
  });
  
  // Update page title
  pageTitle.textContent = module.replace('-', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Log page view for analytics (if enabled)
  logAnalyticsEvent('page_view', { module });
}

// Toggle theme between light and dark
async function toggleTheme() {
  const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.className = `theme-${newTheme}`;
  
  // Save theme preference
  try {
    await window.api.preferences.savePreferences({
      theme: newTheme
    });
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}

// Load module content
async function loadModuleContent(moduleName) {
  const moduleElement = document.getElementById(moduleName);
  
  if (!moduleElement) return;
  
  try {
    // Get the module content from separate files
    const response = await fetch(`./modules/${moduleName}/${moduleName}.html`);
    
    if (response.ok) {
      const html = await response.text();
      moduleElement.innerHTML = html;
      
      // Initialize module-specific JS
      // This will happen automatically due to the import at the top
      const event = new CustomEvent('module-loaded', { detail: { module: moduleName } });
      document.dispatchEvent(event);
    } else {
      moduleElement.innerHTML = `<p>Error loading ${moduleName} module.</p>`;
    }
  } catch (error) {
    console.error(`Error loading ${moduleName} module:`, error);
    moduleElement.innerHTML = `<p>Error loading ${moduleName} module.</p>`;
  }
}

// Check premium features
async function checkPremiumFeatures() {
  try {
    const featureFlags = await window.api.featureFlags.getFeatureFlags();
    
    // Check if any premium features are enabled
    const hasPremium = featureFlags.some(flag => flag.is_premium === 1 && flag.is_enabled === 1);
    
    // Update UI based on premium status
    if (hasPremium) {
      premiumBtn.innerHTML = '✨ Premium Enabled';
      premiumBtn.classList.add('premium-enabled');
    }
  } catch (error) {
    console.error('Error checking premium features:', error);
  }
}

// Unlock premium features
async function unlockPremiumFeatures() {
  try {
    const featureFlags = await window.api.featureFlags.getFeatureFlags();
    
    // Enable all premium features
    for (const flag of featureFlags) {
      if (flag.is_premium === 1) {
        await window.api.featureFlags.updateFeatureFlag(flag.feature_name, 1);
      }
    }
    
    // Update UI
    premiumBtn.innerHTML = '✨ Premium Enabled';
    premiumBtn.classList.add('premium-enabled');
    
    // Close modal
    premiumModal.style.display = 'none';
    
    // Show success message
    alert('Premium features unlocked successfully!');
    
    // Log premium unlocked for analytics (if enabled)
    logAnalyticsEvent('premium_unlocked', { timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error unlocking premium features:', error);
    alert('Error unlocking premium features. Please try again.');
  }
}

// Log analytics event (if enabled)
async function logAnalyticsEvent(eventType, eventData) {
  try {
    const preferences = await window.api.preferences.getPreferences();
    
    // Only log if analytics are enabled
    if (preferences && preferences.analytics_enabled === 1) {
      await window.api.analytics.saveAnalyticsEvent({
        type: eventType,
        data: eventData
      });
    }
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
}

// Export functions that may be needed by other modules
export {
  navigateTo,
  logAnalyticsEvent
};
