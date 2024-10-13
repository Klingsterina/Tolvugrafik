var canvas;
var gl;
var vBuffer; // Declare vBuffer globally

var gridSize = 10;
var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var zoom = 0.7; // Default zoom level
var tween = 0.0; // Tween value for cube scaling
var numVertices = 36;

var matrixLoc;
var cellStates = [];
var nextCellStates = [];

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    colorCube();

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Initialize cell states
    initializeCellStates();

    // Initialize buffers (only once)
    initializeBuffers(program);

    // Mouse event listeners for rotation
    setupMouseControls();

    // Game loop - Update cell states every 800 ms
    gameLoop();

    render();
}

function initializeBuffers(program) {
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );
}

function gameLoop() {
    updateCellStates();
    tween = 0;
    setTimeout(function() {
        gameLoop();
    }, 900);
}

function initializeCellStates() {
    // Initialize cells in a 3D grid with random states
    for (var x = 0; x < gridSize; x++) {
        cellStates[x] = [];
        nextCellStates[x] = [];
        for (var y = 0; y < gridSize; y++) {
            cellStates[x][y] = [];
            nextCellStates[x][y] = [];
            for (var z = 0; z < gridSize; z++) {
                nextCellStates[x][y][z] = Math.random() > 0.7 ? 1 : 0;
                cellStates[x][y][z] = 0;
            }
        }
    }
}

function countNeighbors(x, y, z) {
    var count = 0;
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            for (var dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                var nx = x + dx;
                var ny = y + dy;
                var nz = z + dz;
                if (
                    // console.log(gridSize);
                    nx >= 0 && nx < gridSize &&
                    ny >= 0 && ny < gridSize &&
                    nz >= 0 && nz < gridSize
                ) {
                    count += cellStates[nx][ny][nz];
                }
            }
        }
    }
    return count;
}

function updateCellStates() {
    for (var x = 0; x < gridSize; x++) {
        for (var y = 0; y < gridSize; y++) {
            for (var z = 0; z < gridSize; z++) {
                cellStates[x][y][z] = nextCellStates[x][y][z];
            }
        }
    }

    for (var x = 0; x < gridSize; x++) {
        for (var y = 0; y < gridSize; y++) {
            for (var z = 0; z < gridSize; z++) {
                var neighbors = countNeighbors(x, y, z);
                if (cellStates[x][y][z] === 1) {
                    nextCellStates[x][y][z] = neighbors === 2 || neighbors === 3 ? 1 : 0;
                } else {
                    nextCellStates[x][y][z] = neighbors === 3 ? 1 : 0;
                }
            }
        }
    }
    // Swap the current and next states

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

function quad(a, b, c, d) {
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
    
    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];
    
    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

function setupMouseControls() {
    // Mouse event listeners for rotation
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });
    
    canvas.addEventListener("mouseup", function(e){
        movement = false;
    });
    
    canvas.addEventListener("mousemove", function(e){
        if (movement) {
            spinY = (spinY + (origX - e.offsetX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });
    
    canvas.addEventListener("wheel", function(e) {
        // Prevent the default scrolling behavior
        e.preventDefault();
        
        // Adjust zoom level based on scroll direction
        zoom *= (e.deltaY < 0) ? 1.1 : 0.9; // Zoom in or out
        zoom = Math.max(0.1, Math.min(zoom, 10)); // Limit zoom level
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult( mv, scalem(zoom, zoom, zoom) );
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Tween for smooth transitions (adjusting over time)
    if (tween < 0.8) {
        tween += 0.1;
    }

    mv = mult( mv, scalem( 0.2, 0.2, 0.2 ) );
    mv = mult( mv, translate( -5, -5, -5 ) );

    for (var i = 0; i < gridSize; i++) {
        for (var j = 0; j < gridSize; j++) {
            for (var k = 0; k < gridSize; k++) {
                let mv1 = mult( mv, translate(i, j, k) );
                if (nextCellStates[i][j][k] == 1) {
                    if (nextCellStates[i][j][k] != cellStates[i][j][k]) {
                        mv1 = mult( mv1, scalem( tween, tween, tween ) );
                    } else {
                        mv1 = mult( mv1, scalem( 0.9, 0.9, 0.9 ) );
                    }
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, numVertices);
                } else if (nextCellStates[i][j][k] == 0 && cellStates[i][j][k] == 1 && tween < 0.89) {
                    mv1 = mult( mv1, scalem( 1-tween, 1-tween, 1-tween ) );
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, points.length);
                }
                console.log(nextCellStates[i][j][k]);
            }
        }
    }
    requestAnimFrame(render); // Request the next frame
}
