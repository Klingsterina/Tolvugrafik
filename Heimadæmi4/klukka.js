var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var spinZ = 0;
var origX;
var origY;
var rotation = 0.0;
let lastTime = performance.now();

var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );

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
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    render();
}

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
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    // Ég breytti litunum þar sem mér fannst hinir passa ekki við sem klukka
    var vertexColors = [
        [ 0.7, 0.5, 0.4, 1.0 ],  // soft brown
        [ 0.8, 0.6, 0.5, 1.0 ],  // light reddish brown
        [ 0.9, 0.8, 0.6, 1.0 ],  // soft cream
        [ 0.8, 0.7, 0.5, 1.0 ],  // light olive-brown
        [ 0.6, 0.5, 0.4, 1.0 ],  // darker brown
        [ 1.0, 0.9, 0.8, 1.0 ],   // light cream (off-white)
        [ 0.8, 0.7, 0.6, 1.0 ],  // taupe (soft brown-gray)
        [ 0.9, 0.7, 0.6, 1.0 ]  // cream with a hint of pink
    ];

    // Annars eru gömlu litirnir hérna
    // var vertexColors = [
    //     [ 0.0, 0.0, 0.0, 1.0 ],  // black
    //     [ 1.0, 0.0, 0.0, 1.0 ],  // red
    //     [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    //     [ 0.0, 1.0, 0.0, 1.0 ],  // green
    //     [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    //     [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    //     [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    //     [ 1.0, 1.0, 1.0, 1.0 ]   // white
    // ];
    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}


function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /***************************************************************************************************
    // Hér er mini útgáfa af snúningi.
    // Þetta lætur eins og klukka nema snýst hraðar en venjulegur tími
    ****************************************************************************************************/
    rotation -= 60;
    var hourRotation = rotation*30/43200;
    var minuteRotation = rotation*6/1024;
    var secondsRotation = rotation*6/60;


    /****************************************************************************************************
    // Hér er raunverulegur tími klukku þar sem sekúnduvísirinn hreyfist jafn hratt og venjulegri klukku,
    // ásamt mínótu og klukkutíma.
    ****************************************************************************************************/

    // let currentTime = performance.now();
    // let deltaTime = (currentTime - lastTime) / 1000; // Convert milliseconds to seconds
    // lastTime = currentTime;

    // rotation -= deltaTime; // Increment by the elapsed time for smooth motion

    // // Calculate angles based on elapsed time
    // var secondsRotation = rotation * 6; // 360 degrees / 60 seconds
    // var minuteRotation = (rotation / 60) * 6; // 360 degrees / 60 minutes
    // var hourRotation = (rotation / 3600) * 30; // 360 degrees / 12 hours

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    // Build the clock
    // build the hour arm
    var hourArm = mult(mv, rotateZ(hourRotation)); // Rotate hour arm
    var hourTip = mult(hourArm, translate(0.0, 0.38, -0.04)); // Get the tip of the hour arm
    hourArm = mult(hourArm, scalem(0.05, 0.4, 0.05)); // Scale the hour arm
    hourArm = mult(hourArm, translate(0.0, 0.5, 0.0))
    gl.uniformMatrix4fv(matrixLoc, false, flatten(hourArm));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // build the minute arm
    var minuteArm = mult(hourTip, rotateZ(minuteRotation));
    var minuteTip = mult(minuteArm, translate(0.0, 0.29, -0.023));
    minuteArm = mult(minuteArm, scalem( 0.02, 0.3, 0.03 ) );
    minuteArm = mult(minuteArm, translate(0.0, 0.5, 0.0));    
    gl.uniformMatrix4fv(matrixLoc, false, flatten(minuteArm));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Build the seconds arm
    var secondsArm = mult(minuteTip, rotateZ(secondsRotation));
    secondsArm = mult(secondsArm, scalem( 0.01, 0.2, 0.02 ));
    secondsArm = mult(secondsArm, translate(0.0, 0.5, 0.0));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(secondsArm));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    //Build a background
    mv1 = mult(mv, scalem(2.0, 2.0, 0.005));
    mv1 = mult(mv1, translate(0.0, 0.0, 5.0))
    mv1 = mult(mv1, rotate(90, [1,0,0]))
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame( render );
}