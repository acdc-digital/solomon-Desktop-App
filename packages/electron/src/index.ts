// INDEX FILE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/src/index.ts

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import url from 'node:url';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});