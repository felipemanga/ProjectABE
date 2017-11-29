#include <Arduboy2.h>
#include <ArdVoice.h>
#include "voices.h"
#include "bitmaps.h"

#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))

Arduboy2 arduboy;
ArdVoice ardvoice;
#define ARDBITMAP_SBUF arduboy.getBuffer()
#include <ArdBitmap.h>
ArdBitmap<WIDTH, HEIGHT> ardbitmap;
unsigned long initTime;

int voice_segment = 0;
boolean onePlayed = false;
boolean twoPlayed = false;
boolean threePlayed = false;
boolean merryPlayed = false;

void setup() {
	arduboy.begin();
  arduboy.invert(!arduboy.audio.enabled());
	arduboy.setFrameRate(60);
  initTime = millis();
}


void loop() {
	if (!(arduboy.nextFrame()))
		return;

  arduboy.clear();
  unsigned long myTime = (millis()-initTime);
  float resize1 = abs(sin((millis()-initTime)/ (1000.0/(PI))));
  float resize2 = abs(sin((millis()-initTime - 3000)/ (4000.0/(PI))));
  float resize3 = abs(sin((millis()-initTime - 7000)/ (8000.0/(PI))));

  if (myTime < 7000){
    setContrast((myTime > 3000 ? resize2 :resize1) * 255);
    ardbitmap.drawCompressedResized(WIDTH / 2, HEIGHT / 2, myTime < 1000 ?  NUMBER_3 :
    myTime < 2000 ?  NUMBER_2 :
    myTime < 3000 ?  NUMBER_1 :
    MERRY_CHRISTMAS , WHITE, ALIGN_CENTER, MIRROR_NONE, myTime > 3000 ? resize2 :resize1);
 
  } else {

    int contrast = resize3 * 255;
    setContrast(contrast);
    ardbitmap.drawCompressedResized(WIDTH/2, HEIGHT, DOG[ (myTime/80)% ARRAY_LEN(DOG)], WHITE, ALIGN_H_CENTER | ALIGN_V_BOTTOM, MIRROR_NONE, resize3 );  

  }

  //VOICES
  if (myTime > 250 && !threePlayed){
    threePlayed = true;
    ardvoice.playVoice(three_q6);
  }

  if (myTime > 1250 && !twoPlayed){
    twoPlayed = true;
    ardvoice.playVoice(two_q6);
  }

  if (myTime > 2300 && !onePlayed){
    onePlayed = true;
    ardvoice.playVoice(one_q6);
  }

  if (myTime > 3200){
  
  if(!ardvoice.isVoicePlaying()) {
    switch(voice_segment){
      case 0:
        ardvoice.playVoice(merry_q6);
        voice_segment++;
        break;
      case 1:
        ardvoice.playVoice(merry_q6, 4400, 0, 1.0);
        voice_segment++;
        break;  
      case 2:
        ardvoice.playVoice(merry_q6, 4400, 13500, 0.8);
        voice_segment++;
        break; 
      case 3:
        ardvoice.playVoice(merry_q6, 4400, 11500, 1.3);
        voice_segment++;
        break;     
      case 4:
        ardvoice.playVoice(merry_q6, 11500, 13500, 1.4);
        voice_segment++;
        break;        
      default:
      break;
      }
    }
  }

  //Reset demo
  if(arduboy.pressed(A_BUTTON) || arduboy.pressed(B_BUTTON)){
    initTime = millis();
    voice_segment = 0;
    onePlayed = false;
    twoPlayed = false;
    threePlayed = false;
    merryPlayed = false;
  }
  if(arduboy.pressed(UP_BUTTON)){
    arduboy.audio.on();
    arduboy.invert(false);
  }
  if(arduboy.pressed(DOWN_BUTTON)){
    arduboy.audio.off();
    arduboy.invert(true);
  }

  arduboy.display();
}



void setContrast(uint8_t contrast){

  arduboy.LCDCommandMode();
  SPI.transfer(0xd9);                                                     
  SPI.transfer(0x2f);                                                     
  SPI.transfer(0xdb);                                                     
  SPI.transfer(0x00);       
    
  SPI.transfer(0x81); // contrast command
  SPI.transfer(contrast);
  arduboy.LCDDataMode();
}

