var canvas;
var gl;
var renderId;

var mouseX;               // Old value of x-coordinate  
var movement = false;     // Do we move the paddle?
var mouseBufferId;        // Buffer fyrir byssuna
var birdBufferId;         // Buffer fyrir fuglana
var skotBufferId;         // Buffer fyrir skot
var vPosition;
var speed = Math.random();

let stig = "";
let fuglar = 0;
var skot = [];
var birds = [];
var numBirds = 4;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.6, 0.6, 0.8, 1.2);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Hnit fyrir byssuna
    var mouseVertices = [
        vec2(-0.1, -0.9),  // Bottom left
        vec2(0.0, -0.7),   // Top center
        vec2(0.1, -0.9)    // Bottom right 
    ];
    
    // Tengir shader við breytur
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
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
            if (skot.length < 4) {
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

//Athugar árekstur hjá fugli og skots
function checkForCollisions() {
    for (let i = 0; i < skot.length; i++) {
        let shot = skot[i];
        for (let j = 0; j < birds.length; j++) {
            let bird = birds[j];
            // Skilgreina mörk fyrir skot og fugl
            let shotLeft = shot.x - 0.01;
            let shotRight = shot.x + 0.01;
            let shotBottom = shot.y;
            let shotTop = shot.y + 0.1;

            let birdLeft = bird.x - 0.03;
            let birdRight = bird.x + 0.03;
            let birdBottom = bird.y - 0.01;
            let birdTop = bird.y + 0.04;

            // Tékkar á árekstri, athugar hvort mörkin skarast
            if (
                shotRight > birdLeft &&
                shotLeft < birdRight &&
                shotTop > birdBottom &&
                shotBottom < birdTop
            ) {
                // Fjarlægjir fugl og skot ef árekstur á sér stað
                skot.splice(i, 1);
                birds.splice(j, 1);
                console.log("bird hit")

                stig+= "| ";
                fuglar++;
                document.getElementById("stig").innerText = `Fuglar: ${stig}`;

                if (fuglar >= numBirds) {
                    endGame();
                    return;
                }
                i--; // Lækka i til að taka tillit til þess að eitt skot var fjarlægt
                break; // Stöðva lykkjuna þegar árekstur er fundinn
            }
        }
    }
}

//Fall sem endar leikinn
function endGame() {
    cancelAnimationFrame(renderId);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const message = `Leik lokið! \n Þú hefur skotið ${numBirds} fugla.`;
    console.log(message);

    // Búa til HTML element fyrir skilaboð
    const leikLokið = document.createElement('div');
    leikLokið.className = 'leikLokið';
    leikLokið.innerText = message;
    document.body.appendChild(leikLokið);

    const newGame = "Nýr leikur";
    const button = document.createElement('button');
    button.className = 'newGame';
    button.innerText = newGame;
    document.body.appendChild(button);

    button.addEventListener('click', function() {
        startGame()
    })
}

function startGame() {
    location.reload();
}

// Teiknar fuglana
function drawBird() {
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
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
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 8 * Float32Array.BYTES_PER_ELEMENT, flatten(birdVertices));
    };

    // Teikna alla fugla eftir að búið er að uppfæra bufferinn
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < birds.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4); // Teikna hvern fugl
    }
}

//Teiknar byssuna
function drawGun() {
    // Teikna byssuna (óbreyttur kóði)
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Teiknar skotin
function drawShots() {
    // Uppfærir og teiknar skotin
    for (let i = 0; i < skot.length; i++) {
        let shot = skot[i];
        shot.y += shot.speed;
        // Fjarlægir skot ef það fer út fyrir skjáinn
        if (shot.y > 1.0) {
            skot.splice(i, 1);
            i--;
            continue;
        }
        
        var skotVertices = [
            vec2(shot.x - 0.001, shot.y ),
            vec2(shot.x - 0.001, shot.y + 0.05),
            vec2(shot.x + 0.01, shot.y + 0.05),
            vec2(shot.x + 0.01, shot.y)
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, skotBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(skotVertices));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        console.log("pew pew")
    };
}

// Aðal Animation fallið
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGun();
    drawBird();
    drawShots();
    checkForCollisions();
    
    setTimeout(function () {
        renderId = requestAnimationFrame(render);
    }, speed);
}


//VERKEFNI og Geymdur kóði
//DONE
// Fleiri en einn fugl er á flugi á sama tíma og þeir eru á mismunandi hraða og í
// mismunandi hæð

//búa til hnit fyrir skotin
//búa til buttonevent fyrir skotin
// spilari ítir á bil til að skjóta

// • Hægt er að vera með meira en eitt skot (t.d. 3-5) í gangi á sama tíma (þ.e. hægt að
// skjóta nýju skoti þó annað skot sé þegar í loftinu).

//búa til collision á fuglunum og skotinu
//þegar skot hittir fugl þá hverfur fuglinn

// • Halda utanum skotna fugla með því að setja "strik" efst í gluggann. Þegar komin eru 5
// strik þá er leiknum lokið


//GEYMA KÓÐA
// var maxBirds = 10;
// // Bæta nýjum fugli við ef það eru færri en hámarki fugla
// if (birds.length < maxBirds) {
//     birds.push(...generateBirds(1)); // Bætir einum nýjum fugli við
//     console.log("new birdy");
// }

// Math.floor(Math.random() * 15) + 5; // Velur fjölda fugla á bilinu 5 til 15
