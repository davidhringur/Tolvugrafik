/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Wíragrindarteningur teiknaður tvisvar frá mismunandi
//     sjónarhorni til að fá víðsjónaráhrif (með gleraugum)
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 24;

var points = [];
var colors = [];

var vBufferMAP;
var vBufferCreature;
var vPosition;

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -3.0;
var eyesep = 0.2;

var proLoc;
var mvLoc;

var n = 10; // For grid, n x n x n
var darkMatter = 0.5; // Proportion of empty space between creatures
var Grid = [];
var scale = 1;
var CreatureLength = scale/n*(1-darkMatter);

var startNumberOfWolfs = 2;
var startNumberOfSheep = 10;
var maxHunger = 21;
var wolfChildrenNum = 80;
var sheepChildrenNum = 20;

var sheepObjs = [];
var wolfObjs = [];

var timer = 0;
var tempo = 15;

// the 8 vertices of the cube
var v = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];

var lines = [ v[0], v[1], v[1], v[2], v[2], v[3], v[3], v[0],
              v[4], v[5], v[5], v[6], v[6], v[7], v[7], v[4],
              v[0], v[4], v[1], v[5], v[2], v[6], v[3], v[7]
            ];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    colorCube();
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    gridFill();

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vBufferMAP = gl.createBuffer();
    vBufferCreature = gl.createBuffer();

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "wireColor" );
    
    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));
    
    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    


    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.1;
         } else {
             zDist -= 0.1;
         }
     }  );  

     document.getElementById("N").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        n = parseInt(event.target.value);
        CreatureLength = scale/n*(1-darkMatter);
        gridFill();

     }
     document.getElementById("startSheepNum").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        startNumberOfSheep = parseInt(event.target.value);
        gridFill();

     }
     document.getElementById("startWolfNum").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        startNumberOfWolfs = parseInt(event.target.value);
        gridFill();
     }
     document.getElementById("hunger").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        maxHunger = parseInt(event.target.value);
        gridFill();

     }
     document.getElementById("wolfChild").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        wolfChildrenNum = parseInt(event.target.value);
        gridFill();

     }
     document.getElementById("sheepChild").onchange = function(event) {
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        sheepChildrenNum = parseInt(event.target.value);
        gridFill();

     }
     document.getElementById("resetBtn").onclick = function(event){
        sheepObjs = [];
        wolfObjs = [];
        Grid = [];
        gridFill();

     }
     document.getElementById("SimSpeed").onchange = function(event) {
        tempo = parseInt(event.target.value);
     }
     
    render();
}

// INSERT
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( v[indices[i]] );
        
    }
}
// end CUBE INSERT

// Fill grid
function gridFill(){
    for (x = 0; x<n;x++){
        Grid.push([])
        for (y = 0; y<n;y++){
            Grid[x].push([]);
            for (z = 0; z<n;z++){
                Grid[x][y].push(0)
            }
        }
    }

    let random = generateRan();
    for (i = 0; i<random.length; i++){
        if (i < startNumberOfSheep) {
            sheepObjs.push(new Sheep(random[i]%n, Math.floor(random[i]/n)%n, Math.floor(random[i]/n/n)%n));
        } else
            wolfObjs.push(new Wolf(random[i]%n, Math.floor(random[i]/n)%n, Math.floor(random[i]/n/n)%n));
    }

    moveAll()
}

function moveAll(){
    for (g = 0; g<sheepObjs.length; g++){
        sheepObjs[g].move();
    }
    for (g = 0; g<wolfObjs.length; g++){
        wolfObjs[g].move();
    }
}

function gridUpdate(){
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferCreature );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var mv = lookAt( vec3(0.0-eyesep/2.0, 0.0, zDist),
                      vec3(0.0, 0.0, zDist+2.0),
                      vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    for (i = 0; i<sheepObjs.length; i++){
        let x = sheepObjs[i].x; let y = sheepObjs[i].y; let z = sheepObjs[i].z;
        mv1 = mult( mv, translate( x*scale/n+scale/2/n-scale/2, y*scale/n+scale/2/n-scale/2, z*scale/n+scale/2/n-scale/2 ) );
        mv1 = mult( mv1, scalem( CreatureLength, CreatureLength, CreatureLength ) );
        gl.uniform4fv( colorLoc, sheepObjs[i].color );
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
    for (i = 0; i<wolfObjs.length; i++){
        let x = wolfObjs[i].x; let y = wolfObjs[i].y; let z = wolfObjs[i].z;
        mv1 = mult( mv, translate( x*scale/n+scale/2/n-scale/2, y*scale/n+scale/2/n-scale/2, z*scale/n+scale/2/n-scale/2 ) );
        mv1 = mult( mv1, scalem( CreatureLength, CreatureLength, CreatureLength ) );
        gl.uniform4fv( colorLoc, wolfObjs[i].color );
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
    

}

function generateRan(){
    var max = n*n*n;
    var random = [];
    for(var i = 0;i<max ; i++){
        var temp = Math.floor(Math.random()*max);
        if(random.indexOf(temp) == -1){
            random.push(temp);
        }
        else
         i--;
    }
    return random.slice(0, startNumberOfWolfs+startNumberOfSheep);
}

function render()
{
    timer++;
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferMAP );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW );
    var mv = lookAt( vec3(0.0-eyesep/2.0, 0.0, zDist),
                      vec3(0.0, 0.0, zDist+2.0),
                      vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, mult( rotateX(spinX), rotateY(spinY) ) );

    // Vinstri mynd er í rauðu...
    gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 0.0, 1.0) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.LINES, 0, NumVertices );

    

    gridUpdate()
    
    if (timer%Math.floor(tempo) == 0)
        moveAll()
    requestAnimFrame( render );
}


class Sheep {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.age = Math.floor(Math.random()*14);
      this.color = vec4(0.0, 0.8+Math.random()*0.2, Math.random()*0.2, 1.0);
    }
    move() {
        Grid[this.x][this.y][this.z] = 0;
        let r = Math.random();
        // avoid wolf
        var goRandom = true;
        for (let j = 1; j<2;j++){
            if (Grid[modulo_Euclidean(this.x+j,n)][this.y][this.z]==2 && Grid[modulo_Euclidean(this.x-1,n)][this.y][this.z]==0){
                this.x -= 1; goRandom = false;
                break;}
            else if (Grid[modulo_Euclidean(this.x-j,n)][this.y][this.z] ==2 && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z]==0 ){
                this.x += 1; goRandom = false;
                break;}
            else if (Grid[this.x][modulo_Euclidean(this.y+j,n)][this.z] ==2 && Grid[this.x][modulo_Euclidean(this.y-1,n)][this.z]==0 ){
                this.y -= 1; goRandom = false;
                break;}
            else if (Grid[this.x][modulo_Euclidean(this.y-j,n)][this.z] ==2 && Grid[this.x][modulo_Euclidean(this.y+1,n)][this.z]==0 ){
                this.y += 1; goRandom = false;
                break;}
            else if (Grid[this.x][this.y][modulo_Euclidean(this.z+j,n)] ==2 && Grid[this.x][this.y][modulo_Euclidean(this.z-1,n)]==0){
                this.z -= 1; goRandom = false;
                break;}
            else if (Grid[this.x][this.y][modulo_Euclidean(this.z-j,n)] ==2 && Grid[this.x][this.y][modulo_Euclidean(this.z+1,n)]==0 ){
                this.z += 1; goRandom = false;
                break;}
        }
        if (goRandom){
            if (r<1/3){
                if (r<1/6 && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z] == 0)
                    this.x += 1;
                else if (Grid[modulo_Euclidean(this.x-1,n)][this.y][this.z] == 0)
                    this.x -= 1;
            } else if (r<2/3) {
                if (r<3/6 && Grid[this.x][modulo_Euclidean(this.y+1,n)][this.z] == 0)
                    this.y += 1;
                else if (Grid[this.x][modulo_Euclidean(this.y-1,n)][this.z] == 0)
                    this.y -= 1;
            } else if (r<3/3){
                if (r<5/6 && Grid[this.x][this.y][modulo_Euclidean(this.z+1,n)] == 0)
                    this.z += 1;
                else if (Grid[this.x][this.y][modulo_Euclidean(this.z-1,n)] == 0)
                    this.z -= 1;
            }
        }
        this.x = modulo_Euclidean(this.x, n);
        this.y = modulo_Euclidean(this.y, n);
        this.z = modulo_Euclidean(this.z, n);
        Grid[this.x][this.y][this.z] = 1;
        this.age++;
        if (this.age % sheepChildrenNum == 0 && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z] == 0){
            sheepObjs.push(new Sheep(modulo_Euclidean(this.x+1,n), this.y, this.z));
    }


  }
}

class Wolf {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.kills = 0;
      this.color = vec4( 0.6+Math.random()*0.4, 0.0, 0.0, 1.0);
      this.hunger = 0;
      //this.history = [];
    }
    move() {
        //this.history.push([this.x,this.y,this.z])
        Grid[this.x][this.y][this.z] = 0;
        let r = Math.random();
        this.hunger++;

        // find pray
        var goRandom = true;
        for (let j = 1; j<3;j++){
            if (Grid[modulo_Euclidean(this.x+j,n)][this.y][this.z]==1 && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z]!=2){
                this.x += 1; goRandom = false;
                break;}
            else if (Grid[modulo_Euclidean(this.x-j,n)][this.y][this.z] ==1 && Grid[modulo_Euclidean(this.x-1,n)][this.y][this.z]!=2 ){
                this.x -= 1; goRandom = false;
                break;}
            else if (Grid[this.x][modulo_Euclidean(this.y+j,n)][this.z] ==1 && Grid[this.x][modulo_Euclidean(this.y+1,n)][this.z]!=2){
                this.y += 1; goRandom = false;
                break;}
            else if (Grid[this.x][modulo_Euclidean(this.y-j,n)][this.z] ==1 && Grid[this.x][modulo_Euclidean(this.y-1,n)][this.z]!=2){
                this.y -= 1; goRandom = false;
                break;}
            else if (Grid[this.x][this.y][modulo_Euclidean(this.z+j,n)] ==1 && Grid[this.x][this.y][modulo_Euclidean(this.z+1,n)]!=2 ){
                this.z += 1; goRandom = false;
                break;}
            else if (Grid[this.x][this.y][modulo_Euclidean(this.z-j,n)] ==1 && Grid[this.x][this.y][modulo_Euclidean(this.z-1,n)]!=2){
                this.z -= 1; goRandom = false;
                break;}
        }
        if (goRandom){
            if (r<1/3){
                if (r<1/6 && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z] < 2)
                    this.x += 1;
                else if (Grid[modulo_Euclidean(this.x-1,n)][this.y][this.z] < 2)
                    this.x -= 1;
            } else if (r<2/3) {
                if (r<3/6 && Grid[this.x][modulo_Euclidean(this.y+1,n)][this.z] < 2)
                    this.y += 1;
                else if (Grid[this.x][modulo_Euclidean(this.y-1,n)][this.z] < 2)
                    this.y -= 1;
            } else if (r<3/3){
                if (r<5/6 && Grid[this.x][this.y][modulo_Euclidean(this.z+1,n)] < 2)
                    this.z += 1;
                else if (Grid[this.x][this.y][modulo_Euclidean(this.z-1,n)] < 2)
                    this.z -= 1;
            }
        }
    this.x = modulo_Euclidean(this.x, n);
    this.y = modulo_Euclidean(this.y, n);
    this.z = modulo_Euclidean(this.z, n);

    if (Grid[this.x][this.y][this.z] == 1) {
        for (i = 0; i<sheepObjs.length; i++ ){
            let x = sheepObjs[i].x; let y = sheepObjs[i].y; let z = sheepObjs[i].z;
            if (this.x == x && this.y == y && this.z == z){
                sheepObjs.splice(i, 1);
                this.kills++;
                this.hunger = 0;
                if (this.kills >= wolfChildrenNum  && Grid[modulo_Euclidean(this.x+1,n)][this.y][this.z] == 0){
                    wolfObjs.push(new Wolf(modulo_Euclidean(this.x+1,n), this.y, this.z));
                }   
            }
        }
    }

    if (this.hunger> maxHunger){
        for (i = 0; i<wolfObjs.length; i++ ){
            let x = wolfObjs[i].x; let y = wolfObjs[i].y; let z = wolfObjs[i].z;
            if (this.x == x && this.y == y && this.z == z){
                wolfObjs.splice(i, 1);
            }
        }
    }

    Grid[this.x][this.y][this.z] = 2;
  }
}


function modulo_Euclidean(a, b) {
    var m = a % b;
    if (m < 0) {
      // m += (b < 0) ? -b : b; // avoid this form: it is UB when b == INT_MIN
      m = (b < 0) ? m - b : m + b;
    }
    return m;
  }