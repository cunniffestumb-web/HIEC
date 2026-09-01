// 3D太阳系模拟器
class SolarSystem3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container element not found:', containerId);
            return;
        }
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planets = {};
        this.sun = null;
        this.animationId = null;
        this.isAnimating = true;
        this.timeSpeed = 1;
        this.planetOrbitSpeed = 0.2; // 新增：星球公转速度倍数
        
        // 初始化控制参数
        this.rotationSpeed = 0.2;
        
        // WASD移动控制
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        this.moveSpeed = 0.2 // 降低WASD移动速度，从2.0调整为0.5
        
        // 跟随目标
        this.followTarget = null;
        this.isFollowing = false;
        this.followDistance = 15; // 跟随距离
        this.followHeight = 5;    // 跟随高度
        
        // 黑洞相关对象初始化
        this.blackHole = null;
        this.lensEffect = null;
        this.lensEffect2 = null;
        
        // 木星卫星系统相关对象初始化
        this.jupiter = null;
        this.jupiterMoons = [];
        this.selectedMoon = null;
        
        // 行星数据
        this.planetData = {
            mercury: { distance: 8, size: 0.3, speed: 0.02, color: 0x8C7853, name: '水星' },
            venus: { distance: 12, size: 0.5, speed: 0.015, color: 0xFFC649, name: '金星' },
            earth: { distance: 16, size: 0.6, speed: 0.01, color: 0x6B93D6, name: '地球' },
            mars: { distance: 20, size: 0.4, speed: 0.008, color: 0xCD5C5C, name: '火星' },
            jupiter: { distance: 28, size: 1.5, speed: 0.005, color: 0xD8CA9D, name: '木星' },
            saturn: { distance: 36, size: 1.2, speed: 0.003, color: 0xFAD5A5, name: '土星' },
            uranus: { distance: 44, size: 0.8, speed: 0.002, color: 0x4FD0E7, name: '天王星' },
            neptune: { distance: 52, size: 0.8, speed: 0.001, color: 0x4B70DD, name: '海王星' }
        };
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createSun();
        this.createPlanets();
        this.createStarField();
        this.animate();
        this.setupEventListeners();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 30, 60);
    }
    
    createRenderer() {
        if (!this.container) {
            console.error('Cannot create renderer: container is null');
            return;
        }
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }
    
    createControls() {
        if (!this.camera || !this.renderer) {
            console.error('Cannot create controls: camera or renderer is null');
            return;
        }
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;   // 允许更近距离观察
        this.controls.maxDistance = 200;
        this.controls.rotateSpeed = 0.2; // 提高旋转速度，便于在跟随模式下操作
        this.controls.zoomSpeed = 1.0;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
        
        // 启用所有控制功能
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;  // 允许平移，增加操作灵活性
    }
    
    createLights() {
        // 太阳光源
        const sunLight = new THREE.PointLight(0xffffff, 2, 200);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
    }
    
    createSun() {
        // 增大太阳的尺寸，使其更符合实际比例
        const sunGeometry = new THREE.SphereGeometry(5, 64, 64); // 从2增加到5，提高细节
        
        // 创建更真实的太阳材质
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff44,        // 更亮的黄色
            emissive: 0xffaa00,     // 橙色自发光
            emissiveIntensity: 0.8  // 增强发光强度
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = { 
            name: '太阳', 
            type: 'sun',
            info: {
                name: '太阳',
                description: '太阳系的中心恒星，为所有行星提供光和热',
                diameter: '1,392,700 km',
                mass: '1.989 × 10³⁰ kg',
                temperature: '5,778 K (表面)'
            }
        };
        this.scene.add(this.sun);
        
        // 增强的太阳光晕效果 - 多层光晕
        const innerGlowGeometry = new THREE.SphereGeometry(6, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.sun.add(innerGlow);
        
        // 外层光晕
        const outerGlowGeometry = new THREE.SphereGeometry(8, 32, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa22,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.sun.add(outerGlow);
        
        // 添加太阳耀斑效果（粒子系统的简化版本）
        const flareGeometry = new THREE.SphereGeometry(10, 16, 16);
        const flareMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        this.sun.add(flare);
    }
    
    // 创建程序化纹理的函数
    createPlanetTexture(planetName, size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        switch(planetName) {
            case 'mercury':
                // 水星 - 灰色陨石坑表面
                ctx.fillStyle = '#8C7853';
                ctx.fillRect(0, 0, size, size);
                // 添加陨石坑
                for(let i = 0; i < 20; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const radius = Math.random() * 20 + 5;
                    ctx.fillStyle = '#6B5D42';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'venus':
                // 金星 - 黄色云层
                ctx.fillStyle = '#FFC649';
                ctx.fillRect(0, 0, size, size);
                // 添加云层纹理
                for(let i = 0; i < 15; i++) {
                    ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.random() * 0.4})`;
                    ctx.fillRect(0, i * size/15, size, size/15 + Math.random() * 10);
                }
                break;
                
            case 'earth':
                // 地球 - 蓝色海洋和绿色大陆
                ctx.fillStyle = '#4A90E2';
                ctx.fillRect(0, 0, size, size);
                 
                 // 添加更真实的大陆形状
                 ctx.fillStyle = '#228B22';
                 // 模拟亚洲大陆
                 ctx.fillRect(size * 0.6, size * 0.2, size * 0.35, size * 0.4);
                 // 模拟欧洲
                 ctx.fillRect(size * 0.45, size * 0.15, size * 0.2, size * 0.25);
                 // 模拟非洲
                 ctx.fillRect(size * 0.45, size * 0.35, size * 0.2, size * 0.45);
                 // 模拟北美洲
                 ctx.fillRect(size * 0.1, size * 0.1, size * 0.25, size * 0.5);
                 // 模拟南美洲
                 ctx.fillRect(size * 0.15, size * 0.55, size * 0.15, size * 0.35);
                 // 模拟澳洲
                 ctx.fillRect(size * 0.75, size * 0.65, size * 0.15, size * 0.1);
                 
                 // 添加极地冰帽
                 ctx.fillStyle = '#FFFFFF';
                 ctx.fillRect(0, 0, size, size * 0.08);
                 ctx.fillRect(0, size * 0.92, size, size * 0.08);
                 
                 // 添加云层
                 ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                 for(let i = 0; i < 15; i++) {
                     const x = Math.random() * size;
                     const y = Math.random() * size;
                     const radius = Math.random() * 40 + 15;
                     ctx.beginPath();
                     ctx.arc(x, y, radius, 0, Math.PI * 2);
                     ctx.fill();
                 }
                 break;
                
            case 'mars':
                // 火星 - 红色沙漠
                ctx.fillStyle = '#CD5C5C';
                ctx.fillRect(0, 0, size, size);
                // 添加极地冰帽
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, size, size/8);
                ctx.fillRect(0, size * 7/8, size, size/8);
                // 添加沙尘暴纹理
                for(let i = 0; i < 12; i++) {
                    ctx.fillStyle = `rgba(139, 69, 19, ${0.2 + Math.random() * 0.3})`;
                    const y = Math.random() * size;
                    ctx.fillRect(0, y, size, Math.random() * 20 + 5);
                }
                break;
                
            case 'jupiter':
                // 木星 - 条纹云带
                ctx.fillStyle = '#D8CA9D';
                ctx.fillRect(0, 0, size, size);
                // 添加条纹
                const stripeColors = ['#B8860B', '#CD853F', '#DEB887'];
                for(let i = 0; i < size; i += 20) {
                    ctx.fillStyle = stripeColors[Math.floor(Math.random() * stripeColors.length)];
                    ctx.fillRect(0, i, size, 15 + Math.random() * 10);
                }
                // 添加大红斑
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.ellipse(size * 0.7, size * 0.4, 40, 25, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'saturn':
                // 土星 - 淡黄色条纹
                ctx.fillStyle = '#FAD5A5';
                ctx.fillRect(0, 0, size, size);
                // 添加淡色条纹
                for(let i = 0; i < size; i += 25) {
                    ctx.fillStyle = `rgba(218, 165, 32, ${0.3 + Math.random() * 0.4})`;
                    ctx.fillRect(0, i, size, 20);
                }
                break;
                
            case 'uranus':
                // 天王星 - 蓝绿色
                ctx.fillStyle = '#4FD0E7';
                ctx.fillRect(0, 0, size, size);
                // 添加淡色云层
                for(let i = 0; i < 8; i++) {
                    ctx.fillStyle = `rgba(135, 206, 235, ${0.2 + Math.random() * 0.3})`;
                    const y = Math.random() * size;
                    ctx.fillRect(0, y, size, Math.random() * 30 + 10);
                }
                break;
                
            case 'neptune':
                // 海王星 - 深蓝色风暴
                ctx.fillStyle = '#4B70DD';
                ctx.fillRect(0, 0, size, size);
                // 添加风暴斑点
                for(let i = 0; i < 6; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const radius = Math.random() * 25 + 10;
                    ctx.fillStyle = '#1E90FF';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createPlanets() {
        // 初始化轨道数组
        this.orbits = [];
        
        Object.keys(this.planetData).forEach(planetName => {
            const data = this.planetData[planetName];
            
            // 创建轨道
            const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = -Math.PI / 2;
            this.scene.add(orbit);
            this.orbits.push(orbit); // 添加到轨道数组中
            
            // 创建行星
            const planetGeometry = new THREE.SphereGeometry(data.size, 16, 16);
            
            // 使用纹理材质替代纯色材质
            const planetTexture = this.createPlanetTexture(planetName);
            const planetMaterial = new THREE.MeshLambertMaterial({
                map: planetTexture
            });
            
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            planet.position.x = data.distance;
            planet.castShadow = true;
            planet.receiveShadow = true;
            planet.userData = {
                name: data.name,
                type: 'planet',
                distance: data.distance,
                speed: data.speed,
                angle: Math.random() * Math.PI * 2
            };
            
            this.scene.add(planet);
            this.planets[planetName] = planet;
            
            // 特殊处理土星环
            if (planetName === 'saturn') {
                const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xC4A484,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = -Math.PI / 2;
                planet.add(ring);
            }
        });
    }
    
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 300; // 减少星星数量，从1000降至300
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;
            positions[i + 1] = (Math.random() - 0.5) * 400;
            positions[i + 2] = (Math.random() - 0.5) * 400;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,      // 减小星星大小，从0.5降至0.3
            opacity: 0.6,   // 降低透明度，使星星更暗淡
            transparent: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        try {
            this.animationId = requestAnimationFrame(() => this.animate());
            
            // WASD移动控制
            this.handleMovement();
            
            // 处理跟随逻辑
            if (this.isFollowing && this.followTarget) {
                this.updateFollowCamera();
            }
            
            // 更新行星位置
            Object.keys(this.planets).forEach(planetName => {
                const planet = this.planets[planetName];
                const userData = planet.userData;
                
                userData.angle += userData.speed * this.timeSpeed * this.planetOrbitSpeed * 0.5; // 减慢公转速度
                planet.position.x = Math.cos(userData.angle) * userData.distance;
                planet.position.z = Math.sin(userData.angle) * userData.distance;
                
                // 行星自转 - 减慢速度
                planet.rotation.y += 0.005; // 从0.01减少到0.005
            });
            
            // 太阳自转 - 减慢速度
             if (this.sun) {
                 this.sun.rotation.y += 0.002; // 从0.005减少到0.002
             }
             
             // 黑洞动画
             this.animateBlackHole();
             
             // 木星卫星系统动画
             this.animateJupiterMoons();
             
             // 安全检查controls是否存在
             if (this.controls) {
                 this.controls.update();
             }
             
             // 安全检查renderer、scene、camera是否存在
             if (this.renderer && this.scene && this.camera) {
                 this.renderer.render(this.scene, this.camera);
             }
        } catch (error) {
            console.warn('动画渲染错误:', error);
            // 尝试继续动画循环
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 鼠标点击事件
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        // WASD键盘移动事件
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // 设置3D控制面板事件监听器
        this.setupControlPanel();
    }
    
    setupControlPanel() {
        // 移除原有的3D控制面板相关代码，因为已删除HTML元素
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    onMouseClick(event) {
        try {
            const mouse = new THREE.Vector2();
            const rect = this.renderer.domElement.getBoundingClientRect();
            
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            
            // 确保包含所有可点击对象，包括木星卫星
            const objects = [this.sun, ...Object.values(this.planets)];
            if (this.jupiter) objects.push(this.jupiter);
            if (this.jupiterMoons && this.jupiterMoons.length > 0) {
                objects.push(...this.jupiterMoons);
            }
            
            const intersects = raycaster.intersectObjects(objects);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                console.log('点击对象:', clickedObject.name, clickedObject.userData); // 调试信息
                this.focusOnObject(clickedObject);
                this.showObjectInfo(clickedObject.userData.name || clickedObject.name);
            }
        } catch (error) {
            console.warn('鼠标点击处理错误:', error);
        }
    }
    
    // WASD键盘事件处理
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.w = true;
                break;
            case 'KeyA':
                this.keys.a = true;
                break;
            case 'KeyS':
                this.keys.s = true;
                break;
            case 'KeyD':
                this.keys.d = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.w = false;
                break;
            case 'KeyA':
                this.keys.a = false;
                break;
            case 'KeyS':
                this.keys.s = false;
                break;
            case 'KeyD':
                this.keys.d = false;
                break;
        }
    }
    
    // WASD移动处理
    handleMovement() {
        if (!this.controls || !this.camera) return;
        
        const moveVector = new THREE.Vector3();
        
        if (this.keys.w) {
            moveVector.z -= this.moveSpeed;
        }
        if (this.keys.s) {
            moveVector.z += this.moveSpeed;
        }
        if (this.keys.a) {
            moveVector.x -= this.moveSpeed;
        }
        if (this.keys.d) {
            moveVector.x += this.moveSpeed;
        }
        
        if (moveVector.length() > 0) {
            // 如果正在移动，停止跟随
            if (this.isFollowing) {
                this.stopFollowing();
            }
            
            // 根据相机方向调整移动向量
            moveVector.applyQuaternion(this.camera.quaternion);
            this.camera.position.add(moveVector);
            this.controls.target.add(moveVector);
        }
    }
    
    focusOnObject(object) {
        // 设置跟随目标
        this.followTarget = object;
        this.isFollowing = true;
        
        const targetPosition = object.position.clone();
        
        // 计算初始相机位置（在目标后方和上方）
        const initialOffset = new THREE.Vector3(0, this.followHeight, this.followDistance);
        const initialPosition = targetPosition.clone().add(initialOffset);
        
        // 平滑移动相机到初始位置
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();
        const duration = 2000;
        
        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.camera.position.lerpVectors(startPosition, initialPosition, progress);
            this.controls.target.lerp(targetPosition, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    }
    
    // 更新跟随相机位置
    updateFollowCamera() {
        if (!this.followTarget || !this.camera || !this.controls) return;
        
        const targetPosition = this.followTarget.position.clone();
        
        // 获取当前相机到目标的方向向量
        const currentDirection = new THREE.Vector3();
        currentDirection.subVectors(this.camera.position, targetPosition).normalize();
        
        // 如果方向向量长度为0（相机在目标位置），设置默认方向
        if (currentDirection.length() === 0) {
            currentDirection.set(0, 0, 1);
        }
        
        // 计算期望的相机位置（保持当前的相对方向和距离）
        const desiredPosition = targetPosition.clone().add(
            currentDirection.multiplyScalar(this.followDistance)
        );
        
        // 平滑移动到期望位置，但不强制改变相机朝向
        this.camera.position.lerp(desiredPosition, 0.02);
        
        // 只更新控制器的目标，让用户可以自由旋转
        this.controls.target.lerp(targetPosition, 0.02);
    }
    
    // 停止跟随
    stopFollowing() {
        this.isFollowing = false;
        this.followTarget = null;
    }
    
    showObjectInfo(objectName) {
        // 确保左侧信息面板展开
        const infoPanel = document.getElementById('infoPanel');
        if (infoPanel && infoPanel.classList.contains('collapsed')) {
            infoPanel.classList.remove('collapsed');
        }
        
        // 触发信息面板更新
        const event = new CustomEvent('celestialSelected', {
            detail: { name: objectName }
        });
        document.dispatchEvent(event);
    }
    
    setTimeSpeed(speed) {
        this.timeSpeed = speed;
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        if (this.isAnimating) {
            this.animate();
        } else if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    resetView(sceneType = null) {
        // 停止跟随模式
        this.stopFollowing();
        
        // 获取当前场景类型（从HTML页面的currentScene变量或参数）
        let currentSceneType = sceneType;
        if (!currentSceneType && typeof window !== 'undefined' && window.currentScene) {
            currentSceneType = window.currentScene;
        }
        
        // 根据场景类型重置到对应的初始状态
        switch (currentSceneType) {
            case 'blackhole':
                // 清除其他场景，保持黑洞场景
                this.clearSolarSystem();
                this.clearJupiterMoons();
                
                // 重置黑洞场景的相机位置
                this.camera.position.set(0, 0, 50);
                this.controls.target.set(0, 0, 0);
                break;
                
            case 'jupiter-moons':
                // 清除其他场景，保持木星卫星场景
                this.clearSolarSystem();
                this.clearBlackHole();
                
                // 重置木星卫星场景的相机位置
                this.camera.position.set(0, 20, 40);
                this.controls.target.set(0, 0, 0);
                break;
                
            default: // 'solar-system' 或未指定
                // 清除所有场景，重新创建太阳系
                this.clearSolarSystem();
                this.clearJupiterMoons();
                this.clearBlackHole();
                
                // 重新创建太阳系
                this.createSun();
                this.createPlanets();
                
                // 重置太阳系场景的相机位置
                this.camera.position.set(0, 30, 60);
                this.controls.target.set(0, 0, 0);
                break;
        }
        
        this.controls.update();
        
        // 关闭信息面板
        const infoPanel = document.querySelector('.info-panel');
        if (infoPanel) {
            infoPanel.classList.add('collapsed');
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        // 清理几何体和材质
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
     }
     
     // 创建木星卫星系统
    createJupiterMoons() {
        try {
            // 清除现有场景
            this.clearSolarSystem();
            this.clearBlackHole();
            this.clearJupiterMoons();
            
            // 创建木星
            this.createJupiter();
            
            // 创建主要卫星（伽利略卫星）
            this.createGalileanMoons();
            
            // 设置相机位置
            this.camera.position.set(0, 10, 25);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        } catch (error) {
            console.warn('创建木星卫星系统错误:', error);
        }
    }
    
    // 创建木星
    createJupiter() {
        const jupiterGeometry = new THREE.SphereGeometry(8, 64, 64);
        
        // 尝试加载真实的木星贴图，如果失败则使用程序生成的纹理
        let jupiterMaterial;
        
        // 首先尝试加载用户提供的真实木星贴图
        const loader = new THREE.TextureLoader();
        
        // 创建默认的程序生成纹理
        const defaultTexture = this.createJupiterTexture();
        
        // 使用基础材质，不受光照影响，贴图始终保持原有亮度
        jupiterMaterial = new THREE.MeshBasicMaterial({
            map: defaultTexture,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide
        });
        
        // 尝试加载真实贴图（如果存在）
        loader.load(
            'images/jupiter-texture.jpg',
            (texture) => {
                // 成功加载真实贴图
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = true;
                
                // 更新材质的所有纹理属性
                jupiterMaterial.map = texture;
                jupiterMaterial.bumpMap = texture;
                jupiterMaterial.needsUpdate = true;
                console.log('成功加载真实木星贴图');
            },
            undefined,
            (error) => {
                // 加载失败，继续使用程序生成的纹理
                console.log('使用程序生成的木星纹理');
            }
        );
        
        this.jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
        this.jupiter.name = '木星';
        this.jupiter.userData = {
            type: 'jupiter',
            info: {
                name: '木星',
                description: '太阳系最大的行星，拥有79颗已知卫星',
                diameter: '142,984 km',
                mass: '1.898 × 10²⁷ kg',
                composition: '氢气和氦气为主'
            }
        };
        
        // 添加木星的自转动画
        this.jupiter.rotation.x = 0.1; // 轻微倾斜
        
        this.scene.add(this.jupiter);
        console.log('木星创建成功');
    }

    // 创建木星纹理 - 高细节版本
    createJupiterTexture(size = 1024) {  // 增加默认分辨率
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // 创建更真实的木星基础渐变
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#FFF8DC');    // 中心亮色
        gradient.addColorStop(0.2, '#F4A460');  // 沙棕色
        gradient.addColorStop(0.4, '#DEB887');  // 浅棕色
        gradient.addColorStop(0.6, '#CD853F');  // 秘鲁色
        gradient.addColorStop(0.8, '#A0522D');  // 赭石色
        gradient.addColorStop(1, '#8B4513');    // 马鞍棕色
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // 添加更真实的条纹带 - 多层次水平条纹
        for (let layer = 0; layer < 3; layer++) {
            const bandCount = 25 + layer * 10;
            for (let i = 0; i < bandCount; i++) {
                const y = (i / bandCount) * size;
                const bandWidth = 3 + Math.sin(i * 0.3 + layer) * 2 + layer;
                const opacity = (0.2 + Math.sin(i * 0.4) * 0.15) / (layer + 1);
                
                // 交替的明暗条纹，增加颜色变化
                const hue = 30 + Math.sin(i * 0.2) * 20; // 橙黄色调变化
                const saturation = 40 + Math.sin(i * 0.3) * 20;
                const lightness = 50 + (i % 2 === 0 ? 15 : -15) + Math.sin(i * 0.5) * 10;
                
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
                ctx.fillRect(0, y, size, bandWidth);
            }
        }
        
        // 添加更细致的云带纹理 - 多层波浪
        for (let layer = 0; layer < 2; layer++) {
            const waveCount = 15 + layer * 5;
            for (let i = 0; i < waveCount; i++) {
                const y = (i / waveCount) * size + size * 0.05;
                const amplitude = 8 + layer * 4;
                const frequency = 0.015 + layer * 0.005;
                
                ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + Math.sin(i * 0.6) * 0.05})`;
                
                // 创建复杂波浪形条纹
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < size; x += 5) {
                    const waveY = y + Math.sin(x * frequency + i * 0.5) * amplitude + 
                                     Math.sin(x * frequency * 2 + i) * (amplitude * 0.3);
                    ctx.lineTo(x, waveY);
                }
                ctx.lineTo(size, y);
                ctx.lineTo(size, y + 6);
                ctx.lineTo(0, y + 6);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // 创建更真实的大红斑 - 增强细节
        const spotX = size * 0.35;
        const spotY = size * 0.55;
        const spotRadiusX = size * 0.15;
        const spotRadiusY = size * 0.10;
        
        // 大红斑的多层渐变
        const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRadiusX);
        spotGradient.addColorStop(0, 'rgba(220, 20, 60, 0.95)');   // 深红中心
        spotGradient.addColorStop(0.3, 'rgba(178, 34, 34, 0.85)'); // 火砖红
        spotGradient.addColorStop(0.6, 'rgba(139, 0, 0, 0.7)');    // 暗红
        spotGradient.addColorStop(1, 'rgba(101, 67, 33, 0.5)');    // 棕色边缘
        
        ctx.fillStyle = spotGradient;
        ctx.beginPath();
        ctx.ellipse(spotX, spotY, spotRadiusX, spotRadiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 添加大红斑内部的多层螺旋纹理
        for (let spiral = 0; spiral < 3; spiral++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - spiral * 0.05})`;
            ctx.lineWidth = 3 - spiral;
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 6; angle += 0.05) {
                const radius = (angle / (Math.PI * 6)) * spotRadiusX * (0.9 - spiral * 0.2);
                const x = spotX + Math.cos(angle + spiral * 0.5) * radius;
                const y = spotY + Math.sin(angle + spiral * 0.5) * radius * 0.65;
                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // 添加更多小的风暴和涡旋 - 增加数量和细节
        for (let i = 0; i < 15; i++) {
            const stormX = Math.random() * size;
            const stormY = Math.random() * size;
            const stormRadius = 8 + Math.random() * 15;
            
            // 创建风暴的渐变
            const stormGradient = ctx.createRadialGradient(stormX, stormY, 0, stormX, stormY, stormRadius);
            const r = 80 + Math.random() * 120;
            const g = 40 + Math.random() * 80;
            const b = 20 + Math.random() * 60;
            
            stormGradient.addColorStop(0, `rgba(${r + 50}, ${g + 30}, ${b + 20}, 0.6)`);
            stormGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`);
            
            ctx.fillStyle = stormGradient;
            ctx.beginPath();
            ctx.arc(stormX, stormY, stormRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 添加细微的大气湍流效果
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const length = 20 + Math.random() * 40;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.strokeStyle = `rgba(255, 240, 200, ${0.1 + Math.random() * 0.1})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        // 添加极地区域的特殊纹理
        const polarGradient = ctx.createRadialGradient(size/2, 0, 0, size/2, 0, size * 0.3);
        polarGradient.addColorStop(0, 'rgba(200, 180, 140, 0.3)');
        polarGradient.addColorStop(1, 'rgba(160, 120, 80, 0.1)');
        ctx.fillStyle = polarGradient;
        ctx.fillRect(0, 0, size, size * 0.2);
        
        const southPolarGradient = ctx.createRadialGradient(size/2, size, 0, size/2, size, size * 0.3);
        southPolarGradient.addColorStop(0, 'rgba(200, 180, 140, 0.3)');
        southPolarGradient.addColorStop(1, 'rgba(160, 120, 80, 0.1)');
        ctx.fillStyle = southPolarGradient;
        ctx.fillRect(0, size * 0.8, size, size * 0.2);
        
        // 创建纹理并返回
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    // 创建伽利略卫星
    createGalileanMoons() {
        const moonData = [
            {
                name: '木卫一（伊奥）',
                distance: 12,  // 从8增加到12
                size: 0.6,     // 从0.4增加到0.6
                speed: 0.03,
                color: '#FFFF99',
                info: {
                    name: '木卫一（伊奥）',
                    description: '木星最内侧的伽利略卫星，拥有活跃的火山活动',
                    diameter: '3,643 km',
                    orbital_period: '1.77天',
                    discovery: '1610年由伽利略发现'
                }
            },
            {
                name: '木卫二（欧罗巴）',
                distance: 15,  // 从10增加到15
                size: 0.55,    // 从0.35增加到0.55
                speed: 0.02,
                color: '#E6E6FA',
                info: {
                    name: '木卫二（欧罗巴）',
                    description: '被冰层覆盖，可能存在地下海洋和生命',
                    diameter: '3,122 km',
                    orbital_period: '3.55天',
                    discovery: '1610年由伽利略发现'
                }
            },
            {
                name: '木卫三（甘尼米德）',
                distance: 18,  // 从12增加到18
                size: 0.75,    // 从0.5增加到0.75
                speed: 0.015,
                color: '#A0A0A0',
                info: {
                    name: '木卫三（甘尼米德）',
                    description: '太阳系最大的卫星，比水星还大',
                    diameter: '5,268 km',
                    orbital_period: '7.15天',
                    discovery: '1610年由伽利略发现'
                }
            },
            {
                name: '木卫四（卡利斯托）',
                distance: 22,  // 从15增加到22
                size: 0.7,     // 从0.45增加到0.7
                speed: 0.01,
                color: '#696969',
                info: {
                    name: '木卫四（卡利斯托）',
                    description: '表面布满陨石坑，是太阳系最古老的表面之一',
                    diameter: '4,821 km',
                    orbital_period: '16.69天',
                    discovery: '1610年由伽利略发现'
                }
            }
        ];
        
        // 初始化卫星数组和轨道数组，完全复制行星的实现方式
        this.jupiterMoons = [];
        this.moonOrbits = [];
        
        moonData.forEach((data, index) => {
            // 创建卫星轨道线 - 完全复制行星轨道的创建方式
            const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = -Math.PI / 2;
            this.scene.add(orbit);
            this.moonOrbits.push(orbit);
            
            // 创建卫星 - 完全复制行星的创建方式
            const moonGeometry = new THREE.SphereGeometry(data.size, 16, 16);
            
            // 使用基础材质，不受光照影响，贴图始终保持原有亮度
            const moonTexture = this.createMoonTexture(data.color, data.name);
            const moonMaterial = new THREE.MeshBasicMaterial({
                map: moonTexture
            });
            
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            // 设置初始位置
            moon.position.x = data.distance;
            // 添加与行星相同的阴影属性
            moon.castShadow = true;
            moon.receiveShadow = true;
            // 完全复制行星的userData结构，包含完整信息
            moon.userData = {
                name: data.name,
                type: 'moon',
                distance: data.distance,
                speed: data.speed,
                angle: index * Math.PI / 2, // 初始角度分散
                info: data.info // 添加完整的卫星信息
            };
            
            // 添加到场景和数组中 - 与行星完全一致的方式
            this.scene.add(moon);
            this.jupiterMoons.push(moon);
        });
    }
    
    // 创建卫星纹理
    createMoonTexture(baseColor, moonName, size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // 基础颜色
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);
        
        // 根据不同卫星添加特色纹理
        if (moonName.includes('伊奥')) {
            // 伊奥的火山活动纹理
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 20 + 5;
                ctx.fillStyle = `rgba(255, 69, 0, ${Math.random() * 0.5 + 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else if (moonName.includes('欧罗巴')) {
            // 欧罗巴的冰层裂纹纹理
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, Math.random() * size);
                ctx.lineTo(Math.random() * size, Math.random() * size);
                ctx.stroke();
            }
        } else {
            // 其他卫星的陨石坑纹理
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 15 + 3;
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3 + 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // 清除木星卫星系统
    clearJupiterMoons() {
        if (this.jupiter) {
            this.scene.remove(this.jupiter);
            this.jupiter = null;
        }
        
        // 清除木星卫星
        if (this.jupiterMoons) {
            this.jupiterMoons.forEach(moon => {
                this.scene.remove(moon);
            });
            this.jupiterMoons = [];
        }
        
        // 清除卫星轨道线
        if (this.moonOrbits) {
            this.moonOrbits.forEach(orbit => {
                this.scene.remove(orbit);
            });
            this.moonOrbits = [];
        }
        
        this.selectedMoon = null;
    }
    
    // 动画木星卫星系统
    animateJupiterMoons() {
        if (!this.jupiter || this.jupiterMoons.length === 0) return;
        
        // 旋转木星 - 进一步减慢速度
        this.jupiter.rotation.y += 0.0005; // 从0.001进一步减少到0.0005
        
        // 卫星公转 - 进一步减慢速度
        this.jupiterMoons.forEach(moon => {
            moon.userData.angle += moon.userData.speed * this.timeSpeed * 0.05; // 从0.1进一步减少到0.05，更慢
            moon.position.x = Math.cos(moon.userData.angle) * moon.userData.distance;
            moon.position.z = Math.sin(moon.userData.angle) * moon.userData.distance;
            
            // 卫星自转 - 进一步减慢速度
            moon.rotation.y += 0.0005; // 从0.001进一步减少到0.0005
        });
    }
     
     createBlackHole() {
        // 清除现有的太阳系对象
        this.clearSolarSystem();
        
        // 创建黑洞主体
        const blackHoleGeometry = new THREE.SphereGeometry(8, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1.0
        });
        
        this.blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.blackHole.position.set(0, 0, 0);
        this.blackHole.userData = {
            name: '黑洞',
            type: 'blackhole'
        };
        this.scene.add(this.blackHole);
        
        // 创建透镜效果（透明的边缘光晕）
        this.createLensEffect();
        
        // 创建黑洞射流效果
        this.createBlackHoleJets();
        
        // 更新相机位置以更好地观察黑洞
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    createLensEffect() {
        // 创建透镜效果 - 透明的光晕环（增大尺寸）
        const lensGeometry = new THREE.RingGeometry(8.2, 15, 64);
        const lensMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.lensEffect = new THREE.Mesh(lensGeometry, lensMaterial);
        this.lensEffect.rotation.x = Math.PI / 2; // 水平放置
        this.lensEffect.userData = {
            name: '透镜效果',
            type: 'lens'
        };
        this.scene.add(this.lensEffect);
        
        // 创建第二层更大的透镜效果
        const lensGeometry2 = new THREE.RingGeometry(15, 22, 64);
        const lensMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.lensEffect2 = new THREE.Mesh(lensGeometry2, lensMaterial2);
        this.lensEffect2.rotation.x = Math.PI / 2; // 水平放置
        this.scene.add(this.lensEffect2);
    }
    
    createBlackHoleJets() {
        // 创建黑洞射流效果 - 从黑洞两极喷射的高能粒子流
        this.blackHoleJets = [];
        
        // 创建上方射流
        const jetGeometry1 = new THREE.CylinderGeometry(0.5, 2, 80, 16);
        const jetMaterial1 = new THREE.MeshBasicMaterial({
            color: 0xffffff,  // 改为白色
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const upperJet = new THREE.Mesh(jetGeometry1, jetMaterial1);
        upperJet.position.set(0, 40, 0);
        upperJet.userData = {
            name: '上射流',
            type: 'jet',
            direction: 'up'
        };
        this.scene.add(upperJet);
        this.blackHoleJets.push(upperJet);
        
        // 创建下方射流
        const jetGeometry2 = new THREE.CylinderGeometry(2, 0.5, 80, 16);
        const jetMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xffffff,  // 改为白色
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const lowerJet = new THREE.Mesh(jetGeometry2, jetMaterial2);
        lowerJet.position.set(0, -40, 0);
        lowerJet.userData = {
            name: '下射流',
            type: 'jet',
            direction: 'down'
        };
        this.scene.add(lowerJet);
        this.blackHoleJets.push(lowerJet);
        
        // 创建射流内核（更亮的中心部分）
        const coreGeometry1 = new THREE.CylinderGeometry(0.2, 0.8, 70, 8);
        const coreMaterial1 = new THREE.MeshBasicMaterial({
            color: 0xffffff,  // 改为白色
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const upperCore = new THREE.Mesh(coreGeometry1, coreMaterial1);
        upperCore.position.set(0, 35, 0);
        upperCore.userData = {
            name: '上射流核心',
            type: 'jetcore'
        };
        this.scene.add(upperCore);
        this.blackHoleJets.push(upperCore);
        
        const coreGeometry2 = new THREE.CylinderGeometry(0.8, 0.2, 70, 8);
        const coreMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xffffff,  // 改为白色
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const lowerCore = new THREE.Mesh(coreGeometry2, coreMaterial2);
        lowerCore.position.set(0, -35, 0);
        lowerCore.userData = {
            name: '下射流核心',
            type: 'jetcore'
        };
        this.scene.add(lowerCore);
        this.blackHoleJets.push(lowerCore);
        
        // 创建射流粒子效果
        this.createJetParticles();
    }
    
    createJetParticles() {
        // 创建射流粒子系统（减少粒子数量以提高性能）
        const particleCount = 100; // 从200减少到100
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // 初始化粒子位置和速度
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 随机分布在射流区域
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            const height = (Math.random() - 0.5) * 80;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = height;
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // 设置向上或向下的速度
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = height > 0 ? Math.random() * 0.5 + 0.2 : -(Math.random() * 0.5 + 0.2);
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
            
            // 设置粒子颜色（白色）
            colors[i3] = 0.8 + Math.random() * 0.2;     // R - 白色偏亮
            colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G - 白色偏亮
            colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B - 白色偏亮
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.jetParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.jetParticles.userData = {
            velocities: velocities,
            name: '射流粒子',
            type: 'jetparticles'
        };
        this.scene.add(this.jetParticles);
        this.blackHoleJets.push(this.jetParticles);
    }
    
    createSpaceDistortion() {
        // 创建空间扭曲网格效果
        this.spaceDistortionRings = [];
        
        // 创建多个同心圆环来模拟空间扭曲
        for (let i = 0; i < 5; i++) {
            const radius = 15 + i * 8;
            const ringGeometry = new THREE.RingGeometry(radius, radius + 0.5, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x4444ff,
                transparent: true,
                opacity: 0.15 - i * 0.02,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // 水平放置
            ring.userData = {
                originalRadius: radius,
                distortionPhase: i * Math.PI / 3
            };
            
            this.scene.add(ring);
            this.spaceDistortionRings.push(ring);
        }
        
        // 创建垂直的扭曲网格
        for (let i = 0; i < 3; i++) {
            const radius = 20 + i * 10;
            const ringGeometry = new THREE.RingGeometry(radius, radius + 0.3, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x6666ff,
                transparent: true,
                opacity: 0.1 - i * 0.02,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.userData = {
                originalRadius: radius,
                distortionPhase: i * Math.PI / 2,
                isVertical: true
            };
            
            this.scene.add(ring);
            this.spaceDistortionRings.push(ring);
        }
    }

    createAccretionDisk() {
        // 创建多层吸积盘以产生螺旋效果 - 进一步增大尺寸
        this.accretionDisks = [];
        
        for (let i = 0; i < 5; i++) { // 增加到5层
            const diskGeometry = new THREE.RingGeometry(20 + i * 12, 60 + i * 18, 64); // 进一步增大尺寸
            const diskMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1 - i * 0.015, 0.8, 0.6),
                transparent: true,
                opacity: 0.6 - i * 0.08, // 调整透明度
                side: THREE.DoubleSide
            });
            
            const disk = new THREE.Mesh(diskGeometry, diskMaterial);
            disk.rotation.x = -Math.PI / 2;
            disk.rotation.z = i * 0.25; // 每层稍微旋转
            disk.userData = { rotationSpeed: 0.008 + i * 0.004 };
            
            this.scene.add(disk);
            this.accretionDisks.push(disk);
        }
    }
    
    createGravitationalLensing() {
        // 创建引力透镜效果的光环
        const lensGeometry = new THREE.RingGeometry(35, 45, 32);
        const lensMaterial = new THREE.MeshBasicMaterial({
            color: 0x4169e1,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        this.gravitationalLens = new THREE.Mesh(lensGeometry, lensMaterial);
        this.gravitationalLens.rotation.x = -Math.PI / 2;
        this.scene.add(this.gravitationalLens);
    }
    
    createHawkingRadiation() {
        // 创建霍金辐射粒子系统
        this.hawkingParticles = [];
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.8),
                transparent: true,
                opacity: 0.6
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // 随机位置在黑洞周围
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 5;
            particle.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 4,
                Math.sin(angle) * radius
            );
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.1
                ),
                life: Math.random() * 100
            };
            
            this.scene.add(particle);
            this.hawkingParticles.push(particle);
        }
    }
    
    clearSolarSystem() {
        // 清除太阳
        if (this.sun) {
            this.scene.remove(this.sun);
            this.sun = null;
        }
        
        // 清除行星
        Object.values(this.planets).forEach(planet => {
            this.scene.remove(planet);
        });
        this.planets = {};
        
        // 清除所有轨道线
        if (this.orbits) {
            this.orbits.forEach(orbit => {
                this.scene.remove(orbit);
            });
            this.orbits = [];
        }
        
        // 清除星空背景（保留以营造深空感）
        // 不清除星空，让黑洞在星空中显示
    }
    
    clearBlackHole() {
        // 清除黑洞本体
        if (this.blackHole) {
            this.scene.remove(this.blackHole);
            this.blackHole = null;
        }
        
        // 清除透镜效果
        if (this.lensEffect) {
            this.scene.remove(this.lensEffect);
            this.lensEffect = null;
        }
        
        if (this.lensEffect2) {
            this.scene.remove(this.lensEffect2);
            this.lensEffect2 = null;
        }
        
        // 清除射流效果
        if (this.blackHoleJets) {
            this.blackHoleJets.forEach(jet => {
                this.scene.remove(jet);
            });
            this.blackHoleJets = [];
        }
        
        if (this.jetParticles) {
            this.scene.remove(this.jetParticles);
            this.jetParticles = null;
        }
        
        // 重置相机位置
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    animateBlackHole() {
        if (!this.blackHole) return;
        
        // 缓慢旋转黑洞本体
        this.blackHole.rotation.y += 0.002;
        
        // 动画透镜效果
        if (this.lensEffect) {
            const time = Date.now() * 0.001;
            
            // 第一层透镜效果的脉动
            this.lensEffect.rotation.z += 0.005;
            const pulse1 = Math.sin(time * 0.5) * 0.1 + 1;
            this.lensEffect.scale.set(pulse1, pulse1, 1);
            
            // 透明度变化
            const opacity1 = 0.1 + Math.sin(time * 0.3) * 0.05;
            this.lensEffect.material.opacity = Math.max(0.02, opacity1);
        }
        
        if (this.lensEffect2) {
            const time = Date.now() * 0.001;
            
            // 第二层透镜效果的反向旋转和脉动
            this.lensEffect2.rotation.z -= 0.003;
            const pulse2 = Math.sin(time * 0.7 + Math.PI) * 0.08 + 1;
            this.lensEffect2.scale.set(pulse2, pulse2, 1);
            
            // 透明度变化
            const opacity2 = 0.05 + Math.sin(time * 0.4 + Math.PI/2) * 0.03;
            this.lensEffect2.material.opacity = Math.max(0.01, opacity2);
        }
        
        // 动画射流效果
        this.animateJets();
    }
    
    animateJets() {
        if (!this.blackHoleJets || this.blackHoleJets.length === 0) return;
        
        const time = Date.now() * 0.001;
        
        // 动画射流主体
        this.blackHoleJets.forEach((jet, index) => {
            if (jet.userData.type === 'jet') {
                // 射流的脉动效果
                const pulse = Math.sin(time * 2 + index) * 0.1 + 1;
                jet.scale.set(pulse, 1, pulse);
                
                // 透明度变化
                const opacity = 0.5 + Math.sin(time * 1.5 + index) * 0.2;
                jet.material.opacity = Math.max(0.3, opacity);
                
                // 轻微旋转
                jet.rotation.y += 0.01;
            } else if (jet.userData.type === 'jetcore') {
                // 射流核心的更强脉动
                const corePulse = Math.sin(time * 3 + index * 2) * 0.15 + 1;
                jet.scale.set(corePulse, 1, corePulse);
                
                // 核心透明度变化
                const coreOpacity = 0.7 + Math.sin(time * 2 + index * 2) * 0.3;
                jet.material.opacity = Math.max(0.4, coreOpacity);
            }
        });
        
        // 动画射流粒子
        if (this.jetParticles) {
            const positions = this.jetParticles.geometry.attributes.position.array;
            const velocities = this.jetParticles.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                // 更新粒子位置
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
                
                // 重置超出范围的粒子
                if (Math.abs(positions[i + 1]) > 50) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 2;
                    
                    positions[i] = Math.cos(angle) * radius;
                    positions[i + 1] = (Math.random() - 0.5) * 10; // 重新开始位置
                    positions[i + 2] = Math.sin(angle) * radius;
                    
                    // 重新设置速度
                    velocities[i] = (Math.random() - 0.5) * 0.1;
                    velocities[i + 1] = positions[i + 1] > 0 ? Math.random() * 0.5 + 0.2 : -(Math.random() * 0.5 + 0.2);
                    velocities[i + 2] = (Math.random() - 0.5) * 0.1;
                }
            }
            
            this.jetParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
}

// 导出类供外部使用
window.SolarSystem3D = SolarSystem3D;
