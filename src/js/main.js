import "../css/main.css";
import * as THREE from "three";
import Water from "./water";

const isFireFox = () => navigator.userAgent.indexOf("Firefox") !== -1;

const ripple = (water, x, y, width, height, camera) => {
    const vx = (2 * x / width - 1) / camera.projectionMatrix.elements[0];
    const vy = (2 * y / height - 1) / camera.projectionMatrix.elements[5];
    const vz = 1;

    const m = camera.matrixWorldInverse.elements;
    const rayDir = new THREE.Vector3();
    rayDir.x = vx * m[0] + vy * m[1] + vz * m[2];
    rayDir.y = vx * m[4] + vy * m[5] + vz * m[6];
    rayDir.z = vx * m[8] + vy * m[9] + vz * m[10];
    rayDir.normalize();

    const rx = camera.position.x + rayDir.x * (camera.position.y / rayDir.y);
    const rz = camera.position.z - rayDir.z * (camera.position.y / rayDir.y);
    const cx = ~~(water.size * (4.5 + rx) / 9.0);
    const cy = ~~(water.size * (4.5 + rz) / 9.0);
    water.ripple(cx, cy, 8, 800);
};

const Demo = canvas => {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.sortObjects = false;
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1.0, 100);
    camera.position.set(0, 2, 3.75);
    camera.lookAt(0, -0.5, 1.5);
    scene.add(camera);

    const light1 = new THREE.PointLight(0xDDDDDD, 1, 0, 2);
    light1.position.set(0, 8, -20);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xEEEEBB, 0.9, 0, 2);
    light2.position.set(0, 8, 20);
    scene.add(light2);

    const water = new Water(isFireFox() ? 256 : 512);
    const geometry = new THREE.PlaneBufferGeometry(9, 9, water.size - 1, water.size - 1);
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");

    const material = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load("aqua.png"),
        specular: 0xF0F0F8,
        shininess: 10
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -90 * Math.PI / 180;
    scene.add(mesh);

    const resizeCanvas = () => {
        const clientWidth = canvas.clientWidth;
        const clientHeight = canvas.clientHeight;
        if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
            canvas.width = clientWidth;
            canvas.height = clientHeight;
            camera.aspect = canvas.width / canvas.height;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.width, canvas.height);
        }
    };

    let tick;
    const loop = (timestamp) => {
        const tock = timestamp - tick | 0; tick = timestamp;
        requestAnimationFrame(loop);

        water.animate(tock / 100.0);
        water.transfer(positions.array);
        geometry.computeVertexNormals();
        positions.needsUpdate = true;
        normals.needsUpdate = true;

        renderer.render(scene, camera);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', e => ripple(water, e.clientX, e.clientY, canvas.clientWidth, canvas.clientHeight, camera));

    resizeCanvas();
    requestAnimationFrame(loop);
};

window.addEventListener("load", () => Demo(document.querySelector("canvas")), { once: true });
