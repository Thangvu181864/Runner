/* eslint-disable linebreak-style */
import {
  Scene, DirectionalLight, AmbientLight, Object3D, AnimationMixer, AnimationAction, Clock,
  Box3, Group, BoxGeometry, MeshPhongMaterial, Mesh, Vector3, TextureLoader, RepeatWrapping,
} from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import TWEEN, { Tween } from '@tweenjs/tween.js';

export default class RunningScene extends Scene {
  private fbxLoader = new FBXLoader();

  private tunnel = new Object3D();

  private player = new Object3D();

  private animationMixer!: AnimationMixer;

  private runningAnimation!: AnimationAction;

  private clock = new Clock();

  private delta = 0;

  private tunnelClone = new Object3D();

  private caveSize = 0;

  private speed = 220;

  private currentAnimation!: AnimationAction;

  private jumpingAnimation!: AnimationAction;

  private isJumping = false;

  private jumpingUp!: Tween<any>;

  private jumpingDown!: Tween<any>;

  private isSliding = false;

  private slidingAnimation !: AnimationAction;

  private sliderTimeout!: ReturnType<typeof setTimeout>;

  private trainObject = new Object3D();

  private knifeObject = new Object3D();

  private maceObject = new Object3D();

  private rockObject = new Object3D();

  private obstacleArray: Group[] = [];

  private currentObstacleOne = new Group();

  private currentObstacleTwo = new Group();

  private playerBox = new Mesh(new BoxGeometry(), new MeshPhongMaterial({ color: 0x0000ff }));

  private playerBoxCollider = new Box3(new Vector3(), new Vector3());

  private obstacleBox = new Box3(new Vector3(), new Vector3());

  private obstacleBox2 = new Box3(new Vector3(), new Vector3());

  private coinObject = new Object3D();

  private coinsArray: Group[] = [];

  private activeCoinsGroup = new Group();

  private coinBox = new Box3(new Vector3(), new Vector3());

  private scores = 0;

  private coins = 0;

  private isGamePaused = false;

  private isGameOver = false;

  private stumbleAnimation!: AnimationAction;

  private isPlayerHeadStart = false;

  async load() {
    const ambient = new AmbientLight(0xFFFFFF, 1);
    this.add(ambient);

    const light = new DirectionalLight(0xf6b26b, 1);

    light.castShadow = true;
    light.position.set(0, 40, -10);
    light.target.position.set(0, 0, -60);
    this.add(light);
    this.add(light.target);

    const loader = new TextureLoader();
    loader.load('/public/assets/models/bau.jpg', (texture) => {
      // eslint-disable-next-line no-param-reassign, no-multi-assign
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(1, 1);
      this.background = texture;
    });

    this.tunnel = await this.fbxLoader.loadAsync('./assets/models/hiepp.fbx');
    this.tunnel.position.set(-1, 0, -400);
    this.tunnel.scale.set(0.05, 0.055, 0.05);
    this.add(this.tunnel);

    this.player = await this.fbxLoader.loadAsync('../../assets/characters/hiepdv.fbx');
    this.player.position.z = -110;
    this.player.position.y = -35;
    this.player.scale.set(0.1, 0.1, 0.1);
    this.player.rotation.y = 180 * (Math.PI / 180);
    this.add(this.player);

    const runningAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/hiepdv@running.fbx');

    this.animationMixer = new AnimationMixer(this.player);
    this.runningAnimation = this.animationMixer.clipAction(runningAnimationObject.animations[0]);
    this.runningAnimation.play();

    this.tunnelClone = this.tunnel.clone();
    const caveBox = new Box3().setFromObject(this.tunnel);
    this.caveSize = caveBox.max.z - caveBox.min.z - 1;
    this.tunnelClone.position.z = this.tunnel.position.z + this.caveSize;
    this.add(this.tunnelClone);

    this.currentAnimation = this.runningAnimation;

    const jumpingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/hiepdv@jumping.fbx');

    this.jumpingAnimation = this.animationMixer.clipAction(jumpingAnimationObject.animations[0]);

    const slidingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/hiepdv@sliding.fbx');
    slidingAnimationObject.animations[0].tracks.shift();
    this.slidingAnimation = this.animationMixer.clipAction(slidingAnimationObject.animations[0]);

    this.trainObject = await this.fbxLoader.loadAsync('../../assets/models/train.fbx');
    this.knifeObject = await this.fbxLoader.loadAsync('../../assets/models/trunk.fbx');
    this.maceObject = await this.fbxLoader.loadAsync('../../assets/models/woodlp.fbx');
    this.rockObject = await this.fbxLoader.loadAsync('../../assets/models/treelog.fbx');

    this.createObstacleMove();

    this.createLeftJumpObstacle();

    this.createCenterJumpObstacle();

    this.createRightJumpObstacle();

    this.createRightCenterObstacle();

    this.createLeftSlideObstacle();

    this.createLeftCenterObstacle();

    this.createLeftRightObstacle();

    this.createCenterSlideObstacle();

    this.createRightSlideObstacle();

    this.playerBox.scale.set(50, 200, 20);
    this.playerBox.position.set(0, 90, 0);
    this.player.add(this.playerBox);
    this.playerBox.visible = false;

    this.coinObject = await this.fbxLoader.loadAsync('../../assets/models/coin.fbx');
    this.coinObject.rotation.set(90 * (Math.PI / 180), 0, 150 * (Math.PI / 180));

    this.generateLeftCenterRightCoins();

    this.generateLeftSideCoin();

    this.generateLeftandCenterCoins();

    this.generateCenterRightCoins();

    this.generateRightCoins();

    const stumblingAnimationObject = await this.fbxLoader.loadAsync('../../assets/animations/hiepdv@stumbling.fbx');
    this.stumbleAnimation = this.animationMixer.clipAction(stumblingAnimationObject.animations[0]);
  }

  initialize() {
    document.onkeydown = (e) => {
      if (!this.isGameOver && !this.isGamePaused) {
        if (e.key === 'ArrowLeft') {
          this.moveLeft();
        } if (e.key === 'ArrowRight') {
          this.moveRight();
        }
        if (e.key === 'ArrowUp') {
          this.jump();
        }
        if (e.key === 'ArrowDown') {
          this.slide();
        }
        if (e.key === ' ') {
          this.pauseAndResumeGame();
        }
      }
    };
    (document.querySelector('.scores-container') as HTMLInputElement).style.display = 'block';

    (document.querySelector('.coins-container') as HTMLInputElement).style.display = 'block';

    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'block';

    (document.querySelector('.pause-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };

    (document.getElementById('resume-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };
    (document.getElementById('restart-button') as HTMLInputElement).onclick = () => {
      this.restartGame();
    };
    setTimeout(() => {
      this.isPlayerHeadStart = true;
    }, 3000);
    if (!this.visible) {
      this.visible = true;
    }

    if (!this.clock.running) {
      this.currentAnimation = this.runningAnimation;
      this.currentAnimation.reset();
      this.currentAnimation.play();
      this.clock.start();
      this.speed = 100;
      this.player.position.x = 0;
    }
  }

  update() {
    if (this.animationMixer) {
      this.delta = this.clock.getDelta();
      this.animationMixer.update(this.delta);
    }
    this.tunnel.position.z += this.speed * this.delta;
    this.tunnelClone.position.z += this.speed * this.delta;

    if (this.tunnel.position.z > 600) {
      this.tunnel.position.z = this.tunnelClone.position.z - this.caveSize + 10;
    }

    if (this.tunnelClone.position.z > 600) {
      this.tunnelClone.position.z = this.tunnel.position.z - this.caveSize + 10;
    }
    TWEEN.update();

    this.playerBoxCollider.setFromObject(this.playerBox);

    this.detectCollisionWithCoins();

    this.detectCollisionWithObstacles();

    this.scores += Math.round(this.speed * this.delta);
    (document.querySelector('.scores-count') as HTMLInputElement).innerHTML = this.scores.toString();

    if (this.isPlayerHeadStart) {
      this.spawnObstacle();
      this.spawnCoin();
    }

    if (!this.isGameOver && this.speed < 200 && !this.isGamePaused) {
      this.speed += 0.01;
    }
  }

  hide() {
    this.isGameOver = false;

    this.coins = 0;

    this.scores = 0;

    (document.getElementById('game-paused-modal') as HTMLInputElement).style.display = 'none';

    (document.querySelector('.scores-container') as HTMLInputElement).style.display = 'none';

    (document.querySelector('.coins-container') as HTMLInputElement).style.display = 'none';

    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'none';

    this.visible = false;

    this.currentObstacleOne.position.z = -1200;
    this.currentObstacleTwo.position.z = -1500;

    this.activeCoinsGroup.position.z = -1200;
    this.currentAnimation.stop();

    this.clock.stop();
  }

  private gameOver() {
    this.isGameOver = true;
    this.speed = 0;
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'none';
    setTimeout(() => {
      this.clock.stop();
      (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'block';
      (document.querySelector('#current-score') as HTMLInputElement).innerHTML = this.scores.toString();
      (document.querySelector('#current-coins') as HTMLInputElement).innerHTML = this.coins.toString();
    }, 3000);
    this.stumbleAnimation.reset();
    this.stumbleAnimation.setLoop(1, 1);
    this.stumbleAnimation.clampWhenFinished = true;

    this.currentAnimation.crossFadeTo(this.stumbleAnimation, 0.1, false).play();
    this.currentAnimation = this.stumbleAnimation;
    this.currentObstacleOne.position.z -= 5;
    this.currentObstacleTwo.position.z -= 5;
    this.isPlayerHeadStart = false;
  }

  private restartGame() {
    (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'none';
    this.currentObstacleOne.position.z = -1200;
    this.currentObstacleTwo.position.z = -1500;
    this.activeCoinsGroup.position.z = -1800;
    this.clock.start();
    this.speed = 150;
    this.coins = 0;
    this.scores = 0;
    (document.querySelector('.coins-count') as HTMLInputElement).innerHTML = '0';
    this.runningAnimation.reset();
    this.currentAnimation.crossFadeTo(this.runningAnimation, 0, false).play();
    this.player.position.z = -110;
    this.isGameOver = false;
    this.isGamePaused = false;
    this.currentAnimation = this.runningAnimation;
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'block';
    this.player.position.x = 0;
    setTimeout(() => {
      this.isPlayerHeadStart = true;
    }, 3000);
  }

  private detectCollisionWithObstacles() {
    for (let i = 0; i < this.currentObstacleOne.children.length; i += 1) {
      this.obstacleBox.setFromObject(this.currentObstacleOne.children[i]);
      if (this.playerBoxCollider.intersectsBox(this.obstacleBox)) {
        this.gameOver();
      }
    }
    for (let i = 0; i < this.currentObstacleTwo.children.length; i += 1) {
      this.obstacleBox2.setFromObject(this.currentObstacleTwo.children[i]);

      if (this.playerBoxCollider.intersectsBox(this.obstacleBox2)) {
        this.gameOver();
      }
    }
  }

  private moveLeft() {
    if (this.player.position.x !== -18) {
      const tweenLeft = new TWEEN.Tween(this.player.position)
        .to({ x: this.player.position.x - 18 }, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          this.player.rotation.y = -140 * (Math.PI / 180);
          if (this.player.position.x <= -18) {
            this.player.position.x = -18;
          }
        })
        .onComplete(() => {
          this.player.rotation.y = 180 * (Math.PI / 180);
        });
      tweenLeft.start();
    }
  }

  private moveRight() {
    if (this.player.position.x !== 18) {
      this.player.rotation.y = 140 * (Math.PI / 180);
      const tweenRight = new Tween(this.player.position)
        .to({ x: this.player.position.x + 18 }, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          if (this.player.position.x >= 18) {
            this.player.position.x = 18;
          }
        })
        .onComplete(() => {
          this.player.rotation.y = 180 * (Math.PI / 180);
        });
      tweenRight.start();
    }
  }

  private jump() {
    if (!this.isJumping) {
      if (this.isSliding) {
        clearTimeout(this.sliderTimeout);
        this.player.position.y = -35;
        this.isSliding = false;
      }
      this.isJumping = true;
      this.currentAnimation.stop();
      this.currentAnimation = this.jumpingAnimation;
      this.currentAnimation.reset();
      this.currentAnimation.setLoop(1, 1);
      this.currentAnimation.clampWhenFinished = true;
      this.currentAnimation.play();
      this.animationMixer.addEventListener('finished', () => {
        this.currentAnimation.crossFadeTo(this.runningAnimation, 0.1, false).play();
        this.currentAnimation = this.runningAnimation;
      });

      this.jumpingUp = new Tween(this.player.position).to({ y: this.player.position.y += 20 }, 400);
      this.jumpingDown = new Tween(this.player.position)
        .to({ y: this.player.position.y -= 20 }, 500);
      this.jumpingUp.chain(this.jumpingDown);
      this.jumpingUp.start();
      this.jumpingDown.onComplete(() => {
        this.isJumping = false;
        this.player.position.y = -35;
      });
    }
  }

  private slide() {
    if (!this.isSliding) {
      if (this.isJumping) {
        this.jumpingUp.stop();
        this.jumpingDown.stop();
        this.player.position.y = -35;
        this.isJumping = false;
      }
      this.isSliding = true;
      this.player.position.y -= 5;
      this.currentAnimation.stop();
      this.slidingAnimation.reset();
      this.currentAnimation = this.slidingAnimation;
      this.slidingAnimation.clampWhenFinished = true;
      this.slidingAnimation.play();
      this.slidingAnimation.crossFadeTo(this.runningAnimation, 1.9, false).play();
      this.currentAnimation = this.runningAnimation;
      this.sliderTimeout = setTimeout(() => {
        this.player.position.y = -35;
        this.isSliding = false;
      }, 800);
    }
  }

  private createRandomObstacle() {
    let randomNum = Math.floor(Math.random() * this.obstacleArray.length);

    while (this.obstacleArray[randomNum] === this.currentObstacleOne
      || this.obstacleArray[randomNum] === this.currentObstacleTwo) {
      randomNum = Math.floor(Math.random() * this.obstacleArray.length);
    }
    return this.obstacleArray[randomNum];
  }

  private spawnObstacle() {
    if (!this.currentObstacleOne.visible) {
      this.currentObstacleOne.visible = true;
    }

    if (!this.currentObstacleTwo.visible) {
      this.currentObstacleTwo.visible = true;
      this.currentObstacleTwo.position.z = this.currentObstacleOne.position.z - 450;
    }

    this.currentObstacleOne.position.z += this.speed * this.delta;
    this.currentObstacleTwo.position.z += this.speed * this.delta;
    if (this.currentObstacleOne === this.obstacleArray[0]) {
      // eslint-disable-next-line max-len
      this.currentObstacleOne.position.x += Math.sin(this.currentObstacleOne.position.z / 100) * 0.6;
      // eslint-disable-next-line max-len
      this.currentObstacleOne.rotation.x += Math.sin(this.currentObstacleOne.position.z / 100) * 0.1;
    }

    if (this.currentObstacleOne.position.z > -40) {
      this.currentObstacleOne.visible = false;
      this.currentObstacleOne.position.z = -1100;
      this.currentObstacleOne = this.createRandomObstacle();
    }

    if (this.currentObstacleTwo.position.z > -40) {
      this.currentObstacleTwo.visible = false;
      this.currentObstacleTwo.position.z = this.currentObstacleOne.position.z - 450;
      this.currentObstacleTwo = this.createRandomObstacle();
    }
  }

  private detectCollisionWithCoins() {
    for (let i = 0; i < this.activeCoinsGroup.children.length; i += 1) {
      this.coinBox.setFromObject(this.activeCoinsGroup.children[i]);
      if (this.playerBoxCollider.intersectsBox(this.coinBox)) {
        this.activeCoinsGroup.children[i].visible = false;
        this.activeCoinsGroup.children[i].position.z += 70;
        if (!this.isGamePaused && !this.isGameOver) {
          this.coins += 1;
        }
        (document.querySelector('.coins-count') as HTMLInputElement).innerHTML = `${this.coins}`;
        setTimeout(() => {
          this.activeCoinsGroup.children[i].position.z -= 70;
        }, 100);
      }
    }
  }

  private generateRandomCoins() {
    const randNum = Math.floor(Math.random() * this.coinsArray.length);
    this.activeCoinsGroup = this.coinsArray[randNum];
  }

  private spawnCoin() {
    if (!this.activeCoinsGroup.visible) {
      this.activeCoinsGroup.visible = true;
    }

    this.activeCoinsGroup.position.z += 0.8 * this.speed * this.delta;
    if (this.activeCoinsGroup.position.z > 50) {
      for (let i = 0; i < this.activeCoinsGroup.children.length; i += 1) {
        if (!this.activeCoinsGroup.children[i].visible) {
          this.activeCoinsGroup.children[i].visible = true;
        }
      }
      this.activeCoinsGroup.visible = false;
      this.activeCoinsGroup.position.z = -1200;
      this.generateRandomCoins();
    }
  }

  private pauseAndResumeGame() {
    if (!this.isGamePaused) {
      this.clock.stop();
      (document.getElementById('game-paused-modal') as HTMLInputElement).style.display = 'block';
      this.isGamePaused = true;
    } else {
      this.clock.start();
      (document.getElementById('game-paused-modal') as HTMLInputElement).style.display = 'none';
      this.isGamePaused = false;
    }
    this.saveCoins();
    this.saveHighScore();
  }

  private saveHighScore() {
    const highScore = localStorage.getItem('high-score') || 0;
    if (Number(this.scores) > Number(highScore)) {
      localStorage.setItem('high-score', this.scores.toString());
    }
  }

  private saveCoins() {
    const prevTotalCoins = localStorage.getItem('total-coins') || 0;
    const totalCoins = Number(prevTotalCoins) + this.coins;
    localStorage.setItem('coins', totalCoins.toString());
  }

  private createObstacleMove() {
    const meshGroup = new Group();
    const mesh2 = this.knifeObject.clone();
    mesh2.scale.set(0.09, 0.09, 0.09);
    mesh2.position.set(42, -31, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.rockObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(-8, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -800);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createLeftJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(0, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -800);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createCenterJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-23, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(23, -20, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.rockObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(0, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createRightJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-23, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(-1, -20, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.rockObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(23, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createRightCenterObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(0, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(24, -20, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createLeftCenterObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-23, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(0, -20, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createLeftRightObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-23, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(23, -20, 0);
    meshGroup.add(mesh2);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createCenterSlideObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-24, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(23, -20, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.maceObject.clone();
    mesh3.scale.set(0.002, 0.002, 0.002);
    mesh3.position.set(0, -15, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createRightSlideObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(-24, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(0, -20, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.maceObject.clone();
    mesh3.scale.set(0.002, 0.002, 0.002);
    mesh3.position.set(20, -15, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private createLeftSlideObstacle() {
    const meshGroup = new Group();
    const mesh = this.trainObject.clone();
    mesh.scale.set(0.04, 0.04, 0.04);
    mesh.position.set(23, -20, 0);
    meshGroup.add(mesh);
    const mesh2 = this.trainObject.clone();
    mesh2.scale.set(0.04, 0.04, 0.04);
    mesh2.position.set(0, -20, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.maceObject.clone();
    mesh3.scale.set(0.002, 0.002, 0.002);
    mesh3.position.set(-21, -15, 3);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -1200);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  private generateLeftCenterRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      const centerCoin = this.coinObject.clone();
      const rightCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      centerCoin.position.set(0, -12, -i * 20);
      rightCoin.position.set(18, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      rightCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin, centerCoin, rightCoin);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }

  private generateLeftSideCoin() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }

  private generateLeftandCenterCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const leftCoin = this.coinObject.clone();
      const centerCoin = this.coinObject.clone();
      leftCoin.position.set(-18, -12, -i * 20);
      centerCoin.position.set(0, -12, -i * 20);
      leftCoin.scale.set(0.035, 0.035, 0.035);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      coinsGroup.add(leftCoin, centerCoin);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }

  private generateCenterRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const centerCoin = this.coinObject.clone();
      const rightCoin = this.coinObject.clone();
      centerCoin.position.set(0, -12, -i * 20);
      rightCoin.position.set(18, -12, -i * 20);
      coinsGroup.add(centerCoin, rightCoin);
      centerCoin.scale.set(0.035, 0.035, 0.035);
      rightCoin.scale.set(0.035, 0.035, 0.035);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }

  private generateRightCoins() {
    const coinsGroup = new Group();
    for (let i = 0; i < 5; i += 1) {
      const rightCoin = this.coinObject.clone();
      rightCoin.position.set(18, -12, -i * 20);
      coinsGroup.add(rightCoin);
      rightCoin.scale.set(0.035, 0.035, 0.035);
    }
    coinsGroup.position.set(0, -20, -1200);
    this.add(coinsGroup);
    coinsGroup.visible = false;
    this.coinsArray.push(coinsGroup);
  }
}
