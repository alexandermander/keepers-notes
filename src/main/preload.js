// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
	setLog: (title) => ipcRenderer.send('set-log', title)
})

contextBridge.exposeInMainWorld('windowAPI', {
	saveNote: (note) => ipcRenderer.send("save-temp-note", note),
	getFolders: () => ipcRenderer.invoke('get-folders'),
	getFiles: (folder) => ipcRenderer.invoke('get-files', folder),
	saveInFolder: (folder) => ipcRenderer.send('save-in-folder', folder),
	openFile: (file) => ipcRenderer.send('open-file', file),
	getFileData: (notes) => ipcRenderer.invoke('get-file-data', notes),
	openMainWindow: () => ipcRenderer.send('open-main-window'),
	saveIconPos: (folderAndPos) => ipcRenderer.send('save-icon-pos', folderAndPos)
})
