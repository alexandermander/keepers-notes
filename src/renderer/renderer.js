import './index.css';
import { setupKeydownHandler } from './components/createNewFile';

import { library, dom } from '@fortawesome/fontawesome-svg-core';

const addIcons = (iconSets) => {
	iconSets.forEach(set => {
		const icons = Object.keys(set)
			.filter(key => key.startsWith('fa'))
			.map(key => set[key]);

		library.add(...icons);
	});
	dom.watch();
};

import * as regularIcons from '@fortawesome/free-regular-svg-icons';
import * as brandsIcons from '@fortawesome/free-brands-svg-icons';
import * as solidIcons from '@fortawesome/free-solid-svg-icons';

addIcons([regularIcons, brandsIcons, solidIcons]);

console.log('👋 This message is being logged by "renderer.js", included via webpack');
setupKeydownHandler();

async function getFolders() {
	const folders = await window.windowAPI.getFolders();
	console.log('folders', folders);
	return folders
}

function createFiles(draggable) {
	const files = [];
	const centerX = parseFloat(draggable.getAttribute('x')) || 0; // Icon's x position
	const centerY = parseFloat(draggable.getAttribute('y')) || 0; // Icon's y position
	const spacing = 60; // Vertical spacing between files

	// Example: Create 3 files in a vertical stack
	for (let i = 0; i < 3; i++) {
		const yOffset = (i + 1) * spacing; // Increment yOffset for vertical stacking

		const file = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		file.setAttribute("class", `file-${draggable.id} render`); // Associate with the parent
		file.setAttribute("width", "100"); // File width
		file.setAttribute("height", "50"); // File height
		file.setAttribute("x", centerX); // Align with the icon's x position
		file.setAttribute("y", centerY + yOffset); // Stack below the icon
		file.setAttribute("fill", "#3b82f6"); // File color
		file.setAttribute("rx", "5"); // Rounded corners
		files.push(file);
	}
	return files;
}

document.addEventListener('DOMContentLoaded', () => {
	const svg = document.getElementById('zoomable-svg');
	const viewBox = { x: 0, y: 0, width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height };
	let isZooming = false, isDragging = false, isPanning = false;
	let startX = 0, startY = 0;


	const addIcons = (iconList) => {
		iconList.forEach((icon) => {
			const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");

			// Generate random position within the SVG
			const randomX = Math.random() * 800; // Assuming the SVG is 1024x1024
			const randomY = Math.random() * 800;

			// Generate random size within a reasonable range
			const randomSize = Math.floor(Math.random() * 50) + 50; // Sizes between 50px and 100px

			foreignObject.classList.add('draggable');
			foreignObject.setAttribute("x", randomX);
			foreignObject.setAttribute("y", randomY);
			foreignObject.setAttribute("width", randomSize);
			foreignObject.setAttribute("height", randomSize);

			// Add the icon with random font size
			foreignObject.innerHTML = `<i class="render fa ${icon}" style="font-size: ${randomSize}px;"></i>`;
			svg.appendChild(foreignObject);
		});
	};

	addIcons(["sharp fa-folder", "fa-brands fa-docker", "fa-brands fa-facebook"]);
	// add a event listnser when the mouse is over the svg with class draggable

	const draggables = document.querySelectorAll('.draggable');// is a svg element with class draggable
	draggables.forEach((draggable) => {
		draggable.addEventListener('dblclick', () => {
			const container = draggable.closest('svg'); // Get the SVG container
			const isOpen = draggable.dataset.open === "true"; // Check current state

			if (isOpen) {
				// Close the icon and remove the files
				const files = container.querySelectorAll(`.file-${draggable.id}`);
				files.forEach(file => file.remove());
				draggable.dataset.open = "false"; // Update state
			} else {
				// Open the icon and display files
				const files = createFiles(draggable); // Generate file icons dynamically
				files.forEach(file => container.appendChild(file));
				draggable.dataset.open = "true"; // Update state
			}
		});

		draggable.addEventListener('mousedown', (event) => {
			if (isZooming || isPanning) {
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
				draggable.style.cursor = 'grab'; // Reset cursor
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			};

			// Attach listeners for moving and releasing the mouse
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		draggable.style.cursor = 'grab';
	});


	document.addEventListener('keydown', (event) => {
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
				`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
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
