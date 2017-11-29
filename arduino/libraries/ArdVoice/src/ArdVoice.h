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

#ifndef ARDVOICE_H
#define ARDVOICE_H

#include <Arduino.h>

#define PIN_SPEAKER_1 5  /**< The pin number of the first lead of the speaker */
#define PIN_SPEAKER_2 13 /**< The pin number of the second lead of the speaker */


//Fast pseudoo-random number generator, it's ok for noise
#define STATE_BYTES 7
#define MULT 0x13B /* for STATE_BYTES==6 only */
#define MULT_LO (MULT & 255)
#define MULT_HI (MULT & 256)

uint8_t fastRand8();
  
class ArdVoice
{
  public:
    ArdVoice();
    void playVoice(const uint8_t *audio);
    void playVoice(const uint8_t *audio, uint16_t startTime, uint16_t endTime, float speed);
    void stopVoice();
    boolean isVoicePlaying();
  private:
    boolean isSoundInit = false;

};



#endif
