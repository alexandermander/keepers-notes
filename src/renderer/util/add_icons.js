import { library, dom } from '@fortawesome/fontawesome-svg-core';
import * as regularIcons from '@fortawesome/free-regular-svg-icons';
import * as brandsIcons from '@fortawesome/free-brands-svg-icons';
import * as solidIcons from '@fortawesome/free-solid-svg-icons';


//const addIcons = (iconSets) => {
//	iconSets.forEach(set => {
//		const icons = Object.keys(set)
//			.filter(key => key.startsWith('fa'))
//			.map(key => set[key]);
//
//		library.add(...icons);
//	});
//	dom.watch();
//	console.log('Icons added');
//};

function addIcons() {
	const iconSets = [regularIcons, brandsIcons, solidIcons];
	iconSets.forEach(set => {
		const icons = Object.keys(set)
			.filter(key => key.startsWith('fa'))
			.map(key => set[key]);

		library.add(...icons);
	});
	dom.watch();
	console.log('Icons added');
}

export default addIcons;

//export default addIcons();

// how to import the addIcons function in src/renderer/renderer.js
/*
 
 how to import the addIcons function in src/renderer/renderer.js
import addIcons from './util/add_icons';


*/
