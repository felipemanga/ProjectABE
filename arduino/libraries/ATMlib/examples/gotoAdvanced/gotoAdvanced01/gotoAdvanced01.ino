#include <Arduino.h>
#include <Arduboy2.h>
#include <ATMlib.h>
#include "bitmaps.h"
#include "song.h"


Arduboy2Base arduboy;
Sprites sprites;
ATMsynth ATM;

void setup() {
  arduboy.begin();
  // set the framerate of the game at 60 fps
  arduboy.setFrameRate(60);
  // let's make sure the sound was not muted in a previous sketch
  arduboy.audio.on();
  // Initializes ATMSynth and samplerate
  // Begin playback of song.
  ATM.play(music);
}

void loop() {

  if (!(arduboy.nextFrame())) return;
  arduboy.pollButtons();
  arduboy.clear();
  sprites.drawSelfMasked(34, 4, T_arg, 0);
  if (arduboy.justPressed(B_BUTTON)) ATM.playPause();
  if (arduboy.justPressed(A_BUTTON)) ATM.playPause();
  arduboy.display();
}
