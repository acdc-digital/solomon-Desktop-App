// INDEX FILE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/src/index.ts

import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import url from 'node:url';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

// Set up logging
import log from 'electron-log';
autoUpdater.logger = log;
// Cast to 'any' to bypass the type-check for transports property
;(autoUpdater.logger as any).transports.file.level = 'info';

// Check if we’re in development mode:
const isDev = process.env.NODE_ENV === 'development';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // If you eventually want more security:
      // contextIsolation: true,
      // nodeIntegration: false,
    },
  });

  if (isDev) {
    // Load the local Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Load the production build from renderer/out/index.html
    const indexPath = path.join(__dirname, '../../renderer/out/index.html');
    const indexUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true,
    });
    mainWindow.loadURL(indexUrl);
  }
};

app.whenReady().then(() => {
  createWindow();
  // Check for updates after window creation
  autoUpdater.checkForUpdatesAndNotify();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

autoUpdater.on('update-available', () => {
  log.info('Update available.');
  // Optionally, notify the user that an update is downloading.
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded.');
  // Prompt the user to restart the app to apply updates.
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message:
        'A new version has been downloaded. Restart the application to apply the updates?',
      buttons: ['Restart', 'Later'],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater: ', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});