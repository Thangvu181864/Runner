import {
  Scene, DirectionalLight, AmbientLight, Object3D, AnimationMixer, AnimationAction, Clock,
  Box3, Group, BoxGeometry, MeshPhongMaterial, Mesh, Vector3,
} from 'three';



  // library for smooth moving
  import TWEEN, { Tween } from '@tweenjs/tween.js';

  
  import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
  
  export default class RunningScene extends Scene {
    private fbxLoader = new FBXLoader();
  
    private woodenCave = new Object3D();

    private player = new Object3D();

  
    private animationMixer!: AnimationMixer;

    private runningAnimation!: AnimationAction;
  
    private clock = new Clock();
  
    private delta =0;


    private woodenCaveClone = new Object3D(); //store a copy of the original wooden cave

    private caveSize = 0; //store the size of the cave
  
    private speed = 120;//store the rate at which we want the cave to be moved
    
    //make the player jump
    
  private currentAnimation!: AnimationAction;

  private jumpingAnimation!: AnimationAction;

  private isJumping = false;

  private jumpingUp!: Tween<any>;

  private jumpingDown!: Tween<any>;

  //make the playre slide
  private isSliding = false;

  private slidingAnimation !: AnimationAction;

  private sliderTimeout!: ReturnType<typeof setTimeout>;

  // create obstacles
  
  private barrelObject = new Object3D();

  private boxObject = new Object3D();

  private spikeObject = new Object3D();

  private obstacleArray: Group[] = [];

//Moving the Obstacles Towards the Player
  private currentObstacleOne = new Group();

  private currentObstacleTwo = new Group();

//  Detecting Collisions With The Obstacles
// wrappeed around the player above
  private playerBox = new Mesh(new BoxGeometry(), new MeshPhongMaterial({ color: 0x0000ff }));
// create axis-aligned bounding boxes (AABB) around playerBox
  private playerBoxCollider = new Box3(new Vector3(), new Vector3());
// create AABB around currentObstacleOne
  private obstacleBox = new Box3(new Vector3(), new Vector3());
// create AABB around currentObstacleTwo
  private obstacleBox2 = new Box3(new Vector3(), new Vector3());

// add coin

private coinObject = new Object3D();

private coinsArray: Group[] = [];
// sqawning the coins randomly
//  activeCoinsGroup to store the generated random coins
private activeCoinsGroup = new Group();

private coinBox = new Box3(new Vector3(), new Vector3());

// display score and coins
private scores = 0;

private coins = 0.0;

// impliment pause
private isGamePaused = false;

// impliment game over
private isGameOver = false;
private stumbleAnimation!: AnimationAction;
// boolen true to start generate obstacle
private isPlayerHeadStart = false;

//----------------------------------------------
    async load() {
      const ambient = new AmbientLight(0xFFFFFF, 2.0);
      this.add(ambient);
  
      const light = new DirectionalLight(0xFFFFFF, 3.0);
  
      light.position.set(0, 40, -10);
      this.add(light);
        //import map
      this.woodenCave = await this.fbxLoader.loadAsync('./assets/models/wooden-cave.fbx');
      this.woodenCave.position.set(0, 0, -500);
      this.woodenCave.scale.set(0.055, 0.055, 0.055);
      this.add(this.woodenCave);
        //import player
      this.player = await this.fbxLoader.loadAsync('../../assets/characters/xbot.fbx');
      this.player.position.z = -110;
      this.player.position.y = -35;
      this.player.scale.set(0.1, 0.1, 0.1);
      this.player.rotation.y = 180 * (Math.PI / 180);
      this.add(this.player);
        // add animation running for player
      const runningAnimationObject = await   this.fbxLoader.loadAsync('./assets/animations/xbot@running.fbx');

      this.animationMixer = new AnimationMixer(this.player);
      this.runningAnimation = this.animationMixer.clipAction(runningAnimationObject.animations[0]);
      this.runningAnimation.play();
        
        //clone the cave and position it at the back of the original cave
      this.woodenCaveClone = this.woodenCave.clone();
      const caveBox = new Box3().setFromObject(this.woodenCave);
      this.caveSize = caveBox.max.z - caveBox.min.z - 1;
      this.woodenCaveClone.position.z = this.woodenCave.position.z + this.caveSize;
      this.add(this.woodenCaveClone);
       

      //The currentAnimation will be used to store the animation that is currently being played
      this.currentAnimation = this.runningAnimation;

      // add jumping animation
    const jumpingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/xbot@jumping.fbx');

    this.jumpingAnimation = this.animationMixer.clipAction(jumpingAnimationObject.animations[0]);

    // add sliding animation
    const slidingAnimationObject = await this.fbxLoader.loadAsync('./assets/animations/xbot@sliding.fbx');
    // remove the animation track that makes the player move forward when sliding
    slidingAnimationObject.animations[0].tracks.shift();
    this.slidingAnimation = this.animationMixer.clipAction(slidingAnimationObject.animations[0]);

  // import the obstacle models
  this.barrelObject = await this.fbxLoader.loadAsync('../../assets/models/barrel.fbx');
  this.boxObject = await this.fbxLoader.loadAsync('../../assets/models/box.fbx');
  this.spikeObject = await this.fbxLoader.loadAsync('../../assets/models/spike.fbx');

  //  call the obstacle method
  this.createLeftJumpObstacle();

  this.createCenterJumpObstacle();

  this.createRightJumpObstacle();

  this.createRightCenterObstacle();

  this.createLeftSlideObstacle();

  this.createCenterRightObstacle();

  this.createLeftCenterObstacle();

  this.createLeftRightObstacle();

  this.createCenterSlideObstacle();

  this.createRightSlideObstacle();
 
  //  Detecting Collisions With The Obstacles
  //wrap the playerBox around the player
  this.playerBox.scale.set(50, 200, 20);
  this.playerBox.position.set(0, 90, 0);
  this.player.add(this.playerBox);

// import cpin
this.coinObject = await this.fbxLoader.loadAsync('../../assets/models/coin.fbx');
this.coinObject.rotation.set(90 * (Math.PI / 180), 0, 150 * (Math.PI / 180));
// load coin

this.generateLeftCenterRightCoins();

this.generateLeftSideCoin();

this.generateLeftandCenterCoins();

this.generateCenterRightCoins();

this.generateRightCoins();

//import die animation
const stumblingAnimationObject = await this.fbxLoader.loadAsync('../../assets/animations/xbot@stumbling.fbx');
this.stumbleAnimation = this.animationMixer.clipAction(stumblingAnimationObject.animations[0]);

// hide the blue player box that we are using to detect collisions with the player
this.playerBox.visible = false;

  
    }
  
    initialize() {
        // move left and right
        
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
    
      
          // make the score and coin visible
          
    (document.querySelector('.scores-container') as HTMLInputElement).style.display = 'block';

    (document.querySelector('.coins-container') as HTMLInputElement).style.display = 'block';

    //  display pause button
    (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'block';

    //  pause and resume and restart game called when click
    (document.querySelector('.pause-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };

    (document.getElementById('resume-button') as HTMLInputElement).onclick = () => {
      this.pauseAndResumeGame();
    };

    (document.getElementById('restart-button') as HTMLInputElement).onclick = () => {
      this.restartGame();
    };

// after 3s start generate obstacle
    setTimeout(() => {
      this.isPlayerHeadStart = true;
    }, 3000);


      
    }
  
    update() {
        //update the animation
        if (this.animationMixer) {
            this.delta = this.clock.getDelta();
            this.animationMixer.update(this.delta);
          }
          //moving 2 map toward the player
          this.woodenCave.position.z += this.speed * this.delta;
          this.woodenCaveClone.position.z += this.speed * this.delta;

          //re-spawn the caves when they are no longer visible to the camera
      if (this.woodenCave.position.z > 600) {
        this.woodenCave.position.z = this.woodenCaveClone.position.z - this.caveSize;
      }
  
      if (this.woodenCaveClone.position.z > 600) {
        this.woodenCaveClone.position.z = this.woodenCave.position.z - this.caveSize;
      }

      // to move player
TWEEN.update();
// moving the obstacles toward the player
this.spawnObstacle();
// create a bounding box around the playerBox
this.playerBoxCollider.setFromObject(this.playerBox);

this.detectCollisionWithObstacles();

// spawnCoin randomly
this.spawnCoin();
// call method to detect collision with coins
this.detectCollisionWithCoins();

// update score and coin
this.scores +=Math.round(this.speed * this.delta);
(document.querySelector('.scores-count') as HTMLInputElement).innerHTML = this.scores.toString();


    if (this.isPlayerHeadStart) {
      this.spawnObstacle();
      this.spawnCoin();
    }
// 
    if (!this.isGameOver && this.speed < 200 && !this.isGamePaused ) {
      this.speed += 10;
    }

    }
  
    hide() {
      (document.querySelector('.disable-touch') as HTMLInputElement).style.display = 'none';
  
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
  

    // moving
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
// obstacles
  private createLeftJumpObstacle() {
    const meshGroup = new Group();
    const mesh = this.barrelObject.clone();
    mesh.scale.set(0.03, 0.03, 0.03);
    mesh.position.set(0, -25, 0);
    meshGroup.add(mesh);
    const mesh2 = this.barrelObject.clone();
    mesh2.scale.set(0.03, 0.03, 0.03);
    mesh2.position.set(20, -25, 0);
    meshGroup.add(mesh2);
    const mesh3 = this.spikeObject.clone();
    mesh3.scale.set(0.06, 0.06, 0.06);
    mesh3.position.set(-20, -31, 0);
    meshGroup.add(mesh3);
    meshGroup.position.set(0, 0, -800);
    this.add(meshGroup);
    meshGroup.visible = false;
    this.obstacleArray.push(meshGroup);
  }

  
 private createCenterJumpObstacle() {
  const meshGroup = new Group();
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(20, -25, 0);
  meshGroup.add(mesh2);
  const mesh3 = this.spikeObject.clone();
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
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(0, -25, 0);
  meshGroup.add(mesh2);
  const mesh3 = this.spikeObject.clone();
  mesh3.scale.set(0.06, 0.06, 0.06);
  mesh3.position.set(20, -31, 0);
  meshGroup.add(mesh3);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createRightCenterObstacle() {
  const meshGroup = new Group();
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(0, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(20, -25, 0);
  meshGroup.add(mesh2);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createLeftCenterObstacle() {
  const meshGroup = new Group();
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(0, -25, 0);
  meshGroup.add(mesh2);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createLeftRightObstacle() {
  const meshGroup = new Group();
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(20, -25, 0);
  meshGroup.add(mesh2);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createCenterRightObstacle() {
  const meshGroup = new Group();
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.031, 0.031, 0.031);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(20, -25, 0);
  meshGroup.add(mesh2);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createCenterSlideObstacle() {
  const meshGroup = new Group();
  const geometry = new BoxGeometry();
  const material = new MeshPhongMaterial({ color: 'brown' });
  const plank = new Mesh(geometry, material);
  meshGroup.add(plank);
  plank.position.set(0, -20, 0);
  plank.scale.set(40, 0.5, 7);
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(20, -25, 0);
  meshGroup.add(mesh2);
  const mesh3 = this.boxObject.clone();
  mesh3.scale.set(4, 2, 2);
  mesh3.position.set(0, -19, 3);
  meshGroup.add(mesh3);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createRightSlideObstacle() {
  const meshGroup = new Group();
  const geometry = new BoxGeometry();
  const material = new MeshPhongMaterial({ color: 'brown' });
  const plank = new Mesh(geometry, material);
  meshGroup.add(plank);
  plank.position.set(20, -20, 0);
  plank.scale.set(40, 0.5, 7);
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(-20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(0, -25, 0);
  meshGroup.add(mesh2);
  const mesh3 = this.boxObject.clone();
  mesh3.scale.set(4, 2, 2);
  mesh3.position.set(20, -19, 3);
  meshGroup.add(mesh3);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
}

private createLeftSlideObstacle() {
  const meshGroup = new Group();
  const geometry = new BoxGeometry();
  const material = new MeshPhongMaterial({ color: 'brown' });
  const plank = new Mesh(geometry, material);
  meshGroup.add(plank);
  plank.position.set(-20, -20, 0);
  plank.scale.set(40, 0.5, 7);
  const mesh = this.barrelObject.clone();
  mesh.scale.set(0.03, 0.03, 0.03);
  mesh.position.set(20, -25, 0);
  meshGroup.add(mesh);
  const mesh2 = this.barrelObject.clone();
  mesh2.scale.set(0.03, 0.03, 0.03);
  mesh2.position.set(0, -25, 0);
  meshGroup.add(mesh2);
  const mesh3 = this.boxObject.clone();
  mesh3.scale.set(4, 2, 2);
  mesh3.position.set(-20, -19, 3);
  meshGroup.add(mesh3);
  meshGroup.position.set(0, 0, -1200);
  this.add(meshGroup);
  meshGroup.visible = false;
  this.obstacleArray.push(meshGroup);
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

// CALL GAMEOVER WHEN collision os detected
private detectCollisionWithObstacles() {
  // for (let i = 0; i < this.currentObstacleOne.children.length; i += 1) {
  //   this.obstacleBox.setFromObject(this.currentObstacleOne.children[i]);
  //   if (this.playerBoxCollider.intersectsBox(this.obstacleBox)) {
  //     this.gameOver();
  //   }
  // }
  // for (let i = 0; i < this.currentObstacleTwo.children.length; i += 1) {
  //   this.obstacleBox2.setFromObject(this.currentObstacleTwo.children[i]);

  //   if (this.playerBoxCollider.intersectsBox(this.obstacleBox2)) {
  //     this.gameOver();
  //   }
  // }
}

// coin
private generateLeftCenterRightCoins() {
  const coinsGroup = new Group();
  for (let i = 0; i < 5; i += 1) {
    const leftCoin = this.coinObject.clone();
    const centerCoin = this.coinObject.clone();
    const rightCoin = this.coinObject.clone();
    leftCoin.position.set(-18, -12, -i * 25);
    centerCoin.position.set(0, -12, -i * 25);
    rightCoin.position.set(18, -12, -i * 25);
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
    leftCoin.position.set(-18, -12, -i * 25);
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
    leftCoin.position.set(-18, -12, -i * 25);
    centerCoin.position.set(0, -12, -i * 25);
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
    centerCoin.position.set(0, -12, -i * 25);
    rightCoin.position.set(18, -12, -i * 25);
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
    rightCoin.position.set(18, -12, -i * 25);
    coinsGroup.add(rightCoin);
    rightCoin.scale.set(0.035, 0.035, 0.035);
  }
  coinsGroup.position.set(0, -20, -1200);
  this.add(coinsGroup);
  coinsGroup.visible = false;
  this.coinsArray.push(coinsGroup);
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
      }, 50);
      
    }
  }
}


// pause and resume

pauseAndResumeGame() {
  if (!this.isGamePaused ) {
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


// game over
private gameOver() {
  this.isGameOver = true;
  this.speed = 0;
  (document.querySelector('.pause-button') as HTMLInputElement).style.display = 'none';
  setTimeout(() => {
    this.clock.stop();
    (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'block';
    (document.querySelector('#current-score') as HTMLInputElement).innerHTML = this.scores.toString();
    (document.querySelector('#current-coins') as HTMLInputElement).innerHTML = this.coins.toString();
    this.stumbleAnimation.reset();
    this.player.visible = false;
  }, 3000);
  this.stumbleAnimation.reset();
  this.currentAnimation.crossFadeTo(this.stumbleAnimation, 0, false).play();
  this.currentAnimation = this.stumbleAnimation;
  this.currentObstacleOne.position.z -= 5;
  this.currentObstacleTwo.position.z -= 5;
  this.isPlayerHeadStart= false;
  this.saveCoins();
  this.saveHighScore();
}


// restart game
private restartGame() {
  this.player.visible = true;
  (document.getElementById('game-over-modal') as HTMLInputElement).style.display = 'none';
  this.currentObstacleOne.position.z = -1200;
  this.currentObstacleTwo.position.z = -1500;
  this.activeCoinsGroup.position.z = -1800;
  this.clock.start();
  this.speed = 120;
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
    this.isPlayerHeadStart= true;
  }, 3000);
}

// save high score and coin
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


  }
  