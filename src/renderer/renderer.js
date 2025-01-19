import './index.css';

import { setupKeydownHandler } from './components/createNewFile';
import { showFilesInFolder } from './components/showFilsInfolder';
import addIcons from './util/add_icons';


addIcons();
setupKeydownHandler();


const svg = document.getElementById('zoomable-svg');
const viewBox = { x: 0, y: 0, width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height };
let isZooming = false, isDragging = false, isPanning = false;
let startX = 0, startY = 0;

async function getFolders() {
	const folders = await window.windowAPI.getFolders();
	console.log('folders', folders);
	return folders.folders;
}


function addFolderIcon(folderswithIcons) {
	let id = 0;
	folderswithIcons.forEach((folder) => {
		const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

		const randomX = Math.random() * 800;
		const randomY = Math.random() * 800;

		const sizeOfIcon = 80

		g.setAttribute("transform", `translate(${0}, ${0})`);

		const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
		const div = document.createElement("div");
		const icon = document.createElement("i");

		foreignObject.setAttribute("id", id++);
		foreignObject.setAttribute("x", randomX);
		foreignObject.setAttribute("y", randomY);
		foreignObject.setAttribute("width", sizeOfIcon);
		foreignObject.setAttribute("height", sizeOfIcon);

		foreignObject.classList.add('draggable');

		foreignObject.dataset.open = "false";
		foreignObject.dataset.folderName = folder.name;

		foreignObject.innerHTML = `<i class="render ${folder.icon}" 
		style = "font-size: ${sizeOfIcon}px;" ></i > `;

		// TODO:  make files name show up in svg

		g.appendChild(foreignObject);
		svg.appendChild(g);
	});
}



let folders = [];

document.addEventListener('DOMContentLoaded', async () => {
	folders = await getFolders();
	addFolderIcon(folders);

	const draggables = document.querySelectorAll('.draggable');// is a svg element with class draggable





	draggables.forEach((draggable) => {

		draggable.addEventListener('dblclick', () => {
			const container = draggable.closest('svg');
			const isOpen = draggable.dataset.open === "true";

			if (isOpen) {
				// Close the icon, remove the twist
				draggable.classList.remove('icon-twist');

				// Remove the files
				let files = container.querySelectorAll(`.file-${draggable.id} `);
				files = Array.from(files).reverse();

				files.forEach((file, index) => {
					setTimeout(() => {
						file.classList.add('fade-out');
						setTimeout(() => {
							file.remove();
						}, 500);
					}, index * 50); // Delay increases per file
				});

				draggable.dataset.open = "false";

			} else {
				// Open the icon, add the twist

				draggable.dataset.open = "true";
				draggable.classList.add('icon-twist');
				const files = showFilesInFolder(draggable);

			}
		});

		draggable.addEventListener('mousedown', (event) => {
			if (isZooming || isPanning || draggable.dataset.open === "true") {
				return; // Exit early to avoid interference
			}

			draggable.style.cursor = 'grabbing';

			let shiftX = event.clientX - draggable.getBoundingClientRect().left;
			let shiftY = event.clientY - draggable.getBoundingClientRect().top;

			const onMouseMove = (moveEvent) => {
				let newX = moveEvent.clientX - shiftX;
				let newY = moveEvent.clientY - shiftY;

				// Convert to SVG coordinates if within an SVG
				const svg = draggable.closest('svg');
				if (svg) {
					const svgPoint = svg.createSVGPoint();
					svgPoint.x = newX;
					svgPoint.y = newY;

					// Transform screen coordinates to SVG coordinates
					const screenCTM = svg.getScreenCTM();
					if (screenCTM) {
						const transformedPoint = svgPoint.matrixTransform(screenCTM.inverse());
						newX = transformedPoint.x;
						newY = transformedPoint.y;
					}
				}

				// Update the position of the draggable element
				draggable.setAttribute('x', newX);
				draggable.setAttribute('y', newY);
			};

			// Remove event listeners when the mouse is released
			const onMouseUp = () => {
				draggable.style.cursor = 'move';
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			};

			// Attach listeners for moving and releasing the mouse
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		//draggable.dataset.open
		draggable.style.cursor = "move";
	});


	document.addEventListener('keydown', (event) => {

		// if ctrl + q open notes
		if (event.key === 'q' && event.ctrlKey) {
			const file = null;
			window.windowAPI.openFile(file);
		}

		const popup = document.getElementById('search-popup');

		if (popup && !popup.classList.contains('hidden') && event.key === ' ') {
			return; // Exit early to avoid interference
		}
		if (event.key === 'z' || event.key === 'Z') {
			isZooming = true;
			svg.style.cursor = 'zoom-in'; // Change cursor to indicate zoom mode
		}
		//if esc key is pressed then disable zoom mode
		if (event.key === 'Escape') {
			isZooming = false;
			svg.style.cursor = 'default'; // Change cursor to default
		}
		//if enmvet is space then reset the viewbox
		if (event.key === ' ') {
			event.preventDefault(); // Prevent default browser behavior
			isZooming = false;
			isPanning = true;
			svg.style.cursor = 'grab'; // Change cursor to indicate panning
		}
	});


	document.addEventListener('keyup', (event) => {
		// Check if the Space key is released
		if (event.key === ' ') {
			event.preventDefault(); // Prevent default browser behavior
			isPanning = false;
			svg.style.cursor = 'default'; // Change cursor to default
		}
	});

	svg.addEventListener('mousedown', (event) => {
		if (isZooming || isPanning) {
			isDragging = true;
			startX = event.clientX;
			startY = event.clientY;
			if (isPanning) svg.style.cursor = 'grabbing'; // Grabbing cursor for panning
		}
	});

	// Handle dragging for panning or zooming
	svg.addEventListener('mousemove', (event) => {
		if (isDragging) {
			const deltaX = event.clientX - startX;
			const deltaY = event.clientY - startY;

			if (isPanning) {
				const panFactor = 1.2;
				viewBox.x -= deltaX * (viewBox.width / svg.clientWidth) * panFactor;
				viewBox.y -= deltaY * (viewBox.height / svg.clientHeight) * panFactor;
			}

			if (isZooming) {
				const zoomFactor = 0.005; // Adjust for zoom sensitivity
				const cursorX = event.clientX;
				const cursorY = event.clientY;

				// Translate cursor position to SVG coordinates
				const svgRect = svg.getBoundingClientRect();
				const cursorSvgX = viewBox.x + ((cursorX - svgRect.left) / svg.clientWidth) * viewBox.width;
				const cursorSvgY = viewBox.y + ((cursorY - svgRect.top) / svg.clientHeight) * viewBox.height;

				// Calculate new dimensions
				const scale = 1 - deltaX * zoomFactor;
				const newWidth = Math.max(50, viewBox.width * scale);
				const newHeight = newWidth * (viewBox.height / viewBox.width);

				// Adjust viewBox position to zoom into cursor position
				viewBox.x = cursorSvgX - ((cursorSvgX - viewBox.x) * (newWidth / viewBox.width));
				viewBox.y = cursorSvgY - ((cursorSvgY - viewBox.y) * (newHeight / viewBox.height));
				viewBox.width = newWidth;
				viewBox.height = newHeight;
			}

			// Apply updated viewBox
			svg.setAttribute(
				'viewBox',
				`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height} `
			);

			// Update start positions
			startX = event.clientX;
			startY = event.clientY;
		}
	});

	// Stop dragging when the mouse is released
	svg.addEventListener('mouseup', () => {
		if (isDragging) {
			isDragging = false;
			if (isPanning) svg.style.cursor = 'grab'; // Reset to grab cursor
		}
	});

	// Stop dragging if the mouse leaves the SVG
	svg.addEventListener('mouseleave', () => {
		if (isDragging) {
			isDragging = false;
			if (isPanning) svg.style.cursor = 'grab'; // Reset to grab cursor
		}
	});

});


