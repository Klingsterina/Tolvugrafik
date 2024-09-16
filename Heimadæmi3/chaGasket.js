"use strict";

var canvas;
var gl;
var points;
var mouseX;
var translation = [0.0, 0.0];
var skali = 1.0;               // Initial scale
var color = [1.0, 0.0, 1.1, 1.0]; // Initial color (red)
var movement = false;
var mouseDown = false;
var lastMousePos = {x: 0, y:0}; // initializa stöðu músar

var uColor;
var uScale;
var uTranslation;

var NumPoints = 50000;           //Byrjunar staða punkta

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];

    // Specify a starting point p for our iterations
    // p must lie inside any set of three vertices
    var u = add( vertices[0], vertices[1] );
    var v = add( vertices[0], vertices[2] );
    var p = scale( 0.25, add( u, v ) );

    // And, add our initial point into our array of points

    points = [ p ];
    // Compute new points
    // Each new point is located midway between
    // last point and a randomly chosen vertex

    for ( var i = 0; points.length < NumPoints; ++i ) {
        var j = Math.floor(Math.random() * 3);
        p = add( points[i], vertices[j] );
        p = scale( 0.5, p );
        points.push( p );
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the points into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Uniform locations
    uTranslation = gl.getUniformLocation(program, "uTranslation");
    uScale = gl.getUniformLocation(program, "uScale");
    uColor = gl.getUniformLocation(program, "uColor");

    // Set initial uniform values
    gl.uniform2fv(uTranslation, translation);
    gl.uniform1f(uScale, skali);
    gl.uniform4fv(uColor, color);

    moveSierpinski()
    render();
};

function moveSierpinski() {
    canvas.addEventListener("wheel", function (e){
        console.log("wheeling");
        var scaleFactor = e.deltaY > 0 ? 0.9 : 1.1; //fékk chatGBT til að hjálpa við þetta
        skali *= scaleFactor;
        skali = Math.max(0.01, Math.min(20, skali));
        gl.uniform1f(uScale, skali);
        render();
    });

    canvas.addEventListener("mouseup", function (e){
        mouseDown = false;
    });

    canvas.addEventListener("mousedown", function (e){
        mouseDown = true;
        lastMousePos = {x: e.offsetX, y: e.offsetY};
    });

    canvas.addEventListener("mousemove", function (e){
        if (mouseDown) {
            var xMove = ((e.offsetX-1) - lastMousePos.x) / canvas.width*2;
            var yMove = (lastMousePos.y - (e.offsetY-1)) / canvas.height*2;
            translation[0] += xMove;
            translation[1] += yMove;
            gl.uniform2fv(uTranslation, translation);
            lastMousePos = {x: e.offsetX, y: e.offsetY};
            render()
        }
    });
    
    window.addEventListener("keydown", function (e){
        if (e.code === "Space") {
            color = [Math.random(), Math.random(), Math.random(), 1.0]
            gl.uniform4fv(uColor, color);
            render();
            // e.preventDefault()
            console.log("it works");
        }
    });
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, points.length );
}
