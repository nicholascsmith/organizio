const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    // Ensure the data directory exists
    this.userDataPath = app.getPath('userData');
    this.dbPath = path.join(this.userDataPath, 'organizio.db');
    
    // Initialize database connection
    this.db = new Database(this.dbPath);
    
    // Enable foreign keys for referential integrity
    this.db.pragma('foreign_keys = ON');
    
    // Initialize database schema
    this.initSchema();
    
    console.log(`Database initialized at: ${this.dbPath}`);
  }
  
  initSchema() {
    // Create tables if they don't exist
    const queries = [
      // User preferences table
      `CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY,
        theme TEXT DEFAULT 'light',
        analytics_enabled INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Feature flags table for premium features
      `CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY,
        feature_name TEXT NOT NULL UNIQUE,
        is_enabled INTEGER DEFAULT 0,
        is_premium INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Email organizer table
      `CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY,
        service TEXT NOT NULL,
        email TEXT NOT NULL,
        last_login TEXT,
        importance INTEGER DEFAULT 0,
        action_needed TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Account manager table
      `CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        service TEXT NOT NULL,
        username TEXT NOT NULL,
        url TEXT,
        last_login TEXT,
        importance INTEGER DEFAULT 0,
        status TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Password hygiene table - NOTE: This doesn't store actual passwords
      // It only stores metadata about password strength and update frequency
      `CREATE TABLE IF NOT EXISTS password_hygiene (
        id INTEGER PRIMARY KEY,
        account_id INTEGER,
        service TEXT NOT NULL,
        strength INTEGER DEFAULT 0,
        last_updated TEXT,
        needs_update INTEGER DEFAULT 0,
        unique_password INTEGER DEFAULT 1,
        two_factor_enabled INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )`,
      
      // Social media table
      `CREATE TABLE IF NOT EXISTS social_media (
        id INTEGER PRIMARY KEY,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        profile_url TEXT,
        last_post_date TEXT,
        post_frequency TEXT,
        importance INTEGER DEFAULT 0,
        action_needed TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Privacy settings table
      `CREATE TABLE IF NOT EXISTS privacy_settings (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        setting_name TEXT NOT NULL,
        current_status TEXT,
        recommended_status TEXT,
        importance INTEGER DEFAULT 0,
        action_needed TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Analytics table (for opt-in local analytics only)
      `CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_data TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    // Execute each query to create tables
    for (const query of queries) {
      this.db.prepare(query).run();
    }
    
    // Initialize default preferences if none exist
    const prefsCount = this.db.prepare('SELECT COUNT(*) as count FROM preferences').get().count;
    if (prefsCount === 0) {
      this.db.prepare('INSERT INTO preferences (theme, analytics_enabled) VALUES (?, ?)').run('light', 0);
    }
    
    // Initialize default feature flags
    const featureFlagsCount = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags').get().count;
    if (featureFlagsCount === 0) {
      const defaultFeatures = [
        { name: 'email_organizer', enabled: 1, premium: 0 },
        { name: 'account_manager', enabled: 1, premium: 0 },
        { name: 'password_hygiene_basic', enabled: 1, premium: 0 },
        { name: 'password_hygiene_advanced', enabled: 0, premium: 1 },
        { name: 'social_media_basic', enabled: 1, premium: 0 },
        { name: 'social_media_advanced', enabled: 0, premium: 1 },
        { name: 'privacy_coach_basic', enabled: 1, premium: 0 },
        { name: 'privacy_coach_advanced', enabled: 0, premium: 1 },
        { name: 'bulk_actions', enabled: 0, premium: 1 },
        { name: 'detailed_reports', enabled: 0, premium: 1 }
      ];
      
      const insertFeatureStmt = this.db.prepare(
        'INSERT INTO feature_flags (feature_name, is_enabled, is_premium) VALUES (?, ?, ?)'
      );
      
      for (const feature of defaultFeatures) {
        insertFeatureStmt.run(feature.name, feature.enabled, feature.premium);
      }
    }
  }
  
  // Generic CRUD operations
  
  // Get all records from a table
  getAll(table) {
    return this.db.prepare(`SELECT * FROM ${table}`).all();
  }
  
  // Get a single record by ID
  getById(table, id) {
    return this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  }
  
  // Insert a new record
  insert(table, data) {
    // Generate column names and placeholders for the SQL query
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const result = this.db.prepare(query).run(...values);
    
    return result.lastInsertRowid;
  }
  
  // Update a record by ID
  update(table, id, data) {
    // Generate SET part of the SQL query
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    return this.db.prepare(query).run(...values);
  }
  
  // Delete a record by ID
  delete(table, id) {
    return this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  }
  
  // Custom queries
  
  // Get user preferences
  getPreferences() {
    return this.db.prepare('SELECT * FROM preferences WHERE id = 1').get();
  }
  
  // Update user preferences
  updatePreferences(preferences) {
    const { theme, analytics_enabled } = preferences;
    return this.db.prepare(
      'UPDATE preferences SET theme = ?, analytics_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
    ).run(theme, analytics_enabled);
  }
  
  // Get feature flags
  getFeatureFlags() {
    return this.db.prepare('SELECT * FROM feature_flags').all();
  }
  
  // Update a feature flag
  updateFeatureFlag(name, enabled) {
    return this.db.prepare(
      'UPDATE feature_flags SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE feature_name = ?'
    ).run(enabled, name);
  }
  
  // Add analytics event (if opted in)
  addAnalyticsEvent(eventType, eventData) {
    const analyticsEnabled = this.getPreferences().analytics_enabled;
    if (analyticsEnabled) {
      return this.db.prepare(
        'INSERT INTO analytics (event_type, event_data) VALUES (?, ?)'
      ).run(eventType, JSON.stringify(eventData));
    }
    return null;
  }
  
  // Get analytics events
  getAnalytics() {
    return this.db.prepare('SELECT * FROM analytics ORDER BY timestamp DESC').all();
  }
  
  // Clear analytics data
  clearAnalytics() {
    return this.db.prepare('DELETE FROM analytics').run();
  }
  
  // Close the database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseManager;
