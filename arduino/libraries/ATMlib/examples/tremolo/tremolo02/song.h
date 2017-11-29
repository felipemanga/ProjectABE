#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 61
  //                            // setup bytes 19
  0x07,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x03, 0x00,                   // Address of track 1
  0x09, 0x00,                   // Address of track 2
  0x0D, 0x00,                   // Address of track 3
  0x11, 0x00,                   // Address of track 4
  0x1E, 0x00,                   // Address of track 5
  0x22, 0x00,                   // Address of track 5
  
  0x02,                         // Channel 0 entry track (PULSE)
  0x01,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x00,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 3
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 2048 / bytes = 6
  0x9D, 50,                     // SET song tempo: value = 50
  0xFD, 31, 3,                  // REPEAT: count = 32 / track = 2  (32 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 2048 / bytes = 4
  0xFD, 31, 5,                  // REPEAT: count = 32 / track = 5  (32 * 64 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 3"                   // ticks = 64 / bytes = 4
  0x00 + 49,                    // NOTE ON: note = 22
  0xFC, 4,                      // GOTO: track = 3 (64 ticks)
  0xFE,                         // RETURN

  //"Track 4"                   // ticks = 64 / bytes = 13
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0x41, -16,                    // FX: VOLUME SLIDE ON: steps = -16
  0x9F + 16,                    // DELAY: 16 ticks
  0x40, 32,                     // FX: SET VOLUME: volume = 32
  0x41, -8,                     // FX: VOLUME SLIDE ON: steps = -8
  0x9F + 4,                     // DELAY: 4 ticks
  0x43,                         // FX: VOLUME SLIDE OFF
  0x9F + 43,                    // DELAY: 44 ticks
  0xFE,                         // RETURN

  //"Track 5"                   // ticks = 64 / bytes = 4
  0x00 + 13,                    // NOTE ON: note = 23
  0xFC, 6,                      // GOTO: track = 3 (64 ticks)
  0xFE,                         // RETURN

  //"track 6"                   // ticks = 64 / bytes = 8
  0x40, 32,                     // FX: SET VOLUME: volume = 32
  0x4E, 1, 0x00 + 30,           // SET TREMOLO: depth = 16 / retrig = OFF / rate = 3
  0x9F + 64,                    // DELAY: 64 ticks
  0x4F,                         // TREMOLO OFF

  0xFE,                         // RETURN



};

#endif
