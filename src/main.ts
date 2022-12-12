import { WebGLRenderer, PerspectiveCamera } from "three";

import RunningScene from "./scenes/RunningScene";

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new WebGLRenderer({
  canvas: document.getElementById("app") as HTMLCanvasElement,
  antialias: true,
  precision: "mediump",
});

renderer.setSize(width, height);

const mainCamera = new PerspectiveCamera(50, width / height, 0.1, 1000);
mainCamera.position.z = 10;
//move camera with mouse
document.addEventListener("mousemove", (e) => {
  mainCamera.position.x = (e.clientX / width) * 10 - 10;
  mainCamera.position.y = (e.clientY / height) * 10 - 10;
});

function onWindowResize() {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

const runningScene = new RunningScene();

const render = () => {
  runningScene.update();
  renderer.render(runningScene, mainCamera);
  requestAnimationFrame(render);
};

const main = async () => {
  await runningScene.load();
  (document.querySelector('.loading-container') as HTMLInputElement).style.display = 'none';
  runningScene.initialize();
  render();
};

main();
