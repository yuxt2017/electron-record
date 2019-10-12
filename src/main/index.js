import { app, BrowserWindow, ipcMain } from 'electron'
import createMiniWindow from './windows/miniWindow'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  // mainWindow = new BrowserWindow({
  //   height: 563,
  //   // useContentSize: true,
  //   width: 1000,
  //   titleBarStyle: 'hidden',
  //   frame: false
  // })

  // mainWindow.loadURL(winURL)

  // mainWindow.on('closed', () => {
  //   mainWindow = null
  // })
  mainWindow = createMiniWindow(BrowserWindow)
}


app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('open-video-area', () => {
  mainWindow.setSize(360, 300, true)
})
ipcMain.on('close-video-area', () => {
  mainWindow.setSize(360, 85, true)
})

ipcMain.on('window-mini', () => {
  mainWindow.minimize()
})
ipcMain.on('window-close', () => {
  mainWindow.close() // 窗口关闭
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
