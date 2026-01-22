const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.ico'), // Sẽ tạo sau nếu cần
    show: false, // Ẩn cửa sổ cho đến khi sẵn sàng
    titleBarStyle: 'default'
  });

  // Load ứng dụng Angular đã build
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development: kết nối đến Angular dev server
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load file index.html từ dist/scale
    const indexPath = path.join(__dirname, '../dist/scale/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Hiển thị cửa sổ khi đã load xong
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus vào cửa sổ
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Xử lý lỗi khi load trang
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (!isDev) {
      // Trong production, có thể hiển thị trang lỗi
      mainWindow.loadFile(path.join(__dirname, '../dist/scale/index.html'));
    }
  });
}

// Khi Electron đã sẵn sàng
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Trên macOS, thường sẽ tạo lại cửa sổ khi click vào icon trong dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Thoát khi tất cả cửa sổ đóng (trừ macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Xử lý certificate errors (nếu cần)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Trong development, có thể bỏ qua lỗi certificate
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

