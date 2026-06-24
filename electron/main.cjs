const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs');
const path = require('node:path');

const isDev = !app.isPackaged;
let splashWindow;
let mainWindowRef;
let isCheckingForUpdates = false;
let manualUpdateCheck = false;
let updaterReady = false;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.controlefinanceiromensal.app');
}

function getAppIconPath() {
  return isDev
    ? path.join(__dirname, '..', 'public', 'icons', 'icon-512.png')
    : path.join(__dirname, '..', 'dist', 'icons', 'icon-512.png');
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 360,
    frame: false,
    resizable: false,
    movable: true,
    show: false,
    center: true,
    backgroundColor: '#0f766e',
    title: 'Controle Financeiro Mensal',
    icon: getAppIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    show: false,
    backgroundColor: '#f4f7f8',
    title: 'Controle Financeiro Mensal',
    icon: getAppIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindowRef = mainWindow;

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.show();
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      splashWindow = null;
    }, 700);
  });

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function dispatchToRenderer(eventName) {
  const targetWindow = BrowserWindow.getFocusedWindow() || mainWindowRef;

  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.webContents.executeJavaScript(
    `window.dispatchEvent(new Event(${JSON.stringify(eventName)}));`
  );
}

function showUpdateMessage(message, type = 'info') {
  const targetWindow = mainWindowRef && !mainWindowRef.isDestroyed() ? mainWindowRef : null;
  dialog.showMessageBox(targetWindow, {
    type,
    title: 'Atualizações',
    message,
    buttons: ['OK'],
  });
}

function hasUpdateConfig() {
  return !isDev && fs.existsSync(path.join(process.resourcesPath, 'app-update.yml'));
}

function configureAutoUpdater() {
  if (isDev || !hasUpdateConfig()) return;

  updaterReady = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    isCheckingForUpdates = true;
  });

  autoUpdater.on('update-available', () => {
    showUpdateMessage('Uma atualização foi encontrada. O download será feito automaticamente.');
  });

  autoUpdater.on('update-not-available', () => {
    if (manualUpdateCheck) {
      showUpdateMessage('Você já está usando a versão mais recente.');
    }
    isCheckingForUpdates = false;
    manualUpdateCheck = false;
  });

  autoUpdater.on('error', (error) => {
    if (manualUpdateCheck) {
      showUpdateMessage(
        `Não foi possível verificar atualizações agora.\n\n${error?.message || 'Tente novamente mais tarde.'}`,
        'warning'
      );
    }
    isCheckingForUpdates = false;
    manualUpdateCheck = false;
  });

  autoUpdater.on('update-downloaded', async () => {
    isCheckingForUpdates = false;
    manualUpdateCheck = false;

    const targetWindow = mainWindowRef && !mainWindowRef.isDestroyed() ? mainWindowRef : null;
    const result = await dialog.showMessageBox(targetWindow, {
      type: 'info',
      title: 'Atualização pronta',
      message: 'A atualização foi baixada. Deseja reiniciar o aplicativo agora para instalar?',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

function checkForUpdates(manual = false) {
  if (isDev) {
    showUpdateMessage('A verificação de atualizações funciona somente no aplicativo instalado.');
    return;
  }

  if (!updaterReady) {
    if (manual) {
      showUpdateMessage(
        'Esta instalação foi gerada sem canal de atualização. Gere uma versão com GH_OWNER e GH_REPO para ativar o GitHub Releases.',
        'warning'
      );
    }
    return;
  }

  if (isCheckingForUpdates) {
    if (manual) {
      showUpdateMessage('A verificação de atualização já está em andamento.');
    }
    return;
  }

  manualUpdateCheck = manual;
  autoUpdater.checkForUpdates();
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Salvar backup dos dados (.json)',
          accelerator: 'CommandOrControl+S',
          click: () => dispatchToRenderer('finance:export-backup'),
        },
        {
          label: 'Importar backup (.json)',
          accelerator: 'CommandOrControl+O',
          click: () => dispatchToRenderer('finance:import-backup'),
        },
        { type: 'separator' },
        { role: 'reload', label: 'Recarregar' },
        { type: 'separator' },
        { role: 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { role: 'resetZoom', label: 'Zoom padrão' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Verificar atualizações',
          click: () => checkForUpdates(true),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  configureAutoUpdater();
  createMenu();
  createSplashWindow();
  createWindow();
  setTimeout(() => checkForUpdates(false), 3500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
