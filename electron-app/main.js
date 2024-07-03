const { app, BrowserWindow, dialog, clipboard, shell, session, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const appRoot = app.getAppPath();
const appPath = path.join(appRoot, 'out');

console.log('===========NODE_ENV:==================', process.env.NODE_ENV);

console.log('===========appPath==================', appPath);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    resizable: true,
    titleBarStyle: 'hidden',
    title: 'BRClient',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      baseURLForDataURL: `file://${appPath}/`,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  console.log('===========__dirname==================', __dirname);
  const indexPath = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(appPath, 'index.html')}`;

  console.log('===========indexPath==================', indexPath);
  mainWindow.loadURL(indexPath);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // 配置会话对象以允许跨域请求
  const ses = session.fromPartition('persist:webviewsession');
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    headers['Access-Control-Allow-Origin'] = ['*'];
    headers['Access-Control-Allow-Methods'] = ['GET', 'POST', 'PUT', 'DELETE'];
    headers['Access-Control-Allow-Headers'] = ['*'];
    headers['Access-Control-Max-Age'] = ['86400'];
    callback({ responseHeaders: headers });
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 在 Windows 和 Linux 上, 清除 Service Worker 数据库
    // const userDataPath = app.getPath('userData');
    // const swDatabasePath = path.join(userDataPath, 'Service Worker');
    // try {
    //   fs.rmSync(swDatabasePath, { recursive: true, force: true });
    // } catch (err) {
    //   console.error('Failed to delete Service Worker database:', err);
    // }
    app.quit();
  }
});



// 处理文件拖拽
app.on('open-file', (event, path) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('open-file', path);
  }
});

// 处理通知
const sendNotification = (title, body) => {
  const notification = new Notification({ title, body });
  notification.show();
};

// 处理剪贴板
const handleClipboard = (window, event) => {
  if (event.type === 'writeText') {
    clipboard.writeText(event.text);
  } else if (event.type === 'readText') {
    event.returnValue = clipboard.readText();
  }
};

// 处理文件系统
const handleFileSystem = (window, event) => {
  if (event.type === 'open-file') {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
    }).then((result) => {
      if (!result.canceled) {
        event.returnValue = result.filePaths[0];
      }
    });
  } else if (event.type === 'save-file') {
    dialog.showSaveDialog(mainWindow, {
      properties: ['createDirectory'],
    }).then((result) => {
      if (!result.canceled) {
        event.returnValue = result.filePath;
      }
    });
  }
};

// 处理窗口操作
const handleWindow = (window, event) => {
  if (event.type === 'close') {
    mainWindow.close();
  } else if (event.type === 'hide') {
    mainWindow.hide();
  } else if (event.type === 'maximize') {
    mainWindow.maximize();
  } else if (event.type === 'minimize') {
    mainWindow.minimize();
  } else if (event.type === 'unmaximize') {
    mainWindow.unmaximize();
  } else if (event.type === 'unminimize') {
    mainWindow.restore();
  } else if (event.type === 'setIgnoreCursorEvents') {
    mainWindow.setIgnoreCursorEvents(event.ignore);
  } else if (event.type === 'setResizable') {
    mainWindow.setResizable(event.resizable);
  } else if (event.type === 'startDragging') {
    mainWindow.startDragging();
  } else if (event.type === 'setIcon') {
    mainWindow.setIcon(path.join(__dirname, 'icons', event.icon));
  }
};

// 处理渲染进程事件
const handleRendererEvent = (event, args) => {
  if (args.type === 'notification') {
    sendNotification(args.title, args.body);
  } else if (args.type === 'clipboard') {
    handleClipboard(mainWindow, args);
  } else if (args.type === 'fs') {
    handleFileSystem(mainWindow, args);
  } else if (args.type === 'window') {
    handleWindow(mainWindow, args);
  } else if (args.type === 'open-url') {
    shell.openExternal(args.url);
  }
};

