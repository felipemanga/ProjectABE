#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {
  0x03,               // Number of tracks
  0x00, 0x00,         // Address of track 0
  0x09, 0x00,         // Address of track 1
  0x0C, 0x00,         // Address of track 2

  0x02,               // Channel 0 entry track
  0x01,               // Channel 1 entry track
  0x01,               // Channel 2 entry track
  0x01,               // Channel 3 entry track

  //"Track 0"
  0x00 + 26,          // NOTE ON: note = 26
  0x9F + 16,          // DELAY: ticks = 16
  0x00 + 30,          // NOTE ON: note = 30
  0x9F + 16,          // DELAY: ticks = 16
  0x00 + 28,          // NOTE ON: note = 28
  0x9F + 16,          // DELAY: ticks = 16
  0x00 + 23,          // NOTE ON: note = 23
  0x9F + 16,          // DELAY: ticks = 16
  0xFE,               // RETURN

  //"Track 1"
  0x40, 0,            // FX: SET VOLUME: volume = 0
  0x9F,               // FX: STOP CURRENT CHANNEL

  //"Track 2"
  0x9D, 25,           // SET song tempo: value = 25
  0x9E, 2, 1, 1, 1,   // FX: GOTO advanced: ch0 = 0x02 / ch1 = 0x01 / ch2 = 0x01 / ch3 = 0x01
  0x40, 48,           // FX: SET VOLUME: volume = 48
  0x41, -4,           // FX: VOLUME SLIDE ON: steps = -4
  0xFC, 0,            // GOTO track 0
  0x9F,               // FX: STOP CURRENT CHANNEL

};



#endif
