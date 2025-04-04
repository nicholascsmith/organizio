/**
 * Account Manager Module
 * 
 * This module helps users track and manage their online accounts.
 * It follows a four-step flow:
 * 1. Discovery: Ask questions to understand the user's account usage
 * 2. Decision Point: Add accounts and assess importance
 * 3. Recommendations: Generate personalized recommendations
 * 4. Action Plan: Create a step-by-step action plan
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'account-manager') {
    initAccountManagerModule();
  }
});

// Main initialization function
function initAccountManagerModule() {
  // DOM Elements
  const startBtn = document.getElementById('account-start-btn');
  const moduleIntro = document.querySelector('.module-intro');
  const moduleFlow = document.querySelector('.module-flow');
  const moduleResults = document.querySelector('.module-results');
  const stepContents = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator .step');
  
  // Account form elements
  const addAccountBtn = document.getElementById('add-account-btn');
  const accountForm = document.getElementById('account-form');
  const cancelAccountBtn = document.getElementById('cancel-account');
  const saveAccountBtn = document.getElementById('save-account');
  const accountsList = document.getElementById('accounts-list');
  
  // Navigation buttons
  const backToIntroBtn = document.getElementById('back-to-intro');
  const toStep2Btn = document.getElementById('to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const toStep4Btn = document.getElementById('to-step-4');
  const backToStep3Btn = document.getElementById('back-to-step-3');
  const finishAccountBtn = document.getElementById('finish-account');
  
  // Results view buttons
  const restartAccountBtn = document.getElementById('restart-account');
  const viewAccountsBtn = document.getElementById('view-accounts');
  
  // Premium feature button
  const unlockAccountPremiumBtn = document.getElementById('unlock-account-premium');
  
  // State variables
  let currentStep = 1;
  let editingAccountId = null;
  let accounts = [];
  
  // Initialize the module
  initModule();
  
  // Initialize module
  async function initModule() {
    // Initialize accounts from database
    await loadAccounts();
    
    // Check premium features
    await checkPremiumFeatures();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if we have a saved current step in the store
    const savedStep = store.get('modules.accountManager.currentStep');
    if (savedStep > 0) {
      currentStep = savedStep;
      showModuleFlow();
      goToStep(currentStep);
    }
  }
  
  // Load accounts from database
  async function loadAccounts() {
    try {
      accounts = await window.api.database.getAccounts();
      renderAccounts();
      
      // Update store
      store.set('modules.accountManager.accounts', accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      accounts = [];
    }
  }
  
  // Check premium features
  async function checkPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      const accountPremiumFlag = featureFlags.find(flag => flag.feature_name === 'account_manager_advanced');
      
      // Hide premium section if already unlocked
      if (accountPremiumFlag && accountPremiumFlag.is_enabled === 1) {
        const premiumSection = document.getElementById('account-premium-features');
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
    startBtn.addEventListener('click', showModuleFlow);
    
    // Account form buttons
    addAccountBtn.addEventListener('click', showAccountForm);
    cancelAccountBtn.addEventListener('click', hideAccountForm);
    saveAccountBtn.addEventListener('click', saveAccount);
    
    // Navigation buttons
    backToIntroBtn.addEventListener('click', () => {
      hideModuleFlow();
      currentStep = 1;
      store.set('modules.accountManager.currentStep', 0);
    });
    
    toStep2Btn.addEventListener('click', () => {
      saveDiscoveryResponses();
      goToStep(2);
    });
    
    backToStep1Btn.addEventListener('click', () => goToStep(1));
    toStep3Btn.addEventListener('click', () => {
      if (accounts.length > 0) {
        generateRecommendations();
        goToStep(3);
      } else {
        alert('Please add at least one account before continuing.');
      }
    });
    
    backToStep2Btn.addEventListener('click', () => goToStep(2));
    toStep4Btn.addEventListener('click', () => {
      generateActionPlan();
      goToStep(4);
    });
    
    backToStep3Btn.addEventListener('click', () => goToStep(3));
    finishAccountBtn.addEventListener('click', showResults);
    
    // Results view buttons
    restartAccountBtn.addEventListener('click', restartModule);
    viewAccountsBtn.addEventListener('click', () => goToStep(2));
    
    // Premium feature button
    unlockAccountPremiumBtn.addEventListener('click', unlockPremiumFeatures);
  }
  
  // Show the module flow
  function showModuleFlow() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'block';
    moduleResults.style.display = 'none';
    
    // Go to step 1 if no accounts yet
    if (currentStep === 1 || accounts.length === 0) {
      goToStep(1);
    } else {
      goToStep(currentStep);
    }
    
    // Log start of account manager flow
    logAnalyticsEvent('account_manager_start', {
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
    store.set('modules.accountManager.currentStep', currentStep);
    
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
    logAnalyticsEvent('account_manager_step', {
      step: currentStep,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show account form
  function showAccountForm() {
    // Reset form
    document.getElementById('account-service').value = '';
    document.getElementById('account-username').value = '';
    document.getElementById('account-url').value = '';
    document.getElementById('account-last-login').value = 'unknown';
    document.getElementById('account-importance').value = '3';
    document.getElementById('account-status').value = 'active';
    document.getElementById('account-notes').value = '';
    
    // Show form
    accountForm.style.display = 'block';
    addAccountBtn.style.display = 'none';
    editingAccountId = null;
  }
  
  // Hide account form
  function hideAccountForm() {
    accountForm.style.display = 'none';
    addAccountBtn.style.display = 'block';
    editingAccountId = null;
  }
  
  // Save account
  async function saveAccount() {
    const service = document.getElementById('account-service').value.trim();
    const username = document.getElementById('account-username').value.trim();
    const url = document.getElementById('account-url').value.trim();
    const lastLogin = document.getElementById('account-last-login').value;
    const importance = parseInt(document.getElementById('account-importance').value);
    const status = document.getElementById('account-status').value;
    const notes = document.getElementById('account-notes').value.trim();
    
    // Validate input
    if (!service || !username) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      let result;
      
      // Prepare account data
      const accountData = {
        service,
        username,
        url,
        last_login: lastLogin,
        importance,
        status,
        notes
      };
      
      // Update or create account
      if (editingAccountId !== null) {
        result = await window.api.database.updateAccount(editingAccountId, accountData);
        
        // Update the local array
        const index = accounts.findIndex(account => account.id === editingAccountId);
        if (index !== -1) {
          accounts[index] = { ...accounts[index], ...accountData, id: editingAccountId };
        }
      } else {
        const id = await window.api.database.saveAccount(accountData);
        result = id;
        
        // Add to local array
        accounts.push({ ...accountData, id });
      }
      
      // Hide form and render accounts
      hideAccountForm();
      renderAccounts();
      
      // Update store
      store.set('modules.accountManager.accounts', accounts);
      
      // Log account added/updated
      logAnalyticsEvent('account_saved', {
        isNew: editingAccountId === null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error saving account. Please try again.');
    }
  }
  
  // Edit account
  function editAccount(id) {
    // Find the account
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;
    
    // Fill the form
    document.getElementById('account-service').value = account.service || '';
    document.getElementById('account-username').value = account.username || '';
    document.getElementById('account-url').value = account.url || '';
    document.getElementById('account-last-login').value = account.last_login || 'unknown';
    document.getElementById('account-importance').value = account.importance || '3';
    document.getElementById('account-status').value = account.status || 'active';
    document.getElementById('account-notes').value = account.notes || '';
    
    // Show form and set editing ID
    accountForm.style.display = 'block';
    addAccountBtn.style.display = 'none';
    editingAccountId = id;
  }
  
  // Delete account
  async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }
    
    try {
      await window.api.database.deleteAccount(id);
      
      // Remove from local array
      accounts = accounts.filter(account => account.id !== id);
      
      // Render accounts
      renderAccounts();
      
      // Update store
      store.set('modules.accountManager.accounts', accounts);
      
      // Log account deleted
      logAnalyticsEvent('account_deleted', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  }
  
  // Render accounts
  function renderAccounts() {
    if (!accountsList) return;
    
    if (accounts.length === 0) {
      accountsList.innerHTML = '<p>No accounts added yet. Click "Add Account" to get started.</p>';
      return;
    }
    
    // Sort by importance (highest first)
    const sortedAccounts = [...accounts].sort((a, b) => b.importance - a.importance);
    
    // Create HTML
    const html = sortedAccounts.map(account => {
      const importanceClass = getImportanceClass(account.importance);
      const statusClass = getStatusClass(account.status);
      
      return `
        <div class="account-item ${importanceClass} ${statusClass}">
          <div class="account-details">
            <h4>${account.service}</h4>
            <p><strong>Username:</strong> ${account.username}</p>
            ${account.url ? `<p><strong>URL:</strong> <a href="${account.url}" target="_blank">${account.url}</a></p>` : ''}
            <p><strong>Last Login:</strong> ${formatLastLogin(account.last_login)}</p>
            <p><strong>Importance:</strong> ${formatImportance(account.importance)}</p>
            <p><strong>Status:</strong> ${formatStatus(account.status)}</p>
            ${account.notes ? `<p><strong>Notes:</strong> ${account.notes}</p>` : ''}
          </div>
          <div class="account-actions">
            <button class="btn-secondary edit-account" data-id="${account.id}">Edit</button>
            <button class="btn-secondary delete-account" data-id="${account.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');
    
    accountsList.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-account').forEach(button => {
      button.addEventListener('click', () => {
        editAccount(parseInt(button.getAttribute('data-id')));
      });
    });
    
    document.querySelectorAll('.delete-account').forEach(button => {
      button.addEventListener('click', () => {
        deleteAccount(parseInt(button.getAttribute('data-id')));
      });
    });
  }
  
  // Save discovery responses
  function saveDiscoveryResponses() {
    const accountCategories = Array.from(document.getElementById('account-categories').selectedOptions).map(option => option.value);
    const accountTracking = document.getElementById('account-tracking').value;
    const forgottenAccounts = document.getElementById('forgotten-accounts').value;
    const accountConcern = document.getElementById('account-concern').value;
    
    const responses = {
      accountCategories,
      accountTracking,
      forgottenAccounts,
      accountConcern
    };
    
    // Save to store
    store.set('modules.accountManager.userResponses', responses);
    
    // Log discovery responses
    logAnalyticsEvent('account_discovery_completed', {
      responses,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate recommendations
  function generateRecommendations() {
    const recommendationsContainer = document.getElementById('account-recommendations-container');
    if (!recommendationsContainer) return;
    
    // Get user responses
    const responses = store.get('modules.accountManager.userResponses');
    if (!responses) {
      recommendationsContainer.innerHTML = '<p>Please complete the discovery questions first.</p>';
      return;
    }
    
    // Show loading
    recommendationsContainer.innerHTML = '<div class="loading">Generating recommendations...</div>';
    
    // Generate recommendations based on responses
    setTimeout(() => {
      let recommendations = `
        <div class="recommendations">
          <div class="recommendation-card">
            <h4>Account Inventory Management</h4>
            <p>Based on your responses:</p>
            <ul>
      `;
      
      // Different recommendations based on forgotten accounts
      if (responses.forgottenAccounts === 'definitely' || responses.forgottenAccounts === 'probably') {
        recommendations += `
          <li>You likely have forgotten accounts. Consider using an email search technique to rediscover them.</li>
          <li>Check your browser's saved passwords to identify accounts you may have forgotten.</li>
          <li>Search your email for terms like "welcome", "verify", "confirm", or "new account" to find registration emails.</li>
        `;
      } else {
        recommendations += `
          <li>You seem to have good awareness of your accounts. Focus on organizing them by importance and usage.</li>
          <li>Consider categorizing your accounts by type (social, financial, shopping, etc.).</li>
        `;
      }
      
      recommendations += `
            </ul>
          </div>
          
          <div class="recommendation-card">
            <h4>Account Tracking System</h4>
            <p>Based on your current tracking method (${formatTrackingMethod(responses.accountTracking)}):</p>
            <ul>
      `;
      
      // Different recommendations based on tracking method
      if (responses.accountTracking === 'memory') {
        recommendations += `
          <li>Relying on memory alone is risky. Consider establishing a secure tracking system.</li>
          <li>A password manager is the safest and most efficient way to track accounts.</li>
          <li>As an alternative, create an encrypted local document to list account details (but not passwords).</li>
        `;
      } else if (responses.accountTracking === 'browser') {
        recommendations += `
          <li>Browser password managers have limitations and security risks.</li>
          <li>Consider migrating to a dedicated password manager for better security and cross-device access.</li>
          <li>If you continue using browser storage, ensure your device is secured with strong passwords and encryption.</li>
        `;
      } else if (responses.accountTracking === 'document' || responses.accountTracking === 'notes') {
        recommendations += `
          <li>Physical or digital documents with account information present security risks.</li>
          <li>If you keep a document, ensure it's encrypted and password-protected.</li>
          <li>Consider transitioning to a password manager for better security.</li>
        `;
      } else if (responses.accountTracking === 'password-manager') {
        recommendations += `
          <li>You're already using the recommended method for account tracking.</li>
          <li>Ensure your password manager is regularly updated and using the latest security features.</li>
          <li>Regularly audit the accounts in your password manager to remove outdated entries.</li>
        `;
      } else {
        recommendations += `
          <li>Creating a system to track your accounts is essential for digital organization.</li>
          <li>A password manager is highly recommended for security and convenience.</li>
          <li>Alternatively, use a securely encrypted local document (but never store actual passwords in plain text).</li>
        `;
      }
      
      recommendations += `
            </ul>
          </div>
      `;
      
      // Account type specific recommendations
      if (responses.accountCategories && responses.accountCategories.length > 0) {
        recommendations += `
          <div class="recommendation-card">
            <h4>Category-Specific Recommendations</h4>
            <p>Based on your account types:</p>
            <ul>
        `;
        
        if (responses.accountCategories.includes('finance')) {
          recommendations += `
            <li><strong>Financial accounts:</strong> These should have the highest security. Use unique, strong passwords and enable 2FA for all financial accounts.</li>
          `;
        }
        
        if (responses.accountCategories.includes('social-media')) {
          recommendations += `
            <li><strong>Social media:</strong> Regularly review privacy settings and connected applications. Consider deleting inactive accounts to reduce your digital footprint.</li>
          `;
        }
        
        if (responses.accountCategories.includes('shopping')) {
          recommendations += `
            <li><strong>Shopping/Retail:</strong> Check if these stores allow "guest checkout" instead of creating accounts. Consider deleting accounts for stores you rarely use.</li>
          `;
        }
        
        if (responses.accountCategories.includes('streaming')) {
          recommendations += `
            <li><strong>Streaming services:</strong> Track subscription renewal dates to avoid paying for unused services. Review active device lists periodically.</li>
          `;
        }
        
        if (responses.accountCategories.includes('productivity')) {
          recommendations += `
            <li><strong>Productivity tools:</strong> Check for data export options to ensure you can retrieve your work if you stop using the service.</li>
          `;
        }
        
        recommendations += `
            </ul>
          </div>
        `;
      }
      
      // Primary concern recommendations
      recommendations += `
        <div class="recommendation-card">
          <h4>Addressing Your Primary Concern</h4>
          <p>Based on your main concern (${formatConcern(responses.accountConcern)}):</p>
          <ul>
      `;
      
      if (responses.accountConcern === 'security') {
        recommendations += `
          <li>Implement two-factor authentication on all critical accounts.</li>
          <li>Use a password manager to generate and store strong, unique passwords.</li>
          <li>Regularly check for security breaches affecting your accounts at haveibeenpwned.com.</li>
        `;
      } else if (responses.accountConcern === 'privacy') {
        recommendations += `
          <li>Regularly review and adjust privacy settings on all accounts, especially social media.</li>
          <li>Consider using privacy-focused alternatives to mainstream services when possible.</li>
          <li>Periodically search for your personal information online and request removal where appropriate.</li>
        `;
      } else if (responses.accountConcern === 'too-many') {
        recommendations += `
          <li>Focus on identifying and eliminating unnecessary accounts.</li>
          <li>Consolidate accounts where possible (e.g., use one streaming service instead of multiple).</li>
          <li>Create a schedule to systematically review and close accounts you don't need.</li>
        `;
      } else if (responses.accountConcern === 'forgotten') {
        recommendations += `
          <li>Use email search techniques to discover forgotten accounts.</li>
          <li>Check browser saved passwords and password managers for accounts you may have forgotten.</li>
          <li>Implement a consistent naming and tracking system for new accounts.</li>
        `;
      } else if (responses.accountConcern === 'managing') {
        recommendations += `
          <li>Create a subscription tracker (spreadsheet or dedicated app) to monitor recurring payments.</li>
          <li>Set calendar reminders for subscription renewal dates.</li>
          <li>Consider using a service like Trim or Truebill to identify and manage subscriptions.</li>
        `;
      }
      
      recommendations += `
          </ul>
        </div>
      `;
      
      // Analysis of added accounts
      if (accounts.length > 0) {
        recommendations += `
          <div class="recommendation-card">
            <h4>Account-Specific Analysis</h4>
            <p>Based on your ${accounts.length} added accounts:</p>
            <ul>
        `;
        
        // Count accounts by importance
        const highImportance = accounts.filter(acc => acc.importance >= 4).length;
        const mediumImportance = accounts.filter(acc => acc.importance >= 2 && acc.importance <= 3).length;
        const lowImportance = accounts.filter(acc => acc.importance <= 1).length;
        
        // Count by status
        const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
        const inactiveAccounts = accounts.filter(acc => acc.status === 'inactive').length;
        const deleteAccounts = accounts.filter(acc => acc.status === 'delete').length;
        
        // Old accounts
        const oldAccounts = accounts.filter(acc => 
          acc.last_login === 'year' || acc.last_login === 'more-than-year'
        ).length;
        
        recommendations += `
          <li>You have ${highImportance} high-importance accounts, ${mediumImportance} medium-importance accounts, and ${lowImportance} low-importance accounts.</li>
          <li>You have ${activeAccounts} active accounts, ${inactiveAccounts} inactive accounts, and ${deleteAccounts} accounts marked for deletion.</li>
        `;
        
        if (oldAccounts > 0) {
          recommendations += `
            <li>You have ${oldAccounts} accounts you haven't used in over a year. These are prime candidates for deletion if not needed.</li>
          `;
        }
        
        recommendations += `
            </ul>
          </div>
        `;
      }
      
      recommendations += `</div>`;
      
      // Update container
      recommendationsContainer.innerHTML = recommendations;
      
      // Log recommendations generated
      logAnalyticsEvent('account_recommendations_generated', {
        accountCount: accounts.length,
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Generate action plan
  function generateActionPlan() {
    const actionPlanContainer = document.getElementById('account-action-plan-container');
    if (!actionPlanContainer) return;
    
    // Show loading
    actionPlanContainer.innerHTML = '<div class="loading">Creating your action plan...</div>';
    
    // Generate action plan based on recommendations and accounts
    setTimeout(() => {
      // Create action steps based on the accounts
      const criticalAccounts = accounts.filter(acc => acc.importance === 5);
      const importantAccounts = accounts.filter(acc => acc.importance === 4 || acc.importance === 3);
      const lowPriorityAccounts = accounts.filter(acc => acc.importance <= 2);
      const deleteAccounts = accounts.filter(acc => acc.status === 'delete');
      
      let actionPlan = `
        <div class="action-plan">
          <div class="action-step">
            <h4>Step 1: Secure Critical Accounts (Week 1)</h4>
            <p>Focus on securing your most important accounts first.</p>
            <div class="task-list">
      `;
      
      if (criticalAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-secure-critical" class="task-checkbox">
            <label for="task-secure-critical">Set up two-factor authentication for these critical accounts:</label>
            <ul>
        `;
        
        criticalAccounts.forEach(account => {
          actionPlan += `<li>${account.service} (${account.username})</li>`;
        });
        
        actionPlan += `
            </ul>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-password-critical" class="task-checkbox">
            <label for="task-password-critical">Update passwords for all critical accounts to strong, unique passwords</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-recovery-critical" class="task-checkbox">
            <label for="task-recovery-critical">Set up recovery methods (backup email, phone number) for critical accounts</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 2: Delete Unnecessary Accounts (Week 2)</h4>
        <p>Remove accounts you no longer need to reduce your digital footprint.</p>
        <div class="task-list">
      `;
      
      if (deleteAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-delete-accounts" class="task-checkbox">
            <label for="task-delete-accounts">Delete these unnecessary accounts:</label>
            <ul>
        `;
        
        deleteAccounts.forEach(account => {
          actionPlan += `<li>${account.service} (${account.username})</li>`;
        });
        
        actionPlan += `
            </ul>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-download-data" class="task-checkbox">
            <label for="task-download-data">Download any important data before deleting accounts</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-confirm-deletion" class="task-checkbox">
            <label for="task-confirm-deletion">Confirm account deletion by checking for confirmation emails</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 3: Secure Remaining Important Accounts (Week 3)</h4>
        <p>Now focus on your second-tier important accounts.</p>
        <div class="task-list">
      `;
      
      if (importantAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-review-important" class="task-checkbox">
            <label for="task-review-important">Review and update security settings for these important accounts:</label>
            <ul>
        `;
        
        importantAccounts.forEach(account => {
          actionPlan += `<li>${account.service} (${account.username})</li>`;
        });
        
        actionPlan += `
            </ul>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-password-important" class="task-checkbox">
            <label for="task-password-important">Update passwords for all important accounts to strong, unique passwords</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-privacy-settings" class="task-checkbox">
            <label for="task-privacy-settings">Review privacy settings for all social media and sharing accounts</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 4: Establish Ongoing Management (Week 4+)</h4>
        <p>Set up systems to maintain your accounts going forward.</p>
        <div class="task-list">
      `;
      
      if (lowPriorityAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-low-priority" class="task-checkbox">
            <label for="task-low-priority">Review low-priority accounts for potential deletion or security updates:</label>
            <ul>
        `;
        
        lowPriorityAccounts.forEach(account => {
          actionPlan += `<li>${account.service} (${account.username})</li>`;
        });
        
        actionPlan += `
            </ul>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-tracking-system" class="task-checkbox">
            <label for="task-tracking-system">Implement a password manager or secure tracking system for all accounts</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-quarterly-review" class="task-checkbox">
            <label for="task-quarterly-review">Schedule quarterly reviews to check for unused accounts and update security</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-breach-alerts" class="task-checkbox">
            <label for="task-breach-alerts">Set up breach notifications for your email addresses</label>
          </div>
        </div>
      </div>
    </div>
      `;
      
      // Update container
      actionPlanContainer.innerHTML = actionPlan;
      
      // Add event listeners for checkboxes
      document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', saveTaskStatus);
      });
      
      // Load saved task statuses
      loadTaskStatuses();
      
      // Log action plan generated
      logAnalyticsEvent('account_action_plan_generated', {
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Save task status to store
  function saveTaskStatus() {
    const taskStatuses = {};
    
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      taskStatuses[checkbox.id] = checkbox.checked;
    });
    
    store.set('modules.accountManager.taskStatuses', taskStatuses);
  }
  
  // Load task statuses from store
  function loadTaskStatuses() {
    const taskStatuses = store.get('modules.accountManager.taskStatuses');
    
    if (taskStatuses) {
      Object.entries(taskStatuses).forEach(([id, checked]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.checked = checked;
        }
      });
    }
  }
  
  // Show results
  function showResults() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'none';
    moduleResults.style.display = 'block';
    
    // Generate summary
    generateSummary();
    
    // Log completion
    logAnalyticsEvent('account_manager_completed', {
      accountCount: accounts.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate summary
  function generateSummary() {
    const summaryContainer = document.getElementById('account-summary');
    if (!summaryContainer) return;
    
    // Count accounts by importance
    const criticalAccounts = accounts.filter(acc => acc.importance === 5).length;
    const highImportance = accounts.filter(acc => acc.importance === 4).length;
    const mediumImportance = accounts.filter(acc => acc.importance === 3).length;
    const lowImportance = accounts.filter(acc => acc.importance <= 2).length;
    
    // Count by status
    const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
    const inactiveAccounts = accounts.filter(acc => acc.status === 'inactive').length;
    const deleteAccounts = accounts.filter(acc => acc.status === 'delete').length;
    
    // Calculate task completion percentage
    const taskStatuses = store.get('modules.accountManager.taskStatuses') || {};
    const totalTasks = Object.keys(taskStatuses).length;
    const completedTasks = Object.values(taskStatuses).filter(status => status).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Create summary HTML
    const html = `
      <div class="summary-content">
        <div class="summary-section">
          <h5>Account Inventory</h5>
          <p>Total accounts: ${accounts.length}</p>
          <ul>
            <li>Critical: ${criticalAccounts}</li>
            <li>High importance: ${highImportance}</li>
            <li>Medium importance: ${mediumImportance}</li>
            <li>Low importance: ${lowImportance}</li>
          </ul>
        </div>
        
        <div class="summary-section">
          <h5>Account Status</h5>
          <ul>
            <li>Active: ${activeAccounts}</li>
            <li>Inactive: ${inactiveAccounts}</li>
            <li>Marked for deletion: ${deleteAccounts}</li>
          </ul>
        </div>
        
        <div class="summary-section">
          <h5>Action Plan Progress</h5>
          <div class="progress-bar">
            <div class="progress" style="width: ${completionPercentage}%"></div>
          </div>
          <p>${completionPercentage}% complete (${completedTasks}/${totalTasks} tasks)</p>
        </div>
      </div>
    `;
    
    summaryContainer.innerHTML = html;
  }
  
  // Restart module
  function restartModule() {
    // Reset state
    store.resetModuleState('accountManager');
    currentStep = 1;
    
    // Show intro
    hideModuleFlow();
  }
  
  // Unlock premium features
  async function unlockPremiumFeatures() {
    try {
      // Update feature flag
      await window.api.featureFlags.updateFeatureFlag('account_manager_advanced', 1);
      
      // Hide premium section
      const premiumSection = document.getElementById('account-premium-features');
      if (premiumSection) {
        premiumSection.style.display = 'none';
      }
      
      // Show success message
      alert('Premium account management features unlocked!');
      
      // Log premium unlocked
      logAnalyticsEvent('account_premium_unlocked', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unlocking premium features:', error);
      alert('Error unlocking premium features. Please try again.');
    }
  }
  
  // Helper functions
  
  // Format last login
  function formatLastLogin(lastLogin) {
    const formats = {
      'today': 'Today',
      'this-week': 'This week',
      'this-month': 'This month',
      '3-months': 'Within 3 months',
      '6-months': 'Within 6 months',
      'year': 'Within a year',
      'more-than-year': 'More than a year ago',
      'unknown': 'Unknown'
    };
    
    return formats[lastLogin] || lastLogin;
  }
  
  // Format importance
  function formatImportance(importance) {
    switch (parseInt(importance)) {
      case 5: return 'Critical';
      case 4: return 'Very important';
      case 3: return 'Important';
      case 2: return 'Somewhat important';
      case 1: return 'Not important';
      case 0: return 'Not needed';
      default: return 'Unknown';
    }
  }
  
  // Format status
  function formatStatus(status) {
    const formats = {
      'active': 'Active',
      'inactive': 'Inactive',
      'delete': 'Should delete',
      'unknown': 'Not sure'
    };
    
    return formats[status] || status;
  }
  
  // Get importance CSS class
  function getImportanceClass(importance) {
    switch (parseInt(importance)) {
      case 5:
      case 4: return 'high-importance';
      case 3:
      case 2: return 'medium-importance';
      case 1:
      case 0: return 'low-importance';
      default: return '';
    }
  }
  
  // Get status CSS class
  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'delete': return 'status-delete';
      default: return '';
    }
  }
  
  // Format tracking method
  function formatTrackingMethod(method) {
    const formats = {
      'memory': 'Memory only',
      'browser': 'Browser saved passwords',
      'password-manager': 'Password manager',
      'document': 'Document/spreadsheet',
      'notes': 'Written notes',
      'no-system': 'No system'
    };
    
    return formats[method] || method;
  }
  
  // Format concern
  function formatConcern(concern) {
    const formats = {
      'security': 'Security concerns',
      'privacy': 'Privacy concerns',
      'too-many': 'Too many accounts',
      'forgotten': 'Forgotten accounts',
      'managing': 'Managing recurring payments',
      'nothing': 'No concerns'
    };
    
    return formats[concern] || concern;
  }
}
