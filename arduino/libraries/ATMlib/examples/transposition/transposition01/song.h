#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 37
                                // setup bytes 11
  0x03,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x03, 0x00,                   // Address of track 1
  0x0B, 0x00,                   // Address of track 2

  
  0x01,                         // Channel 0 entry track (PULSE)
  0x00,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x00,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 3
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 1216 / bytes = 8
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0xFD, 18, 2,                  // REPEAT: count = 18 + 1 / track = 2 (19 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 64 / bytes = 15
  0x00 +  1,                    // NOTE ON: note = 1
  0x9F +  4,                    // DELAY: ticks = 4
  0x00,                         // NOTE OFF
  0x9F +  4,                    // DELAY: ticks = 4
  0x00 +  5,                    // NOTE ON: note = 5
  0x9F +  4,                    // DELAY: ticks = 4
  0x00,                         // NOTE OFF
  0x9F +  4,                    // DELAY: ticks = 4
  0x00 +  8,                    // NOTE ON: note = 8
  0x9F +  4,                    // DELAY: ticks = 4
  0x00,                         // NOTE OFF
  0x9F +  44,                   // DELAY: ticks = 44
  0x4B, 3,                      // FX: ADD TRANSPOSITION: notes = 3
  0xFE,                         // RETURN
};

#endif
