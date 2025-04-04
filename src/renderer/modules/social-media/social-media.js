/**
 * Social Media Declutter Module
 * 
 * This module helps users manage their social media presence and digital footprint.
 * It follows a four-step flow:
 * 1. Discovery: Ask questions to understand the user's social media usage
 * 2. Decision Point: Add social media accounts and assess importance
 * 3. Recommendations: Generate personalized recommendations
 * 4. Action Plan: Create a step-by-step action plan
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'social-media') {
    initSocialMediaModule();
  }
});

// Main initialization function
function initSocialMediaModule() {
  // DOM Elements
  const startBtn = document.getElementById('social-start-btn');
  const moduleIntro = document.querySelector('.module-intro');
  const moduleFlow = document.querySelector('.module-flow');
  const moduleResults = document.querySelector('.module-results');
  const stepContents = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator .step');
  
  // Social media account form elements
  const addSocialBtn = document.getElementById('add-social-btn');
  const socialForm = document.getElementById('social-form');
  const cancelSocialBtn = document.getElementById('cancel-social');
  const saveSocialBtn = document.getElementById('save-social');
  const socialAccountsList = document.getElementById('social-accounts-list');
  
  // Navigation buttons
  const backToIntroBtn = document.getElementById('back-to-intro');
  const toStep2Btn = document.getElementById('to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const toStep4Btn = document.getElementById('to-step-4');
  const backToStep3Btn = document.getElementById('back-to-step-3');
  const finishSocialBtn = document.getElementById('finish-social');
  
  // Results view buttons
  const restartSocialBtn = document.getElementById('restart-social');
  const viewSocialAccountsBtn = document.getElementById('view-social-accounts');
  
  // Premium feature button
  const unlockSocialPremiumBtn = document.getElementById('unlock-social-premium');
  
  // State variables
  let currentStep = 1;
  let editingSocialId = null;
  let socialAccounts = [];
  
  // Initialize the module
  initModule();
  
  // Initialize module
  async function initModule() {
    // Initialize social accounts from database
    await loadSocialAccounts();
    
    // Check premium features
    await checkPremiumFeatures();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if we have a saved current step in the store
    const savedStep = store.get('modules.socialMedia.currentStep');
    if (savedStep > 0) {
      currentStep = savedStep;
      showModuleFlow();
      goToStep(currentStep);
    }
  }
  
  // Load social accounts from database
  async function loadSocialAccounts() {
    try {
      socialAccounts = await window.api.database.getSocialAccounts();
      renderSocialAccounts();
      
      // Update store
      store.set('modules.socialMedia.accounts', socialAccounts);
    } catch (error) {
      console.error('Error loading social accounts:', error);
      socialAccounts = [];
    }
  }
  
  // Check premium features
  async function checkPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      const socialPremiumFlag = featureFlags.find(flag => flag.feature_name === 'social_media_advanced');
      
      // Hide premium section if already unlocked
      if (socialPremiumFlag && socialPremiumFlag.is_enabled === 1) {
        const premiumSection = document.getElementById('social-premium-features');
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
    
    // Social account form buttons
    if (addSocialBtn) {
      addSocialBtn.addEventListener('click', showSocialForm);
    }
    
    if (cancelSocialBtn) {
      cancelSocialBtn.addEventListener('click', hideSocialForm);
    }
    
    if (saveSocialBtn) {
      saveSocialBtn.addEventListener('click', saveSocialAccount);
    }
    
    // Navigation buttons
    if (backToIntroBtn) {
      backToIntroBtn.addEventListener('click', () => {
        hideModuleFlow();
        currentStep = 1;
        store.set('modules.socialMedia.currentStep', 0);
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
        if (socialAccounts.length > 0) {
          generateRecommendations();
          goToStep(3);
        } else {
          alert('Please add at least one social media account before continuing.');
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
    
    if (finishSocialBtn) {
      finishSocialBtn.addEventListener('click', showResults);
    }
    
    // Results view buttons
    if (restartSocialBtn) {
      restartSocialBtn.addEventListener('click', restartModule);
    }
    
    if (viewSocialAccountsBtn) {
      viewSocialAccountsBtn.addEventListener('click', () => goToStep(2));
    }
    
    // Premium feature button
    if (unlockSocialPremiumBtn) {
      unlockSocialPremiumBtn.addEventListener('click', unlockPremiumFeatures);
    }
  }
  
  // Show the module flow
  function showModuleFlow() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'block';
    moduleResults.style.display = 'none';
    
    // Go to step 1 if no social accounts yet
    if (currentStep === 1 || socialAccounts.length === 0) {
      goToStep(1);
    } else {
      goToStep(currentStep);
    }
    
    // Log start of social media flow
    logAnalyticsEvent('social_media_start', {
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
    store.set('modules.socialMedia.currentStep', currentStep);
    
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
    logAnalyticsEvent('social_media_step', {
      step: currentStep,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show social media account form
  function showSocialForm() {
    // Reset form
    if (document.getElementById('social-platform')) {
      document.getElementById('social-platform').value = 'facebook';
    }
    if (document.getElementById('social-username')) {
      document.getElementById('social-username').value = '';
    }
    if (document.getElementById('social-profile-url')) {
      document.getElementById('social-profile-url').value = '';
    }
    if (document.getElementById('social-last-post')) {
      document.getElementById('social-last-post').value = 'this-month';
    }
    if (document.getElementById('social-frequency')) {
      document.getElementById('social-frequency').value = 'weekly';
    }
    if (document.getElementById('social-importance')) {
      document.getElementById('social-importance').value = '3';
    }
    if (document.getElementById('social-action')) {
      document.getElementById('social-action').value = 'keep-active';
    }
    if (document.getElementById('social-notes')) {
      document.getElementById('social-notes').value = '';
    }
    
    // Show form
    socialForm.style.display = 'block';
    addSocialBtn.style.display = 'none';
    editingSocialId = null;
  }
  
  // Hide social media account form
  function hideSocialForm() {
    socialForm.style.display = 'none';
    addSocialBtn.style.display = 'block';
    editingSocialId = null;
  }
  
  // Save social media account
  async function saveSocialAccount() {
    // Implementation for saving social media accounts would go here
    // Similar to the email and account modules, but with social media-specific fields
    
    // For now, we'll just show a message
    alert("This is a skeleton implementation. In a complete version, this would save your social media account.");
    
    // Hide form
    hideSocialForm();
  }
  
  // Render social media accounts
  function renderSocialAccounts() {
    if (!socialAccountsList) return;
    
    if (socialAccounts.length === 0) {
      socialAccountsList.innerHTML = '<p>No social media accounts added yet. Click "Add Social Media Account" to get started.</p>';
      return;
    }
    
    // Implementation for rendering social media accounts would go here
    // For now, we'll just show a placeholder
    socialAccountsList.innerHTML = '<p>This is a skeleton implementation. In a complete version, this would display your social media accounts.</p>';
  }
  
  // Save discovery responses
  function saveDiscoveryResponses() {
    // Implementation for saving discovery responses would go here
    // Similar to the email and account modules
    
    // Log discovery responses
    logAnalyticsEvent('social_discovery_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate recommendations
  function generateRecommendations() {
    const recommendationsContainer = document.getElementById('social-recommendations-container');
    if (!recommendationsContainer) return;
    
    // Show loading
    recommendationsContainer.innerHTML = '<div class="loading">Generating recommendations...</div>';
    
    // Generate recommendations
    setTimeout(() => {
      recommendationsContainer.innerHTML = `
        <div class="recommendations">
          <p>This is a skeleton implementation. In a complete version, this would display personalized social media management recommendations based on your responses.</p>
          
          <div class="recommendation-card">
            <h4>Review Privacy Settings</h4>
            <p>Review and adjust your privacy settings on all social media platforms.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Audit Connected Apps</h4>
            <p>Review and remove apps and services connected to your social media accounts.</p>
          </div>
          
          <div class="recommendation-card">
            <h4>Declutter Old Content</h4>
            <p>Remove or archive old posts, photos, and comments that no longer represent you.</p>
          </div>
        </div>
      `;
      
      // Log recommendations generated
      logAnalyticsEvent('social_recommendations_generated', {
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Generate action plan
  function generateActionPlan() {
    const actionPlanContainer = document.getElementById('social-action-plan-container');
    if (!actionPlanContainer) return;
    
    // Show loading
    actionPlanContainer.innerHTML = '<div class="loading">Creating your action plan...</div>';
    
    // Generate action plan
    setTimeout(() => {
      actionPlanContainer.innerHTML = `
        <div class="action-plan">
          <p>This is a skeleton implementation. In a complete version, this would display a personalized action plan for managing your social media presence.</p>
          
          <div class="action-step">
            <h4>Step 1: Privacy Audit</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-privacy-settings" class="task-checkbox">
                <label for="task-privacy-settings">Review privacy settings on all platforms</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 2: Content Cleanup</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-content-cleanup" class="task-checkbox">
                <label for="task-content-cleanup">Remove or archive old content</label>
              </div>
            </div>
          </div>
          
          <div class="action-step">
            <h4>Step 3: Usage Management</h4>
            <div class="task-list">
              <div class="task">
                <input type="checkbox" id="task-usage-management" class="task-checkbox">
                <label for="task-usage-management">Set up screen time limits for social media apps</label>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Log action plan generated
      logAnalyticsEvent('social_action_plan_generated', {
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
    logAnalyticsEvent('social_media_completed', {
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate summary
  function generateSummary() {
    const summaryContainer = document.getElementById('social-summary');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
      <div class="summary-content">
        <p>This is a skeleton implementation. In a complete version, this would display a summary of your social media accounts and action plan progress.</p>
      </div>
    `;
  }
  
  // Restart module
  function restartModule() {
    // Reset state
    store.resetModuleState('socialMedia');
    currentStep = 1;
    
    // Show intro
    hideModuleFlow();
  }
  
  // Unlock premium features
  async function unlockPremiumFeatures() {
    try {
      // Update feature flag
      await window.api.featureFlags.updateFeatureFlag('social_media_advanced', 1);
      
      // Hide premium section
      const premiumSection = document.getElementById('social-premium-features');
      if (premiumSection) {
        premiumSection.style.display = 'none';
      }
      
      // Show success message
      alert('Premium social media features unlocked!');
      
      // Log premium unlocked
      logAnalyticsEvent('social_premium_unlocked', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unlocking premium features:', error);
      alert('Error unlocking premium features. Please try again.');
    }
  }
}
