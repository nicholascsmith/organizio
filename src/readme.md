# Organizio

A cross-platform, privacy-first Electron app to help users clean up and take control of their digital lives.

## Overview

Organizio is a desktop application that helps users organize various aspects of their digital life:

- **Email Organizer**: Streamline your email accounts and reduce inbox clutter
- **Account Manager**: Track and manage your online accounts in one place
- **Password Hygiene**: Improve your password practices without sharing any actual passwords
- **Social Media Declutter**: Manage your social media presence and digital footprint
- **Privacy Coach**: Get personalized guidance to enhance your digital privacy

All data remains strictly local—no cloud, no servers, and no scanning of personal files.

## Key Features

- **Privacy-First**: All data is stored locally with zero cloud sync or tracking
- **Modular Design**: Each feature in its own logical module for easy maintenance
- **Beautiful UI**: Modern, clean interface with dark mode support
- **Guided Workflows**: Four-step process for each module (Discovery, Decision, Recommendations, Action Plan)
- **Local Analytics**: Optional usage tracking that stays on your device
- **Premium Features**: Unlock advanced features with feature flags (no online activation required)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/organizio.git
   cd organizio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

## Project Structure

```
organizio/
├── src/
│   ├── main/                  # Main process files
│   │   ├── main.js            # Main process entry point
│   │   ├── database.js        # SQLite database setup
│   │   ├── preload.js         # Secure API exposure to renderer
│   │   └── ipc-handlers.js    # IPC communication handlers
│   │
│   ├── renderer/              # Renderer process files
│   │   ├── index.html         # Main HTML file
│   │   ├── renderer.js        # Renderer process entry point
│   │   ├── state/             # Local state management
│   │   │   └── store.js       # Simple state store
│   │   │
│   │   ├── components/        # Reusable UI components
│   │   │
│   │   ├── modules/           # App modules
│   │   │   ├── email-organizer/
│   │   │   ├── account-manager/
│   │   │   ├── password-hygiene/
│   │   │   ├── social-media/
│   │   │   ├── privacy-coach/
│   │   │   └── settings/
│   │   │
│   │   └── styles/            # CSS styles
│   │       ├── main.css       # Main styles
│   │       ├── themes.css     # Theme styles
│   │       └── animations.css # Animation styles
│   │
│   └── assets/                # Static assets
│
├── node_modules/
├── package.json
└── README.md
```

## Database Structure

Organizio uses SQLite for local data storage with the following tables:

- **preferences**: User preferences and settings
- **feature_flags**: Flags for premium features
- **emails**: Email accounts and organization data
- **accounts**: Online account tracking information
- **password_hygiene**: Password security metadata (no actual passwords stored)
- **social_media**: Social media account tracking
- **privacy_settings**: Privacy settings and recommendations
- **analytics**: Local analytics events (if enabled)

## Development Guide

### How to Add a New Module

1. Create a new folder in `src/renderer/modules/`
2. Create HTML, CSS, and JS files for your module
3. Add the module to navigation in `src/renderer/index.html`
4. Register the module in `src/renderer/renderer.js`
5. Create database tables in `src/main/database.js`
6. Add IPC handlers in `src/main/ipc-handlers.js`
7. Expose APIs in `src/main/preload.js`

### SQLite Database Operations

Organizio uses better-sqlite3 for database operations. Here's how to perform basic CRUD operations:

```javascript
// Create/Insert
const id = await window.api.database.saveEmail({
  service: 'Gmail',
  email: 'user@example.com',
  importance: 5
});

// Read
const emails = await window.api.database.getEmails();

// Update
await window.api.database.updateEmail(id, {
  importance: 4
});

// Delete
await window.api.database.deleteEmail(id);
```

### State Management

Organizio uses a simple state store for managing application state:

```javascript
// Get a value
const theme = store.get('preferences.theme');

// Set a value
store.set('preferences.theme', 'dark');

// Subscribe to changes
const unsubscribe = store.subscribe('preferences.theme', (theme) => {
  console.log('Theme changed:', theme);
});

// Unsubscribe when done
unsubscribe();
```

### Premium Features

Premium features are controlled by feature flags stored in the database:

```javascript
// Check if a premium feature is enabled
const featureFlags = await window.api.featureFlags.getFeatureFlags();
const emailPremium = featureFlags.find(f => f.feature_name === 'email_organizer_advanced');
const isEnabled = emailPremium ? emailPremium.is_enabled === 1 : false;

// Enable a premium feature
await window.api.featureFlags.updateFeatureFlag('email_organizer_advanced', 1);
```

## License

[MIT License](LICENSE)
