import { DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, AnimationMixer, GridHelper, AmbientLight, AnimationAction, Clock, Vector2, Raycaster, Object3D } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

export class Application {
	protected scene: Scene;
	private camera: PerspectiveCamera;
	private renderer: WebGLRenderer;
	private orbitControls: OrbitControls;
	private animationMixer: AnimationMixer;
	private walkAction!: AnimationAction;
	private clock: Clock;
	private fbxLoader: FBXLoader;
	private animationNum: HTMLInputElement;
	private gltfLoader: GLTFLoader;
	private xiaoyi!: GLTF;
	private last_status: string;


	constructor() {
		//初始化舞台、相机、渲染器、3D模型加载器、鼠标缩放控制器、动画混合器
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.domElement.setAttribute('id', 'canvas3d');
		this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
		this.animationMixer = new AnimationMixer(this.scene);
		this.clock = new Clock();
		this.fbxLoader = new FBXLoader();
		this.animationNum = document.createElement('input');
		this.animationNum.type = 'hidden';
		this.animationNum.value = '0';
		this.animationNum.id = 'num';
		document.body.appendChild(this.animationNum);
		this.gltfLoader = new GLTFLoader();
		this.last_status = this.animationNum.value;



		//设置画布大小
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		//添加canvas画布到DOM
		document.body.appendChild(this.renderer.domElement);
		//设置监听器监听窗口大小变更 
		window.addEventListener('resize', () => this.onWindowResize());
		//设置相机位置（右手坐标系）
		// this.camera.position.set(-28, 174, 576);
		this.camera.position.set(-5, 0, 0);
		//设置环境光
		//1.给场景增加环境光 0x404040——soft white light
		let Ambient = new AmbientLight(0x404040, 2);
		this.scene.add(Ambient);
		//2.给场景添加太阳光
		let Sun = new DirectionalLight(0xffffff, 1);
		Sun.position.set(20, 20, 20);
		Sun.castShadow = true;
		//设置相机渲染面积
		/*
		对于聚光灯，需要设置 shadowCameraNear 、 shadowCameraFar 、 shadowCameraFov 三个值，类比我们在第二章学到的透视投影照相机，只有介于 shadowCameraNear 与shadowCameraFar 之间的物体将产生阴影， shadowCameraFov 表示张角。
		对于平行光，需要设置 shadowCameraNear 、 shadowCameraFar 、 shadowCameraLeft 、shadowCameraRight 、 shadowCameraTop 以及 shadowCameraBottom 六个值，相当于正交投影照相机的六个面。同样，只有在这六个面围成的长方体内的物体才会产生阴影效果。
		*/
		Sun.shadow.camera.near = 0.01;
		Sun.shadow.camera.far = 60;
		Sun.shadow.camera.top = 22;
		Sun.shadow.camera.bottom = -22;
		Sun.shadow.camera.left = -35;
		Sun.shadow.camera.right = 35;
		//设置阴影分辨率
		Sun.shadow.mapSize.width = 2048;  // default
		Sun.shadow.mapSize.height = 2048; // default
		//阴影限制
		Sun.shadow.radius = 1;
		this.renderer.shadowMap.enabled = true;
		this.scene.add(Sun);

		//1.创建一个网格平面
		// const planeGeometry = new PlaneGeometry(10000, 10000);
		// const plane = new Mesh(planeGeometry, new MeshBasicMaterial({ color: 0xFFFFFF, side: DoubleSide }));
		// plane.name = 'plane';
		// plane.rotation.x -= Math.PI / 2;
		// this.scene.add(plane);
		// this.scene.add(new GridHelper(10000, 100));
		//2.导入3D模型
		// this.fbxLoader.load('./assets/low_plane.fbx', model => {
		//   // console.log(model);
		//   model.receiveShadow = true;
		//   model.position.y = -90;
		//   model.name = 'xiaoyi'
		//   this.scene.add(model);
		//   console.log('成功生产3d model')
		//   console.log(model)
		// });


		this.gltfLoader.load('./assets/Soldier.glb', model => {
			console.log(model);
			model.scene.receiveShadow = true;
			model.scene.rotation.y = Math.PI / 2;
			model.scene.name = 'xiaoyi'
			this.scene.add(model.scene);

			// const animationClip = model.animations.find(animationClip => animationClip.name === 'Idle');
			// this.walkAction = this.animationMixer.clipAction(animationClip!);
			// this.walkAction.play();

			this.xiaoyi = model;
		});


		//绑定单击事件
		this.renderer.domElement.addEventListener('click', event => {
			// console.log(event);
			//获取鼠标坐标
			const { offsetX, offsetY } = event; //clientX——相对于浏览器窗口  offsetX——相对于事件源元素
			//three.js是按比例而不是按长度，根据官方文档给出的计算公式计算这两个坐标相对three.js中的比例
			const x = (offsetX / window.innerWidth) * 2 - 1;
			const y = - (offsetY / window.innerHeight) * 2 + 1;
			const mousePoint = new Vector2(x, y);


			//光线投射器（在three.js中作用是场景中的物体抓取）
			const raycaster = new Raycaster();
			//传入鼠标位置和参考相机
			raycaster.setFromCamera(mousePoint, this.camera);
			//获取鼠标点击到的物体（光线投射，鼠标点击线路上所有映射到的物体，包括被遮挡的）参数：检测画布中的有元素;开启递归;
			const intersects = raycaster.intersectObjects(this.scene.children, true);
			// console.log(intersects);
			//过滤网格和地面（返回值仍是数组，分别是3D模型的各个组件，随便取第一个，后续通过父级判断）
			const intersect = intersects.filter(intersect => !(intersect.object instanceof GridHelper) && intersect.object.name !== 'plane')[0];
			// console.log(intersect);
			if (intersect && this.isClickSoldier(intersect.object)) {
				//完全停止动画
				// this.walkAction.stop();
				//暂时暂停动画
				//this.walkAction.paused = !this.walkAction.paused;
			}
			// console.log(this.camera.position)
		});


		//渲染页面
		this.render();

	}

	/**
	 * 页面渲染方法
	 */
	private render() {
		//渲染
		this.renderer.render(this.scene, this.camera);
		//更新动画
		this.animationMixer.update(this.clock.getDelta());
		//更新通过鼠标改变的视角和相机位置
		this.orbitControls.update();

		//浏览器下一次重绘时执行，浏览器会自动调节这个速率，网页切换到后台时，会节约性能暂停执行
		window.requestAnimationFrame(() => this.render());
		// console.log(this.camera.position)

		let current_animation = this.animationNum.value;
		// let xiaoyi = this.scene.getObjectByName('xiaoyi');
		if (current_animation === this.last_status) {
			return;
		} else {
			if (current_animation === '0') {
				const animationClip = this.xiaoyi.animations.find(animationClip => animationClip.name === 'Idle');
				this.walkAction = this.animationMixer.clipAction(animationClip!);
				this.walkAction.play();
				this.last_status = '0';
				console.log('successfully change action :', current_animation);
			} else if (current_animation === '1') {
				const animationClip = this.xiaoyi.animations.find(animationClip => animationClip.name === 'Run');
				this.walkAction = this.animationMixer.clipAction(animationClip!);
				this.walkAction.play();
				this.last_status = '1';
				console.log('successfully change action :', current_animation);
			} else if (current_animation === '2') {
				const animationClip = this.xiaoyi.animations.find(animationClip => animationClip.name === 'TPose');
				this.walkAction = this.animationMixer.clipAction(animationClip!);
				this.walkAction.play();
				this.last_status = '2';
				console.log('successfully change action :', current_animation);
			} else if (current_animation === '3') {
				const animationClip = this.xiaoyi.animations.find(animationClip => animationClip.name === 'Walk');
				this.walkAction = this.animationMixer.clipAction(animationClip!);
				this.walkAction.play();
				this.last_status = '3';
				console.log('successfully change action :', current_animation);
			}
		}

	}

	/**
	 * 窗口大小变更时执行
	 */
	private onWindowResize() {
		//更新画布大小
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

	/**
	 * 递归判断是否点击到人物
	 * @param object 
	 * @returns 
	 */
	private isClickSoldier(object: Object3D): Object3D | null {
		if (object.name === 'Soldier') {
			return object;
		} else if (object.parent) {
			return this.isClickSoldier(object.parent);
		} else {
			return null;
		}
	}


}

//this.orbitControls.target.set(0, 1, 0);????
new Application();