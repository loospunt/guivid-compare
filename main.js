const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

// Ensure we catch any extremely early crash
let logPath;
try {
  logPath = path.join(app.getPath('userData'), 'video-compare-gui.log');
} catch (e) {
  logPath = path.join(process.env.TEMP || '/tmp', 'video-compare-gui-error.log');
}

function log(message) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
  } catch (e) {
    console.error('Failed to write log', e);
  }
}

log('--- App Session Started ---');
log(`Platform: ${process.platform}, Architecture: ${process.arch}`);
log(`Node version: ${process.versions.node}`);
log(`Electron version: ${process.versions.electron}`);
log(`userData path: ${app.getPath('userData')}`);

process.on('uncaughtException', (error) => {
  const errStr = error && error.stack ? error.stack : String(error);
  log(`Uncaught Exception:\n${errStr}`);
  try {
    dialog.showErrorBox('Uncaught Exception', errStr);
  } catch (e) {
    log(`Failed to show error box: ${e}`);
  }
});

process.on('unhandledRejection', (reason) => {
  const reasonStr = reason && reason.stack ? reason.stack : String(reason);
  log(`Unhandled Rejection:\n${reasonStr}`);
  try {
    dialog.showErrorBox('Unhandled Rejection', reasonStr);
  } catch (e) {
    log(`Failed to show error box: ${e}`);
  }
});

function createWindow() {
  log('Creating browser window...');
  try {
    const win = new BrowserWindow({
      width: 1412,
      height: 1075,
      resizable: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      },
      autoHideMenuBar: true,
      title: "video compare GUI"
    });

    win.loadFile('index.html');
    log('Browser window loaded index.html successfully.');
  } catch (err) {
    log(`Failed to create browser window: ${err.stack || err}`);
    throw err;
  }
}

app.whenReady().then(() => {
  log('App ready triggered.');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log('App reactivate triggered, creating window.');
      createWindow();
    }
  });
}).catch((err) => {
  log(`Error in app.whenReady: ${err.stack || err}`);
  dialog.showErrorBox('Initialization Error', err.stack || err.message || String(err));
});

app.on('window-all-closed', () => {
  log('All windows closed.');
  if (process.platform !== 'darwin') {
    log('Quitting application.');
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('open-changelog', async () => {
  log('IPC open-changelog received.');
  try {
    const { shell } = require('electron');
    const clPath = path.join(__dirname, 'CHANGELOG.md');
    log(`Opening changelog path: ${clPath}`);
    await shell.openPath(clPath);
    return true;
  } catch (err) {
    log(`Error in IPC open-changelog: ${err.stack || err}`);
    return false;
  }
});

ipcMain.handle('log-from-renderer', async (event, message) => {
  log(`[RENDERER] ${message}`);
  return true;
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  log(`Opening external URL: ${url}`);
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('select-file', async () => {
  log('IPC select-file received.');
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm', 'flv', 'm4v'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      log('File selection canceled by user.');
      return null;
    }
    log(`File selected: ${result.filePaths[0]}`);
    return result.filePaths[0];
  } catch (err) {
    log(`Error in IPC select-file: ${err.stack || err}`);
    throw err;
  }
});

ipcMain.handle('select-exe', async () => {
  log('IPC select-exe received.');
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'com'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      log('Executable selection canceled by user.');
      return null;
    }
    log(`Executable selected: ${result.filePaths[0]}`);
    return result.filePaths[0];
  } catch (err) {
    log(`Error in IPC select-exe: ${err.stack || err}`);
    throw err;
  }
});

ipcMain.handle('check-exe-path', async () => {
  log('IPC check-exe-path received.');
  try {
    const { execSync } = require('child_process');
    const cmd = process.platform === 'win32' ? 'where video-compare.exe' : 'which video-compare';
    log(`Running command to locate executable: ${cmd}`);
    const result = execSync(cmd).toString().trim();
    log(`Executable found at OS path: ${result}`);
    return result;
  } catch (err) {
    log(`Executable not found in OS path: ${err.message}`);
    return null;
  }
});

ipcMain.handle('verify-path', async (event, filePath, type) => {
  log(`IPC verify-path received for: ${filePath} (type: ${type})`);
  return new Promise((resolve) => {
    const fs = require('fs');
    const { exec } = require('child_process');
    if (!filePath) return resolve(false);
    const cleaned = filePath.replace(/^"|"$/g, '');
    if (!fs.existsSync(cleaned)) return resolve(false);
    
    if (!type) return resolve(true);

    let cmd = `"${cleaned}"`;
    if (type === 'mediainfo') {
      cmd = `"${cleaned}" --help`;
    }
    
    log(`Running validation command: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
      const out = stdout ? stdout.toString() : '';
      const err = stderr ? stderr.toString() : '';
      log(`Validation output for ${type}:\nSTDOUT: ${out}\nSTDERR: ${err}`);
      
      if (type === 'vidcompare') {
        if (out.includes('video-compare') || err.includes('video-compare') || out.includes('Jon Frydensbjerg') || err.includes('Jon Frydensbjerg')) {
          return resolve(true);
        }
      } else if (type === 'mediainfo') {
        if (out.includes('MediaInfo') || err.includes('MediaInfo')) {
          return resolve(true);
        }
      }
      
      log(`Validation failed for ${type}`);
      resolve(false);
    });
  });
});

ipcMain.handle('get-mediainfo', async (event, filePath, mediainfoPath, deep = false) => {
  log(`IPC get-mediainfo received for: ${filePath} (deep: ${deep})`);
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    let exe = mediainfoPath || (process.platform === 'win32' ? 'MediaInfo.exe' : 'mediainfo');
    if (exe.includes(' ') && !exe.startsWith('"')) {
      exe = `"${exe}"`;
    }
    
    let cmd = `${exe} --Output=JSON "${filePath}"`;
    if (deep) {
      cmd = `${exe} --ParseSpeed=1 --Full --Output=JSON "${filePath}"`;
    }
    
    log(`Running mediainfo command: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        log(`Error in get-mediainfo: ${error.message}`);
        resolve(null);
        return;
      }
      log(`mediainfo executed successfully.`);
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        log(`Failed to parse JSON: ${e.message}`);
        resolve(null);
      }
    });
  });
});

ipcMain.handle('compare-videos', async (event, cmdStr) => {
  log(`IPC compare-videos received:\nCommand: ${cmdStr}`);
  try {
    const { exec } = require('child_process');
    log(`Executing command string: ${cmdStr}`);
    
    const cp = exec(cmdStr);
    
    cp.stdout.on('data', (data) => {
      log(`[STDOUT] ${data}`);
    });
    
    cp.stderr.on('data', (data) => {
      log(`[STDERR] ${data}`);
    });
    
    cp.on('close', (code) => {
      log(`Process exited with code ${code}`);
    });

    log('Process started successfully.');
    return true;
  } catch (err) {
    log(`Error in IPC compare-videos: ${err.stack || err}`);
    throw err;
  }
});
