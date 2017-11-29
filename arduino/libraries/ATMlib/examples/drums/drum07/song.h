#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 55
  //                            // setup bytes 17
  0x06,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x03, 0x00,                   // Address of track 1
  0x09, 0x00,                   // Address of track 2
  0x10, 0x00,                   // Address of track 3
  0x19, 0x00,                   // Address of track 4
  0x1D, 0x00,                   // Address of track 5
  
  0x01,                         // Channel 0 entry track (PULSE)
  0x00,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x04,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 3
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 2048 / bytes = 6
  0x9D, 50,                     // SET song tempo: value = 50
  0xFD, 31, 2,                  // REPEAT: count = 31 + 1 / track = 2 (32 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 64 / bytes = 7
  0xFC, 3,                      // GOTO: track = 3                    ( 4 ticks)
  0x9F + 12,                    // DELAY: ticks = 12                  (12 ticks)
  0xFC, 3,                      // GOTO: track = 3                    ( 4 ticks)
  0x9F + 44,                    // DELAY: ticks = 44                  (44 ticks)
  0xFE,                         // RETURN

  //"Track 3"                   // ticks = 4 / bytes = 9
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0x00 + 1,                     // NOTE ON: note = 1
  0x41, -16,                    // FX: VOLUME SLIDE ON: steps = -16
  0x9F + 4,                     // DELAY: ticks = 4
  0x43,                         // FX: VOLUME SLIDE OFF
  0x00,                         // NOTE OFF
  0xFE,                         // RETURN

  //"Track 4"                   // ticks = 2048 / bytes = 4
  0xFD, 31, 5,                  // REPEAT: count = 31 + 1 / track = 5 (32 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 5"                   // ticks = 64 / bytes = 9
  0x9F + 32,                    // DELAY: ticks = 32
  0x40, 32,                     // FX: SET VOLUME: volume = 32
  0x41, -2,                     // FX: VOLUME SLIDE ON: steps = -2
  0x9F + 16,                    // DELAY: ticks = 16
  0x43,                         // FX: VOLUME SLIDE OFF
  0x9F + 16,                    // DELAY: ticks = 16
  0xFE,                         // RETURN
};

#endif
