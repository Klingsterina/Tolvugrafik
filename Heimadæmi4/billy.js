var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

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

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    //Hér er mjög kúl grár skápur
    // var vertexColors = [
    //     [ 0.2, 0.2, 0.2, 1.0 ],   // dark gray
    //     [ 0.3, 0.3, 0.3, 1.0 ],   // medium dark gray
    //     [ 0.4, 0.4, 0.4, 1.0 ],   // medium gray
    //     [ 0.0, 0.0, 0.0, 1.0 ],   // black
    //     [ 0.25, 0.25, 0.25, 1.0 ], // black-gray
    //     [ 0.45, 0.45, 0.45, 1.0 ], // lighter medium gray
    //     [ 0.35, 0.35, 0.35, 1.0 ], // charcoal
    //     [ 0.5, 0.5, 0.5, 1.0 ]    // light gray (soft highlight)
    // ];

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) ) ;

    // Build the Billy
    // First the right side
    mv1 = mult( mv, translate( -0.3, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.03, 1.0, 0.5 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Then the left side
    mv1 = mult( mv, translate( 0.3, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.03, 1.0, 0.5 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Then the lowest suport
    mv1 = mult(mv, scalem(0.6, 0.03, 0.49))
    mv1 = mult(mv1, translate(0.0, -13.0, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Then the lowest shelf
    mv1 = mult(mv, scalem(0.6, 0.03, 0.49))
    mv1 = mult(mv1, translate(0.0, -3.0, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Then the top shelf
    mv1 = mult(mv, scalem(0.6, 0.03, 0.49))
    mv1 = mult(mv1, translate(0.0, 7.0, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Then the top of the shelf
    mv1 = mult(mv, scalem(0.6, 0.03, 0.49))
    mv1 = mult(mv1, translate(0.0, 16.0, 0.01));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // cover on the foot
    mv1 = mult(mv, scalem(0.6, 0.1, 0.03));
    mv1 = mult(mv1, translate(0.0, -4.5, -6.5))
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    //back of the shelf
    mv1 = mult( mv, translate( -0.0, 0.0, 0.24 ) );
    mv1 = mult( mv1, scalem( 0.63, 1.0, 0.03 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame( render );
}

