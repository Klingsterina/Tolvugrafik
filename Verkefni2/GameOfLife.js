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

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Initialize cell states
    initializeCellStates();

    // Setup cube vertices and colors
    createCubes();

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

    // Game loop
    setInterval(updateCellStates, 800); // Update cell states every 500 ms

    render();
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
                cellStates[x][y][z] = Math.random() > 0.7 ? 1 : 0;
                nextCellStates[x][y][z] = 0;
            }
        }
    }
}

function createCube(position) {
    var size = 0.05; // Size of the cube
    var vertices = [
        vec3(-size, -size, size),   // Front face
        vec3(-size, size, size),
        vec3(size, size, size),
        vec3(size, -size, size),
        vec3(-size, -size, -size),  // Back face
        vec3(-size, size, -size),
        vec3(size, size, -size),
        vec3(size, -size, -size)
    ];

    // Define colors for each face
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face - Red
        [0.0, 1.0, 0.0, 1.0], // Back face - Green
        [0.0, 0.0, 1.0, 1.0], // Left face - Blue
        [1.0, 1.0, 0.0, 1.0], // Right face - Yellow
        [1.0, 0.0, 1.0, 1.0], // Top face - Magenta
        [0.0, 1.0, 1.0, 1.0]  // Bottom face - Cyan
    ];

    var indices = [
        1, 0, 3, 1, 3, 2, // Front face
        5, 4, 7, 5, 7, 6, // Back face
        4, 0, 1, 4, 1, 5, // Left face
        6, 2, 3, 6, 3, 7, // Right face
        1, 2, 6, 1, 6, 5, // Top face
        0, 4, 7, 0, 7, 3  // Bottom face
    ];

    for (var i = 0; i < indices.length; ++i) {
        points.push(add(vertices[indices[i]], position));
        // Assign color based on the face index
        colors.push(faceColors[Math.floor(i / 6)]); // 6 vertices per face
    }
}



function createCubes() {
    points = [];
    colors = [];
    var offset = gridSize / 2; // Original offset for centering the grid
    var spacing = 0.1; // Set the spacing between cubes

    for (var x = 0; x < gridSize; x++) {
        for (var y = 0; y < gridSize; y++) {
            for (var z = 0; z < gridSize; z++) {
                if (cellStates[x][y][z] === 1) {
                    createCube(
                        vec3((x - offset) * spacing, (y - offset) * spacing, (z - offset) * spacing),
                        [0.0, 1.0, 0.0, 1.0]
                    ); // Green cubes represent live cells
                }
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
    var temp = cellStates;
    cellStates = nextCellStates;
    nextCellStates = temp;

    // Recreate the cubes based on the new states
    createCubes();

    // Update buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    requestAnimFrame(render);
}

