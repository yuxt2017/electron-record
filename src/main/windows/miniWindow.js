const miniWinURL =
    process.env.NODE_ENV === 'development'
        ? `http://localhost:9080`
        : `file://${__dirname}/index.html#mini`
const createMiniWindow = function (BrowserWindow) {
    let obj = {
        height: 80,
        width: 360,
        minWidth: 300,
        minHeight: 80,
        show: true,
        frame: false,
        // transparent: true,
        hasShadow: true,
        // fullscreenable: false,
        // skipTaskbar: false,
        // resizable: process.env.NODE_ENV === 'development',
        // transparent: process.platform !== "linux",
        // alwaysOnTop: true,
        movable: true,
        // maximizable: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            webSecurity: false,
            navigateOnDragDrop: true
        }
    }

    let miniWindow = new BrowserWindow(obj)

    miniWindow.loadURL(miniWinURL)

    miniWindow.on('closed', () => {
        miniWindow = null
    })

    miniWindow.setThumbarButtons([])
    return miniWindow
}
export default createMiniWindow
