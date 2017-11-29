/*
   Copyright (C) 2016 Ignacio Vina (@igvina)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


// ArdVoice: version 0.1

#include "ArdVoice.h"

//#define SAMPLES 180
// 7812,5 ticks/s vs 8000 Hz -> 175,78

#define SAMPLES 176

//Could be size 10 but 16 is faster for % op
#define BUFFER_SIZE 16
uint8_t soundBuffer[BUFFER_SIZE]; 

const uint8_t *voiceName;
//MAX coeffs 10
uint8_t numberOfCoeffs;
int16_t coeffs[10];

uint8_t samplesMod;

int16_t gain;
uint8_t pitchPeriod;

uint8_t sample_count = 1;
uint8_t sample1 = 0xFF;

   
int16_t biasOffset;
uint16_t beat;
uint16_t beat_lenght;  


ArdVoice::ArdVoice(){};

void ArdVoice::playVoice(const uint8_t *audio){
  playVoice(audio, 0, 0, 1.0);
}

void ArdVoice::playVoice(const uint8_t *audio, uint16_t startTime, uint16_t endTime, float speed){


  if (!isSoundInit){
    isSoundInit = true;
/*
  The Arduboy2 library, or equivalent, will control the mode of the
  speaker pins itself, in order to handle muting.
  If the ArdVoice library is used where another library or sketch doesn't
  control the speaker pins, uncomment the following two lines.
*/
//    pinMode(PIN_SPEAKER_1, OUTPUT);
//    pinMode(PIN_SPEAKER_2, OUTPUT);

    TCCR4A = 0b01000010;    // Fast-PWM 8-bit
    TCCR4B = 0b00000001;    // 62500Hz
    // It is faster, but generates an annoying noise/buzz
    //TCCR4B = 0b00000010;    // 62500Hz / 4
    OCR4C  = 0xFF;          // Resolution to 8-bit (TOP=0xFF)
    OCR4A  = 0x80;
    OCR4A = 127;
  }

  voiceName = audio;

  byte readedByte = pgm_read_byte(&voiceName[1]);
    
  uint16_t chunks = ((readedByte & 0x0F) << 8) | (pgm_read_byte(&voiceName[0]) & 0xFF);

  numberOfCoeffs = (readedByte >> 4) & 0x0F;
  beat = (startTime * 2/*8*/) / /*180*/45;
  sample1=0;
  sample_count=1;
  samplesMod = (uint8_t)(SAMPLES * speed);
  beat_lenght =  endTime == 0 ?  chunks :  (endTime * 2/*8*/) / /*180*/45;

  //Init timer
  TIMSK4 = 0b00000100; 
}


//Timer
ISR(TIMER4_OVF_vect){
  
  sample_count--;
  
  if(sample1 != 0xFF){          
    if(sample_count == 0){
      // Should be sample_count = 8, but it's slow to process
      sample_count = 4; 
      // Read LPC coeffs on first sample
      if (sample1 == 0){
        // Reset buffer
        memset(soundBuffer, 127, BUFFER_SIZE);
        // Get array offset
        uint16_t offset = 2 + beat * (2 + numberOfCoeffs);
        beat++;

        // Check if voice ended
        if(beat > beat_lenght){
          // Stop timer and return
          OCR4A = 127;
          TIMSK4 = 0;   
          sample1 = 0xFF;
          return;
      }

      byte readedByte = pgm_read_byte(&voiceName[offset]);
    
      pitchPeriod = readedByte & 0xb10000000; 
    
      if (pitchPeriod == 0){
        pitchPeriod = (readedByte & 0xFF) + 20;
      } else {
        pitchPeriod = 0;
      }
      
      gain = ((pgm_read_byte(&voiceName[offset+1])& 0xFF));; 
      biasOffset = 64;
      
      for (uint8_t  i = 0; i < numberOfCoeffs ; i++){
        readedByte = pgm_read_byte(&voiceName[offset + 2 + i]);
      
        if ((readedByte & 0b10000000) == 0){
          coeffs[i] =((readedByte & 0xFF) - 64);
        } else{
          coeffs[i] = (((64 * 64) / ((readedByte & 0b01111111) - 64 )));
        }  
        //TIP: Faster to precalculate
        biasOffset += coeffs[i];
      }
      biasOffset *= 127;
    }

    // Get next sample
    
    int16_t temp = pitchPeriod == 0 ? 
      gain * ((fastRand8())-127):
      (sample1 % pitchPeriod) == 0 ? gain * 127: 0;

    uint8_t sampleOffset = sample1 % BUFFER_SIZE;
 
    for (uint8_t i = 0; i < numberOfCoeffs; i++) {
      temp -= coeffs[i] * ((soundBuffer[(sampleOffset- i + BUFFER_SIZE - 1)%BUFFER_SIZE] & 0xFF));
    }
      
    temp = (temp + biasOffset) / 64;
    // Fix out of range values
    temp = temp < 0 ? 0 : temp > 255 ? 255 : temp; 

    OCR4A = soundBuffer[sampleOffset] = temp & 0xFF;
      
    sample1++;

    // Jump to next beat
    if (sample1 == samplesMod) sample1 = 0;
    }
  }
} 

void  ArdVoice::stopVoice(){
  OCR4A = 127;
  TIMSK4 = 0;   
  sample1 = 0xFF;
}

boolean  ArdVoice::isVoicePlaying(){
  return sample1 != 0xFF;
}

uint8_t fastRand8() {
  static uint8_t state[STATE_BYTES] = { 0x87, 0xdd, 0xdc, 0x10, 0x35, 0xbc, 0x5c };
  static uint16_t c = 0x42;
  static unsigned int i = 0;
  uint16_t t;
  uint8_t x;

  x = state[i];
  t = (uint16_t)x * MULT_LO + c;
  c = t >> 8;

#if MULT_HI
  c += x;
#endif

  x = t & 255;
  state[i] = x;
  if (++i >= sizeof(state))
    i = 0;
  return x;
}


