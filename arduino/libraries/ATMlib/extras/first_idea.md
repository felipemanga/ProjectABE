So our tracker player should have:

song = how much channels are used, speed, repeat song at position x (0 = no repeat), order of patterns to be played
pattern = length of the pattern?,instrument, note, volume?, effect, (every channel has it's own pattern. In a classic mod, all channels are included in the same pattern)
instrument = or the sample, or the synth instrument (with an optional indication of which portion of the sample can be repeated to hold a sustained note)

We need people who can actually help creating such a player.
```

Song ={3, 64, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 3, 3, 3, 4, 4, 4}

patterns channel1 = { pattern1ch1, pattern2ch1, pattern3ch1, pattern4ch1}
patterns channel2 = { pattern1ch2, pattern2ch2, pattern3ch2, pattern4ch2}
patterns channel3 = { pattern1ch3, pattern2ch3, pattern3ch3, pattern4ch3}

pattern1ch1[64] = {5448, 5801, 3d16, 0024, 0000, 404b, 1400, 0c00, ...}
pattern1ch2[0] = {}
pattern1ch2[4] = {2c00, 3600, 2600, 3500, ..}

instrument 1 = ..
instrument 2 = ..
instrument 3 = ..
instrument 4 = ..
instrument 5 = ..
```

