var canvas;
var gl;

var mouseX;               // Old value of x-coordinate  
var movement = false;     // Do we move the paddle?
var mouseBufferId;        // Buffer fyrir byssuna
var birdBufferId;         // Buffer fyrir fuglana
var skotBufferId;         // Buffer fyrir skot
var vPosition;
var speed = Math.random();

var skot = [];
var birds = [];
var numBirds = Math.floor(Math.random() * 15) + 5; // Velur fjölda fugla á bilinu 5 til 15
var maxBirds = 10;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Hnit fyrir byssuna
    var mouseVertices = [
        vec2(-0.1, -0.9),  // Bottom left
        vec2(0.0, -0.7),   // Top center
        vec2(0.1, -0.9)    // Bottom right 
    ];

    // Initialize empty bird vertices for the buffer
    var emptyBirdVertices = new Float32Array(numBirds * 8);

    // Býr til buffer fyrir byssu
    mouseBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mouseVertices), gl.DYNAMIC_DRAW);

    // Býr til buffer fyrir fuglana
    birdBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, birdBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, emptyBirdVertices, gl.DYNAMIC_DRAW); // Tómur buffer fyrir fuglana

    // Býr til buffer fyrir skotin
    skotBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skotBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW); // Tómur buffer fyrir skot

    // Tengir shader við breytur
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        mouseX = e.offsetX;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            var xmove = 2 * (e.offsetX - mouseX) / canvas.width;
            mouseX = e.offsetX;
            for (let i = 0; i < 3; i++) {
                mouseVertices[i][0] += xmove;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(mouseVertices));
        }
    });

    // búa til keyevent fyrir bilstöngina
    window.addEventListener("keydown", function (e) {
        if (e.code == "Space") {
            if (skot.length < 3) {
                skot.push({
                    x: mouseVertices[1][0], // Byggir á miðpunkti byssunnar
                    y: -0.7,               // Byrjar rétt fyrir ofan byssuna
                    speed: 0.02            // Hraði skotsins
                });
            }
        }
    })

    birds = generateBirds(numBirds);
    render();
};

//VERKEFNI
//DONE
// Fleiri en einn fugl er á flugi á sama tíma og þeir eru á mismunandi hraða og í
// mismunandi hæð

//búa til hnit fyrir skotin
//búa til buttonevent fyrir skotin
// spilari ítir á bil til að skjóta

// • Hægt er að vera með meira en eitt skot (t.d. 3-5) í gangi á sama tíma (þ.e. hægt að
// skjóta nýju skoti þó annað skot sé þegar í loftinu).


//OPTIONAL / IN PROGRESS
// • Halda utanum skotna fugla með því að setja "strik" efst í gluggann. Þegar komin eru 5
// strik þá er leiknum lokið

//TODO

//búa til collision á fuglunum og skotinu
//þegar skot hittir fugl þá hverfur fuglinn
//láta nýjan fugl byrtast eftir ákveðinn tíma


function generateBirds(count) {
    let newBirds = [];
    for (let i = 0; i < count; i++) {
        newBirds.push({
            x: Math.random() * 2 - 1,  // x-staðsetning á bilinu -1 til 1
            y: Math.random() * 0.8 + 0.1, // y-staðsetning á bilinu 0.1 til 0.9 (ofar á skjánum)
            speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.3 ? 1 : -1) // hraði, þar sem sumir fara til vinstri
        });
    }
    return newBirds;
}

function checkForCollisions() {
    skot.forEach((shot, shotIndex) => {
        birds.forEach((bird, birdIndex) => {
            // Skilgreina mörk fyrir skot og fugl
            let shotLeft = shot.x - 0.01;
            let shotRight = shot.x + 0.01;
            let shotBottom = shot.y;
            let shotTop = shot.y + 0.1;

            let birdLeft = bird.x - 0.03;
            let birdRight = bird.x + 0.03;
            let birdBottom = bird.y - 0.01;
            let birdTop = bird.y + 0.04;

            // tékkar á árekstri, athugar hvort mörkin skarast
            if (
                shotRight > birdLeft &&
                shotLeft < birdRight &&
                shotTop > birdBottom &&
                shotBottom < birdTop
            ) {
                // Fjarlægjir fugl og skot ef árekstur á sér stað
                skot.splice(shotIndex, 1);
                birds.splice(birdIndex, 1);

                // Bæta nýjum fugli við ef það eru færri en hámarki fugla
                if (birds.length < maxBirds) {
                    birds.push(...generateBirds(1)); // Bætir einum nýjum fugli við
                    console.log("new birdy")
                }
            }
        });
    });
}

// Teiknar fuglana
function drawBird() {
    birds.forEach((bird, index) => {
        bird.x += bird.speed;
        
        // Fer yfir á hina hliðina þegar fugl fer út fyrir canvas
        if (bird.x > 1.1) bird.x = -1.1;
        if (bird.x < -1.1) bird.x = 1.1;

        // Hnit fyrir hvern fugl miðað við staðsetningu hans
        var birdVertices = [
            vec2(bird.x - 0.03, bird.y - 0.01),   // Bottom left
            vec2(bird.x - 0.03, bird.y + 0.04),  // Top left
            vec2(bird.x + 0.03, bird.y + 0.04),  // Top right
            vec2(bird.x + 0.03, bird.y - 0.01)    // Bottom right
        ];

        // Uppfæra fuglahnitin í buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, birdBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * 8 * Float32Array.BYTES_PER_ELEMENT, flatten(birdVertices));
    });

    // Teikna alla fugla eftir að búið er að uppfæra bufferinn
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < birds.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4); // Teikna hvern fugl
    }
}

function drawGun() {
    // Teikna byssuna (óbreyttur kóði)
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawShots() {
    // Uppfærir og teiknar skotin
    skot.forEach((shot, index) => {
        shot.y += shot.speed;
        // Fjarlægir skot ef það fer út fyrir skjáinn
        if (shot.y > 1.0) {
            skot.splice(index, 1);
            return;
        }
        var skotVertices = [
            vec2(shot.x - 0.01, shot.y ),
            vec2(shot.x - 0.01, shot.y + 0.1),
            vec2(shot.x + 0.01, shot.y + 0.1),
            vec2(shot.x + 0.01, shot.y)
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, skotBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(skotVertices));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        console.log("pew pew")
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGun();
    drawBird();
    drawShots();
    checkForCollisions();
    
    setTimeout(function () {
        requestAnimationFrame(render);
    }, speed);
}