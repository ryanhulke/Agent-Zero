const { app, BrowserWindow, ipcMain, webContents, ipcRenderer } = require('electron')
const { promisify } = require('util');
const path = require('node:path')
const fs = require('fs/promises');

const sleep = promisify(setTimeout);

const Thread = require('./chatgpt');
const { markImage } = require('./markImage');
let win;

const thread = new Thread();


function extractJsonFromMarkdown(mdString) {
  const regex = /```json\s*([\s\S]+?)\s*```/; // This captures content between ```json and ```

  const match = mdString.match(regex);
  if (!match) return null;  // No JSON block found

  const jsonString = match[1].trim();

  try {
      return JSON.parse(jsonString);
  } catch (err) {
      console.error('Failed to parse JSON:', err);
      return null;  // Invalid JSON content
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#18181b',
      symbolColor: '#74b1be'
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: false
    }
  })

  ipcMain.on('current-url', (event, url) => {
    win.webContents.send('update-url', url);
  });

  win.loadFile('index.html')
}

app.whenReady().then(async () => {
  createWindow();
  const thread = new Thread();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });

  let webview;
  let labelData;
  ipcMain.on('webview-ready', async (event, id) => {
    webview = webContents.fromId(id);
    console.log(`Acquired webviewId ${id}`);
  });

  ipcMain.on('send', async (event, {userMessage, elements }) => {
    labels = JSON.parse(elements);
    // start timer
    console.time("sending message");
    const image = await webview.capturePage();
    try {
      const imageBuff = Buffer.from(image.toPNG()).toString('base64');
      // const markedImg = await markImage(imageBuff, labels);
      thread.sendMessage(userMessage, imageBuff);
    } catch (e) {
      console.log(e);
    }
    console.timeEnd("sending message");
  });

  let currentTask;
  

  ipcMain.on('continue', async (event, text) => {

  });

  let action = () => {};
  ipcMain.on('execute', async (event, text) => {
    action();
  });

  thread.on('end_turn', (content) => {
    if (BrowserWindow.getAllWindows().length === 0) return;

    const data = extractJsonFromMarkdown(content);
    let msg = data === null ? content : data.briefExplanation;
    win.webContents.send('end_turn', msg);

    action = () => {
      if(data != null) {
        switch(data.nextAction.action) {
          case "click":
              console.log(`clicking ${JSON.stringify(labelData[data.nextAction.element])}`);
              let { x, y } = labelData[data.nextAction.element];
              webview.sendInputEvent({
                type: 'mouseDown', 
                x, y,
                clickCount: 1
              });
              webview.sendInputEvent({
                type: 'mouseUp', 
                x, y,
                clickCount: 1
              });
              break;
          case "type": {
              console.log(`typing ${data.nextAction.text} into ${JSON.stringify(labelData[data.nextAction.element])}`);
              let { x, y } = labelData[data.nextAction.element];
              webview.sendInputEvent({
                type: 'mouseDown', 
                x, y,
                clickCount: 1
              });
              webview.sendInputEvent({
                type: 'mouseUp', 
                x, y,
                clickCount: 1
              });

              for(let char of data.nextAction.text) {
                webview.sendInputEvent({
                  type: 'char', 
                  keyCode: char
                });
              }
              
              break;
            }
          default:
            console.log(`unknown action ${JSON.stringify(data.nextAction)}`);
            break;
        }
      }
    };
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})