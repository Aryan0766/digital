// microphone = the wave you draw with your voice
// controller = plays notes (and you see the notes as a second wave)
// sparkles = appear when you are loud
// circle in the middle = grows when you are loud
// Controller: A B X Y = notes, D-pad up / down = octave
// Click once to start allows the microphone when the browser asks.
// variables
let mic;
let micAmp; // measures how loud the mic
let micFFT; // analyse your microphone
let synthFFT; // analyses the notes we play
let osc;
let started = false;

let circleSize = 20; // size of the circle in the middle
let colorHue = 0; // current colour

let notes = [220, 262, 330, 392]; // A, B, X, Y buttons (Hz)
let octaveNumber = 0;
let octaveMultiplier = 1;
let dpadUpWas = false;
let dpadDownWas = false;

//setup
function setup () {
  createCanvas(1000, 600);
  colorMode(HSB, 360, 100, 100, 100);
  textAlign(CENTER, CENTER);

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
  if (started === false) {
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
  // dark see through layer so old drawings fade quickly
  noStroke();
  fill(0, 0, 0, 40);
  rect(0, 0, width, height);

  let volume = micAmp.getLevel();

  // the circle in the middle: the louder you are, the bigger it gets
  let targetSize = map(volume, 0, 0.05, 20, 250);
  circleSize = circleSize * 0.8 + targetSize * 0.2; // move 20% of the way each frame = smooth
  noStroke();
  fill(colorHue, 90, 100, 80);
  ellipse(width / 2, height / 2, circleSize, circleSize);

  //controller
  let noteHeld = false;
  let pads = navigator.getGamepads();
  let pad = pads[0];
  if (pad) {
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

  //1) voice: a wave across the middle
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

  //2) notes: a second wave near the bottom
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
  if (volume > 0.02) {
    for (let i = 0; i < 30; i++) {
      stroke(random(360), 60, 100);
      strokeWeight(random(2, 7));
      point(random(width), random(height));
    }
  }

  //info text
  noStroke();
  fill(0, 0, 100, 70);
  textSize(20);
  text("octave: " + octaveNumber, width / 2, height - 20);

  //fade the note out when nothing is held
  if (noteHeld == false) {
    osc.amp(0, 2);
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