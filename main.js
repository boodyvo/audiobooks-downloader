const path = require('path');
const { app, BrowserWindow, session } = require("electron");
const { book } = require('./config');
const ipc = require('electron').ipcMain;

function createWindow () {
    let win = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            devTools: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.on("closed", () => {
        win = null
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    win.webContents.openDevTools();

    let urls = {};
    let last = false;

    ipc.on('set-url-title', function (event, arg) {
        console.log("Got ipc");
        console.log(arg);
        urls[arg.url] = arg.title;
    });

    ipc.on('got-last', function(event, arg) {
        last = true;
    });

    win.webContents.session.on('will-download', (event, item, webContents) => {
        console.log(item.getURL());
        console.log(urls);
        let name = urls[item.getURL()];
        if (name.indexOf(".mp3") === -1)
            name += ".mp3";
        item.setSavePath(path.join(__dirname, book, name));

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                } else {
                    console.log(`Received bytes: ${item.getReceivedBytes()}`)
                }
            }
        });
        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log('Download successfully')
            } else {
                console.log(`Download failed: ${state}`)
            }
            if (last)
                app.quit();
        })
    })
}

app.on('ready', createWindow);

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
    win.removeAllListeners('close');
    globalShortcut.unregisterAll();
    win.close();
});
