const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  const startUrl = `file://${path.join(__dirname, "dist", "index.html")}`;
  win.loadURL(startUrl);

  // OPTIONAL: open dev tools to see errors
  
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
