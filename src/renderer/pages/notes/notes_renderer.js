const { marked } = require('marked');
import { createIconPickerPopup } from './componstes/iconPickerPopup';

// get parm from the url


const { iconpopup, showPopup, hidePopup } = createIconPickerPopup();

const folderList = document.getElementById('folder-list');
const editor = document.querySelector('.editor');


let saveName = null;
let markedFolder = null;
let markedIcon = null;

// Keep track of the currently selected or dragged image
let selectedImage = null;
let draggedImage = null;
let offsetX = 0;
let offsetY = 0;

let createId = 0;

const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get('file');

if (filePath) {
	console.log('Opening file:', filePath);

	// Code/code of sp.kep " so set the sanme and the folder

	const lastSlashIndex = filePath.lastIndexOf('/');
	const lastDotIndex = filePath.lastIndexOf('.');
	const folder = filePath.substring(0, lastSlashIndex);
	const name = filePath.substring(lastSlashIndex + 1, lastDotIndex);

	saveName = name;
	markedFolder = folder;

	window.windowAPI.getFileData(filePath).then((data) => {

		const { note, images } = JSON.parse(data);
		console.log('note:', images);
		editor.innerText = note;

		// img src with x and y position

		images.forEach((image) => {
			const img = document.createElement('img');
			img.src = image.src;
			img.style.position = 'absolute';
			img.style.left = `${image.x}px`;
			img.style.top = `${image.y}px`;

			editor.appendChild(img);
		});


	});
}

iconpopup.addEventListener('iconSelected', (event) => {
	const { iconName, className } = event.detail;
	console.log('User picked icon:', iconName, className);

	markedIcon = className;

	// get the icon element that hvae the id 0
	const icon = document.getElementById(0);
	console.log('icon', icon);

	hidePopup();
});

async function getFolders() {
	const folders = await window.windowAPI.getFolders();

	return folders.folders;
}

function saveInFolder() {

	const noteDataString = getTextAndImages();
	if (!saveName) {
		console.error('No note name provided');
		return;
	}
	const notesAndFolder = {
		saveName,
		noteDataString,
		folder: markedFolder,
		icon: markedIcon,
	};

	console.log('notesAndFolder', notesAndFolder);
	window.windowAPI.saveInFolder(notesAndFolder);
}

function getTextAndImages() {
	const tempText = document.getElementsByClassName('editor');
	const text = Array.from(tempText).map((element) => element.innerText);
	const note = text.join('\n');

	// check if any image is there in the editor
	const images = document.querySelectorAll('img');

	// get the image and the x and y position
	const imageDetails = Array.from(images).map((image) => {
		const rect = image.getBoundingClientRect();
		return {
			src: image.src,
			x: rect.x,
			y: rect.y,
		};
	});

	const noteData = {
		note,
		images: imageDetails,
	};

	//	console.log('noteData', JSON.stringify(noteData));
	const noteDataString = JSON.stringify(noteData);

	//	console.log('noteData', noteData);
	return noteDataString;
}

function saveinTempNote() {
	const noteDataString = getTextAndImages();
	window.windowAPI.saveNote(noteDataString);
}

editor.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {

		//const editor = document.getElementsByClassName('editor')[0];
		//const selection = window.getSelection();

		//if (!selection.anchorNode || selection.anchorNode.nodeType !== Node.TEXT_NODE) {
		//	// Ensure the selection is not a text node

		//	// Create a new <div> with a class
		//	const newLine = document.createElement('div');
		//	newLine.className = 'tempText'; // Add a class if needed
		//	newLine.innerHTML = '<br>'; // Create an empty line

		//	// Append the new line at the correct position in the editor
		//	const editor = document.getElementsByClassName('editor')[0];
		//	const lastChild = editor.lastChild;

		//	if (lastChild && lastChild.nodeName === 'DIV' && lastChild.innerHTML === '<br>') {
		//		// Avoid creating redundant empty lines at the end
		//		editor.appendChild(newLine);
		//	} else {
		//		editor.appendChild(newLine);
		//	}

		//	// Move the caret to the new line
		//	const range = document.createRange();
		//	range.selectNodeContents(newLine);
		//	range.collapse(true); // Position the caret at the beginning of the new line
		//	selection.removeAllRanges();
		//	selection.addRange(range);

		//	return;
		//}


		//const div = selection.anchorNode.parentElement;

		//// Parse the current line (optional)
		//const parsed = marked(div.innerText.trim());
		//div.innerHTML = parsed;

		//// Create a new line directly below the current line
		//const newLine = document.createElement('div');
		//newLine.innerHTML = '<br>'; // Empty line
		//div.parentNode.insertBefore(newLine, div.nextSibling); // Insert after current line

		//// Move the caret to the new line
		//const range = document.createRange();
		//range.selectNodeContents(newLine);
		//range.collapse(true); // Place caret at the start of the new line
		//selection.removeAllRanges();
		//selection.addRange(range);

		saveinTempNote();
	}
});

editor.addEventListener('wheel', (event) => {
	if (!event.ctrlKey) {
		return;
	}
	const editor = document.getElementsByClassName('editor')[0];
	const fontSize = window.getComputedStyle(editor).fontSize;
	const currentSize = parseFloat(fontSize);
	const newSize = event.deltaY > 0 ? currentSize - 1 : currentSize + 1;
	editor.style.fontSize = `${newSize}px`;
});



// if if hte user press on the editor make the image selected be false and remove the selected-image class
editor.addEventListener('mousedown', (event) => {

	// check out side the image
	if (event.target.nodeName !== 'IMG') {
		if (selectedImage) {
			selectedImage.classList.remove('selected-image');
			selectedImage = false;
		}
	}

});

editor.addEventListener('keydown', (event) => {
	if (event.key === 'Delete' && selectedImage) {
		selectedImage.remove();
		selectedImage = false;
	}
});

editor.addEventListener('mouseover', (event) => {
	if (event.target.nodeName === 'IMG') {
		event.target.style.cursor = 'grab';

		event.target.addEventListener('mousedown', (mousedownEvent) => {

			mousedownEvent.preventDefault();
			draggedImage = mousedownEvent.target;

			if (selectedImage) {
				selectedImage.classList.remove('selected-image');
			}
			selectedImage = draggedImage;
			selectedImage.classList.add('selected-image');

			offsetX = mousedownEvent.offsetX;
			offsetY = mousedownEvent.offsetY;
			draggedImage.style.cursor = 'grabbing';

			// Move the image as you drag
			const onMouseMove = (mousemoveEvent) => {
				if (draggedImage) {
					const editorRect = editor.getBoundingClientRect();
					const x = mousemoveEvent.clientX - editorRect.left - offsetX;
					const y = mousemoveEvent.clientY - editorRect.top - offsetY;
					draggedImage.style.position = 'absolute';
					draggedImage.style.left = `${x}px`;
					draggedImage.style.top = `${y}px`;
				}
			};

			// Stop dragging when the mouse button is released
			const onMouseUp = () => {
				if (draggedImage) {
					draggedImage.style.cursor = 'grab';
					draggedImage = null;
					// savein folder if imae is set
					if (saveName && markedFolder) {
						saveInFolder();
					}
				}
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			};

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});
	}
});


//window.electronAPI
document.addEventListener('keydown', (event) => {
	if (event.key === 's' && event.ctrlKey && !saveName && !markedFolder) {
		event.preventDefault(); // Prevent default browser behavior
		const popup = document.getElementById('search-popup');

		//set the placeholder of the input field name:
		const input = popup.querySelector('input');
		input.placeholder = 'Save note';
		popup.classList.remove('hidden'); // Show the popup
		popup.querySelector('input').focus(); // Focus the input field
	}
	else if (event.key === 's' && event.ctrlKey && saveName && markedFolder) {
		saveInFolder(saveName);
	}
	else if (event.key === 's' && event.ctrlKey && saveName && !markedFolder) {
		const folderPopup = document.getElementById('folder-popup');
		folderPopup.classList.remove('hidden');
	}
});
document.addEventListener('keydown', (event) => {
	// ctl q for onten the main window
	if (event.key === 'q' && event.ctrlKey) {
		window.windowAPI.openMainWindow();
	}

	if (event.key === 'Enter') {
		const popup = document.getElementById('search-popup');

		if (popup.classList.contains('hidden')) {
			return;
		}

		const input = popup.querySelector('input');
		const value = input.value;

		if (value === '') {
			return;
		}

		saveName = value;

		// Hide the search popup
		popup.classList.add('hidden');

		// Show the folder popu
		const folderPopup = document.getElementById('folder-popup');

		// Get the list of folders
		getFolders().then((folders) => {
			folderList.innerHTML = '';
			folders.forEach((folder) => {
				const li = document.createElement('li');

				// Create a span for the folder name
				const folderName = document.createElement('span');
				folderName.textContent = folder.name;

				// Create an icon for the right side
				const icon = document.createElement('i');
				icon.className = folder.icon;
				icon.style.marginLeft = 'auto'; // Push icon to the right

				// Append both elements inside li
				li.appendChild(folderName);
				li.appendChild(icon);

				li.setAttribute('tabindex', '0');

				li.addEventListener('click', () => {
					selectFolder(li, folder);
				});

				li.addEventListener('keydown', (event) => {
					if (event.key === 'Enter') {
						selectFolder(li, folder);
					}
				});

				folderList.appendChild(li);
			});
		});

		const createFolderBtn = document.getElementById('create-folder');
		createFolderBtn.onclick = () => {

			const input = document.createElement('input');
			input.setAttribute('tabindex', '0');
			folderList.appendChild(input);
			input.focus();

			input.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' && input.value.trim() !== '') {

					showPopup();
					const li = document.createElement('li');

					//set the id of the folder
					li.textContent = input.value;

					const icon = document.createElement('i');
					/// now pick the icon to set the icon
					//and wiat until the user pick the icon



					icon.style.marginLeft = 'auto'; // Push icon to the right
					li.appendChild(icon);

					li.setAttribute('tabindex', '0');

					li.addEventListener('click', () => {
						selectFolder(li, input.value);
					});

					li.addEventListener('keydown', (event) => {
						if (event.key === 'Enter') {
							selectFolder(li, input.value);
						}
					});

					folderList.replaceChild(li, input);
				}
			});

			folderList.scrollTop = folderList.scrollHeight;

		};

		// Show the popup
		folderPopup.classList.remove('hidden');

		// Function to handle folder selection
		function selectFolder(item, folder) {
			// Remove 'selected' class from all items
			folderList.querySelectorAll('.selected').forEach((li) => li.classList.remove('selected'));

			item.classList.add('selected');

			markedFolder = folder.name;
			markedIcon = folder.icon;

			folderPopup.classList.add('hidden');
		}
	}

	if (event.key === 'Escape') {
		const popup = document.getElementById('search-popup');
		popup.classList.add('hidden');

		const folderPopup = document.getElementById('folder-popup');
		folderPopup.classList.add('hidden');
	}
});

