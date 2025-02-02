"use strict";
// INDEX FILE
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/electron/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = __importDefault(require("node:url"));
const electron_squirrel_startup_1 = __importDefault(require("electron-squirrel-startup"));
if (electron_squirrel_startup_1.default) {
    electron_1.app.quit();
}
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
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
