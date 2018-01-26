parsers export should be a function that accepts an open serialport as the first argument. and option options as the second.

the parser object should be an event emitter

if should expose a public send method that takes data,and callback arguments.
an optional middle options arguments may be necessary

all other protocol command implementation should be done in another file.

