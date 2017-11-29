#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 78 
  //                            // setup bytes 17
  0x06,                         // Number of tracks
  0x00, 0x00,                   // Address of track 0
  0x03, 0x00,                   // Address of track 1
  0x0B, 0x00,                   // Address of track 2
  0x20, 0x00,                   // Address of track 3
  0x24, 0x00,                   // Address of track 4
  0x36, 0x00,                   // Address of track 5
  
  0x01,                         // Channel 0 entry track (PULSE)
  0x00,                         // Channel 1 entry track (SQUARE)
  0x00,                         // Channel 2 entry track (TRIANGLE)
  0x03,                         // Channel 3 entry track (NOISE)

  //"Track 0"                   // ticks = 0 / bytes = 3
  0x40, 0,                      // FX: SET VOLUME: volume = 0
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 1"                   // ticks = 3072 / bytes = 8
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0xFD, 31, 2,                  // REPEAT: count = 31 + 1 / track = 2 (32 * 96 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 96 / bytes = 21
  0x00 + 24,                    // NOTE ON: note = 24
  0x9F + 24,                    // DELAY: 24 ticks
  0x00 + 36,                    // NOTE ON: note = 36
  0x47, 0x43, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +4 +3 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  8,                    // DELAY: 8 ticks
  0x00,                         // NOTE OFF
  0x48,                         // FX: ARPEGGIO OFF
  0x9F + 16,                    // DELAY: 16 ticks
  0x00 + 22,                    // NOTE ON: note = 22
  0x9F + 24,                    // DELAY: 24 ticks
  0x00 + 34,                    // NOTE ON: note = 34
  0x47, 0x43, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +4 +3 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  8,                    // DELAY: 8 ticks
  0x00,                         // NOTE OFF
  0x48,                         // FX: ARPEGGIO OFF
  0x9F + 16,                    // DELAY: 16 ticks
  0xFE,                         // RETURN

  //"Track 3"                   // ticks = 3072 / bytes = 4
  0xFD, 31, 4,                  // REPEAT: count = 31 + 1 / track = 4  (32 * 96 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 4"                   // ticks = 96 / bytes = 18
  0xFD, 1, 5,                   // REPEAT: count = 1 + 1 / track = 5  (24 ticks)
  0x9F + 12,                    // DELAY: 12 ticks
  0xFD, 1, 5,                   // REPEAT: count = 1 + 1 / track = 5  (24 ticks)
  0x9F + 12,                    // DELAY: 12 ticks
  0x49, 4 + 0,                  // FX: RETRIG NOISE: point = 1 (*4) / speed = 0 (fastest)
  0x40, 48,                     // FX: SET VOLUME: volume = 63
  0x42, -8, 1,                  // FX: VOLUME SLIDE ON: steps = -8
  0x9F + 24,                    // DELAY:  24 ticks
  0x4A,                         // FX: RETRIG: off
  0xFE,                         // RETURN

  //"Track 5"                   // ticks = 12 / bytes = 7
  0x40, 48,                     // FX: SET VOLUME: volume = 48
  0x42, -16, 1,                 // FX: VOLUME SLIDE ON: steps = -16 / every 1 ticks
  0x9F + 12,                    // DELAY: 12 ticks
  0xFE,                         // RETURN

};

#endif
