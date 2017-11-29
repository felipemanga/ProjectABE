
#include <Arduboy.h>
#include "bitmaps.h"

#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))

#define FRAME_RATE 24
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
  arduboy.setFrameRate(FRAME_RATE);
}


// our main game loop, this runs once every cycle/frame.
// this is where our game logic goes.
void loop() {
  // pause render until it's time for the next frame
  if (!(arduboy.nextFrame()))
    return;

  // first we clear our screen to black
  arduboy.clear();

  float resize1 = abs(cos(millis()/ 1000.0));
  float resize2 = abs(sin(millis()/ 1000.0));

  ardbitmap.drawCompressedResized(WIDTH/ 4, HEIGHT, BOY[arduboy.frameCount % ARRAY_LEN(BOY)], WHITE, ALIGN_H_CENTER | ALIGN_V_BOTTOM, MIRROR_NONE, resize1); 
  
  ardbitmap.drawCompressedResized((WIDTH * 3) / 4, HEIGHT, BOY[(arduboy.frameCount + 10) % ARRAY_LEN(BOY)], WHITE, ALIGN_H_CENTER | ALIGN_V_BOTTOM, MIRROR_NONE, resize2); 
  
  // then we finaly we tell the arduboy to display what we just wrote to the display
  arduboy.display();
}
