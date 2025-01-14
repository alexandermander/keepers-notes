/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 */

import './index.css';
import { setupKeydownHandler } from './components/createNewFile';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faSmile } from '@fortawesome/free-regular-svg-icons';

library.add(faSmile);

// Automatically replace <i> tags with SVGs

dom.watch();


console.log('👋 This message is being logged by "renderer.js", included via webpack');
setupKeydownHandler();

async function getFolders() {
	const folders = await window.windowAPI.getFolders();
	console.log('folders', folders);
	return folders
}

getFolders().then((folders) => {
	folders.forEach((folder) => {
		// Select the SVG container
		const svgContainer = document.getElementById('zoomable-svg');

		// Create an <i> element for the FontAwesome icon
		const iconElement = document.createElement('i');
		iconElement.className = 'fas fa-folder'; // Use the class for a folder icon

		// Optionally, add attributes or data to the icon element
		iconElement.setAttribute('data-folder-name', folder);

		// Append the icon to the SVG container
		svgContainer.appendChild(iconElement);
	});

	// Watch and replace <i> with SVGs
	dom.watch();
});

document.addEventListener('DOMContentLoaded', () => {
	const svg = document.getElementById('zoomable-svg');
	let isZooming = false;
	let isDragging = false;
	let isPanning = false;
	let viewBox = { x: 0, y: 0, width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height };
	let startX = 0;
	let startY = 0;

	// Enable zoom mode with the 'z' key
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
