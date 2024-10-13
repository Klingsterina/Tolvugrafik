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
var tween = 0.00; // Tween value for cube scaling
var numVertices = 36;

var matrixLoc;
var cellStates = [];
var nextCellStates = [];


window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    // gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
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

/**
 * Upphafsstillir WebGL bufferana fyrir staðsetningar- og litagögn.
 * Bindir og bufferar hnit og litagögn í GPU fyrir teikningu.
 *
 * @param {WebGLProgram} program - WebGL forritið sem inniheldur shadera.
 */
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

/**
 * Setur upp músarstýringar fyrir snúning á grindinni.
 * Hlustar á músarviðburði til að stýra snúningi og zoom.
 */
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

            updateGradient();
        }
    });
    
    canvas.addEventListener("wheel", function(e) {
        e.preventDefault();
        
        // Stilla zoom-levelið eftir scroll-áttinni
        zoom *= (e.deltaY < 0) ? 1.1 : 0.9; // Zoom in eða út
        zoom = Math.max(0.1, Math.min(zoom, 10)); // Limita zoom levelið
    });
}

/**
 * Fall til að uppfæra gradient
 */
function updateGradient() {
    const angle = Math.atan2(spinY, spinX) * (180 / Math.PI); // Reikna út snúning
    const gradient = `linear-gradient(${angle}deg, rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.5))`;
    canvas.style.background = gradient; // Setja gradient á canvas
}

/**
 * Býr til 6 hliðar teningsins og litsetur þær.
 */
function colorCube(){
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

/**
 * Hjálparfall sem teiknar fjórhyrning byggðan á fjórum hornum með gögnum um staðsetningu og lit.
 *
 * @param {number} a - Fyrsta horn fjórhyrningsins.
 * @param {number} b - Annað horn fjórhyrningsins.
 * @param {number} c - Þriðja horn fjórhyrningsins.
 * @param {number} d - Fjórða horn fjórhyrningsins.
 */
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
        [ 1.0, 0.45, 0.0, 1.0 ],    // djúp appelsínugulur
        [ 1.0, 0.65, 0.1, 1.0 ],    // ljós appelsínugulur
        [ 1.0, 0.85, 0.3, 1.0 ],    // mildur gul-appelsínugulur
        [ 0.93, 0.33, 0.0, 1.0 ],   // rauð-appelsínugulur
        [ 0.85, 0.54, 0.13, 1.0 ],  // gullin-brúnn
        [ 1.0, 0.55, 0.2, 1.0 ],    // appelsínurauður
        [ 0.98, 0.6, 0.01, 1.0 ],   // gylltur appelsínugulur
        [ 1.0, 0.75, 0.5, 1.0 ]     // föl appelsínugulur
    ];
    
    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];
    
    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

/**
 * Upphafsstillir ástand frumna fyrir 3D grind.
 * Hver fruma fær handahófskennt upphafsástand, annaðhvort lifandi (1) eða dauð (0).
 */
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

/**
 * Telur fjölda lifandi nágranna fyrir frumu í staðsetningu (x, y, z).
 * Skilar fjölda lifandi nágranna.
 */
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

/**
 * Uppfærir ástand allra frumna í grindinni eftir reglum Conway's Game of Life.
 * Flytur núverandi ástand yfir á næsta ástand áður en reiknað er.
 */
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
                    nextCellStates[x][y][z] = (neighbors === 5 || neighbors === 6 || neighbors === 7) ? 1 : 0;
                } else {
                    nextCellStates[x][y][z] = neighbors === 6 ? 1 : 0;
                }
            }
        }
    }
}

/**
 * Aðal lykkjan sem uppfærir ástand frumna á 900 millisekúndna fresti.
 * Kallar á sjálfa sig endurtekið eftir hverja uppfærslu.
 */
function gameLoop() {
    updateCellStates();
    tween = 0;
    setTimeout(function() {
        gameLoop();
    }, 2000);
}

/**
 * Teiknar grindina og teningana eftir núverandi ástandi.
 * Kallar á requestAnimFrame til að halda áfram teikningunni í endurteknum ramma.
 */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult( mv, scalem(zoom, zoom, zoom) );
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Tween for smooth transitions (adjusting over time)
    if(tween <= 0.9){
        tween = tween + 0.02;
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
                        mv1 = mult( mv1, scalem( 0.89, 0.89, 0.89 ) );
                    }
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, numVertices);
                } else if (nextCellStates[i][j][k] == 0 && cellStates[i][j][k] == 1 && tween < 0.9) {
                    mv1 = mult( mv1, scalem( 0.9-tween, 0.9-tween, 0.9-tween ) );
                    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
                    gl.drawArrays( gl.TRIANGLES, 0, points.length);
                }
                console.log(nextCellStates[i][j][k]);
            }
        }
    }
    requestAnimFrame(render); // Request the next frame
}
