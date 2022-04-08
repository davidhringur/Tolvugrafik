// Ná í striga
const canvas = document.querySelector('#c');

// Skilgreina sviðsnet
const scene = new THREE.Scene();

scene.add(new THREE.AmbientLight(0x888888));

  const light = new THREE.DirectionalLight('#FFFFFF', 1);
  light.position.set(0, 0, 10);
  light.castShadow = true;
  scene.add(light);



// Skilgreina myndavél og staðsetja hana
const camera = new THREE.PerspectiveCamera( 60, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
camera.position.z = 5;
camera.position.y = 4;


// Bæta við músarstýringu
const controls = new THREE.OrbitControls( camera, canvas );
// Heldur áfram að snúast eftir að músarhnappi hefur verið sleppt
controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.listenToKeyEvents( window );
var cameraState = 1
window.addEventListener("keydown", function(e){
    switch( e.keyCode ) {
       case 49:	// w
            camera.position.z = 5;
            camera.position.y = 4;
           break;
        case 50:	// w
            camera.position.z -= 5;
            camera.position.y -= 4;
           break;
        }
    });

// Skilgreina birtingaraðferð
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

// Skilgreinum hleðsluhlut fyrir mynstur
const loader = new THREE.TextureLoader();

// Hlöðum inn mynstrinu...
//const texture = loader.load('resources/earth_atmos_4096.jpg');
//const traceFloorTexture = loader.load('resources/462b223a236b4ffdd15d1e70d2db00ba.jpg');

// Notum nú bara einfalda áferð án ljósgjafa og tilgreinum mynstrið
//const material = new THREE.MeshBasicMaterial({ map: texture });
const traceFloor = new THREE.MeshBasicMaterial( { color: 0x12326b } );//new THREE.MeshBasicMaterial({ map: traceFloorTexture });
const material = new THREE.MeshBasicMaterial( { color: 0xeff249 } );
// Búa til kúlu með mynstri og bæta í sviðsnetið
const geometry = new THREE.SphereGeometry(1, 50, 50);
const ball = new THREE.Mesh( geometry, material);

//const wallGeom = new THREE.BoxGeometry( 0.1, 1.5, 4 );
//const wall = new THREE.Mesh(wallGeom, material);
//wall.position.set(1.05,-0.25,0);

const floorGeom = new THREE.BoxGeometry(35,0.05,35);
const floor = new THREE.Mesh(floorGeom, traceFloor);
floor.position.set(0,-1-0.025,0);
floor.receiveShadow = true;

//const light = new THREE.PointLight( 0xffffff, 1, 100 );
//light.position.set( 0, 10, 4 );
//light.castShadow = true; // default false
//scene.add( light );
let w = 5.5;
let gap = (32-4*w)/4;
for (i = -16;i<16;i+=8){
    for (j = -16;j<16;j+=8){
        
        const material = new THREE.MeshBasicMaterial( { color: 0xa8326b } );
        const wallGeom = new THREE.BoxGeometry( w, 1, w );
        const wall = new THREE.Mesh(wallGeom, material);
        wall.position.set(i+w/2+gap/2,0,j+w/2+gap/2);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
    }
}
var points = []
var pointsCount = 0
for (i=-16-gap/2; i<=16+gap/2; i+=gap+w){
    for (j=-16-gap/2; j<16+gap/2; j+=gap){
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        const geometry = new THREE.SphereGeometry(0.2, 25, 25);
        const point = new THREE.Mesh( geometry, material);
        point.position.set(i+gap/2,0,j+gap/2);
        point.castShadow = true;
        points.push(point);
        scene.add(point);
    }
}

scene.add(floor);

scene.add(ball);

function curentDirection(){
    var d = new THREE.Vector3();
    camera.getWorldDirection( d );
    let x = Math.round(d.x);
    let z = Math.round(d.z);
    return [x,z, Math.round(d.x * 100.0) / 100.0, Math.round(d.z * 100.0) / 100.0];
}


var isRotatingFromUpDown = false;
var isRotatingFromLeftRight = false;

function turn(){
    const elementz = document.getElementById("idz");
        elementz.innerHTML = "Ponints: "+pointsCount//isRotatingFromUpDown//controls.target.z % 8 //(controls.target.z % 8 <= 0 && controls.target.z % 8 >= 0.1);
    if (controls.getNextMove() == -1){
        var d = curentDirection();
        
        if ((d[1]==-1 || d[1]==1) && d[2]==0){
            isRotatingFromLeftRight = false;
            
            
            if ((Math.abs(controls.target.z % 8) <= 1.9 || Math.abs(controls.target.z % 8) >= 6.1) && isRotatingFromUpDown == false){
                isRotatingFromUpDown = true;
                controls.setNextMove(0);
                controls.rotateLeft(-Math.PI/2);
            }

        }
        if ((d[0]==-1 || d[0]==1) && d[3]==0){
            isRotatingFromUpDown = false;
            

            if ((Math.abs(controls.target.x % 8) <= 1.9 || Math.abs(controls.target.x % 8) >= 6.1) && isRotatingFromLeftRight == false){
                isRotatingFromLeftRight = true;
                controls.setNextMove(0);
                controls.rotateLeft(-Math.PI/2);
            }
        }
    }

    if (controls.getNextMove() == 1){
        var d = curentDirection();
        const elementz = document.getElementById("idz");
        elementz.innerHTML = d[3]//isRotatingFromUpDown//controls.target.z % 8 //(controls.target.z % 8 <= 0 && controls.target.z % 8 >= 0.1);
        if ((d[1]==-1 || d[1]==1) && d[2]==0){
            isRotatingFromLeftRight = false;
            
            if ((Math.abs(controls.target.z % 8) <= 1.9 || Math.abs(controls.target.z % 8) >= 6.1) && isRotatingFromUpDown == false){
                isRotatingFromUpDown = true;
                controls.setNextMove(0);
                controls.rotateLeft(Math.PI/2);
            }

        }
        if ((d[0]==-1 || d[0]==1) && d[3]==0){
            isRotatingFromUpDown = false;

            if ((Math.abs(controls.target.x % 8) <= 1.9 || Math.abs(controls.target.x % 8) >= 6.1) && isRotatingFromLeftRight == false){
                isRotatingFromLeftRight = true;
                controls.setNextMove(0);
                controls.rotateLeft(Math.PI/2);
            }
        }
    }
}

controls.target.z = -2.3;
// Hreyfifall
const animate = function () {
    requestAnimationFrame( animate );

    var vector = new THREE.Vector3();
    camera.getWorldDirection( vector );
    //const elementx = document.getElementById("idlooking");
    //const elementy = document.getElementById("idPos");
    //const elementz = document.getElementById("idz");
    //elementx.innerHTML = "LOOKING   x: "+ Math.round(vector.x * 100.0) / 100.0 + "  y: "+ Math.round(vector.y * 100.0) / 100.0+"  z: "+Math.round(vector.z * 100.0) / 100.0 ;
    //elementy.innerHTML = "x: "+ Math.round(controls.target.x * 100.0) / 100.0 + "  y: "+ Math.round(controls.target.y * 100.0) / 100.0+"  z: "+Math.round(controls.target.z * 100.0) / 100.0 ;
    //elementz.innerHTML = ;
    turn()

    for (i = 0; i<points.length;i++){
        if (Math.hypot(points[i].position.x - ball.position.x, points[i].position.z - ball.position.z)<1){
            scene.remove(points[i]);
            points.splice(i, 1);
            pointsCount+=1;
        }
    }

    if (Math.abs(ball.position.x)>17){
        controls.target.x = 17
    }

    controls.update();
    ball.position.set(controls.target.x, controls.target.y, controls.target.z);
    renderer.render( scene, camera );
};

animate();