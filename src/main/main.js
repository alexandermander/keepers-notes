import { app, BrowserWindow, ipcMain } from 'electron';
// const { app, BrowserWindow, ipcMain } = require('electron');
import started from 'electron-squirrel-startup';
import fs from 'fs';
import path from 'path';
import os from 'os';


if (started) {
	app.quit();
}

let mainWindow;


const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	});

	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
	console.log('Main window loaded:', MAIN_WINDOW_WEBPACK_ENTRY);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
	createWindow();

	ipcMain.on('save-temp-note', (event, note) => {
		saveInTemp(note);
	});


	//save-in-folder', folder)
	ipcMain.on('save-in-folder', (event, folder) => {
		saveInFolder(folder);
	});

	ipcMain.on('set-log', (event, title) => {
		console.log("file://", __dirname);
		mainWindow.loadURL(NOTES_WINDOW_WEBPACK_ENTRY);
	});

	ipcMain.handle('get-folders', async (event) => {
		const folders = getFolders();
		return folders;
	});

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

function saveInTemp(note) {
	const tempDir = os.tmpdir();
	const filePath = path.join(tempDir, 'keepersNotes', 'tempNote.txt');
	const fileDir = path.dirname(filePath);

	if (!fs.existsSync(fileDir)) {
		fs.mkdirSync(fileDir, { recursive: true });
	}

	fs.writeFileSync(filePath, note);

}

function getFolders() {
	//const filePath = path.join(tempDir, 'keepersNotes');
	const filePath = path.join(app.getPath('documents'), 'keepersNotes');
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath, { recursive: true });
	}

	const folders = fs.readdirSync(filePath);
	console.log('folders:', folders);
	return folders;
}

function saveInFolder(notesAndFolder) {
	const { saveName, noteDataString, folder } = notesAndFolder;
	const folderPath = path.join(app.getPath('documents'), 'keepersNotes', folder);
	const filePath = path.join(folderPath, `${saveName}.kep`);

	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	fs.writeFileSync(filePath, noteDataString);

}
