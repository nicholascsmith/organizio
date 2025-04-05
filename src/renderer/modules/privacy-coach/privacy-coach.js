/**
 * Privacy Coach Module
 * 
 * This module helps users enhance their digital privacy.
 * It follows a four-step flow:
 * 1. Discovery: Ask questions to understand the user's privacy concerns
 * 2. Decision Point: Add privacy settings and assess importance
 * 3. Recommendations: Generate personalized recommendations
 * 4. Action Plan: Create a step-by-step action plan
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'privacy-coach') {
    initPrivacyCoachModule();
  }
});

// Main initialization function
function initPrivacyCoachModule() {
  // DOM Elements
  const startBtn = document.getElementById('privacy-start-btn');
  const moduleIntro = document.querySelector('.module-intro');
  const moduleFlow = document.querySelector('.module-flow');
  const moduleResults = document.querySelector('.module-results');
  const stepContents = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator .step');
  
  // Privacy setting form elements
  const addPrivacySettingBtn = document.getElementById('add-privacy-setting-btn');
  const privacySettingForm = document.getElementById('privacy-setting-form');
  const cancelPrivacySettingBtn = document.getElementById('cancel-privacy-setting');
  const savePrivacySettingBtn = document.getElementById('save-privacy-setting');
  const privacySettingsList = document.getElementById('privacy-settings-list');
  
  // Navigation buttons
  const backToIntroBtn = document.getElementById('back-to-intro');
  const toStep2Btn = document.getElementById('to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const toStep4Btn = document.getElementById('to-step-4');
  const backToStep3Btn = document.getElementById('back-to-step-3');
  const finishPrivacyBtn = document.getElementById('finish-privacy');
  
  // Results view buttons
  const restartPrivacyBtn = document.getElementById('restart-privacy');
  const viewPrivacySettingsBtn = document.getElementById('view-privacy-settings');
  
  // Premium feature button
  const unlockPrivacyPremiumBtn = document.getElementById('unlock-privacy-premium');
  
  // State variables
  let currentStep = 1;
  let editingPrivacySettingId = null;
  let privacySettings = [];
  
  // Initialize the module
  initModule();
  
  // Initialize module
  async function initModule() {
    // Initialize privacy settings from database
    await loadPrivacySettings();
    
    // Check premium features
    await checkPremiumFeatures();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if we have a saved current step in the store
    const savedStep = store.get('modules.privacyCoach.currentStep');
    if (savedStep > 0) {
      currentStep = savedStep;
      showModuleFlow();
      goToStep(currentStep);
    }
  }
  
  // Load privacy settings from database
  async function loadPrivacySettings() {
    try {
      privacySettings = await window.api.database.getPrivacySettings();
      renderPrivacySettings();
      
      // Update store
      store.set('modules.privacyCoach.settings', privacySettings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      privacySettings = [];
    }
  }
  
  // Check premium features
  async function checkPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      const privacyPremiumFlag = featureFlags.find(flag => flag.feature_name === 'privacy_coach_advanced');
      
      // Hide premium section if already unlocked
      if (privacyPremiumFlag && privacyPremiumFlag.is_enabled === 1) {
        const premiumSection = document.getElementById('privacy-premium-features');
        if (premiumSection) {
          premiumSection.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error checking premium features:', error);
    }
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Start button
    if (startBtn) {
      startBtn.addEventListener('click', showModuleFlow);
    }
    
    // Privacy setting form buttons
    if (addPrivacySettingBtn) {
      addPrivacySettingBtn.addEventListener('click', showPrivacySettingForm);
    }
    
    if (cancelPrivacySettingBtn) {
      cancelPrivacySettingBtn.addEventListener('click', hidePrivacySettingForm);
    }
    
    if (savePrivacySettingBtn) {
      savePrivacySettingBtn.addEventListener('click', savePrivacySetting);
    }
    
    // Navigation buttons
    if (backToIntroBtn) {
      backToIntroBtn.addEventListener('click', () => {
        hideModuleFlow();
        currentStep = 1;
        store.set('modules.privacyCoach.currentStep', 0);
      });
    }
    
    if (toStep2Btn) {
      toStep2Btn.addEventListener('click', () => {
        saveDiscoveryResponses();
        goToStep(2);
      });
    }
    
    if (backToStep1Btn) {
      backToStep1Btn.addEventListener('click', () => goToStep(1));
    }
    
    if (toStep3Btn) {
      toStep3Btn.addEventListener('click', () => {
        if (privacySettings.length > 0) {
          generateRecommendations();
          goToStep(3);
        } else {
          alert('Please add at least one privacy setting before continuing.');
        }
      });
    }
    
    if (backToStep2Btn) {
      backToStep2Btn.addEventListener('click', () => goToStep(2));
    }
    
    if (toStep4Btn) {
      toStep4Btn.addEventListener('click', () => {
        generateActionPlan();
        goToStep(4);
      });
    }
    
    if (backToStep3Btn) {
      backToStep3Btn.addEventListener('click', () => goToStep(3));
    }
    
    if (finishPrivacyBtn) {
      finishPrivacyBtn.addEventListener('click', showResults);
    }
    
    // Results view buttons
    if (restartPrivacyBtn) {
      restartPrivacyBtn.addEventListener('click', restartModule);
    }
    
    if (viewPrivacySettingsBtn) {
      viewPrivacySettingsBtn.addEventListener('click', () => goToStep(2));
    }
    
    // Premium feature button
    if (unlockPrivacyPremiumBtn) {
      unlockPrivacyPremiumBtn.addEventListener('click', unlockPremiumFeatures);
    }
  }
  
  // Show the module flow
  function showModuleFlow() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'block';
    moduleResults.style.display = 'none';
    
    // Go to step 1 if no privacy settings yet
    if (currentStep === 1 || privacySettings.length === 0) {
      goToStep(1);
    } else {
      goToStep(currentStep);
    }
    
    // Log start of privacy coach flow
    logAnalyticsEvent('privacy_coach_start', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Hide the module flow
  function hideModuleFlow() {
    moduleIntro.style.display = 'block';
    moduleFlow.style.display = 'none';
    moduleResults.style.display = 'none';
  }
  
  // Go to a specific step
  function goToStep(step) {
    currentStep = step;
    
    // Update store
    store.set('modules.privacyCoach.currentStep', currentStep);
    
    // Update step indicator
    stepIndicators.forEach(indicator => {
      const indicatorStep = parseInt(indicator.getAttribute('data-step'));
      indicator.classList.remove('active', 'completed');
      
      if (indicatorStep === currentStep) {
        indicator.classList.add('active');
      } else if (indicatorStep < currentStep) {
        indicator.classList.add('completed');
      }
    });
    
    // Show current step content
    stepContents.forEach(content => {
      const contentStep = parseInt(content.getAttribute('data-step'));
      content.style.display = contentStep === currentStep ? 'block' : 'none';
    });
    
    // Log navigation to this step
    logAnalyticsEvent('privacy_coach_step', {
      step: currentStep,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show privacy setting form
  function showPrivacySettingForm() {
    // Reset form
    if (document.getElementById('privacy-category')) {
      document.getElementById('privacy-category').value = 'browser';
    }
    if (document.getElementById('privacy-setting-name')) {
      document.getElementById('privacy-setting-name').value = '';
    }
    if (document.getElementById('privacy-current-status')) {
      document.getElementById('privacy-current-status').value = 'unknown';
    }
    if (document.getElementById('privacy-importance')) {
      document.getElementById('privacy-importance').value = '3';
    }
    if (document.getElementById('privacy-notes')) {
      document.getElementById('privacy-notes').value = '';
    }
    
    // Show form
    privacySettingForm.style.display = 'block';
    addPrivacySettingBtn.style.display = 'none';
    editingPrivacySettingId = null;
  }
  
  // Hide privacy setting form
  function hidePrivacySettingForm() {
    privacySettingForm.style.display = 'none';
    addPrivacySettingBtn.style.display = 'block';
    editingPrivacySettingId = null;
  }
  
  // Save privacy setting
  async function savePrivacySetting() {
    // Implementation for saving privacy settings would go here
    // Similar to the other modules, but with privacy-specific fields
    
    // For now, we'll just show a message
    alert("This is a skeleton implementation. In a complete version, this would save your privacy setting.");
    
    // Hide form
    hidePrivacySettingForm();
  }
  
  // Render privacy settings
  function renderPrivacySettings() {
    if (!privacySettingsList) return;
    
    if (privacySettings.length === 0) {
      privacySettingsList.innerHTML = '<p>No privacy settings added yet. Click "Add Privacy Setting" to get started.</p>';
      return;
    }
    
    // Implementation for rendering privacy settings would go here
    // For now, we'll just show a placeholder
    privacySettingsList.innerHTML = '<p>This is a skeleton implementation. In a complete version, this would display your privacy settings.</p>';
  }
  
  // Save discovery responses
  function saveDiscoveryResponses() {
    // Implementation for saving discovery responses would go here
    // Similar to the other modules
    
    // Log discovery responses
    logAnalyticsEvent('privacy_discovery_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate recommendations
  function generateRecommendations() {
    const recommendationsContainer = document.getElementById('privacy-recommendations-container');
    if (!recommendationsContainer) return;
    
    // Show loading
    recommendationsContainer.innerHTML = '<div class="loading">Generating recommendations...</div>';
    
    // Generate recommendations
    setTimeout(() => {
      recommendationsContainer.innerHTML = `
        <div class="recommendations">
          <p>This is a skeleton implementation. In a complete version, this would display personalized privacy recommendations based on your responses.</p>
          
          <div class="recommendation-card">
            <h4>Browser Privacy</h4>
            <p>Use privacy-focused browser extensions and adjust your browser settings to enhance privacy.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Data Minimization</h4>
            <p>Limit the personal information you share online and regularly clean up old accounts.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Secure Communications</h4>
            <p>Use encrypted messaging and email services for sensitive communications.</p>
          </div>
        </div>
      `;
      
      // Log recommendations generated
      logAnalyticsEvent('privacy_recommendations_generated', {
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Generate action plan
  function generateActionPlan() {
    const actionPlanContainer = document.getElementById('privacy-action-plan-container');
    if (!actionPlanContainer) return;
    
    // Show loading
    actionPlanContainer.innerHTML = '<div class="loading">Creating your action plan...</div>';
    
    // Generate action plan
    setTimeout(() => {
      actionPlanContainer.innerHTML = `
        <div class="action-plan">
          <p>This is a skeleton implementation. In a complete version, this would display a personalized action plan for enhancing your privacy.</p>
          
          <div class="action-step">
            <h4>Step 1: Browser Privacy</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-browser-privacy" class="task-checkbox">
                <label for="task-browser-privacy">Install privacy-focused browser extensions</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 2: Account Security</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-account-security" class="task-checkbox">
                <label for="task-account-security">Review privacy settings on major accounts</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 3: Communication Privacy</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-communication-privacy" class="task-checkbox">
                <label for="task-communication-privacy">Set up encrypted messaging for sensitive communications</label>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Log action plan generated
      logAnalyticsEvent('privacy_action_plan_generated', {
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Show results
  function showResults() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'none';
    moduleResults.style.display = 'block';
    
    // Generate summary
    generateSummary();
    
    // Log completion
    logAnalyticsEvent('privacy_coach_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate summary
  function generateSummary() {
    const summaryContainer = document.getElementById('privacy-summary');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
      <div class="summary-content">
        <p>This is a skeleton implementation. In a complete version, this would display a summary of your privacy settings and action plan progress.</p>
      </div>
    `;
  }
  
  // Restart module
  function restartModule() {
    // Reset state
    store.resetModuleState('privacyCoach');
    currentStep = 1;
    
    // Show intro
    hideModuleFlow();
  }
  
  // Unlock premium features
  async function unlockPremiumFeatures() {
    try {
      // Update feature flag
      await window.api.featureFlags.updateFeatureFlag('privacy_coach_advanced', 1);
      
      // Hide premium section
      const premiumSection = document.getElementById('privacy-premium-features');
      if (premiumSection) {
        premiumSection.style.display = 'none';
      }
      
      // Show success message
      alert('Premium privacy features unlocked!');
      
      // Log premium unlocked
      logAnalyticsEvent('privacy_premium_unlocked', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unlocking premium features:', error);
      alert('Error unlocking premium features. Please try again.');
    }
  }
}
