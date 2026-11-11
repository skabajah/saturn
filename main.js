const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

const ASPECT = 16 / 9;
let mainWindow = null;
let lastSize = { width: 1280, height: 720 };
let isAdjusting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    frame: false,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Load your app from the App folder
  mainWindow.loadFile(path.join(__dirname, 'App', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('will-resize', (event, newBounds) => {
    if (isAdjusting) return;
    const { width: w, height: h } = newBounds;
    if (w === lastSize.width && h === lastSize.height) return;

    isAdjusting = true;
    let newW = w;
    let newH = Math.round(w / ASPECT);

    if (newH > h) {
      newH = h;
      newW = Math.round(h * ASPECT);
    }

    event.preventDefault();
    mainWindow.setBounds({ ...newBounds, width: newW, height: newH });
    lastSize = { width: newW, height: newH };
    setImmediate(() => { isAdjusting = false; });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('win:minimize', () => mainWindow?.minimize());
ipcMain.handle('win:toggleMaximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.setSize(1280, 720);
    lastSize = { width: 1280, height: 720 };
  } else {
    mainWindow.maximize();
  }
});
ipcMain.handle('win:close', () => mainWindow?.close());
ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('dialog:openMedia', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open media',
    properties: ['openFile'],
    filters: [
      { name: 'Media', extensions: ['mp4','mkv','webm','mov','avi','mp3','m4a','wav','flac','ogg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  return { path: filePath, url: 'file://' + filePath.replace(/\\/g, '/') };
});

ipcMain.handle('win:toggleFullscreen', () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(next);
  return next;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});