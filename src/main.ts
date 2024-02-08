import * as THREE from 'three';
import './style.css'

// @ts-ignore
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";
import {Water} from 'three/addons/objects/Water2.js';

import imageTexture from '/assets/image-texture.jpg';
import videoTexture from '/assets/video-texture.mp4';
import wallTextureImage from '/assets/wall-texture.jpg';
import floorTextureImage from '/assets/floor-texture.jpg';

class FirstPersonWorld {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: PointerLockControls;
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private velocity: THREE.Vector3;
    private direction: THREE.Vector3;
    private textureLoader = new THREE.TextureLoader();
    private prevTime: number = performance.now();
    private directionalLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    // @ts-ignore
    private waterMesh: Water;
    // @ts-ignore
    private imagePlaneMesh: THREE.Mesh;
    // @ts-ignore
    private videoPlaneMesh: THREE.Mesh;

    constructor() {

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);



        this.ambientLight = new THREE.AmbientLight(0x404040,0.1); // soft white light
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(0, 1, 0);
        this.scene.add(this.directionalLight);


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new PointerLockControls(this.camera, document.body);




        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.setSceneBackground('0x87ceeb');
        this.addFloorAndWalls();
        this.addImagePlane();
        this.addVideoPlane();
        this.addWater();
        this.addEventListeners();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
        document.body.addEventListener('click', () => {
            this.controls.lock();
        });
        document.addEventListener('click', this.onDocumentMouseClick, false);

    }


    private setSceneBackground(color: string ) {
        this.scene.background = new THREE.Color(color);
    }

    private addFloorAndWalls() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);

        //add texture to floor
        const floorTexture = this.textureLoader.load(floorTextureImage);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(10, 10);
        const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.5;
        this.scene.add(floor);

        // Walls

        const wallTexture = this.textureLoader.load(wallTextureImage);
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(5, 1);
        const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture, side: THREE.DoubleSide });
        const wallGeometry = new THREE.PlaneGeometry(20, 5);

        // Back Wall
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.z = -10;
        backWall.position.y = 0;
        this.scene.add(backWall);

        // Front Wall
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.rotation.y = Math.PI;
        frontWall.position.z = 10;
        frontWall.position.y = 0;
        this.scene.add(frontWall);

        // Left Wall
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = -Math.PI / 2;
        leftWall.position.x = -10;
        leftWall.position.y = 0;
        this.scene.add(leftWall);

        // Right Wall
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = Math.PI / 2;
        rightWall.position.x = 10;
        rightWall.position.y = 0;
        this.scene.add(rightWall);
    }

    private addImagePlane() {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(imageTexture); // Update path
        const geometry = new THREE.PlaneGeometry(5, 3);
        const material = new THREE.MeshBasicMaterial({ map: texture , side: THREE.DoubleSide});
        this.imagePlaneMesh = new THREE.Mesh(geometry, material);
        this.imagePlaneMesh.position.set(0, 0, 9.9);
        this.scene.add(this.imagePlaneMesh);
    }

    private addVideoPlane() {
        const video = document.createElement('video');
        video.src = videoTexture; // Update path
        video.loop = true;
        video.muted = true;
        video.play();

        const texture = new THREE.VideoTexture(video);
        const geometry = new THREE.PlaneGeometry(5, 3);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        this.videoPlaneMesh = new THREE.Mesh(geometry, material);
        this.videoPlaneMesh.position.set(0, 0, -9.9);
        this.scene.add(this.videoPlaneMesh);
    }

    private addEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }
    private addWater() {

        const waterGeometry = new THREE.PlaneGeometry(4, 4);


        this.waterMesh = new Water(
            waterGeometry,
            {
                textureWidth: 1024,
                textureHeight: 1024,
                color: "#0096FF",
                scale: 4,
                flowDirection: new THREE.Vector2(1, 1),
            }
        );

        this.waterMesh.rotation.x = - Math.PI / 2;
        this.waterMesh.position.y = -1.4; // Adjust the Y position to match your scene's floor level
        this.scene.add(this.waterMesh);
    }


    private onKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    private animate = () => {

        requestAnimationFrame(this.animate);

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;
        // const time = performance.now() * 0.001;



        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // this ensures consistent movements in all directions

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 100.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 100.0 * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.checkCollisions();

        this.prevTime = time;

        this.renderer.render(this.scene, this.camera);

    };

    private checkCollisions() {
        // Simple boundary checks
        const bounds = {
            minX: -9,
            maxX: 9,
            minZ: -9,
            maxZ: 9
        };

        if (this.camera.position.x < bounds.minX) this.camera.position.x = bounds.minX;
        if (this.camera.position.x > bounds.maxX) this.camera.position.x = bounds.maxX;
        if (this.camera.position.z < bounds.minZ) this.camera.position.z = bounds.minZ;
        if (this.camera.position.z > bounds.maxZ) this.camera.position.z = bounds.maxZ;
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    private onDocumentMouseClick = (event: MouseEvent) => {
        event.preventDefault();

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === this.imagePlaneMesh || intersects[i].object === this.videoPlaneMesh) {
                this.promptForNewMedia(intersects[i].object);
                break;
            }
        }
    };

    private promptForNewMedia = (object: THREE.Object3D) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = object === this.imagePlaneMesh ? 'image/*' : 'video/*';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);

            if (object === this.imagePlaneMesh) {
                // Assuming it's an image
               this.textureLoader.load(url, (texture) => {
                    // @ts-ignore
                    (object as THREE.Mesh).material.map = texture;
                    // @ts-ignore
                    (object as THREE.Mesh).material.needsUpdate = true;
                });
            } else if (object === this.videoPlaneMesh) {
                // Assuming it's a video
                const video = document.createElement('video');
                video.src = url;
                video.loop = true;
                video.muted = true;
                video.play();

                // @ts-ignore
                (object as THREE.Mesh).material.map = new THREE.VideoTexture(video);
                // @ts-ignore
                (object as THREE.Mesh).material.needsUpdate = true;
            }
        };
        input.click();
    };

}

new FirstPersonWorld();
