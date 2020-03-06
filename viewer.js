

/*
	Copyright Abhinav Singh Chauhan (@xclkvj)
	Copying the contents of this file by any means is prohibited.
*/

const ViewerBG = '#eee';
const ViewerUI = {
	canvasWrapper: document.getElementById('viewerCanvasWrapper'),
	cubeWrapper: document.getElementById('orientCubeWrapper'),
	toggleZoom: document.getElementById('toggleZoom'),
	togglePan: document.getElementById('togglePan'),
	toggleOrbit: document.getElementById('toggleOrbit'),
	resetBtn: document.getElementById('resetBtn'),
	toggleModelBrowser: document.getElementById('toggleModelBrowser'),
	modelBrowser: document.getElementById('modelBrowser'),
	modelBrowserContent: document.getElementById('modelBrowserContent'),
	fileInput: document.getElementById('fileInput'),
	explodeSliderWrapper: document.getElementById('explodeSliderWrapper'),
	explodeSlider: document.getElementById('explodeSlider'),
	toggleExplode: document.getElementById('toggleExplode'),
	toggleShare: document.getElementById('toggleShare'),
	shareSidebar: document.getElementById('shareSidebar'),
	loader: document.getElementById('loader'),
	toggleMeasure: document.getElementById('toggleMeasure'),
	loaderInfo: document.getElementById('loaderInfo'),
	backToHome: document.getElementById('backToHome'),
	webglContainer: document.getElementById('webglContainer'),
	downloadScreen: document.getElementById('downloadScreen'),
	explodeFace: document.getElementById('explodeFace')
};

function setItemSelected(ele, bool) {
	if (bool) {
		ele.classList.add('item-selected');
	} else {
		ele.classList.remove('item-selected');
	}
}

function toggle(ele) {
	if (ele.getBoundingClientRect().height > 0) {
		ele.style.display = 'none';
		return false;
	} else {
		ele.style.display = 'block';
		return true;
	}
}

function toggleThrough(ele, through, cb, selected=true) {
	through.onclick = () => {
		let bool = toggle(ele);
		selected && setItemSelected(through, bool);
		cb && cb(bool);
	}
}

function show(ele) {
	ele.style.display = 'block';
}

function hide(ele) {
	ele.style.display = 'none';
}

function Viewer() {

	ViewerUI.downloadScreen.onclick = function() {
		const canvas = renderer.domElement;
		renderAll();
		const image = canvas.toDataURL("image/png");
		const a = document.createElement("a");
		a.href = image.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
		a.download = "image.png"
		a.click();
	}

	ViewerUI.explodeFace.onclick = function() {
		explodeFace = this.checked;
		resetExplode();
		explode();
	}

	let cubeCameraDistance = 1.75;

	let cubeWrapper = ViewerUI.cubeWrapper;
	let cubeScene = new THREE.Scene();
	let cubeCamera = new THREE.PerspectiveCamera(70, cubeWrapper.offsetWidth / cubeWrapper.offsetHeight, 0.1, 100);
	let cubeRenderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true,
		preserveDrawingBuffer: true
	});

	cubeRenderer.setSize(cubeWrapper.offsetWidth, cubeWrapper.offsetHeight);
	cubeRenderer.setPixelRatio(window.deivicePixelRatio);

	cubeWrapper.appendChild(cubeRenderer.domElement);

	let materials = [];
	let texts = ['RIGHT', 'LEFT', 'TOP', 'BOTTOM', 'FRONT', 'BACK'];

	let textureLoader = new THREE.TextureLoader();
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	
	let size = 64;
	canvas.width = size;
	canvas.height = size;

	ctx.font = 'bolder 12px "Open sans", Arial';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';

	let mainColor = '#fff';
	let otherColor = '#ccc';

	let bg = ctx.createLinearGradient(0, 0, 0, size);
	bg.addColorStop(0, mainColor);
	bg.addColorStop(1,  otherColor);

	for (let i = 0; i < 6; i++) {
		if (texts[i] == 'TOP') {
			ctx.fillStyle = mainColor;
		} else if (texts[i] == 'BOTTOM') {
			ctx.fillStyle = otherColor;
		} else {
			ctx.fillStyle = bg;
		}
		ctx.fillRect(0, 0, size, size);
		ctx.strokeStyle = '#aaa';
		ctx.setLineDash([8, 8]);
		ctx.lineWidth = 4;
		ctx.strokeRect(0, 0, size, size);
		ctx.fillStyle = '#999';
		ctx.fillText(texts[i], size / 2, size / 2);
		materials[i] = new THREE.MeshBasicMaterial({
			map: textureLoader.load(canvas.toDataURL())
		});
	}

	let planes = [];

	let planeMaterial = new THREE.MeshBasicMaterial({
		side: THREE.DoubleSide,
		color: 0x00c0ff,
		transparent: true,
		opacity: 0,
		depthTest: false
	});
	let planeSize = 0.7;
	let planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);

	let a = 0.51;

	let plane1 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane1.position.z = a;
	cubeScene.add(plane1);
	planes.push(plane1);

	let plane2 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane2.position.z = -a;
	cubeScene.add(plane2);
	planes.push(plane2);

	let plane3 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane3.rotation.y = Math.PI / 2;
	plane3.position.x = a;
	cubeScene.add(plane3);
	planes.push(plane3);

	let plane4 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane4.rotation.y = Math.PI / 2;
	plane4.position.x = -a;
	cubeScene.add(plane4);
	planes.push(plane4);

	let plane5 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane5.rotation.x = Math.PI / 2;
	plane5.position.y = a;
	cubeScene.add(plane5);
	planes.push(plane5);

	let plane6 = new THREE.Mesh(planeGeometry, planeMaterial.clone());
	plane6.rotation.x = Math.PI / 2;
	plane6.position.y = -a;
	cubeScene.add(plane6);
	planes.push(plane6);

	let groundMaterial = new THREE.MeshBasicMaterial({
		color: 0xaaaaaa
	});
	let groundGeometry = new THREE.PlaneGeometry(1, 1);
	let groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
	groundPlane.rotation.x = -Math.PI / 2;
	groundPlane.position.y = -0.6;

	cubeScene.add(groundPlane);

	let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
	cubeScene.add(cube);

	function updateCubeCamera() {
		cubeCamera.rotation.copy(camera.rotation);
		let dir = camera.position.clone().sub(controller.target).normalize();
		cubeCamera.position.copy(dir.multiplyScalar(cubeCameraDistance));
	}

	let activePlane = null;

	cubeRenderer.domElement.onmousemove = function(evt) {

		if (activePlane) {
			activePlane.material.opacity = 0;
			activePlane.material.needsUpdate = true;
			activePlane = null;
		}

		let x = evt.offsetX;
		let y = evt.offsetY;
		let size = cubeRenderer.getSize(new THREE.Vector2());
		let mouse = new THREE.Vector2(x / size.width * 2 - 1, -y / size.height * 2 + 1);
		
		let raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, cubeCamera);
		let intersects = raycaster.intersectObjects(planes.concat(cube));

		if (intersects.length > 0 && intersects[0].object != cube) {
			activePlane = intersects[0].object;
			activePlane.material.opacity = 0.2;
			activePlane.material.needsUpdate = true;
		}
	}

	let startTime = 0;
	let duration = 500;
	let oldPosition = new THREE.Vector3();
	let newPosition = new THREE.Vector3();
	let play = false;

	cubeRenderer.domElement.onclick = function(evt) {

		cubeRenderer.domElement.onmousemove(evt);

		if (!activePlane || hasMoved) {
			return false;
		}

		oldPosition.copy(camera.position);

		let distance = camera.position.clone().sub(controller.target).length();
		newPosition.copy(controller.target);

		if (activePlane.position.x !== 0) {
			newPosition.x += activePlane.position.x < 0 ? -distance : distance;
		} else if (activePlane.position.y !== 0) {
			newPosition.y += activePlane.position.y < 0 ? -distance : distance;
		} else if (activePlane.position.z !== 0) {
			newPosition.z += activePlane.position.z < 0 ? -distance : distance;
		}

		//play = true;
		//startTime = Date.now();
		camera.position.copy(newPosition);
	}

	cubeRenderer.domElement.ontouchmove = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = e.targetTouches[0].pageX - rect.left;
		let y = e.targetTouches[0].pageY - rect.top;
		cubeRenderer.domElement.onmousemove({
			offsetX: x,
			offsetY: y
		});
	}

	cubeRenderer.domElement.ontouchstart = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = e.targetTouches[0].pageX - rect.left;
		let y = e.targetTouches[0].pageY - rect.top;
		cubeRenderer.domElement.onclick({
			offsetX: x,
			offsetY: y
		});
	}

	ViewerUI.fileInput.addEventListener('input', function(evt) {
		let file = evt.target.files[0];
		if (file) {
			show(ViewerUI.loader);
			ViewerUI.loaderInfo.innerHTML = 'Reading file...';
			let reader = new FileReader();
			reader.onload = function(e) {
				loadModel(e.target.result);
			}
			reader.onerror = function(err) {
				ViewerUI.loaderInfo.innerHTML = 'Error reading file! See console for more info.';
				console.error(err);
			}
			reader.readAsDataURL(file);
		}
	});
	
	hide(ViewerUI.loader);

	let hasMoved = false;

	function antiMoveOnDown(e) {
		hasMoved = false;
	}
	function antiMoveOnMove(e) {
		hasMoved = true;
	}
	
	window.addEventListener('mousedown', antiMoveOnDown, false);
	window.addEventListener('mousemove', antiMoveOnMove, false);
	window.addEventListener('touchstart', antiMoveOnDown, false);
	window.addEventListener('touchmove', antiMoveOnMove, true);
	
	let showExploded = false;
	let explodeFactor = 0;
	let explodeFace = !true;
	
	toggleThrough(ViewerUI.explodeSliderWrapper, ViewerUI.toggleExplode, (bool) => {
		if (!bool) {
			resetExplode();
		} else {
			explodeFactor = ViewerUI.explodeSlider.value;
			explode();
		}
	});
	
	function resetExplode() {
		let temp = explodeFactor;
		let temp2 = explodeFace;
		explodeFace = true;
		explodeFactor = 0;
		explode();
		explodeFace = false;
		explode();
		explodeFactor = temp;
		explodeFace = temp2;
	}
	
	toggleThrough(ViewerUI.shareSidebar, ViewerUI.toggleShare);
	toggleThrough(ViewerUI.modelBrowser, ViewerUI.toggleModelBrowser);
	
	ViewerUI.explodeSlider.oninput = function() {
		explodeFactor = this.value;
		explode();
	}
	
	function explode() {
		for (let i = 0; i < loadedMeshes.length; i++) {
			
			let node = loadedMeshes[i];

			if (explodeFace) {
				let defaultPositionArray = node.defaultPositionArray;
				let positionArray = node.geometry.attributes.position.array;
				let normalArray = node.geometry.attributes.normal.array;
				let indexArray = node.geometry.index.array;
				
				for (let j = 0; j < indexArray.length; j++) {
					
					let index = indexArray[j]
					let position = new THREE.Vector3(defaultPositionArray[index * 3], defaultPositionArray[index * 3 + 1], defaultPositionArray[index * 3 + 2]);
					let normal = new THREE.Vector3(normalArray[index * 3], normalArray[index * 3 + 1], normalArray[index * 3 + 2]);
					
					position.add(normal.multiplyScalar(explodeFactor));
					positionArray[index * 3] = position.x;
					positionArray[index * 3 + 1] = position.y;
					positionArray[index * 3 + 2] = position.z;
					
				}
				
				node.geometry.attributes.position.needsUpdate = true;
				node.geometry.computeBoundingBox();
				node.geometry.computeBoundingSphere();
			} else {
				node.position.copy(node.defaultPosition).add(node.defaultPosition.clone().normalize().multiplyScalar(explodeFactor));
			}
		}
	}
	
	ViewerUI.toggleZoom.onclick = function() {
		setZoomMode();
		setItemSelected(selectedModeElement, false);
		selectedModeElement = this;
		setItemSelected(this, true);
	}
	
	ViewerUI.togglePan.onclick = function() {
		setPanMode();
		setItemSelected(selectedModeElement, false);
		selectedModeElement = this;
		setItemSelected(this, true);
	}
	
	ViewerUI.toggleOrbit.onclick = function() {
		setOrbitMode();
		setItemSelected(selectedModeElement, false);
		selectedModeElement = this;
		setItemSelected(this, true);
	}
	
	ViewerUI.toggleMeasure.onclick = function() {
		isInMeasureMode = !isInMeasureMode;
		if (!isInMeasureMode) {
			lineScene.remove.apply(lineScene, lineScene.children);
			spriteScene.remove.apply(spriteScene, spriteScene.children);
		}
		setItemSelected(this, isInMeasureMode);
	}
	
	ViewerUI.resetBtn.onclick = ViewerUI.backToHome.onclick =function() {
		resetAll();
	}

	function resetAll() {
		controller.reset();
		lineScene.remove.apply(lineScene, lineScene.children);
		spriteScene.remove.apply(spriteScene, spriteScene.children);
		isInMeasureMode = false;
		setItemSelected(ViewerUI.toggleMeasure, false);
		ViewerUI.explodeSliderWrapper.style.display = 'none';
		ViewerUI.explodeFace.checked = false;
		explodeFace = false;
		setItemSelected(ViewerUI.toggleExplode, false);
		resetExplode();
		resetSelect();
	}

	function updateSelectDom(child) {
		if (child.itemWrapper) {
			if (child.isSelected) {
				child.itemWrapper.querySelector('.graph-name').style.color = '#03a9f4';
			} else {
				child.itemWrapper.querySelector('.graph-name').style.color = 'inherit';
			}
		}
	}
	
	function setOrbitMode() {
		controller.enableZoom = true;
		controller.enablePan = true;
		controller.enableRotate = true;
		controller.mouseButtons = {
			LEFT: THREE.MOUSE.ROTATE,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: THREE.MOUSE.PAN
		};
	}
	
	function setPanMode() {
		controller.enableZoom = false;
		controller.enablePan = true;
		controller.enableRotate = false;
		controller.mouseButtons = {
			LEFT: THREE.MOUSE.PAN,
			MIDDLE: THREE.MOUSE.PAN,
			RIGHT: THREE.MOUSE.PAN
		};
	}
	
	function setZoomMode() {
		controller.enableZoom = true;
		controller.enablePan = false;
		controller.enableRotate = false;
		controller.mouseButtons = {
			LEFT: THREE.MOUSE.DOLLY,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: THREE.MOUSE.DOLLY
		};
	}
	
	let wrapper = ViewerUI.canvasWrapper;
	let scene = new THREE.Scene();
	let camera = new THREE.PerspectiveCamera(70, wrapper.offsetWidth / wrapper.offsetHeight, 0.1, 1000);
	
	let renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: false
	});
	
	renderer.setClearColor(new THREE.Color(ViewerBG));
	renderer.autoClear = false;
	renderer.setPixelRatio(window.deivicePixelRatio);

	let isInMeasureMode = false;
	let lineScene = new THREE.Scene();
	let spriteScene = new THREE.Scene();

	function makeCircleImage() {
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		let size = 32;
		canvas.width = size;
		canvas.height = size;

		let r = size * 0.8 / 2;
		let blur = size - r;
		
		ctx.shadowBlur = 5;
		ctx.shadowColor = '#555';

		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();

		ctx.shadowBlur = 0;
		ctx.fillStyle = '#009bff';
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, r * 0.5, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();

		return canvas;
	}

	let circleTexture = new THREE.CanvasTexture(makeCircleImage())
	let circleMaterial = new THREE.SpriteMaterial({ 
		map: circleTexture,
		sizeAttenuation: false 
	});
	let circleSprite = new THREE.Sprite(circleMaterial);
	circleSprite.scale.setScalar(0.08);

	let lineMaterial = new THREE.LineBasicMaterial({
		color: 0x009bff,
		linewidth: 10
	});

	let activeLine = null;

	renderer.domElement.onclick = function(evt) {
		if (hasMoved) {
			return false;
		}
		
		evt = evt || window.event;
		
		let x = evt.offsetX;
		let y = evt.offsetY;
		let size = renderer.getSize(new THREE.Vector2());
		let mouse = new THREE.Vector2(x / size.width * 2 - 1, -y / size.height * 2 + 1);
		
		let raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
		let intersects = raycaster.intersectObjects(loadedMeshes);
		
		if (!isInMeasureMode) {
			resetSelect();
		}
		
		if (intersects.length > 0) {
			if (isInMeasureMode) {
				let point = intersects[0].point;
				if (!activeLine) {
					let sprite1 = circleSprite.clone();
					let sprite2 = circleSprite.clone();
					sprite1.position.copy(point.clone());
					sprite2.position.copy(point.clone());
					spriteScene.add(sprite1);
					spriteScene.add(sprite2);
					let lineGeometry = new THREE.Geometry();
					lineGeometry.vertices.push(sprite1.position, sprite2.position);
					let line = new THREE.Line(lineGeometry, lineMaterial);
					line.sprite1 = sprite1;
					line.sprite2 = sprite2;
					lineScene.add(line);
					activeLine = line;
				} else {
					activeLine.geometry.vertices[1].copy(point);
					activeLine.geometry.verticesNeedUpdate = true;
					makeDistanceSprite();
					activeLine = null;
				}
			} else {
				let mesh = intersects[0].object;
				mesh.isSelected = true;
				updateMeshInteractionMaterial(mesh);
			}
		} else {
			if (isInMeasureMode) {
				if (activeLine) {
					lineScene.remove(activeLine);
					spriteScene.remove(activeLine.sprite1);
					spriteScene.remove(activeLine.sprite2);
					activeLine = null;
				}
			}
		}
	}
	
	function resetSelect() {
		scene.traverse(child => {
			child.isSelected = false;
			if (child.isMesh && child.material) {	
				updateMeshInteractionMaterial(child);
			}
			updateSelectDom(child);
		});
	}
		

	renderer.domElement.onmousemove = function(evt) {
		evt = evt || window.event;

		if (!isInMeasureMode) {
			return;
		}
		
		let x = evt.offsetX;
		let y = evt.offsetY;
		let size = renderer.getSize(new THREE.Vector2());
		let mouse = new THREE.Vector2(x / size.width * 2 - 1, -y / size.height * 2 + 1);
		
		let raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
		let intersects = raycaster.intersectObjects(loadedMeshes);
		
		if (isInMeasureMode && activeLine) {
			if (intersects.length > 0) {
				let point = intersects[0].point;
				activeLine.geometry.vertices[1].copy(point);
				activeLine.geometry.verticesNeedUpdate = true;
			} else {
				activeLine.geometry.vertices[1].copy(activeLine.geometry.vertices[0]);
				activeLine.geometry.verticesNeedUpdate = true;
			}

		}
	}

	/*renderer.domElement.ontouchmove = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = e.targetTouches[0].pageX - rect.left;
		let y = e.targetTouches[0].pageY - rect.top;
		renderer.domElement.onmousemove({
			offsetX: x,
			offsetY: y
		});
	}*/

	renderer.domElement.ontouchstart = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = e.targetTouches[0].pageX - rect.left;
		let y = e.targetTouches[0].pageY - rect.top;
		renderer.domElement.onclick({
			offsetX: x,
			offsetY: y
		});
	}

	function makeDistanceSprite() {

		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		let fontsize = 32;

		ctx.font = 'bolder ' + fontsize + 'px "Open Sans", Arial';
		let v = activeLine.geometry.vertices;
		let length = v[0].clone().sub(v[1]).length().toFixed(1);
		let text = '~ ' + length;
		let size = ctx.measureText(text);
		let paddingLeft = 20;
		let paddingTop = 10;
		let margin = 10;
		canvas.width = size.width + paddingLeft * 2 + margin * 2;
		canvas.height = fontsize + paddingTop * 2 + margin * 2;

		ctx.shadowBlur = 10;
		ctx.shadowColor = '#555';
		ctx.fillStyle = '#009bff';
		roundRect(ctx, margin, margin, canvas.width - margin * 2, canvas.height - margin * 2, 10);

		ctx.shadowBlur = 0;
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.font = 'bolder ' + fontsize + 'px "Open Sans", Arial';
		ctx.fillText(text, paddingLeft + margin, paddingTop + margin);

		let texture = new THREE.CanvasTexture(canvas);
		let sprite = new THREE.Sprite(new THREE.SpriteMaterial({
			map: texture,
			sizeAttenuation: false
		}));

		let h = 0.7;
		sprite.scale.set(0.002 * canvas.width, 0.0025 * canvas.height).multiplyScalar(h);

		sprite.position.copy(v[0].clone().add(v[1]).multiplyScalar(0.5));
		spriteScene.add(sprite);

	}

	function roundRect(ctx, x, y, w, h, r) { 
		ctx.beginPath(); 
		ctx.moveTo(x + r, y); 
		ctx.lineTo(x + w - r, y); 
		ctx.quadraticCurveTo(x + w, y, x + w, y + r); 
		ctx.lineTo(x + w, y + h - r); 
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); 
		ctx.lineTo(x + r, y + h); 
		ctx.quadraticCurveTo(x, y + h, x, y + h - r); 
		ctx.lineTo(x, y + r); 
		ctx.quadraticCurveTo(x, y, x + r, y); 
		ctx.closePath(); 
		ctx.fill();
	} 
	
	
	function updateMeshInteractionMaterial(mesh) {
		if (mesh.isHidden) {
			mesh.interactionMaterial.color = hiddenColor;
			mesh.interactionMaterial.opacity = hiddenAlpha;
		} else {
			mesh.interactionMaterial.opacity = 1;
		}
		if (mesh.isSelected) {
			mesh.interactionMaterial.color = selectColor;
			mesh.itemWrapper.querySelector('.graph-name').style.color = '#03a9f4';
		} else {
			mesh.itemWrapper.querySelector('.graph-name').style.color = 'inherit';
		}
		mesh.interactionMaterial.needsUpdate = true;
		if (!mesh.isSelected && !mesh.isHidden) {
			mesh.material = mesh.defaultMaterial;
		} else {
			mesh.material = mesh.interactionMaterial;
		}
	}
	
	function onResize() {
		let width = wrapper.offsetWidth;
		let height = wrapper.offsetHeight;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
	
	onResize();
	
	wrapper.appendChild(renderer.domElement);
	window.addEventListener('resize', onResize, false);
	
	let gltfLoader = new THREE.GLTFLoader();
	let loadedScene = null;
	let loadedMeshes = [];
	
	let d = 5;

	let selectColor = new THREE.Color('#42006b');
	let hiddenColor = new THREE.Color('#555');
	let hiddenAlpha = 0.3;

	let interactionMaterial = new THREE.MeshPhongMaterial({
		transparent: true,
		color: selectColor,
		side: THREE.DoubleSide,
		precision: 'mediump'
	});
	
	function loadModel(url) {
		
		resetAll();
		if (loadedScene) {
			scene.remove(loadedScene);
			loadedScene = null;
			loadedMeshes.length = 0;
		}
		
		show(ViewerUI.loader);
		ViewerUI.modelBrowserContent.innerHTML = '';
		ViewerUI.loaderInfo.innerHTML = 'Loading model...';
		
		gltfLoader.load(
			url,
			function onLoad(gltf) {
				
				loadedScene = gltf.scene;
				scene.add(gltf.scene);

				gltf.scene = gltf.scene || gltf.scenes[0];

				let object = gltf.scene;

				const box = new THREE.Box3().setFromObject(object);
				const size = box.getSize(new THREE.Vector3()).length();
				const center = box.getCenter(new THREE.Vector3());

				controller.reset();

				object.position.x += (object.position.x - center.x);
				object.position.y += (object.position.y - center.y);
				object.position.z += (object.position.z - center.z);
				controller.maxDistance = size * 10;
				camera.near = size / 100;
				camera.far = size * 100;
				camera.updateProjectionMatrix();

				camera.position.copy(center);
				camera.position.x += size / 2.0;
				camera.position.y += size / 5.0;
				camera.position.z += size / 2.0;

				directionalLight.position.setScalar(size);

				camera.lookAt(center);

				controller.saveState();

				gltf.scene.traverse((node) => {
					if (node.isMesh && node.material) {
						node.geometry.computeBoundingBox();
						node.material.side = THREE.DoubleSide;
						node.material.precision = 'mediump';
						node.material.needsUpdate = true;
						node.interactionMaterial = interactionMaterial.clone();
						node.defaultMaterial = node.material;
						node.defaultPositionArray = Array.from(node.geometry.attributes.position.array);
						node.defaultPosition = node.position.clone();
						loadedMeshes.push(node);
					}
				});

				let content = ViewerUI.modelBrowserContent;
				let counter = 0;
				let parentLevel = 0;

				function makeSceneGraph(obj) {
					
					if (obj.children.length === 0 && !obj.isMesh) {
						return;
					}
					
					let itemWrapper = document.createElement('div');
					itemWrapper.classList.add('graph-item-wrapper');
					
					let item = document.createElement('div');
					item.classList.add('graph-item');
					
					itemWrapper.appendChild(item);
					
					content.appendChild(itemWrapper);
					let n = 0;
					let obj2 = obj;
					while (obj2 != gltf.scene) {
						obj2 = obj2.parent;
						n++;
					}
					
					item.style.paddingLeft = n * 1.5 + 'em';
					obj.itemWrapper = itemWrapper;
					
					let left = document.createElement('div');
					left.classList.add('graph-left');
					let right = document.createElement('div');
					right.classList.add('graph-right');
					item.appendChild(left);
					item.appendChild(right);
					
					if (obj.children.length > 0) {
						
						parentLevel++;
						let folder = document.createElement('div');
						
						folder.style.marginRight = '10px';
						folder.classList.add('graph-folder');
						folder.innerHTML = '<i class="fa fa-folder-open"></i>';
						left.appendChild(folder);
						
						obj.isFolderOpen = true;
						obj.openFolder = function() {
							folder.innerHTML = obj.isFolderOpen ? '<i class="fa fa-folder-open"></i>' :  '<i class="fa fa-folder"></i>';
							obj.traverse(child => {
								if (obj === child) {
									return;
								}
								if (child.itemWrapper) {
									if (child.parent.isFolderOpen && obj.isFolderOpen) {
										child.itemWrapper.style.display = 'block';
									}
									if (!obj.isFolderOpen) {
										child.itemWrapper.style.display = 'none';
									}
								}
							});
						}
						
						folder.onclick = () => {
							obj.isFolderOpen = !obj.isFolderOpen;
							obj.openFolder();
						}
						
						for (let i = 0; i < obj.children.length; i++) {
							makeSceneGraph(obj.children[i]);
						}
						
					}
					
					let name = document.createElement('div');
					name.classList.add('graph-name');
					name.innerHTML = obj.name || 'None';
					left.appendChild(name);
					
					name.onclick = function() {
						resetSelect();
						obj.traverse(child => {	
							child.isSelected = true;
							if (child.isMesh && child.material) {
								updateMeshInteractionMaterial(child);
							}
							updateSelectDom(child)
						});
					}
					
					let visible = document.createElement('div');
					visible.classList.add('graph-visible');
					visible.innerHTML = '<i class="fa fa-eye"></i>';
					
					obj.showMesh = function() {
						visible.innerHTML = obj.isMeshVisible ? '<i class="fa fa-eye"></i>' : '<i class="fa fa-eye-slash"></i>';
						obj.traverse(child => {
							if (child.itemWrapper) {
								let eye = child.itemWrapper.querySelector('.graph-visible');
								eye.innerHTML = obj.isMeshVisible ? '<i class="fa fa-eye"></i>' : '<i class="fa fa-eye-slash"></i>';
								eye.style.color = obj.isMeshVisible ? 'inherit' : 'rgba(0, 0, 0, 0.3)';
							}
							if (child.isMesh && child.material) {
								child.isHidden = !obj.isMeshVisible;
								updateMeshInteractionMaterial(child);
							}
						});
					}
					
					obj.isHidden = false;
					obj.isSelected = false;
					obj.isMeshVisible = true;
					visible.onclick = function() {
						obj.isMeshVisible = !obj.isMeshVisible;
						obj.showMesh();
					}
					
					right.appendChild(visible)
					
				}
				
				makeSceneGraph(gltf.scene)

				hide(ViewerUI.loader);
				
			},
			function onProgress(xhr) {
				ViewerUI.loaderInfo.innerHTML = Math.round(xhr.loaded / xhr.total * 100) + '% loaded';
			},
			function onError(err) {
				ViewerUI.loaderInfo.innerHTML = 'Error loading model! See console for more info.';
				console.error('Error loading model!', err);
			}
		);
		
	}
	
	
	
	let controller = new THREE.OrbitControls(camera, renderer.domElement);
	controller.enabled = true;
	controller.enableDamping = true;
	controller.dampingFactor = 0.5;
	controller.screenSpacePanning = true;

	let cubeController = new THREE.OrbitControls(camera, cubeRenderer.domElement);
	cubeController.enablePan = false;
	cubeController.enableZoom = false;
	cubeController.rotateSpeed = 0.125;
	
	let selectedModeElement = ViewerUI.toggleOrbit;
	setOrbitMode();

	camera.position.z = d;
	camera.lookAt(scene.position);
	controller.update();
	controller.saveState();
	
	let ambientLight = new THREE.AmbientLight();
	ambientLight.intensity = 1;
	scene.add(ambientLight);

	let directionalLight = new THREE.DirectionalLight();
	directionalLight.position.set(200, 200, 200)
	directionalLight.intensity = 0.5;
	scene.add(directionalLight);
	
	/*let light1 = new THREE.PointLight(0xffffff);
	light1.position.set(100, 100, 100);
	scene.add(light1);
	
	let light2 = new THREE.PointLight(0xffffff);
	light2.position.set(100, 100, -100);
	scene.add(light2);
	
	let light3 = new THREE.PointLight(0xffffff);
	light3.position.set(-100, 100, 100);
	scene.add(light3);
	
	let light4 = new THREE.PointLight(0xffffff);
	light4.position.set(-100, 100, -100);
	scene.add(light4);
	
	light1.intensity = light2.intensity = light3.intensity = light4.intensity = 0.3;*/
	
	let stop = false;

	function renderAll() {

		renderer.clear();
		renderer.render(scene, camera);
		updateCubeCamera();
		cubeRenderer.render(cubeScene, cubeCamera);

		renderer.clearDepth();

		if (isInMeasureMode) {
			renderer.clearDepth();
			renderer.render(lineScene, camera);
			renderer.clearDepth();
			renderer.render(spriteScene, camera);
		}
	}
	
	function animate(time) {

		if (stop) {
			return;
		}

		if (play) {
			let now = Date.now();
			let x = Math.min(1, (now - startTime) / duration);
			camera.position.copy(oldPosition).lerp(newPosition, x)
			if (x === 1) {
				play = false;
			}
		}
		
		requestAnimationFrame(animate);
		controller.update();
		renderAll();
	}
	
	requestAnimationFrame(animate);
	
	return {
		loadModel: loadModel
	};
	
}

function draggable(ele, toggleEle) {
	
	let startX = 0;
	let startY = 0;
	
	function onMouseDown(evt) {
		evt = evt || window.event;
		startDrag(evt.clientX, evt.clientY);
		window.addEventListener('mousemove', onMouseMove, true);
	}
	
	function onMouseMove(evt) {
		evt = evt || window.event;
		let newX = evt.clientX;
		let newY = evt.clientY;
		moveDrag(newX, newY);
	}
	
	function onMouseUp() {
		window.removeEventListener('mousemove', onMouseMove, true);
	}
	
	function startDrag(x, y) {
		startX = x;
		startY = y;
	}
	
	function moveDrag(newX, newY) {
		
		let deltaX = newX - startX;
		let deltaY = newY - startY;
		
		startX = newX;
		startY = newY;

		let x = ele.offsetLeft + deltaX;
		let y = ele.offsetTop + deltaY;
		x < 0 && (x = 0);
		y < 0 && (y = 0);
		let w = ele.parentNode.offsetWidth - ele.offsetWidth;
		let h = ele.parentNode.offsetHeight - ele.offsetHeight;
		x > w && (x = w);
		y > h && (y = h);

		ele.style.left = x + 'px';
		ele.style.top = y + 'px';
		
	}
	
	toggleEle.addEventListener('mousedown', onMouseDown, true);
	window.addEventListener('mouseup', onMouseUp, true);
	
}

