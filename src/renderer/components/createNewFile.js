export function setupKeydownHandler() {
	//window.electronAPI
	document.addEventListener('keydown', (event) => {
		if (event.key === 'n' && event.ctrlKey) {
			event.preventDefault(); // Prevent default browser behavior
			const popup = document.getElementById('search-popup');

			//set the placeholder of the input field name:
			const input = popup.querySelector('input');
			input.placeholder = 'New file';
			popup.classList.remove('hidden'); // Show the popup
			popup.querySelector('input').focus(); // Focus the input field
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			// if the popup is hidden, exit early so get the
			const popup = document.getElementById('search-popup');

			if (popup.classList.contains('hidden')) {
				return;
			}
			const input = popup.querySelector('input');
			const value = input.value;

			if (value === '') {
				return;
			}
			console.log(value);
			window.electronAPI.setLog(value);

		}

		if (event.key === 'Escape') {
			const popup = document.getElementById('search-popup');
			popup.classList.add('hidden'); // Hide the popup
		}
	});
}
