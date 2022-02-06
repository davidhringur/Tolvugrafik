/////////////////////////////////////////////////////////////////
//    S�nid�mi � T�lvugraf�k
//     S�nir notkun � tveimur minnissv��um (VBO) og hvernig �au
//     eru virkju� r�tt fyrir teikningu � render().
//     Tv� VBO teiknu� me� s�mu liturum (og "uniform" breytu)
//
//    Hj�lmt�r Hafsteinsson, jan�ar 2022
/////////////////////////////////////////////////////////////////
var gl;

// Global variables (accessed in render)
var locPosition;
var locColor;
var bufferIdA;
var bufferIdB;
var colorA = vec4(0.0, 0.0, 1.0, 1.0);
var colorB = vec4(0.0, 1.0, 0.0, 1.0);
var colorG = vec4(1.0, 1.0, 0.0, 1.0);
var colorM = vec4(1.0, 0.0, 0.0, 1.0);

//initial state of triangles
var verticesA = [ vec2( -0.9, -1.0 ), vec2( -0.9,  -0.6 ), vec2( -0.7, -0.8) ];
var verticesB = [ vec2(  0.25, -1 ), vec2(  0.25,  -0.45 ), vec2(  0.55, -1.0 ),
                  vec2(  0.55,  -0.45 ), vec2(  0.25,  -0.45 ), vec2(  0.55, -1.0 )];
var verticesG = []
let monsterWidth = 0.1
var verticesM = [vec2(-5,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5+monsterWidth,-1+monsterWidth)]
var direction = 1 // 1 for right -1 for left
var keyState = {};
var isJumping = false;
var G = 0;
var coinCount = 0
var counter = 0
var gameOver = false

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    const element = document.getElementById("id01");
    element.innerHTML = "Coins: "+coinCount;
    
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Define two VBOs and load the data into the GPU
    bufferIdA = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdA );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesA), gl.STATIC_DRAW );

    bufferIdB = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdB );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesB), gl.STATIC_DRAW );
    
    bufferIdG = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesG), gl.STATIC_DRAW );
    
    bufferIdM = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdM );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesM), gl.STATIC_DRAW );

    // Get location of shader variable vPosition
    locPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( locPosition );

    locColor = gl.getUniformLocation( program, "rcolor" );
    
    window.addEventListener('keydown',function(e){
        keyState[e.keyCode || e.which] = true;
    },true);

    window.addEventListener('keyup',function(e){
        keyState[e.keyCode || e.which] = false;
    },true);

    render();
};

function rectCollision(origin, size, offset){
    let x_min = origin[0];
    let x_max = origin[0] + size[0];
    let y_min = origin[1];
    let y_max = origin[1] + size[1];
    let x_min2 = verticesA[0][0]+offset[0];
    let x_max2 = verticesA[2][0]+offset[0];
    let y_min2 = verticesA[0][1]+offset[1];
    let y_max2 = verticesA[1][1]+offset[1];
    if (direction === -1){
        x_min2 = verticesA[2][0]+offset[0];
        x_max2 = verticesA[1][0]+offset[0];
        
    }
    
    let a = (x_max > x_min2 && x_max<x_max2) || (x_min > x_min2 && x_min<x_max2)
    let b = (y_max > y_min2 && y_max<y_max2) || (y_min > y_min2 && y_min<y_max2)
    if (a && b)
        return true
        
    return false
}

function gameLoop() {
    counter += 1
    let x_min = verticesA[0][0];
    let x_max = verticesA[2][0];
    let y_min = verticesA[0][1];
    let y_max = verticesA[1][1];
    if (direction === -1){
        x_min = verticesA[2][0];
        x_max = verticesA[1][0];
    }
    let dx = 0.03;
    let dy = 0.05
    let dG = 0.002
    
    let floor = -1
    let firstObstRange = vec2(0.25, 0.55);
    
    let marioInFirstObstRange = ((x_max > firstObstRange[0] & x_max < firstObstRange[1])|(x_min < firstObstRange[1] & x_min > firstObstRange[0]))
    
    let marioInFirstObstRangeLookahed = ((x_max+12*dx > firstObstRange[0] & x_max+12*dx < firstObstRange[1])|(x_min+12*dx < firstObstRange[1] & x_min+12*dx > firstObstRange[0]))
    let marioInFirstObstRangeLookahedLeft = ((x_max-12*dx > firstObstRange[0] & x_max-12*dx < firstObstRange[1])|(x_min-12*dx < firstObstRange[1] & x_min-12*dx > firstObstRange[0]))
    
    
    if (marioInFirstObstRange) {
        floor = -0.45
    }
    
    if (keyState[37]){
        if (direction === 1){
            direction = -1
            verticesA[2][0] -= 2*(verticesA[2][0]-verticesA[1][0])
            for (let i = 0; i < 3; i++){
                verticesA[i][0] += 0.2;
            }
            x_min = verticesA[2][0];
        }
        
        if ((x_min - dx > -1)&&(floor <= y_min | !marioInFirstObstRangeLookahedLeft))
            for (let i = 0; i < 3; i++){
                verticesA[i][0] -= dx
            }
        
    }
    if (keyState[39]){
        if ((x_max + dx < 1)&&(floor <= y_min | !marioInFirstObstRangeLookahed))
            for (let i = 0; i < 3; i++){
                verticesA[i][0] += dx
            }
        if (direction === -1){
            direction = 1
            verticesA[2][0] += 2*(-verticesA[2][0]+verticesA[1][0])
            for (let i = 0; i < 3; i++){
                verticesA[i][0] -= 0.2;
            }
        }
    }
    
    if (keyState[38]){
        if (isJumping === false)
            G = 0;
        isJumping = true;
        
    }
    
    if (isJumping) {
        if (y_max + (dy - G) < 1 && y_min + (dy - G) > floor){
            for (let i = 0; i < 3; i++){
                verticesA[i][1] += dy;
            }
        }
    }
    
    if (y_min > floor){ // Activate GRAVITY!
        
        //G += dG
        
        if (G+dG > y_min-floor){
            isJumping = false
        }
        G = Math.min(G+dG, y_min-floor)
        for (let i = 0; i < 3; i++){
            verticesA[i][1] -= G
        }
    } else {
        G = 0
        isJumping = false
    }


    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdA );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesA), gl.STATIC_DRAW );
    
    
    
    counter += 1
    let width = 0.05
    if (counter% 500 === 0) {
        let x_gold = Math.random()*2-1
        let y_gold = -Math.random()
        
        
        verticesG.push(vec2(x_gold,y_gold),vec2(x_gold,y_gold+width),vec2(x_gold+width,y_gold),vec2(x_gold,y_gold+width),vec2(x_gold+width,y_gold),vec2(x_gold+width,y_gold+width))
        
        if (counter > 1500 && verticesG.length > 3*6) {
            verticesG.splice(0,6)
        }
    }
    
    for (let i = 0; i<verticesG.length;i+=6){
        let a  =(rectCollision(verticesG[i], vec2(width,width), vec2(0,0)))
        if (rectCollision(verticesG[i], vec2(width,width), vec2(0,0))){
            verticesG.splice(i,6)
            coinCount += 1
            const element = document.getElementById("id01");
            element.innerHTML = "Coins: "+coinCount;
            if (coinCount >= 10){
                element.innerHTML = "Coins: "+coinCount + "  YOU WON!";
                monsterWidth = 2000
                verticesM = [vec2(-1,-1),vec2(-1,-1+monsterWidth),vec2(-1+monsterWidth,-1),vec2(-1,-1+monsterWidth),vec2(-1+monsterWidth,-1),vec2(-1+monsterWidth,-1+monsterWidth)]
                gameOver = true
                colorM = vec4(0.0, 1.0, 0.0, 1.0);
                
            }
        }
    }
    
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesG), gl.STATIC_DRAW );
    
    // Move monster
    if (!gameOver){
        for (let i = 0; i < 6; i++){
            verticesM[i][0] += 0.01;
        }
    }
    if (verticesM[0][0]>3){
        verticesM = [vec2(-5,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5+monsterWidth,-1+monsterWidth)]
        
    }
    
    if (rectCollision(verticesM[0], vec2(monsterWidth,monsterWidth), vec2(0,0))){
        monsterWidth = 2000
        verticesM = [vec2(-5,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5,-1+monsterWidth),vec2(-5+monsterWidth,-1),vec2(-5+monsterWidth,-1+monsterWidth)]
        gameOver = true
    }
    
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdM );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesM), gl.STATIC_DRAW );
    
    
}


function render() {
    gameLoop();
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdA );
    gl.vertexAttribPointer( locPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv( locColor, flatten(colorA) );
    gl.drawArrays( gl.TRIANGLES, 0, 3 );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdB );
    gl.vertexAttribPointer( locPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv( locColor, flatten(colorB) );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdG );
    gl.vertexAttribPointer( locPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv( locColor, flatten(colorG) );
    gl.drawArrays( gl.TRIANGLES, 0, verticesG.length );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferIdM );
    gl.vertexAttribPointer( locPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv( locColor, flatten(colorM) );
    gl.drawArrays( gl.TRIANGLES, 0, verticesM.length );
    
    
    setTimeout(render, 10); // frame rate
}
