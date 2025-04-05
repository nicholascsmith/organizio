/**
 * Email Organizer Module
 * 
 * This module helps users organize their email accounts and improve their email habits.
 * It follows a four-step flow:
 * 1. Discovery: Ask questions to understand the user's email usage
 * 2. Decision Point: Add email accounts and assess importance
 * 3. Recommendations: Generate personalized recommendations
 * 4. Action Plan: Create a step-by-step action plan
 */

import store from '../../state/store.js';
import { logAnalyticsEvent } from '../../renderer.js';

// Initialize module when it's loaded
document.addEventListener('module-loaded', event => {
  if (event.detail.module === 'email-organizer') {
    initEmailOrganizerModule();
  }
});

// Main initialization function
function initEmailOrganizerModule() {
  // DOM Elements
  const startBtn = document.getElementById('email-start-btn');
  const moduleIntro = document.querySelector('.module-intro');
  const moduleFlow = document.querySelector('.module-flow');
  const moduleResults = document.querySelector('.module-results');
  const stepContents = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator .step');
  
  // Email account form elements
  const addEmailBtn = document.getElementById('add-email-btn');
  const emailForm = document.getElementById('email-form');
  const cancelEmailBtn = document.getElementById('cancel-email');
  const saveEmailBtn = document.getElementById('save-email');
  const emailAccountsList = document.getElementById('email-accounts-list');
  
  // Navigation buttons
  const backToIntroBtn = document.getElementById('back-to-intro');
  const toStep2Btn = document.getElementById('to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const toStep3Btn = document.getElementById('to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const toStep4Btn = document.getElementById('to-step-4');
  const backToStep3Btn = document.getElementById('back-to-step-3');
  const finishEmailBtn = document.getElementById('finish-email');
  
  // Results view buttons
  const restartEmailBtn = document.getElementById('restart-email');
  const viewEmailsBtn = document.getElementById('view-emails');
  
  // Premium feature button
  const unlockEmailPremiumBtn = document.getElementById('unlock-email-premium');
  
  // State variables
  let currentStep = 1;
  let editingEmailId = null;
  let emailAccounts = [];
  
  // Initialize the module
  initModule();
  
  // Initialize module
  async function initModule() {
    // Initialize email accounts from database
    await loadEmailAccounts();
    
    // Check premium features
    await checkPremiumFeatures();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if we have a saved current step in the store
    const savedStep = store.get('modules.emailOrganizer.currentStep');
    if (savedStep > 0) {
      currentStep = savedStep;
      showModuleFlow();
      goToStep(currentStep);
    }
  }
  
  // Load email accounts from database
  async function loadEmailAccounts() {
    try {
      emailAccounts = await window.api.database.getEmails();
      renderEmailAccounts();
      
      // Update store
      store.set('modules.emailOrganizer.emails', emailAccounts);
    } catch (error) {
      console.error('Error loading email accounts:', error);
      emailAccounts = [];
    }
  }
  
  // Check premium features
  async function checkPremiumFeatures() {
    try {
      const featureFlags = await window.api.featureFlags.getFeatureFlags();
      const emailPremiumFlag = featureFlags.find(flag => flag.feature_name === 'email_organizer_advanced');
      
      // Hide premium section if already unlocked
      if (emailPremiumFlag && emailPremiumFlag.is_enabled === 1) {
        const premiumSection = document.getElementById('email-premium-features');
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
    
    // Email account form buttons
    addEmailBtn.addEventListener('click', showEmailForm);
    cancelEmailBtn.addEventListener('click', hideEmailForm);
    saveEmailBtn.addEventListener('click', saveEmailAccount);
    
    // Navigation buttons
    backToIntroBtn.addEventListener('click', () => {
      hideModuleFlow();
      currentStep = 1;
      store.set('modules.emailOrganizer.currentStep', 0);
    });
    
    toStep2Btn.addEventListener('click', () => {
      saveDiscoveryResponses();
      goToStep(2);
    });
    
    backToStep1Btn.addEventListener('click', () => goToStep(1));
    toStep3Btn.addEventListener('click', () => {
      if (emailAccounts.length > 0) {
        generateRecommendations();
        goToStep(3);
      } else {
        alert('Please add at least one email account before continuing.');
      }
    });
    
    backToStep2Btn.addEventListener('click', () => goToStep(2));
    toStep4Btn.addEventListener('click', () => {
      generateActionPlan();
      goToStep(4);
    });
    
    backToStep3Btn.addEventListener('click', () => goToStep(3));
    finishEmailBtn.addEventListener('click', showResults);
    
    // Results view buttons
    restartEmailBtn.addEventListener('click', restartModule);
    viewEmailsBtn.addEventListener('click', () => goToStep(2));
    
    // Premium feature button
    unlockEmailPremiumBtn.addEventListener('click', unlockPremiumFeatures);
  }
  
  // Show the module flow
  function showModuleFlow() {
    moduleIntro.style.display = 'none';
    moduleFlow.style.display = 'block';
    moduleResults.style.display = 'none';
    
    // Go to step 1 if no accounts yet
    if (currentStep === 1 || emailAccounts.length === 0) {
      goToStep(1);
    } else {
      goToStep(currentStep);
    }
    
    // Log start of email organization flow
    logAnalyticsEvent('email_organizer_start', {
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
    store.set('modules.emailOrganizer.currentStep', currentStep);
    
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
    logAnalyticsEvent('email_organizer_step', {
      step: currentStep,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show email account form
  function showEmailForm() {
    // Reset form
    document.getElementById('email-service').value = '';
    document.getElementById('email-address').value = '';
    document.getElementById('email-last-login').value = 'unknown';
    document.getElementById('email-importance').value = '3';
    document.getElementById('email-notes').value = '';
    
    // Show form
    emailForm.style.display = 'block';
    addEmailBtn.style.display = 'none';
    editingEmailId = null;
  }
  
  // Hide email account form
  function hideEmailForm() {
    emailForm.style.display = 'none';
    addEmailBtn.style.display = 'block';
    editingEmailId = null;
  }
  
  // Save email account
  async function saveEmailAccount() {
    const service = document.getElementById('email-service').value.trim();
    const email = document.getElementById('email-address').value.trim();
    const lastLogin = document.getElementById('email-last-login').value;
    const importance = parseInt(document.getElementById('email-importance').value);
    const notes = document.getElementById('email-notes').value.trim();
    
    // Validate input
    if (!service || !email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      let result;
      
      // Prepare email account data
      const emailData = {
        service,
        email,
        last_login: lastLogin,
        importance,
        notes
      };
      
      // Create action_needed based on importance
      if (importance <= 1) {
        emailData.action_needed = 'Consider deleting';
      } else if (importance === 2) {
        emailData.action_needed = 'Clean up and organize';
      } else if (importance >= 4) {
        emailData.action_needed = 'Keep organized';
      }
      
      // Update or create email account
      if (editingEmailId !== null) {
        result = await window.api.database.updateEmail(editingEmailId, emailData);
        
        // Update the local array
        const index = emailAccounts.findIndex(account => account.id === editingEmailId);
        if (index !== -1) {
          emailAccounts[index] = { ...emailAccounts[index], ...emailData, id: editingEmailId };
        }
      } else {
        const id = await window.api.database.saveEmail(emailData);
        result = id;
        
        // Add to local array
        emailAccounts.push({ ...emailData, id });
      }
      
      // Hide form and render accounts
      hideEmailForm();
      renderEmailAccounts();
      
      // Update store
      store.set('modules.emailOrganizer.emails', emailAccounts);
      
      // Log email account added/updated
      logAnalyticsEvent('email_account_saved', {
        isNew: editingEmailId === null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving email account:', error);
      alert('Error saving email account. Please try again.');
    }
  }
  
  // Edit email account
  function editEmailAccount(id) {
    // Find the email account
    const account = emailAccounts.find(acc => acc.id === id);
    if (!account) return;
    
    // Fill the form
    document.getElementById('email-service').value = account.service || '';
    document.getElementById('email-address').value = account.email || '';
    document.getElementById('email-last-login').value = account.last_login || 'unknown';
    document.getElementById('email-importance').value = account.importance || '3';
    document.getElementById('email-notes').value = account.notes || '';
    
    // Show form and set editing ID
    emailForm.style.display = 'block';
    addEmailBtn.style.display = 'none';
    editingEmailId = id;
  }
  
  // Delete email account
  async function deleteEmailAccount(id) {
    if (!confirm('Are you sure you want to delete this email account?')) {
      return;
    }
    
    try {
      await window.api.database.deleteEmail(id);
      
      // Remove from local array
      emailAccounts = emailAccounts.filter(account => account.id !== id);
      
      // Render accounts
      renderEmailAccounts();
      
      // Update store
      store.set('modules.emailOrganizer.emails', emailAccounts);
      
      // Log email account deleted
      logAnalyticsEvent('email_account_deleted', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting email account:', error);
      alert('Error deleting email account. Please try again.');
    }
  }
  
  // Render email accounts
  function renderEmailAccounts() {
    if (!emailAccountsList) return;
    
    if (emailAccounts.length === 0) {
      emailAccountsList.innerHTML = '<p>No email accounts added yet. Click "Add Email Account" to get started.</p>';
      return;
    }
    
    // Sort by importance (highest first)
    const sortedAccounts = [...emailAccounts].sort((a, b) => b.importance - a.importance);
    
    // Create HTML
    const html = sortedAccounts.map(account => {
      const importanceClass = getImportanceClass(account.importance);
      
      return `
        <div class="email-account-item ${importanceClass}">
          <div class="account-details">
            <h4>${account.email}</h4>
            <p><strong>Service:</strong> ${account.service}</p>
            <p><strong>Last Login:</strong> ${formatLastLogin(account.last_login)}</p>
            <p><strong>Importance:</strong> ${formatImportance(account.importance)}</p>
            ${account.action_needed ? `<p><strong>Action:</strong> ${account.action_needed}</p>` : ''}
            ${account.notes ? `<p><strong>Notes:</strong> ${account.notes}</p>` : ''}
          </div>
          <div class="account-actions">
            <button class="btn-secondary edit-email" data-id="${account.id}">Edit</button>
            <button class="btn-secondary delete-email" data-id="${account.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');
    
    emailAccountsList.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-email').forEach(button => {
      button.addEventListener('click', () => {
        editEmailAccount(parseInt(button.getAttribute('data-id')));
      });
    });
    
    document.querySelectorAll('.delete-email').forEach(button => {
      button.addEventListener('click', () => {
        deleteEmailAccount(parseInt(button.getAttribute('data-id')));
      });
    });
  }
  
  // Save discovery responses
  function saveDiscoveryResponses() {
    const emailCount = document.getElementById('email-count').value;
    const emailPurpose = Array.from(document.getElementById('email-purpose').selectedOptions).map(option => option.value);
    const emailFrequency = document.getElementById('email-frequency').value;
    const emailManagement = document.getElementById('email-management').value;
    
    const responses = {
      emailCount,
      emailPurpose,
      emailFrequency,
      emailManagement
    };
    
    // Save to store
    store.set('modules.emailOrganizer.userResponses', responses);
    
    // Log discovery responses
    logAnalyticsEvent('email_discovery_completed', {
      responses,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate recommendations
  function generateRecommendations() {
    const recommendationsContainer = document.getElementById('recommendations-container');
    if (!recommendationsContainer) return;
    
    // Get user responses
    const responses = store.get('modules.emailOrganizer.userResponses');
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
            <h4>Account Consolidation</h4>
            <p>Based on your ${responses.emailCount} email accounts:</p>
            <ul>
      `;
      
      // Different recommendations based on email count
      if (responses.emailCount === '1-2') {
        recommendations += `
          <li>Your number of accounts is manageable. Focus on organizing them effectively.</li>
          <li>Consider using folders or labels to categorize emails.</li>
        `;
      } else if (responses.emailCount === '3-5') {
        recommendations += `
          <li>Consider consolidating to 2-3 primary accounts if possible.</li>
          <li>Designate specific accounts for specific purposes (e.g., one for work, one for personal).</li>
        `;
      } else {
        recommendations += `
          <li>You have many email accounts. Consider significantly reducing this number.</li>
          <li>Identify accounts that can be merged or deleted.</li>
          <li>Create a plan to forward emails from less important accounts to your primary ones.</li>
        `;
      }
      
      recommendations += `
            </ul>
          </div>
          
          <div class="recommendation-card">
            <h4>Email Management System</h4>
            <p>Based on your current email management approach (${formatManagementSystem(responses.emailManagement)}):</p>
            <ul>
      `;
      
      // Different recommendations based on management system
      if (responses.emailManagement === 'yes') {
        recommendations += `
          <li>Keep using your current system but look for optimization opportunities.</li>
          <li>Consider automating more parts of your workflow with filters and rules.</li>
        `;
      } else if (responses.emailManagement === 'somewhat') {
        recommendations += `
          <li>Formalize your email management system with consistent rules.</li>
          <li>Implement the "touch once" principle - deal with emails as you read them.</li>
          <li>Set up folders or labels for different categories of emails.</li>
        `;
      } else {
        recommendations += `
          <li>Start with a simple system: Read, Act, Archive, or Delete.</li>
          <li>Schedule specific times to check email rather than constantly checking.</li>
          <li>Use the "Inbox Zero" approach to process all emails in your inbox.</li>
        `;
      }
      
      recommendations += `
            </ul>
          </div>
          
          <div class="recommendation-card">
            <h4>Email Checking Frequency</h4>
            <p>Based on your checking frequency (${formatCheckingFrequency(responses.emailFrequency)}):</p>
            <ul>
      `;
      
      // Different recommendations based on checking frequency
      if (responses.emailFrequency === 'multiple-daily') {
        recommendations += `
          <li>Consider reducing check times to 2-3 specific times per day.</li>
          <li>Turn off notifications between scheduled check times.</li>
          <li>Use "focus time" periods where you don't check email at all.</li>
        `;
      } else if (responses.emailFrequency === 'daily') {
        recommendations += `
          <li>Your daily check frequency is good. Consider a morning and evening check.</li>
          <li>Use auto-responders for urgent matters if needed.</li>
        `;
      } else {
        recommendations += `
          <li>Your infrequent checking may cause you to miss important emails.</li>
          <li>Consider setting a regular schedule to process emails thoroughly.</li>
          <li>Make sure important contacts have alternative ways to reach you.</li>
        `;
      }
      
      recommendations += `
            </ul>
          </div>
      `;
      
      // Email purpose specific recommendations
      if (responses.emailPurpose && responses.emailPurpose.length > 0) {
        recommendations += `
          <div class="recommendation-card">
            <h4>Purpose-Specific Recommendations</h4>
            <p>Based on how you use email:</p>
            <ul>
        `;
        
        if (responses.emailPurpose.includes('work')) {
          recommendations += `
            <li><strong>Work emails:</strong> Create a folder system by project or client. Set aside specific time blocks for email.</li>
          `;
        }
        
        if (responses.emailPurpose.includes('personal')) {
          recommendations += `
            <li><strong>Personal emails:</strong> Keep separate from work emails. Consider using a different app or view.</li>
          `;
        }
        
        if (responses.emailPurpose.includes('shopping')) {
          recommendations += `
            <li><strong>Shopping emails:</strong> Create a dedicated folder or use a separate account. Unsubscribe from stores you no longer shop at.</li>
          `;
        }
        
        if (responses.emailPurpose.includes('newsletters')) {
          recommendations += `
            <li><strong>Newsletters:</strong> Use a service like Unroll.me or a dedicated folder. Schedule a specific time to read these.</li>
          `;
        }
        
        if (responses.emailPurpose.includes('social')) {
          recommendations += `
            <li><strong>Social notifications:</strong> Consider turning these off and checking the services directly instead.</li>
          `;
        }
        
        recommendations += `
            </ul>
          </div>
        `;
      }
      
      // Analysis of added accounts
      if (emailAccounts.length > 0) {
        recommendations += `
          <div class="recommendation-card">
            <h4>Account-Specific Recommendations</h4>
            <p>Based on your ${emailAccounts.length} added email accounts:</p>
            <ul>
        `;
        
        // Count accounts by importance
        const highImportance = emailAccounts.filter(acc => acc.importance >= 4).length;
        const mediumImportance = emailAccounts.filter(acc => acc.importance >= 2 && acc.importance <= 3).length;
        const lowImportance = emailAccounts.filter(acc => acc.importance <= 1).length;
        
        // Old accounts
        const oldAccounts = emailAccounts.filter(acc => 
          acc.last_login === 'year' || acc.last_login === 'more-than-year'
        ).length;
        
        recommendations += `
          <li>You have ${highImportance} high-importance accounts, ${mediumImportance} medium-importance accounts, and ${lowImportance} low-importance accounts.</li>
        `;
        
        if (lowImportance > 0) {
          recommendations += `
            <li>Consider deleting or archiving your ${lowImportance} low-importance accounts.</li>
          `;
        }
        
        if (oldAccounts > 0) {
          recommendations += `
            <li>You have ${oldAccounts} accounts you haven't used in over a year. These are prime candidates for deletion.</li>
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
      logAnalyticsEvent('email_recommendations_generated', {
        accountCount: emailAccounts.length,
        timestamp: new Date().toISOString()
      });
    }, 1000); // Simulate loading time
  }
  
  // Generate action plan
  function generateActionPlan() {
    const actionPlanContainer = document.getElementById('action-plan-container');
    if (!actionPlanContainer) return;
    
    // Show loading
    actionPlanContainer.innerHTML = '<div class="loading">Creating your action plan...</div>';
    
    // Generate action plan based on recommendations and accounts
    setTimeout(() => {
      // Create action steps based on the accounts
      const highPriorityAccounts = emailAccounts.filter(acc => acc.importance >= 4);
      const mediumPriorityAccounts = emailAccounts.filter(acc => acc.importance >= 2 && acc.importance <= 3);
      const lowPriorityAccounts = emailAccounts.filter(acc => acc.importance <= 1);
      
      let actionPlan = `
        <div class="action-plan">
          <div class="action-step">
            <h4>Step 1: Account Cleanup (Week 1)</h4>
            <p>Focus on removing unnecessary accounts and streamlining your email ecosystem.</p>
            <div class="task-list">
      `;
      
      if (lowPriorityAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-delete-accounts" class="task-checkbox">
            <label for="task-delete-accounts">Delete or archive these low-priority accounts:</label>
            <ul>
        `;
        
        lowPriorityAccounts.forEach(account => {
          actionPlan += `<li>${account.email} (${account.service})</li>`;
        });
        
        actionPlan += `
            </ul>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-unsubscribe" class="task-checkbox">
            <label for="task-unsubscribe">Unsubscribe from newsletters and marketing emails you don't read</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-forward" class="task-checkbox">
            <label for="task-forward">Set up forwarding from secondary accounts to primary accounts</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 2: Organization System (Week 2)</h4>
        <p>Establish a consistent organization system for your important accounts.</p>
        <div class="task-list">
      `;
      
      if (highPriorityAccounts.length > 0) {
        actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-folders" class="task-checkbox">
            <label for="task-folders">Create folder/label system for these high-priority accounts:</label>
            <ul>
        `;
        
        highPriorityAccounts.forEach(account => {
          actionPlan += `<li>${account.email} (${account.service})</li>`;
        });
        
        actionPlan += `
            </ul>
            <p>Suggested folders: Projects, Personal, Action Required, Waiting, Reference, Archive</p>
          </div>
        `;
      }
      
      actionPlan += `
          <div class="task">
            <input type="checkbox" id="task-filters" class="task-checkbox">
            <label for="task-filters">Set up filters or rules to automatically sort incoming mail</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-inbox-zero" class="task-checkbox">
            <label for="task-inbox-zero">Process existing emails using the Inbox Zero method</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 3: Routine Development (Week 3-4)</h4>
        <p>Establish sustainable habits for ongoing email management.</p>
        <div class="task-list">
          <div class="task">
            <input type="checkbox" id="task-schedule" class="task-checkbox">
            <label for="task-schedule">Set a regular schedule for checking email (e.g., 10am, 2pm, 5pm)</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-notifications" class="task-checkbox">
            <label for="task-notifications">Adjust notification settings to minimize distractions</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-templates" class="task-checkbox">
            <label for="task-templates">Create templates for common responses</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-weekly-review" class="task-checkbox">
            <label for="task-weekly-review">Schedule a weekly review to maintain your system</label>
          </div>
        </div>
      </div>
      
      <div class="action-step">
        <h4>Step 4: Advanced Optimization (Month 2+)</h4>
        <p>Fine-tune your system for long-term sustainability.</p>
        <div class="task-list">
          <div class="task">
            <input type="checkbox" id="task-archive-policy" class="task-checkbox">
            <label for="task-archive-policy">Establish an archiving policy for older emails</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-reassess" class="task-checkbox">
            <label for="task-reassess">Reassess email accounts and subscriptions quarterly</label>
          </div>
          
          <div class="task">
            <input type="checkbox" id="task-security-review" class="task-checkbox">
            <label for="task-security-review">Review security settings for all active accounts</label>
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
      logAnalyticsEvent('email_action_plan_generated', {
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
    
    store.set('modules.emailOrganizer.taskStatuses', taskStatuses);
  }
  
  // Load task statuses from store
  function loadTaskStatuses() {
    const taskStatuses = store.get('modules.emailOrganizer.taskStatuses');
    
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
    logAnalyticsEvent('email_organizer_completed', {
      accountCount: emailAccounts.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate summary
  function generateSummary() {
    const summaryContainer = document.getElementById('email-summary');
    if (!summaryContainer) return;
    
    // Count accounts by importance
    const highImportance = emailAccounts.filter(acc => acc.importance >= 4).length;
    const mediumImportance = emailAccounts.filter(acc => acc.importance >= 2 && acc.importance <= 3).length;
    const lowImportance = emailAccounts.filter(acc => acc.importance <= 1).length;
    
    // Calculate task completion percentage
    const taskStatuses = store.get('modules.emailOrganizer.taskStatuses') || {};
    const totalTasks = Object.keys(taskStatuses).length;
    const completedTasks = Object.values(taskStatuses).filter(status => status).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Create summary HTML
    const html = `
      <div class="summary-content">
        <div class="summary-section">
          <h5>Email Accounts</h5>
          <p>Total accounts: ${emailAccounts.length}</p>
          <ul>
            <li>High importance: ${highImportance}</li>
            <li>Medium importance: ${mediumImportance}</li>
            <li>Low importance: ${lowImportance}</li>
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
    store.resetModuleState('emailOrganizer');
    currentStep = 1;
    
    // Show intro
    hideModuleFlow();
  }
  
  // Unlock premium features
  async function unlockPremiumFeatures() {
    try {
      // Update feature flag
      await window.api.featureFlags.updateFeatureFlag('email_organizer_advanced', 1);
      
      // Hide premium section
      const premiumSection = document.getElementById('email-premium-features');
      if (premiumSection) {
        premiumSection.style.display = 'none';
      }
      
      // Show success message
      alert('Premium email organization features unlocked!');
      
      // Log premium unlocked
      logAnalyticsEvent('email_premium_unlocked', {
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
  
  // Format management system
  function formatManagementSystem(system) {
    const formats = {
      'yes': 'Good system',
      'somewhat': 'Some system',
      'no': 'No system'
    };
    
    return formats[system] || system;
  }
  
  // Format checking frequency
  function formatCheckingFrequency(frequency) {
    const formats = {
      'multiple-daily': 'Multiple times a day',
      'daily': 'Once a day',
      'few-times': 'A few times a week',
      'weekly': 'Once a week',
      'rarely': 'Rarely'
    };
    
    return formats[frequency] || frequency;
  }
}
