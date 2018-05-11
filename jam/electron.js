const {app, BrowserWindow} = require('electron');

let mainWindow;

global.argv = process.argv;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: /.*\.hex$/i.test(""+process.argv[1]) ? 375 : 1024,
      height:600,
  /* */
      webPreferences:{
	  devTools: false
      }
  /* */
    // fullscreen:true
    // frame:false
  });

  // mainWindow.webContents.openDevTools();

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
