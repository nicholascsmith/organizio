const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Initialize database connection
const db = new Database();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Enable Node.js integration in the renderer process
      nodeIntegration: false,
      // Isolate the renderer process for security
      contextIsolation: true,
      // Preload script to expose only specific APIs to renderer
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools during development (optional)
  // mainWindow.webContents.openDevTools();

  // Clean up when window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create window when Electron has finished initializing
app.whenReady().then(() => {
  createWindow();
  
  // On macOS, re-create window when dock icon is clicked
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Set up IPC handlers for database operations
require('./ipc-handlers')(ipcMain, db);
