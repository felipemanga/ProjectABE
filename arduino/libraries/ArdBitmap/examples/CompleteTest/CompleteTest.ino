
#include <Arduboy.h>
#include "bitmaps.h"

#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))

#define SHOW_FPS

#ifdef SHOW_FPS

unsigned long previousTime = 0;
uint8_t fps = 0, fpsCounter = 0;

#endif

unsigned char* bitmap = BITMAP_TEST;
unsigned char* bitmap_c = BITMAP_COMP_TEST;
float resize = 0.6;

uint16_t counter = 0;
uint8_t test_number = 0;
int16_t offset = -WIDTH/2;

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
  arduboy.beginNoLogo();
  //arduboy.boot();
  arduboy.setFrameRate(60);
}


// our main game loop, this runs once every cycle/frame.
// this is where our game logic goes.
void loop() {
  // pause render until it's time for the next frame
  if (!(arduboy.nextFrame()))
    return;
  counter++;
  // first we clear our screen to black
  arduboy.clear();

  long time1 = millis();

    switch (test_number){
      case 0:
        arduboy.setCursor(6, 28);
        arduboy.print(F("UNCOMPRESSED BITMAP"));
      break;
      case 1:
        ardbitmap.drawBitmap(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_NONE);
      break;
      case 2:
        ardbitmap.drawBitmap(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_NONE);
      break;   
      case 3:
        ardbitmap.drawBitmap(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL);
      break;
      case 4:
        ardbitmap.drawBitmap(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL);
      break;
      case 5:
        ardbitmap.drawBitmap(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_VERTICAL);
      break;
      case 6:
        ardbitmap.drawBitmap(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_VERTICAL);
      break;  
      case 7:
        ardbitmap.drawBitmap(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HOR_VER);
      break;
      case 8:
        ardbitmap.drawBitmap(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HOR_VER);
      break;     

      case 9:
        arduboy.setCursor(12, 28);
        arduboy.print(F("COMPRESSED BITMAP"));
      break;  
      case 10:
        ardbitmap.drawCompressed(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_NONE);
      break;
      case 11:
        ardbitmap.drawCompressed(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_NONE);
      break;  
      case 12:
        ardbitmap.drawCompressed(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL);
      break;
      case 13:
        ardbitmap.drawCompressed(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL);
      break;   
      case 14:
        ardbitmap.drawCompressed(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_VERTICAL);
      break;
      case 15:
        ardbitmap.drawCompressed(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_VERTICAL);
      break;   
      case 16:
        ardbitmap.drawCompressed(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HOR_VER);
      break;
      case 17:
        ardbitmap.drawCompressed(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HOR_VER);
      break; 

      case 18:
        arduboy.setCursor(6, 24);
        arduboy.print(F("UNCOMPRESSED BITMAP"));
        arduboy.setCursor(50, 38);
        arduboy.print(F("RESIZE"));
      break;  
      case 19:
        ardbitmap.drawBitmapResized(WIDTH/2, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_NONE, abs(cos(counter/80.0)));
      break;      
      case 20:
        ardbitmap.drawBitmapResized(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_NONE, resize);
      break;    
      case 21:
        ardbitmap.drawBitmapResized(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_NONE, resize);
      break; 
      case 22:
        ardbitmap.drawBitmapResized(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL, resize);
      break;    
      case 23:
        ardbitmap.drawBitmapResized(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL, resize);
      break;    
      case 24:
        ardbitmap.drawBitmapResized(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_VERTICAL, resize);
      break;    
      case 25:
        ardbitmap.drawBitmapResized(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_VERTICAL, resize);
      break; 
      case 26:
        ardbitmap.drawBitmapResized(offset, HEIGHT/2, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HOR_VER, resize);
      break;    
      case 27:
        ardbitmap.drawBitmapResized(WIDTH/2, offset, bitmap, 128, 64, WHITE, ALIGN_CENTER, MIRROR_HOR_VER, resize);
      break;                                                                         

      case 28:
        arduboy.setCursor(12, 24);
        arduboy.print(F("COMPRESSED BITMAP"));
        arduboy.setCursor(50, 38);
        arduboy.print(F("RESIZE"));
      break; 
      case 29:
        ardbitmap.drawCompressedResized(WIDTH/2, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_NONE, abs(cos(counter/50.0)));
      break;     
      case 30:
        ardbitmap.drawCompressedResized(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_NONE, resize);
      break;         
      case 31:
        ardbitmap.drawCompressedResized(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_NONE, resize);
      break;  
      case 32:
        ardbitmap.drawCompressedResized(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL, resize);
      break;     
      case 33:
        ardbitmap.drawCompressedResized(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HORIZONTAL, resize);
      break;   
      case 34:
        ardbitmap.drawCompressedResized(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_VERTICAL, resize);
      break;     
      case 35:
        ardbitmap.drawCompressedResized(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_VERTICAL, resize);
      break; 
      case 36:
        ardbitmap.drawCompressedResized(offset, HEIGHT/2, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HOR_VER, resize);
      break;     
      case 37:
        ardbitmap.drawCompressedResized(WIDTH/2, offset, bitmap_c, WHITE, ALIGN_CENTER, MIRROR_HOR_VER, resize);
      break; 
      
      case 38:
        arduboy.setCursor(12, 24);
        arduboy.print(F("COMPRESSED BITMAP"));
        arduboy.setCursor(36, 38);
        arduboy.print(F("ANIMATION"));
      break;       
      case 39:
        ardbitmap.drawCompressed(WIDTH/2, HEIGHT, DOG[(time1/80)%ARRAY_LEN(DOG)], WHITE, ALIGN_H_CENTER | ALIGN_V_BOTTOM, MIRROR_NONE);
      break;    
      
      case 40:
        arduboy.setCursor(12, 24);
        arduboy.print(F("COMPRESSED BITMAP"));
        arduboy.setCursor(15, 38);
        arduboy.print(F("RESIZE ANIMATION"));
      break;                                   
      case 41:
        ardbitmap.drawCompressedResized(WIDTH/2, HEIGHT, DOG[(time1/80)%ARRAY_LEN(DOG)], WHITE, ALIGN_H_CENTER | ALIGN_V_BOTTOM, MIRROR_HORIZONTAL, abs(cos(counter/50.0)));
      break;  
           
      default:
        arduboy.setCursor(44, 28);
        arduboy.print(F("TEST OK"));

      break;
    }

  offset++;
  if (offset > (WIDTH * 3) /2){
    offset = -WIDTH/2;
    test_number++;
  }

  time1 = millis() - time1;
#ifdef SHOW_FPS
    fpsCounter++;
    unsigned long actualTime = millis();
    if ((fpsCounter % 30) == 0) {
      if (previousTime != 0) {
        fps = (30 * 1000 / (actualTime - previousTime));
      }
      previousTime = actualTime;
      fpsCounter = 0;
    }

  arduboy.setCursor(96, 4);
  arduboy.print(fps);
  arduboy.print(F("fps"));  

  arduboy.setCursor(96, 56);
  arduboy.print(time1);  
  arduboy.print(F(" ms"));  

 #endif

  // then we finaly we tell the arduboy to display what we just wrote to the display
  arduboy.display();
}
