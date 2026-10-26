// microphone = the wave you draw with your voice
// controller = plays notes (and you see the notes as a second wave)
// sparkles = appear when you are loud
// Controller: A B X Y = notes, left stick = move, D-pad up / down = octave
// Click once to start. Allow the microphone when the browser asks.
// variables
let mic;
let micAmp; // measures how loud the mic is (new p5.sound library)
let micFFT; // analyses your microphone
let synthFFT; // analyses the notes we play
let osc;
let started = false;

let x = 500; // circle position
let y = 300;
let colorHue = 0; // current colour (0 - 360)

let notes = [220, 262, 330, 392]; // A, B, X, Y buttons (Hz)
let octaveNumber = 0;
let octaveMultiplier = 1;
let dpadUpWas = false;
let dpadDownWas = false;

const TRAIL_LENGTH = 250;
let trailX = []; // the trail is 4 arrays that act like a loop
let trailY = [];
let trailSize = [];
let trailHue = [];

//setup
function setup () {
  createCanvas(1000, 600);
  colorMode(HSB, 360, 100, 100, 100);
  textAlign(CENTER, CENTER);

  // fill the arrays with starting values
  for (let i = 0; i < TRAIL_LENGTH; i++) {
    trailX[i] = x;
    trailY[i] = y;
    trailSize[i] = 0;
    trailHue[i] = 0;
  }
}

// start
function startEverything () {
  userStartAudio();

  mic = new p5.AudioIn();
  mic.disconnect(); // do not play the mic through the speakers
  mic.start();
  micFFT = new p5.FFT(512);
  mic.connect(micFFT);
  micAmp = new p5.Amplitude();
  mic.connect(micAmp);

  osc = new p5.Oscillator("triangle");
  osc.amp(0);
  osc.start();
  synthFFT = new p5.FFT();
  osc.connect(synthFFT);

  started = true;
}

function mousePressed () {
  if (started == false) {
    startEverything();
  }
}

//draw
function draw () {
  if (started == false) {
    background(0);
    fill(0, 0, 100);
    noStroke();
    textSize(32);
    text("click to start", width / 2, height / 2);
  } else {
    drawGarden();
  }
}

function drawGarden () {
  // dark see through layer so old drawings fade slowly
  noStroke();
  fill(0, 0, 0, 15);
  rect(0, 0, width, height);

  let volume = micAmp.getLevel();

  //controller
  let noteHeld = false;
  let pads = navigator.getGamepads();
  let pad = pads[0];
  if (pad) {
    let stickX = pad.axes[0];
    let stickY = pad.axes[1];
    // dead zone: ignore tiny stick movements so the circle does not drift
    if (stickX > -0.15 && stickX < 0.15) {
      stickX = 0;
    }
    if (stickY > -0.15 && stickY < 0.15) {
      stickY = 0;
    }
    x += stickX * 8;
    y += stickY * 8;

    // D-pad up / down changes the octave (once per press)
    let dpadUp = pad.buttons[12].pressed;
    let dpadDown = pad.buttons[13].pressed;
    if (dpadUp && dpadUpWas == false) {
      octaveUp();
    }
    if (dpadDown && dpadDownWas == false) {
      octaveDown();
    }
    dpadUpWas = dpadUp;
    dpadDownWas = dpadDown;

    // A, B, X, Y = buttons 0, 1, 2, 3
    for (let i = 0; i < 4; i++) {
      if (pad.buttons[i].pressed) {
        playNote(i);
        noteHeld = true;
      }
    }
  }

  // border lock: keep the circle on the screen
  if (x < 0) {
    x = 0;
  }
  if (x > width) {
    x = width;
  }
  if (y < 0) {
    y = 0;
  }
  if (y > height) {
    y = height;
  }

  //1) your voice: a wave across the middle
  let micWave = micFFT.waveform();
  noFill();
  stroke(colorHue, 80, 100);
  strokeWeight(3);
  beginShape();
  for (let i = 0; i < micWave.length; i++) {
    let px = map(i, 0, micWave.length, 0, width);
    let py = map(micWave[i], -1, 1, height * 0.7, height * 0.3);
    vertex(px, py);
  }
  endShape();

  //2) the notes: a second wave near the bottom
  let synthWave = synthFFT.waveform();
  stroke((colorHue + 180) % 360, 80, 100);
  beginShape();
  for (let i = 0; i < synthWave.length; i++) {
    let px = map(i, 0, synthWave.length, 0, width);
    let py = map(synthWave[i], -1, 1, height, height * 0.8);
    vertex(px, py);
  }
  endShape();

  //3) sparkles when you are loud
  if (volume > 0.01) {
    for (let i = 0; i < 30; i++) {
      stroke(random(360), 60, 100);
      strokeWeight(random(2, 7));
      point(random(width), random(height));
    }
  }

  // 4) the circle with a long trail
  // write into one slot of the arrays, and go round and round with %
  let slot = frameCount % TRAIL_LENGTH;
  trailX[slot] = x;
  trailY[slot] = y;
  trailSize[slot] = map(volume, 0, 0.3, 20, 250);
  trailHue[slot] = colorHue;

  noStroke();
  for (let k = 0; k < TRAIL_LENGTH; k++) {
    // k = 0 is the oldest circle, k = last is the newest
    let i = (slot + 1 + k) % TRAIL_LENGTH;
    let fade = map(k, 0, TRAIL_LENGTH, 0, 60);
    let shrink = map(k, 0, TRAIL_LENGTH, 0.3, 1);
    fill(trailHue[i], 90, 100, fade);
    ellipse(trailX[i], trailY[i], trailSize[i] * shrink, trailSize[i] * shrink);
  }

  //info text
  noStroke();
  fill(0, 0, 100, 70);
  textSize(20);
  text("octave: " + octaveNumber, width / 2, height - 20);

  //fade the note out when nothing is held
  if (noteHeld == false) {
    osc.amp(0, 0.2);
  }
}

//notes 
function playNote (i) {
  switch (i) {
    case 0:
      colorHue = 0; // red
      break;
    case 1:
      colorHue = 120; // green
      break;
    case 2:
      colorHue = 220; // blue
      break;
    case 3:
      colorHue = 300; // purple
      break;
  }
  osc.freq(notes[i] * octaveMultiplier);
  osc.amp(0.4, 0.05);
}

function octaveUp () {
  if (octaveNumber < 2) {
    octaveNumber++;
    octaveMultiplier *= 2;
  }
}

function octaveDown () {
  if (octaveNumber > -2) {
    octaveNumber--;
    octaveMultiplier /= 2;
  }
}