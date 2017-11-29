#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 64
  //                            // setup bytes 13
  0x04,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x05, 0x00,                   // Address of track 1
  0x19, 0x00,                   // Address of track 2
  0x22, 0x00,                   // Address of track 3

  0x02,                         // Channel 0 entry track (PULSE)
  0x01,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x00,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 5
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 1024 / bytes = 20
  0xFD, 3, 3,                   // REPEAT: count = 3 + 1 / track = 3  (4 * 64 ticks)
  0x4B, 3,                      // FX: ADD TRANSPOSITION: notes = +3
  0xFD, 3, 3,                   // REPEAT: count = 3 + 1 / track = 3  (4 * 64 ticks)
  0x4B, -1,                     // FX: ADD TRANSPOSITION: notes = -1
  0xFD, 3, 3,                   // REPEAT: count = 3 + 1 / track = 3  (4 * 64 ticks)
  0x4B, -2,                     // FX: ADD TRANSPOSITION: notes = -2
  0xFD, 3, 3,                   // REPEAT: count = 3 + 1 / track = 3  (4 * 64 ticks)
  0xFC, 1,                      // GOTO: track = 1

  //"Track 2"                   // ticks = 64 / bytes = 9
  0x00 + 13,                    // NOTE ON: note = 13
  0x40, 32,                     // FX: SET VOLUME: volume = 32
  0x4E, 1, 0x00 + 0x00 + 31,    // SET TREMOLO OR VIBRATO: depth = 1 / retrig = OFF / TorV = TREMOLO / rate = 31
  0x9F + 64,                    // DELAY: 64 ticks
  0xFC, 2,                      // GOTO: track = 2

  //"Track 3"                   // ticks = 64 / bytes = 12
  0x00 + 49,                    // NOTE ON: note = 49
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0x41, -16,                    // FX: VOLUME SLIDE ON: steps = -16
  0x9F + 16,                    // DELAY: 16 ticks
  0x40, 24,                     // FX: SET VOLUME: volume = 24
  0x41, -8,                     // FX: VOLUME SLIDE ON: steps = -8
  0x9F + 48,                    // DELAY: 48 ticks
  0xFE,                         // RETURN

};

#endif