//////////////////////////////////////////////////////////////////////
//    Sýnisforrit í Tölvugrafík
//     L-laga form teiknað með TRIANGLE-FAN
//
//    Hjálmtýr Hafsteinsson, ágúst 2024
//////////////////////////////////////////////////////////////////////
var gl;
var points;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    let h = 1.2
    let w = 0.32
    let l = 0.95

    let xoff = 0.8;
    let yoff = 0.39
    var vertices = new Float32Array([w-xoff, h-yoff,
                                    0-xoff,  h-yoff,
                                    w-xoff,  w-yoff,
                                    0-xoff,  0-yoff,
                                    l-xoff,  w-yoff,
                                    l-xoff,  0-yoff])
    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER,vertices, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 6 );
}
