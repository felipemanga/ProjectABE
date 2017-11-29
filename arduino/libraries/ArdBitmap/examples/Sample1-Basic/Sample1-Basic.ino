
#include <Arduboy.h>
#include "bitmaps.h"

// make an instance of arduboy used for many functions
Arduboy arduboy;

// make an ArdBitmap instance that will use the given the screen buffer and dimensions
#define ARDBITMAP_SBUF arduboy.getBuffer()
#include <ArdBitmap.h>
ArdBitmap<WIDTH, HEIGHT> ardbitmap;

// This function runs once in your game.
// use it for anything that needs to be set only once in your game.
void setup() {
  // initiate arduboy instance
  arduboy.begin();
  arduboy.setFrameRate(60);
}


// our main game loop, this runs once every cycle/frame.
// this is where our game logic goes.
void loop() {
  // pause render until it's time for the next frame
  if (!(arduboy.nextFrame()))
    return;

  // first we clear our screen to black
  arduboy.clear();

  ardbitmap.drawCompressed(WIDTH / 2 ,HEIGHT / 2, BOY, WHITE, ALIGN_CENTER, MIRROR_NONE);

  // then we finaly we tell the arduboy to display what we just wrote to the display
  arduboy.display();
}
