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

	ipcMain.on('open-file', async (event, file) => {
		if (file) {
			mainWindow.loadURL(NOTES_WINDOW_WEBPACK_ENTRY + '?file=' + file);
		}
		else {
			mainWindow.loadURL(NOTES_WINDOW_WEBPACK_ENTRY);
		}
	});

	/// openMainWindow
	ipcMain.on('open-main-window', async () => {
		mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
	});

	ipcMain.handle('get-file-data', async (event, notes) => {
		console.log('notes:', notes);
		const files = openFile(notes);
		return files;
	});

	ipcMain.handle('get-files', async (event, folder) => {
		const files = getFiles(folder);
		return files;
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
		const folders = getFolderConfig();
		console.log('folders:', folders);
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


function getFolderConfig() {
	const configFile = path.join(app.getPath('documents'), 'keepersNotes', 'config.json');

	// Ensure the directory exists
	const configDir = path.dirname(configFile);
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	let config = { folders: [] }; // Default config

	if (fs.existsSync(configFile)) {
		try {
			const fileContent = fs.readFileSync(configFile, 'utf8');
			config = JSON.parse(fileContent); // Try to parse the existing file
		} catch (error) {
			console.error("Error parsing config.json:", error.message);
			console.error("Resetting config.json to a valid state...");
			fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8'); // Reset file
		}
	} else {
		fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
	}

	console.log('configFile:', configFile);

	const folders = getFolders(); // Ensure this function exists and returns an array

	if (!Array.isArray(config.folders)) {
		config.folders = [];
	}

	folders.forEach(folder => {
		if (!config.folders.find(f => f.name === folder)) {
			config.folders.push({
				name: folder,
				icon: 'far fa-folder',
			});
		}
	});

	console.log('yoo det works:');

	// Save updated config back to file
	fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

	return config; // Already an object, no need to JSON.parse again
}

function updateConfig(folderName, icon) {
	const configFile = path.join(app.getPath('documents'), 'keepersNotes', 'config.json');
	const fileContent = fs.readFileSync(configFile, 'utf8');
	const config = JSON.parse(fileContent);

	const folderIndex = config.folders.findIndex(f => f.name === folderName);
	if (folderIndex === -1) {
		console.error('Folder not found:', folderName);
		return;
	}
	else {
		config.folders[folderIndex].icon = icon;
	}

	fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
}

function getFolders() {
	//const filePath = path.join(tempDir, 'keepersNotes');
	const filePath = path.join(app.getPath('documents'), 'keepersNotes');
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath, { recursive: true });
	}
	// get only folders
	const folders = fs.readdirSync(filePath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	console.log('folders:', folders);
	return folders;
}

function getFiles(folder) {
	const folderPath = path.join(app.getPath('documents'), 'keepersNotes', folder);
	if (!fs.existsSync(folderPath)) {
		// retunr empty array
		return [];
	}
	const files = fs.readdirSync(folderPath, { withFileTypes: true })
		.filter(dirent => dirent.isFile())
		.map(dirent => dirent.name);

	console.log('files:', files);
	return files;
}


function openFile(file) {
	const folderPath = path.join(app.getPath('documents'), 'keepersNotes');
	const filePath = path.join(folderPath, file);
	const fileContent = fs.readFileSync(filePath, 'utf8');
	if (fileContent) {
		return fileContent;
	}
	else {
		return '';
	}
}

function saveInFolder(notesAndFolder) {
	const { saveName, noteDataString, folder, icon } = notesAndFolder;
	// if icons os null the dont update the config file
	const folderPath = path.join(app.getPath('documents'), 'keepersNotes', folder);
	// see if exists if not create it
	if (!fs.existsSync) {
		fs.mkdirSync(folderPath, { recursive: true });
	}
	if (icon) {
		updateConfig(folder, icon);
	}

	const filePath = path.join(folderPath, `${saveName}.kep`);

	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	fs.writeFileSync(filePath, noteDataString);

}
