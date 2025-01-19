async function showFilesInFolder(draggable) {
	const folderName = draggable.dataset.folderName;

	//contextBridge.exposeInMainWorld('windowAPI', {
	//

	console.log('folderName', folderName);

	const files = await window.windowAPI.getFiles(folderName);
	console.log('files', files);

	const radius = 2200;

	const width = Math.floor(Number(draggable.getAttribute("width")));
	const height = Math.floor(Number(draggable.getAttribute("height")));

	const xc = Math.floor(Number(draggable.getAttribute("x")) + width / 2) - radius + 5;
	const yc = Math.floor(Number(draggable.getAttribute("y")) + height / 2) + 80;

	let angle = 0.0;

	for (let i = 0; i < files.length; i++) {
		const container = draggable.closest('svg');
		const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

		//add style on the g element
		// like width and height

		console.log('angle', angle);

		const pathFile = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
		const x = xc + radius * Math.cos(angle) - 25;
		const y = yc + radius * Math.sin(angle) - 25;
		// make the with so it fits the text
		pathFile.setAttribute("width", 100);
		pathFile.setAttribute("height", 70);
		pathFile.setAttribute("x", x);
		pathFile.setAttribute("y", y);

		// Get rotation angle
		const tangent = Math.atan2(y - yc, x - xc);
		const degree = tangent * (180 / Math.PI);
		pathFile.setAttribute("transform", `rotate(${degree}, ${x}, ${y})`);

		const div = document.createElement("div");
		div.style.display = "flex";
		div.style.width = "auto";
		div.style.alignItems = "center";
		div.style.flexWrap = "nowrap"; // Prevent wrapping

		// Icon
		const icon = document.createElement("i");
		icon.className = "render fa fa-solid fa-file file-3d";
		icon.style.fontSize = "50px";

		// File name
		const p = document.createElement("p");
		p.style.fontSize = "16px";
		p.style.color = "white";
		p.style.marginLeft = "10px"; // Space between icon and text
		p.style.whiteSpace = "nowrap"; // Ensure text stays on one line
		p.textContent = files[i];

		pathFile.dataset.fileName = folderName + '/' + files[i];

		div.appendChild(icon);
		div.appendChild(p);
		pathFile.appendChild(div);

		pathFile.classList.add(`file-${draggable.id}`, "fade-in");
		g.appendChild(pathFile);
		angle += 0.035;

		await new Promise((resolve) => setTimeout(resolve, 10));

		container.appendChild(g);

		// add a lissener to the file so i can open it
	}

	// make so i can dobbel click on each file and open it
	const getFiles = document.querySelectorAll(`.file-${draggable.id}`);
	getFiles.forEach((file) => {
		file.addEventListener('dblclick', () => {
			console.log(file.dataset.fileName);
			window.windowAPI.openFile(file.dataset.fileName);
		});
	});


}

export { showFilesInFolder };
