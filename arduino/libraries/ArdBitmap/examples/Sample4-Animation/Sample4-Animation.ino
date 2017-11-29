
#include <Arduboy.h>
#include "bitmaps.h"

#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))

#define FRAME_RATE 60
#define SHOW_FPS
// make an instance of arduboy used for many functions
Arduboy arduboy;

// make an ArdBitmap instance that will use the given the screen buffer and dimensions
#define ARDBITMAP_SBUF arduboy.getBuffer()
#include <ArdBitmap.h>
ArdBitmap<WIDTH, HEIGHT> ardbitmap;

#ifdef SHOW_FPS

long previousTime = 0;
uint8_t fps = 0, fpsCounter = 0;

#endif


// This function runs once in your game.
// use it for anything that needs to be set only once in your game.
void setup() {
  // initiate arduboy instance
  //arduboy.begin();
  arduboy.beginNoLogo();
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

  //ardbitmap.drawCompressedResized(WIDTH / 2, HEIGHT / 2, BOY[arduboy.frameCount % ARRAY_LEN(BOY)], WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL| MIRROR_VERTICAL, (arduboy.frameCount % 100)/50.0);
  ardbitmap.drawCompressed(WIDTH / 2, HEIGHT / 2, BOY[arduboy.frameCount % ARRAY_LEN(BOY)], WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL| MIRROR_VERTICAL);  

#ifdef SHOW_FPS
    fpsCounter++;
    long actualTime = millis();
    if ((fpsCounter % 30) == 0) {
      if (previousTime != 0) {
        fps = (30 * 1000 / (actualTime - previousTime));
      }
      previousTime = actualTime;
      fpsCounter = 0;
    }

  arduboy.setCursor(116, 4);
  arduboy.print(fps);

 #endif
  
  // then we finaly we tell the arduboy to display what we just wrote to the display
  arduboy.display();
}
