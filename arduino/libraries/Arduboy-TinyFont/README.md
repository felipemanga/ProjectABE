# Arduboy-TinyFont  
Tiny 4x4 Font for Arduboy which contains the small ASCII Table from 32 to 127.  
The sprite for the font uses 192 bytes.  
The last character 127 is supposed to bel `DEL` but i used it as a placeholder (■) for not found characters.  

![Preview](https://github.com/yinkou/Arduboy-TinyFont/blob/master/bitmaps/tinyfont-preview.png?raw=true "Font Preview")

## Usage:
Make an instance of `Tinyfont` and initialize it with a screenbuffer with corresponding sizes.  
Call `print()` with you c-string and position to draw text to the screen.

#### Sample:
```cpp  
Tinyfont tinyfont = Tinyfont(arduboy.sBuffer, Arduboy2::width(), Arduboy2::height());
tinyfont.setCursor(0, 0);
tinyfont.print("The quick brown fox jumps\nover the lazy dog.");  
```

## Dependencies:
Subclass of Arduino `Print`.

## Customization:
You can adjust `letterSpacing` and `lineHeight`.

#### Custom characters:
You can add custom characters above 127 (up to index 255) by using the `4x4font.png` as base.  
Edit the file (or the .psd) in an image editor of your choice. But be sure to always append 8x8 pixels at the end which you can fill as you like.
Throw the new .png through a image converter and replace the sprite in `TinyfontSprite.c` with your new data.

## Optimization:
I'm pretty sure this can be optimized since it takes a lot of space.

#### Arduboy2::print()
`Sketch uses 7902 bytes (27%) of program storage space`

#### Tinyfont::print()
`Sketch uses 8834 bytes (30%) of program storage space.`

#### Both:
`Sketch uses 8918 bytes (30%) of program storage space`


## Table
**dec**|**hex**|**symbol**
:-----:|:-----:|:-----:
32|20|(space)
33|21|!
34|22|"
35|23|#
36|24|$
37|25|%
38|26|&
39|27|'
40|28|(
41|29|)
42|2A|*
43|2B|+
44|2C|;
45|2D|-
46|2E|.
47|2F|/
48|30|0
49|31|1
50|32|2
51|33|3
52|34|4
53|35|5
54|36|6
55|37|7
56|38|8
57|39|9
58|3A|:
59|3B|"
60|3C|<
61|3D|=
62|3E|>
63|3F|?
64|40|@
65|41|A
66|42|B
67|43|C
68|44|D
69|45|E
70|46|F
71|47|G
72|48|H
73|49|I
74|4A|J
75|4B|K
76|4C|L
77|4D|M
78|4E|N
79|4F|O
80|50|P
81|51|Q
82|52|R
83|53|S
84|54|T
85|55|U
86|56|V
87|57|W
88|58|X
89|59|Y
90|5A|Z
91|5B|[
92|5C|\
93|5D|]
94|5E|^
95|5F|\_
96|60|`
97|61|a
98|62|b
99|63|c
100|64|d
101|65|e
102|66|f
103|67|g
104|68|h
105|69|i
106|6A|j
107|6B|k
108|6C|l
109|6D|m
110|6E|n
111|6F|o
112|70|p
113|71|q
114|72|r
115|73|s
116|74|t
117|75|u
118|76|v
119|77|w
120|78|x
121|79|y
122|7A|z
123|7B|{
124|7C|\\|
125|7D|}
126|7E|~
127|7F|■
