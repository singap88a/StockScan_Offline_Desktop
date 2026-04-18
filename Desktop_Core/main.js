const { app, BrowserWindow, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendProcess;

function startBackend() {
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  const logDir = path.join(userDataPath, 'logs');

  // Ensure directories exist
  [dataDir, logDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const logFile = path.join(logDir, 'backend.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  logStream.write(`\n--- Backend Start: ${new Date().toISOString()} ---\n`);

  // Path to the backend server (stays in ASAR to find dependencies)
  let backendPath = path.join(__dirname, '..', 'StockScan_backend', 'server.js');

  console.log(`📂 Data: ${dataDir}`);
  console.log(`📝 Logs: ${logFile}`);
  console.log(`🚀 Starting backend via utilityProcess: ${backendPath}`);

  // Use Electron's utilityProcess for robust production background tasks
  backendProcess = utilityProcess.fork(backendPath, [], {
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      NODE_ENV: app.isPackaged ? 'production' : 'development',
      PORT: '5000'
    },
    stdio: 'pipe'
  });

  // Redirect backend output to log file
  backendProcess.stdout.pipe(logStream);
  backendProcess.stderr.pipe(logStream);

  backendProcess.on('spawn', () => {
    logStream.write(`🚀 Backend process successfully spawned\n`);
    console.log('🚀 Backend process spawned');
  });

  backendProcess.on('exit', (code) => {
    logStream.write(`⏹️ Backend process exited with code ${code}\n`);
    console.log(`⏹️ Backend Exited: ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'StockScan POS - Offline',
    icon: path.join(__dirname, '..', 'StockScan_frontend', 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'StockScan_frontend', 'dist', 'index.html'));
  }

  // Handle errors / Retries for dev
  let retryCount = 0;
  mainWindow.webContents.on('did-fail-load', () => {
    if (isDev && retryCount < 20) {
      retryCount++;
      const ports = [5173, 5174, 5175, 5176];
      const nextPort = ports[(retryCount - 1) % ports.length];
      setTimeout(() => mainWindow.loadURL(`http://localhost:${nextPort}`), 1500);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    process.env.NODE_ENV = 'production';
    startBackend();
  } else {
    process.env.NODE_ENV = 'development';
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) backendProcess.kill();
});
