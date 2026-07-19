const { Tray, Menu, app, nativeImage } = require("electron");
const path = require("path");

let tray;

function createTray(mainWindow) {
  const iconPath = path.join(__dirname, "..", "public", "favicon.ico");
  let image;
  try {
    image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) image = nativeImage.createEmpty();
  } catch {
    image = nativeImage.createEmpty();
  }
  tray = new Tray(image);

  const menu = Menu.buildFromTemplate([
    {
      label: "Open MAHA",
      click() {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    { label: "Quit", click() { app.quit(); } },
  ]);

  tray.setToolTip("MAHA AI");
  tray.setContextMenu(menu);
  return tray;
}

module.exports = createTray;