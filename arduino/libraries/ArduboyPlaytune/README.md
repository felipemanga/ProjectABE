# ArduboyPlaytune

The ArduboyPlaytune library is maintained in a git repository hosted on [GitHub](https://github.com/) at:

https://github.com/Arduboy/ArduboyPlaytune

ArduboyPlaytune is based on the [arduino-playtune](https://github.com/LenShustek/arduino-playtune) library written by Len Shustek.

ArduboyPlaytune interprets a sequence of simple commands ("note on", "note off", and "wait") that represents a one or two part musical score without volume modulation. Once the score has started playing, background interrupt routines use the Arduino counters to generate notes in sequence at the right time. Two notes can play simultaneously. A separate open-source project called [midi2tones](https://github.com/MLXXXp/midi2tones) can generate the command sequence from a standard MIDI file.

ArduboyPlaytune can also play individual tones on the second channel, given a frequency and duration. If a score is playing when the *tone()* function is called, the tone will replace any notes assigned to the second channel for the tone's duration. By default, notes on the first channel will continue to play during the tone. By calling function
*toneMutesScore(boolean mute)* with parameter *mute* set to `true`,
the first channel will also be muted during a tone, so only the tone will sound.

Once a score or tone starts playing, all of the processing happens in interrupt routines, so any other "real" program can be running at the same time, as long as it doesn't use the timers or output pins that ArduboyPlaytune is using.

There is no volume modulation. All notes and tones are played as square waves by driving the pins high and low, which makes some scores sound strange. This is definitely not a high-quality synthesizer.

## The Score bytestream

Scores **must** be stored in Flash memory (using PROGMEM), as an array of bytes. E.g.:

```cpp
const byte score[] PROGMEM = {0x90,83, 0,75, 0x80, 0x90,88, 0,225, 0x80, 0xf0};
```

The bytestream is a series of commands that can turn notes on and off, and can start a waiting period until the next note change. Here are the details, with numbers shown in hexadecimal.

If the high-order bit of the byte is 1, then it is one of the following commands:

    9t nn  Start playing note nn on channel t. Channels are numbered
           starting with 0. The notes numbers are the MIDI numbers for the chromatic
           scale, with decimal 60 being Middle C, and decimal 69 being Middle A
           at 440 Hz. The highest note is decimal 127 at about 12,544 Hz.

    8t     Stop playing the note on channel t.

    F0     End of score: stop playing.

    E0     End of score: start playing again from the beginning.

If the high-order bit of the byte is 0, it is a command to wait. The other 7 bits and the 8 bits of the following byte are interpreted as a 15-bit big-endian integer that is the number of milliseconds to wait before processing the next command.

For example,

    07 D0

would cause a wait of 0x07d0 = 2000 decimal milliseconds or 2 seconds. Any tones that were playing before the wait command will continue to play.

## Audio Mute Control

ArduboyPlaytune has the ability to mute the sound output based on a boolean value returned by a provided function. A pointer to this function is passed as a parameter to the ArduboyPlaytune class constructor. The function is called by ArduboyPlaytune to determine whether to actually output sound. If sound is muted, ArduboyPlaytune still goes through the motions of playing scores and tones but it doesn't actually toggle the pins. If muting is not required, a function that just returns `true` should be provided.

The function is called and tested at the point where a note or tone would begin playing. Any sounding notes will continue to play until the current wait time expires. A sounding tone will play for its duration. Sound output won't mute or start in the middle of a score wait or tone duration. Note that the function will be called from within a timer interrupt service routine, at the start of each score note, so it should be as fast as possible.

## Using a single pin

If only one pin is available for sound output (such as with the Arduboy DevKit) it's still possible to play both a score and tones, even though tones are always played on the second channel. This is done by using the same pin number to initialise both channels. The first channel of a score (only) and tones will then both output on the same pin.

When score notes and tones toggle the pin at the same time some very strange sounds are produced. To prevent this, function *toneMutesScore(true)* should be called during initialisation, so the score is muted when a tone is sounding.

## User Interface

Functions in this library, that are available for use by sketches, are documented in file *ArduboyPlaytune.h*

## Arduboy specific information

- If using the [Arduboy2](https://github.com/MLXXXp/Arduboy2) library, *audio.enabled()* is appropriate to use as the *mute* function passed to the ArduboyPlaytune constructor. For example:

```cpp
Arduboy2 arduboy;
ArduboyPlaytune tunes(arduboy.audio.enabled);
```

- The Arduboy2 library defines *PIN_SPEAKER_1* and *PIN_SPEAKER_2* for the speaker pin numbers, which can be used with the *initChannel()* function.

- ArduboyPlaytune uses timer 1, which is also used for PWM on the pins used for the Arduboy's RGB LED. Using ArduboyPlaytune and attempting to control the RGB LED using PWM, such as with *setRGBled()*, may cause problems. Controlling the RGB LED using standard digital I/O, such as with *digitalWriteRGB()*, will work without conflicts.

- For the DevKit, only one pin can be used to drive the speaker, so only the first part in a score can be played. As described above under the _Using a single pin_ heading, both channels can be assigned to the same pin so that tones can also be played. To have a single sketch properly configure for either a production Arduboy or a DevKit, the following code can be used:

```cpp
  // audio setup
  tunes.initChannel(PIN_SPEAKER_1);
#ifndef AB_DEVKIT
  // if not a DevKit
  tunes.initChannel(PIN_SPEAKER_2);
#else
  // if it's a DevKit
  tunes.initChannel(PIN_SPEAKER_1); // use the same pin for both channels
  tunes.toneMutesScore(true);       // mute the score when a tone is sounding
#endif
```

----------

