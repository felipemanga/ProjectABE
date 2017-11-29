#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 50
  //                            // setup bytes 13
  0x04,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x03, 0x00,                   // Address of track 1
  0x0B, 0x00,                   // Address of track 2
  0x1C, 0x00,                   // Address of track 3
  
  0x01,                         // Channel 0 entry track (PULSE)
  0x00,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x00,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 3
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 2048 / bytes = 8
  0x9D, 25,                     // SET song tempo: value = 25
  0x40, 48,                     // FX: SET VOLUME: volume = 48
  0xFD, 7, 2,                   // REPEAT: count = 7 + 1 / track = 2  (8 * 256 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 256 / bytes = 17
  0xFC, 3,                      // GOTO: track = 3  (64 ticks)
  0x4C, -5,                     // FX: SET TRANSPOSITION: notes = -5
  0xFC, 3,                      // GOTO: track = 3  (64 ticks)
  0x4C, -3,                     // FX: SET TRANSPOSITION: notes = -3
  0xFC, 3,                      // GOTO: track = 3  (64 ticks)
  0x4C, -1,                     // FX: SET TRANSPOSITION: notes = -1
  0xFC, 3,                      // GOTO: track = 3  (64 ticks)
  0x4C, 0,                      // FX: SET TRANSPOSITION: notes = 0
  0xFE,                         // RETURN

  //"Track 3"                   // ticks = 64 / bytes = 9
  0x41, -4,                     // FX: VOLUME SLIDE ON: steps = -4
  0x00 + 37,                    // NOTE ON: note = 37
  0x9F + 16,                    // DELAY: ticks = 16
  0x00 + 41,                    // NOTE ON: note = 41
  0x9F + 16,                    // DELAY: ticks = 16
  0x00 + 44,                    // NOTE ON: note = 44
  0x9F + 16,                    // DELAY: ticks = 16
  0xFE,                         // RETURN

};

#endif
