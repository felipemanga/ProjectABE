#ifndef SONG_H
#define SONG_H

#define Song const uint8_t PROGMEM

Song music[] = {                // total song in bytes = 40 
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

  //"Track 1"                   // ticks = 2048 / bytes = 8
  0x9D, 50,                     // SET song tempo: value = 50
  0x40, 63,                     // FX: SET VOLUME: volume = 63
  0xFD, 7, 2,                   // REPEAT: count = 7 + 1 / track = 2  (8 * 256 ticks)
  0x9F,                         // FX: STOP CURRENT CHANNEL

  //"Track 2"                   // ticks = 256 / bytes = 18
  0x00 +  36,                   // NOTE ON: note = 36
  0x47, 0x43, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +4 +3 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  64,                   // DELAY: ticks = 64
  0x47, 0x34, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +3 +4 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  64,                   // DELAY: ticks = 64
  0x47, 0x25, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +2 +5 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  64,                   // DELAY: ticks = 64
  0x47, 0x34, 0x00 + 0x00 + 0,  // FX: ARPEGGIO ON: notes =  +3 +4 / don't play third note = OFF / ritrigger = OFF / ticks = 0
  0x9F +  64,                   // DELAY: ticks = 64
  0xFE,                         // RETURN

};

#endif
