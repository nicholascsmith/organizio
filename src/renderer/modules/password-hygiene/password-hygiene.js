/**
 * Password Hygiene Module
 * 
 * This module helps users improve their password security without storing actual passwords.
 * It follows a four-step flow:
 * 1. Discovery: Ask questions to understand the user's password habits
 * 2. Decision Point: Add password assessments for various services
 * 3. Recommendations: Generate personalized recommendations
 * 4. Action Plan: Create a step-by-step action plan
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'password-hygiene') {
    initPasswordHygieneModule();
  }
});

// Main initialization function
function initPasswordHygieneModule() {
  // DOM Elements
  const startBtn = document.getElementById('password-start-btn');
  const moduleIntro = document.querySelector('.module-intro');
  const moduleFlow = document.querySelector('.module-flow');
  const moduleResults = document.querySelector('.module-results');
  const stepContents = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator .step');
  
  // Password assessment form elements
  const addPasswordBtn = document.getElementById('add-password-assessment-btn');
  const passwordForm = document.getElementById('password-assessment-form');
  const cancelPasswordBtn = document.getElementById('cancel-password-assessment');
  const savePasswordBtn = document.getElementById('save-password-assessment');
  const passwordsList = document.getElementById('password-assessment-list');
  
  // Navigation buttons
  const backToIntroBtn = document.getElementById('back-to-intro');
  const toStep2Btn = document.getElementById('to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const toStep4Btn = document.getElementById('to-step-4');
  const backToStep3Btn = document.getElementById('back-to-step-3');
  const finishPasswordBtn = document.getElementById('finish-password');
  
  // Results view buttons
  const restartPasswordBtn = document.getElementById('restart-password');
  const viewPasswordsBtn = document.getElementById('view-passwords');
  
  // Premium feature button
  const unlockPasswordPremiumBtn = document.getElementById('unlock-password-premium');
  
  // State variables
  let currentStep = 1;
  let editingPasswordId = null;
  let passwordAssessments = [];
  
  // Initialize the module
  initModule();
  
  // Initialize module
  async function initModule() {
    // Initialize passwords from database
    await loadPasswordAssessments();
    
    // Check premium features
    await checkPremiumFeatures();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if we have a saved current step in the store
    const savedStep = store.get('modules.passwordHygiene.currentStep');
    if (savedStep > 0) {
      currentStep = savedStep;
      showModuleFlow();
      goToStep(currentStep);
    }
  }
  
  // Load password assessments from database
  async function loadPasswordAssessments() {
    try {
      passwordAssessments = await window.api.database.getPasswords();
      renderPasswordAssessments();
      
      // Update store
      store.set('modules.passwordHygiene.passwords', passwordAssessments);
    } catch (error) {
      console.error('Error loading password assessments:', error);
      passwordAssessments = [];
    }
  }
  
  // Check premium features
  async function checkPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      const passwordPremiumFlag = featureFlags.find(flag => flag.feature_name === 'password_hygiene_advanced');
      
      // Hide premium section if already unlocked
      if (passwordPremiumFlag && passwordPremiumFlag.is_enabled === 1) {
        const premiumSection = document.getElementById('password-premium-features');
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
    
    // Password assessment form buttons
    if (addPasswordBtn) {
      addPasswordBtn.addEventListener('click', showPasswordForm);
    }
    
    if (cancelPasswordBtn) {
      cancelPasswordBtn.addEventListener('click', hidePasswordForm);
    }
    
    if (savePasswordBtn) {
      savePasswordBtn.addEventListener('click', savePasswordAssessment);
    }
    
    // Navigation buttons
    if (backToIntroBtn) {
      backToIntroBtn.addEventListener('click', () => {
        hideModuleFlow();
        currentStep = 1;
        store.set('modules.passwordHygiene.currentStep', 0);
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
        if (passwordAssessments.length > 0) {
          generateRecommendations();
          goToStep(3);
        } else {
          alert('Please add at least one password assessment before continuing.');
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
    
    if (finishPasswordBtn) {
      finishPasswordBtn.addEventListener('click', showResults);
    }
    
    // Results view buttons
    if (restartPasswordBtn) {
      restartPasswordBtn.addEventListener('click', restartModule);
    }
    
    if (viewPasswordsBtn) {
      viewPasswordsBtn.addEventListener('click', () => goToStep(2));
    }
    
    // Premium feature button
    if (unlockPasswordPremiumBtn) {
      unlockPasswordPremiumBtn.addEventListener('click', unlockPremiumFeatures);
    }
  }
  
  // Show the module flow
  function showModuleFlow() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'block';
    moduleResults.style.display = 'none';
    
    // Go to step 1 if no password assessments yet
    if (currentStep === 1 || passwordAssessments.length === 0) {
      goToStep(1);
    } else {
      goToStep(currentStep);
    }
    
    // Log start of password hygiene flow
    logAnalyticsEvent('password_hygiene_start', {
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
    store.set('modules.passwordHygiene.currentStep', currentStep);
    
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
    logAnalyticsEvent('password_hygiene_step', {
      step: currentStep,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show password assessment form
  function showPasswordForm() {
    // Reset form
    if (document.getElementById('password-service')) {
      document.getElementById('password-service').value = '';
    }
    if (document.getElementById('password-strength')) {
      document.getElementById('password-strength').value = '3';
    }
    if (document.getElementById('password-last-updated')) {
      document.getElementById('password-last-updated').value = 'unknown';
    }
    if (document.getElementById('password-unique')) {
      document.getElementById('password-unique').value = '1';
    }
    if (document.getElementById('password-2fa')) {
      document.getElementById('password-2fa').value = '0';
    }
    if (document.getElementById('password-notes')) {
      document.getElementById('password-notes').value = '';
    }
    
    // Show form
    passwordForm.style.display = 'block';
    addPasswordBtn.style.display = 'none';
    editingPasswordId = null;
  }
  
  // Hide password assessment form
  function hidePasswordForm() {
    passwordForm.style.display = 'none';
    addPasswordBtn.style.display = 'block';
    editingPasswordId = null;
  }
  
  // Save password assessment
  async function savePasswordAssessment() {
    // Implementation for saving password assessments would go here
    // Similar to the email and account modules, but with password-specific fields
    
    // For now, we'll just show a message
    alert("This is a skeleton implementation. In a complete version, this would save your password assessment.");
    
    // Hide form
    hidePasswordForm();
  }
  
  // Render password assessments
  function renderPasswordAssessments() {
    if (!passwordsList) return;
    
    if (passwordAssessments.length === 0) {
      passwordsList.innerHTML = '<p>No password assessments added yet. Click "Add Password Assessment" to get started.</p>';
      return;
    }
    
    // Implementation for rendering password assessments would go here
    // For now, we'll just show a placeholder
    passwordsList.innerHTML = '<p>This is a skeleton implementation. In a complete version, this would display your password assessments.</p>';
  }
  
  // Save discovery responses
  function saveDiscoveryResponses() {
    // Implementation for saving discovery responses would go here
    // Similar to the email and account modules
    
    // Log discovery responses
    logAnalyticsEvent('password_discovery_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate recommendations
  function generateRecommendations() {
    const recommendationsContainer = document.getElementById('password-recommendations-container');
    if (!recommendationsContainer) return;
    
    // Show loading
    recommendationsContainer.innerHTML = '<div class="loading">Generating recommendations...</div>';
    
    // Generate recommendations
    setTimeout(() => {
      recommendationsContainer.innerHTML = `
        <div class="recommendations">
          <p>This is a skeleton implementation. In a complete version, this would display personalized password security recommendations based on your responses.</p>
          
          <div class="recommendation-card">
            <h4>Use a Password Manager</h4>
            <p>A password manager helps you generate and store strong, unique passwords for all your accounts.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Enable Two-Factor Authentication</h4>
            <p>Two-factor authentication adds an extra layer of security to your accounts.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Create Strong, Unique Passwords</h4>
            <p>Use long, complex passwords that are different for each account.</p>
          </div>
        </div>
      `;
      
      // Log recommendations generated
      logAnalyticsEvent('password_recommendations_generated', {
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Generate action plan
  function generateActionPlan() {
    const actionPlanContainer = document.getElementById('password-action-plan-container');
    if (!actionPlanContainer) return;
    
    // Show loading
    actionPlanContainer.innerHTML = '<div class="loading">Creating your action plan...</div>';
    
    // Generate action plan
    setTimeout(() => {
      actionPlanContainer.innerHTML = `
        <div class="action-plan">
          <p>This is a skeleton implementation. In a complete version, this would display a personalized action plan for improving your password security.</p>
          
          <div class="action-step">
            <h4>Step 1: Set Up a Password Manager</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-password-manager" class="task-checkbox">
                <label for="task-password-manager">Choose and set up a password manager</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 2: Update Critical Passwords</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-update-critical" class="task-checkbox">
                <label for="task-update-critical">Update passwords for your most important accounts</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 3: Enable Two-Factor Authentication</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-enable-2fa" class="task-checkbox">
                <label for="task-enable-2fa">Enable 2FA on critical accounts</label>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Log action plan generated
      logAnalyticsEvent('password_action_plan_generated', {
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
    logAnalyticsEvent('password_hygiene_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate summary
  function generateSummary() {
    const summaryContainer = document.getElementById('password-summary');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
      <div class="summary-content">
        <p>This is a skeleton implementation. In a complete version, this would display a summary of your password security assessments and action plan progress.</p>
      </div>
    `;
  }
  
  // Restart module
  function restartModule() {
    // Reset state
    store.resetModuleState('passwordHygiene');
    currentStep = 1;
    
    // Show intro
    hideModuleFlow();
  }
  
  // Unlock premium features
  async function unlockPremiumFeatures() {
    try {
      // Update feature flag
      await window.api.featureFlags.updateFeatureFlag('password_hygiene_advanced', 1);
      
      // Hide premium section
      const premiumSection = document.getElementById('password-premium-features');
      if (premiumSection) {
        premiumSection.style.display = 'none';
      }
      
      // Show success message
      alert('Premium password security features unlocked!');
      
      // Log premium unlocked
      logAnalyticsEvent('password_premium_unlocked', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unlocking premium features:', error);
      alert('Error unlocking premium features. Please try again.');
    }
  }
}
