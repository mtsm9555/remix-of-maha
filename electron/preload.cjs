const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mahaAPI", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, callback) =>
    ipcRenderer.on(channel, (_, data) => callback(data)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  platform: process.platform,
});