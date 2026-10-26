// microphone = the wave you draw with your voice
// controller = plays notes (and you see the notes as a second wave)
// bars on top = the frequencies in your voice (low on the left, high on the right)
// Keyboard backup: A S D F = notes, arrow keys = move circle
// Click once to start (browser needs permission for the mic)

let mic;
let micFFT; // analyses your microphone
let synthFFT; // analyses the notes we play
let osc;
let started = false;

let x = 300;
let y = 300;
let hue = 0;
let notes = [220, 262, 330, 392]; // A, B, X, Y buttons (Hz)
let trail = []; // remembers past circles


function setup () {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textAlign(CENTER, CENTER);
}

function mousePressed () {
  if (started == false) {
    userStartAudio();

    mic = new p5.AudioIn();
    mic.start();
    micFFT = new p5.FFT(0.9, 512); // 0.9 = extra smooth. The first bands cover the voice range
    micFFT.setInput(mic);

    osc = new p5.Oscillator("triangle");
    osc.amp(0);
    osc.start();
    synthFFT = new p5.FFT(); // listens to everything we play
    synthFFT.setInput(osc);

    started = true;
  }
}

function draw () {
  if (started == false) {
    background(0);
    fill(0, 0, 100);
    noStroke();
    textSize(32);
    text("click to start", width / 2, height / 2);
    return;
  }

  noStroke();
  fill(0, 0, 0, 15);
  rect(0, 0, width, height);

  let volume = mic.getLevel();

  // controller
  let noteHeld = false;
  let pads = navigator.getGamepads();
  let pad = pads[0];
  if (pad) {
    x += pad.axes[0] * 8;
    y += pad.axes[1] * 8;
    for (let i = 0; i < 4; i++) {
      if (pad.buttons[i].pressed) {
        playNote(i);
        noteHeld = true;
      }
    }
  }

  // keyboard backup
  if (keyIsDown(LEFT_ARROW)) x -= 8;
  if (keyIsDown(RIGHT_ARROW)) x += 8;
  if (keyIsDown(UP_ARROW)) y -= 8;
  if (keyIsDown(DOWN_ARROW)) y += 8;

  // 1) your voice: a wave across the middle of the screen
  let micWave = micFFT.waveform();
  noFill();
  stroke(hue, 80, 100);
  strokeWeight(3);
  beginShape();
  for (let i = 0; i < micWave.length; i++) {
    let px = map(i, 0, micWave.length, 0, width);
    let py = map(micWave[i], -1, 1, height * 0.7, height * 0.3);
    vertex(px, py);
  }
  endShape();

  // 2) the notes: a second wave near the bottom
  let synthWave = synthFFT.waveform();
  stroke((hue + 180) % 360, 80, 100);
  beginShape();
  for (let i = 0; i < synthWave.length; i++) {
    let px = map(i, 0, synthWave.length, 0, width);
    let py = map(synthWave[i], -1, 1, height, height * 0.8);
    vertex(px, py);
  }
  endShape();



  // 3) the circle: the louder you are, the bigger it gets
  let size = map(volume, 0, 0.3, 20, 250);
  trail.push({
    x: x,
    y: y,
    size: size,
    hue: hue
  });
  if (trail.length > 250) {
    trail.splice(0, 1);
  }
  noStroke();
  for (let i = 0; i < trail.length; i++) {
    let t = trail[i];
    let fade = map(i, 0, trail.length, 0, 60); // older = more transparent
    let shrink = map(i, 0, trail.length, 0.3, 1); // older = smaller
    fill(t.hue, 90, 100, fade);
    circle(t.x, t.y, t.size * shrink);
  }

  // fade the note out when no button is held
  if (noteHeld == false && keyIsPressed == false) {
    osc.amp(0, 0.2);
  }
}

function playNote (i) {
  switch (i) {
    case 0:
      hue = 0; // red
      break;
    case 1:
      hue = 120; // green
      break;
    case 2:
      hue = 220; // blue
      break;
    case 3:
      hue = 300; // purple
      break;
  }
  osc.freq(notes[i]);
  osc.amp(0.4, 0.05);
}

function keyPressed () {
  if (started) {
    let i = "asdf".indexOf(key);
    if (i != -1) {
      playNote(i);
    }
  }
}

function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}