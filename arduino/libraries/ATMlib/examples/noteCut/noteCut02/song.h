#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 29
  //                            // setup bytes 11
  0x03,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x05, 0x00,                   // Address of track 1
  0x0F, 0x00,                   // Address of track 2
  
  0x01,                         // Channel 0 entry track (PULSE)
  0x00,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x00,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 5
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 2048 / bytes = 10
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0x41, -2,                     // FX: VOLUME SLIDE ON: steps = -2
  0x54, 0,                      // FX: NOTE CUT: ticks  = 0 between switching note ON and note OFF
  0xFD, 31, 2,                  // REPEAT: count = 31 + 1 / track = 2 (32 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 64 / bytes = 3
  0x00 + 37,                    // NOTE ON: note = 37
  0x9F + 64,                    // DELAY: ticks = 64
  0xFE,                         // RETURN
};

#endif
