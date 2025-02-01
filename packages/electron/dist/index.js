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
const createWindow = () => {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            // Consider enabling these for production:
            // contextIsolation: true,
            // nodeIntegration: false,
        },
    });
    // Updated: go up two levels from dist to locate the renderer folder.
    const indexPath = node_path_1.default.join(__dirname, '../../renderer/out/index.html');
    const indexUrl = node_url_1.default.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
    });
    mainWindow.loadURL(indexUrl);
    if (!electron_1.app.isPackaged) {
        mainWindow.webContents.openDevTools();
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
