// INDEX FILE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/src/index.ts

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import url from 'node:url';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Consider enabling these for production:
      // contextIsolation: true,
      // nodeIntegration: false,
    },
  });

  // Updated: go up two levels from dist to locate the renderer folder.
  const indexPath = path.join(__dirname, '../../renderer/out/index.html');
  const indexUrl = url.format({
    pathname: indexPath,
    protocol: 'file:',
    slashes: true,
  });

  mainWindow.loadURL(indexUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
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