const { contextBridge, ipcRenderer } = require('electron');

// 公开 Node.js API
contextBridge.exposeInMainWorld('nodeApi', {
  sendNotification: (title, body) => {
    ipcRenderer.send('renderer-event', { type: 'notification', title, body });
  },
  clipboard: {
    writeText: (text) => {
      ipcRenderer.send('renderer-event', { type: 'clipboard', type: 'writeText', text });
    },
    readText: () => {
      return ipcRenderer.sendSync('renderer-event', { type: 'clipboard', type: 'readText' });
    },
  },
  fs: {
    openFile: () => {
      return ipcRenderer.sendSync('renderer-event', { type: 'fs', type: 'open-file' });
    },
    saveFile: () => {
      return ipcRenderer.sendSync('renderer-event', { type: 'fs', type: 'save-file' });
    },
  },
  window: {
    close: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'close' });
    },
    hide: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'hide' });
    },
    maximize: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'maximize' });
    },
    minimize: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'minimize' });
    },
    unmaximize: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'unmaximize' });
    },
    unminimize: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'unminimize' });
    },
    setIgnoreCursorEvents: (ignore) => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'setIgnoreCursorEvents', ignore });
    },
    setResizable: (resizable) => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'setResizable', resizable });
    },
    startDragging: () => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'startDragging' });
    },
    setIcon: (icon) => {
      ipcRenderer.send('renderer-event', { type: 'window', type: 'setIcon', icon });
    },
  },
  openUrl: (url) => {
    ipcRenderer.send('renderer-event', { type: 'open-url', url });
  },
});

// 处理文件拖拽事件
ipcRenderer.on('open-file', (event, path) => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.files = new DataTransfer().files;
  fileInput.files.add(new File([new Blob()], path));
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
});
