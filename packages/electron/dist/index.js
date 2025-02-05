"use strict";
// INDEX FILE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = __importDefault(require("node:url"));
const electron_squirrel_startup_1 = __importDefault(require("electron-squirrel-startup"));
if (electron_squirrel_startup_1.default) {
    electron_1.app.quit();
}
// Set up logging
const electron_log_1 = __importDefault(require("electron-log"));
electron_updater_1.autoUpdater.logger = electron_log_1.default;
// Cast to 'any' to bypass the type-check for transports property
;
electron_updater_1.autoUpdater.logger.transports.file.level = 'info';
// Check if we’re in development mode:
const isDev = process.env.NODE_ENV === 'development';
const createWindow = () => {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            // If you eventually want more security:
            // contextIsolation: true,
            // nodeIntegration: false,
        },
    });
    if (isDev) {
        // Load the local Next.js dev server
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        // Load the production build from renderer/out/index.html
        const indexPath = node_path_1.default.join(__dirname, '../../renderer/out/index.html');
        const indexUrl = node_url_1.default.format({
            pathname: indexPath,
            protocol: 'file:',
            slashes: true,
        });
        mainWindow.loadURL(indexUrl);
    }
};
electron_1.app.whenReady().then(() => {
    createWindow();
    // Check for updates after window creation
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_updater_1.autoUpdater.on('update-available', () => {
    electron_log_1.default.info('Update available.');
    // Optionally, notify the user that an update is downloading.
});
electron_updater_1.autoUpdater.on('update-downloaded', () => {
    electron_log_1.default.info('Update downloaded.');
    // Prompt the user to restart the app to apply updates.
    electron_1.dialog
        .showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version has been downloaded. Restart the application to apply the updates?',
        buttons: ['Restart', 'Later'],
    })
        .then((result) => {
        if (result.response === 0) {
            electron_updater_1.autoUpdater.quitAndInstall();
        }
    });
});
electron_updater_1.autoUpdater.on('error', (err) => {
    electron_log_1.default.error('Error in auto-updater: ', err);
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=index.js.map