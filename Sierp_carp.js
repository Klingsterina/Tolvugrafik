"use strict";

var canvas;
var gl;
var points = [];
var NumTimesToSubdivide = 6;
let maxNumPoints = 20000
let index = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, 1 ),
        vec2(  1,  1 ),
        vec2(  1, -1 ),
        vec2(  -1, -1)
    ];

    divideSquare( vertices[0], vertices[1], vertices[2],vertices[3], 
                    NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function square(a,b,c,d) {
    points.push(a,b,c,a,c,d)
}

function divideSquare(a,b,c,d, count) {

    // check for recursion

    if ( count === 0 ) {
        square( a, b, c, d );
    } else {
        //bisect the sides

        let ratio = 1/3
        let ab1 = mix(a, b, ratio);
        let ab2 = mix(a, b, 1-ratio);
        let bc1 = mix(b, c, ratio);
        let bc2 = mix(b, c, 1-ratio);
        let cd1 = mix(c, d, ratio);
        let cd2 = mix(c, d, 1-ratio);
        let da1 = mix(d, a, ratio);
        let da2 = mix(d, a, 1-ratio);

        --count;

        // eight new squares
        let center1 = vec2(ab1[0], da2[1]);
        let center2 = vec2(ab2[0], bc1[1]);
        let center3 = vec2(ab2[0], bc2[1]);
        let center4 = vec2(ab1[0], da1[1]);

        divideSquare(a, ab1, center1, da2, count);//top right
        divideSquare(ab2, b, bc1, center2, count);// top left
        divideSquare(center3, bc2, c, cd1, count);// bottom right
        divideSquare(da1, center4, cd2, d, count);// bottom left
        divideSquare(ab1, ab2, center2, center1, count);//middle top
        divideSquare(center2, bc1, bc2, center3, count);//middle right
        divideSquare(center4, center3, cd1, cd2, count);//middle bot
        divideSquare(da2, center1, center4, da1, count);//middle left

    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    console.log(points)
}
