#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 33
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

  //"Track 1"                   // ticks = 3072 / bytes = 8
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0xFD, 31, 2,                  // REPEAT: count = 31 + 1 / track = 2 (32 * 96 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track2"                    // ticks = 96 / bytes = 11
  0x00 + 25,                    // NOTE ON: note = 25
  0x52, 0x80  + 2,              // FX: SET GLISSANDO: ticks = 2;
  0x9F + 32,                    // DELAY: 32 ticks
  0x52, 0x00  + 2,              // FX: SET GLISSANDO: ticks = 2;
  0x9F + 32,                    // DELAY: 32 ticks
  0x53,                         // FX: GLISSANDO OFF
  0x00,                         // NOTE OFF
  0x9F + 32,                    // DELAY: 32 ticks
  0xFE,                         // RETURN

};

#endif
