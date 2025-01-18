import addIcons, { regularIcons, brandsIcons, solidIcons } from '../../../util/add_icons';

addIcons();

function debounce(func, wait = 300) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export function getAllIconClassNames() {
	const sets = [regularIcons, brandsIcons, solidIcons];
	const allIconNames = [];

	sets.forEach(set => {
		Object.keys(set)
			.filter(key => key.startsWith('fa'))
			.forEach(key => {
				const iconDef = set[key];
				if (!iconDef?.prefix || !iconDef?.iconName) return;

				allIconNames.push({
					prefix: iconDef.prefix,
					iconName: iconDef.iconName,
					className: `${iconDef.prefix} fa-${iconDef.iconName}`,
				});
			});
	});


	// shuffle the icons

	const shuffledIcons = allIconNames.sort(() => Math.random() - 0.5); // why -0.5? th

	return shuffledIcons;
}

export function createIconPickerPopup() {
	const iconpopup = document.createElement('div');
	iconpopup.classList.add('icon-picker-popup', 'hidden');

	const container = document.createElement('div');
	container.classList.add('icon-picker-container');
	iconpopup.appendChild(container);

	const title = document.createElement('h3');
	title.innerText = 'Pick an Icon';
	container.appendChild(title);

	const searchInput = document.createElement('input');
	searchInput.setAttribute('placeholder', 'Search icons...');
	container.appendChild(searchInput);

	const iconList = document.createElement('ul');
	iconList.classList.add('icon-grid');
	container.appendChild(iconList);

	const allIcons = getAllIconClassNames();
	let visibleIcons = [];

	// **1. Lazy Load Icons with Intersection Observer**
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const iconElement = entry.target;
					iconElement.innerHTML = `<i class="${iconElement.dataset.class}" style="margin-right: 8px; font-size: 24px;"></i>${iconElement.dataset.name}`;
					observer.unobserve(iconElement);
				}
			});
		},
		{ root: iconList, threshold: 0.1 }
	);

	// **2. Render Icons Efficiently**
	function renderIcons(filterText = '') {
		iconList.innerHTML = ''; // Clear list
		const trimmedFilter = filterText.toLowerCase().trim();
		visibleIcons = allIcons.filter(icon => icon.iconName.includes(trimmedFilter));

		// **Only render placeholders, not full icons initially**
		visibleIcons.forEach(({ className, iconName }) => {
			const li = document.createElement('li');
			li.dataset.class = className;
			li.dataset.name = iconName;
			li.textContent = 'Loading...';
			li.addEventListener('click', () => {
				const selectedEvent = new CustomEvent('iconSelected', { detail: { iconName, className } });
				iconpopup.dispatchEvent(selectedEvent);
				hidePopup();
			});
			iconList.appendChild(li);
			observer.observe(li);
		});
	}

	// **3. Search Optimization**
	searchInput.addEventListener('input', debounce((e) => renderIcons(e.target.value), 300));

	function showPopup() {
		iconpopup.classList.remove('hidden');
		searchInput.focus();
	}

	function hidePopup() {
		iconpopup.classList.add('hidden');
		searchInput.value = '';
		renderIcons('');
	}

	renderIcons(); // Initial render
	document.body.appendChild(iconpopup);

	return { iconpopup, showPopup, hidePopup };
}
