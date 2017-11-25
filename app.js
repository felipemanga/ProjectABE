(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":4}],3:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = { bind: bind, inject: inject, getInstanceOf: getInstanceOf, getPolicy: getPolicy };

/*

Welcome to DRY-DI.

*/

var knownInterfaces = [];
var interfaces = {};
var concretions = {};

var context = [{}];

var Ref = function () {
    function Ref(provider, ifid, scope) {
        _classCallCheck(this, Ref);

        this.ifid = ifid;
        this.count = provider.dependencyCount;
        this.dependencyCount = provider.dependencyCount;
        this.scope = scope;

        this.binds = {};
        this.injections = null;
        this.provider = provider;

        var pslot = scope[ifid] || (scope[ifid] = new Slot());

        if (provider.injections) {
            this.injections = {};
            Object.assign(this.injections, provider.injections);

            for (var key in this.injections) {
                var _ifid = this.injections[key];
                var slot = scope[_ifid] || (scope[_ifid] = new Slot());
                slot.addInjector(this);
            }
        }

        pslot.addProvider(this);
    }

    _createClass(Ref, [{
        key: "bindInjections",
        value: function bindInjections(injections) {
            var _this = this;

            injections.forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    clazz = _ref2[0],
                    _interface = _ref2[1];

                var key = knownInterfaces.indexOf(_interface);
                var injection = injections[key];

                if (!(key in _this.binds)) {
                    var ifid = _this.injections[key];
                    _this.scope[_this.ifid].removeInjector(_this);
                    _this.satisfy();
                    _this.dependencyCount--;
                }

                _this.binds[key] = clazz;
            });
        }
    }, {
        key: "satisfy",
        value: function satisfy() {

            this.count--;

            if (this.count == 0) this.scope[this.ifid].addViable();
        }
    }]);

    return Ref;
}();

var Slot = function () {
    function Slot() {
        _classCallCheck(this, Slot);

        this.viableProviders = 0;
        this.providers = [];
        this.injectors = [];
    }

    _createClass(Slot, [{
        key: "addInjector",
        value: function addInjector(ref) {

            this.injectors.push(ref);
            if (this.viableProviders > 0) ref.satisfy();
        }
    }, {
        key: "removeInjector",
        value: function removeInjector(ref) {

            var index = this.injectors.indexOf(ref);
            if (index > -1) this.injectors.splice(index, 1);
        }
    }, {
        key: "addProvider",
        value: function addProvider(ref) {

            this.providers.push(ref);
            if (ref.count == 0) this.addViable();
        }
    }, {
        key: "addViable",
        value: function addViable() {

            this.viableProviders++;
            if (this.viableProviders == 1) {

                var injectors = this.injectors;
                for (var i = 0, l = injectors.length; i < l; ++i) {
                    injectors[i].satisfy();
                }
            }
        }
    }, {
        key: "getViable",
        value: function getViable(clazz, tags, multiple) {

            if (this.viableProviders == 0) {
                if (!multiple) throw new Error("No viable providers for " + clazz + ". #126");
                return [];
            }

            var ret = multiple ? [] : null;

            var mostViable = null;
            var maxPoints = -1;
            notViable: for (var i = 0, c; c = this.providers[i]; ++i) {
                if (c.count) continue;
                var points = c.dependencyCount;
                if (tags && c.tags) {
                    for (var tag in tags) {
                        if (c.tags[tag] !== tags[tag]) continue notViable;
                        points++;
                    }
                }
                if (multiple) ret[ret.length] = c.provider.policy.bind(c.provider, c.binds);else {
                    if (points > maxPoints) {
                        maxPoints = points;
                        mostViable = c;
                    }
                }
            }

            if (!multiple) {
                if (!mostViable) throw new Error("No viable providers for " + clazz + ". Tag mismatch.");

                return mostViable.provider.policy.bind(mostViable.provider, mostViable.binds);
            } else return ret;
        }
    }]);

    return Slot;
}();

function registerInterface(ifc) {

    var props = {},
        currifc = void 0;

    if (typeof ifc == "function") currifc = ifc.prototype;else if ((typeof ifc === "undefined" ? "undefined" : _typeof(ifc)) == "object") currifc = ifc;

    while (currifc && currifc !== Object.prototype) {

        var names = Object.getOwnPropertyNames(ifc.prototype);

        for (var i = 0, l = names.length; i < l; ++i) {
            var name = names[i];

            if (!props[name]) props[name] = _typeof(ifc.prototype[name]);
        }

        currifc = currifc.prototype;
    }

    var len = knownInterfaces.length;
    interfaces[len] = props;
    knownInterfaces[len] = ifc;

    return len;
}

var Provide = function () {
    function Provide() {
        _classCallCheck(this, Provide);

        this.injections = null;
        this.dependencyCount = 0;
        this.clazz = null;
        this.ctor = null;
        this.binds = null;

        // default policy is to create a new instance for each injection
        this.policy = function (binds, args) {
            return new this.ctor(binds, args);
        };
    }

    _createClass(Provide, [{
        key: "clone",
        value: function clone() {

            var ret = new Provide();

            ret.injections = this.injections;
            ret.dependencyCount = this.dependencyCount;
            ret.clazz = this.clazz;
            ret.policy = this.policy;
            ret.ctor = this.ctor;
            ret.binds = this.binds;

            return ret;
        }
    }, {
        key: "bindInjections",
        value: function bindInjections(injections) {

            var binds = this.binds = this.binds || [];
            var bindCount = this.binds.length;

            injections.forEach(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    clazz = _ref4[0],
                    _interface = _ref4[1];

                for (var i = 0; i < bindCount; ++i) {
                    if (binds[i][0] == clazz) return;
                }
                binds[binds.length] = [clazz, _interface];
            });

            return this;
        }
    }, {
        key: "getRef",
        value: function getRef(ifid, _interface) {

            var map = interfaces[ifid],
                clazz = this.clazz;

            for (var key in map) {
                if (_typeof(clazz.prototype[key]) == map[key]) continue;
                throw new Error("Class " + clazz.name + " can't provide to interface " + _interface.name + " because " + key + " is " + _typeof(clazz[key]) + " instead of " + map[key] + ".");
            }

            return new Ref(this, ifid, context[context.length - 1]);
        }
    }, {
        key: "setConcretion",
        value: function setConcretion(clazz) {

            this.clazz = clazz;
            if (typeof clazz == "function") {
                this.ctor = function (_clazz) {
                    _inherits(_class, _clazz);

                    function _class(binds, args) {
                        var _ref5;

                        _classCallCheck(this, _class);

                        return _possibleConstructorReturn(this, (_ref5 = _class.__proto__ || Object.getPrototypeOf(_class)).call.apply(_ref5, [this].concat(_toConsumableArray(args))));
                    }

                    return _class;
                }(clazz);
                // this.ctor.prototype = Object.create(clazz.prototype);
            } else {
                this.policy = function () {
                    return clazz;
                };
            }

            var cid = knownInterfaces.indexOf(clazz);
            if (cid == -1) cid = registerInterface(clazz);

            if (!concretions[cid]) concretions[cid] = [this];else concretions[cid].push(this);

            return this;
        }
    }, {
        key: "factory",
        value: function factory() {

            this.policy = function (binds, args) {
                var THIS = this;

                return function () {
                    for (var _len = arguments.length, args2 = Array(_len), _key = 0; _key < _len; _key++) {
                        args2[_key] = arguments[_key];
                    }

                    return new THIS.ctor(binds, args.concat(args2));
                };
            };

            return this;
        }
    }, {
        key: "singleton",
        value: function singleton() {

            var instance = null;
            this.policy = function (binds, args) {

                if (instance) return instance;

                instance = Object.create(this.ctor.prototype);
                instance.constructor = this.ctor;
                this.ctor.call(instance, binds, args);

                // new (class extends this.ctor{
                //     constructor( args ){
                //         instance = this; // cant do this :(
                //         super(args);
                //     }
                // }

                return instance;
            };

            return this;
        }
    }]);

    return Provide;
}();

function bind(clazz) {

    var cid = knownInterfaces.indexOf(clazz);
    if (cid == -1) {
        cid = registerInterface(clazz);
    }

    var providers = concretions[cid];
    var localProviders = [];

    if (!providers) {

        if (clazz && clazz["@inject"]) inject(clazz["@inject"]).into(clazz);else new Provide().setConcretion(clazz);

        providers = concretions[cid];
    }

    localProviders = providers.map(function (partial) {
        return partial.clone();
    });

    var refs = [];
    var tags = null;
    var ifid = void 0;

    var partialBind = {
        to: function to(_interface) {

            var ifid = knownInterfaces.indexOf(_interface);
            if (ifid == -1) ifid = registerInterface(_interface);

            localProviders.forEach(function (provider) {

                var ref = provider.getRef(ifid, _interface);
                ref.tags = tags;
                refs.push(ref);
            });

            return this;
        },

        withTags: function withTags(tags) {
            refs.forEach(function (ref) {
                return ref.tags = tags;
            });
            return this;
        },

        singleton: function singleton() {
            localProviders.forEach(function (provider) {
                return provider.singleton();
            });
            return this;
        },
        factory: function factory() {
            localProviders.forEach(function (provider) {
                return provider.factory();
            });
            return this;
        },
        inject: function inject(map) {
            return this.injecting(map);
        },
        injecting: function injecting() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            refs.forEach(function (ref) {
                return ref.bindInjections(args);
            });
            localProviders.forEach(function (provider) {
                return provider.bindInjections(args);
            });
            return this;
        }

    };

    return partialBind;
}

var Inject = function () {
    function Inject(dependencies) {
        _classCallCheck(this, Inject);

        this.dependencies = dependencies;
        var tags = this.tags = {};
        for (var key in dependencies) {
            tags[key] = {};
        }
    }

    _createClass(Inject, [{
        key: "into",
        value: function into(clazz) {

            var cid = knownInterfaces.indexOf(clazz);
            if (cid == -1) cid = registerInterface(clazz);

            var injections = {},
                map = this.dependencies,
                dependencyCount = 0,
                tags = this.tags,
                multiple = {};

            for (var key in map) {

                var _interface = map[key];
                var dependency = _interface;
                if (Array.isArray(dependency)) {

                    _interface = _interface[0];
                    for (var i = 1; i < dependency.length; ++i) {

                        if (typeof dependency[i] == "string") tags[key][dependency[i]] = true;else if (Array.isArray(dependency[i])) multiple[key] = true;else if (dependency[i]) Object.assign(tags[key], dependency[i]);
                    }
                }

                var ifid = knownInterfaces.indexOf(_interface);

                if (ifid == -1) ifid = registerInterface(_interface);

                injections[key] = ifid;

                dependencyCount++;
            }

            var provider = new Provide().setConcretion(clazz),
                proto = clazz.prototype;
            var providers = concretions[cid];

            provider.injections = injections;
            provider.dependencyCount = dependencyCount;

            provider.ctor = function (binds, args) {
                resolveDependencies(binds, this);
                clazz.apply(this, args);
            };
            provider.ctor.prototype = Object.create(clazz.prototype);
            provider.ctor.prototype.constructor = clazz;

            // provider.ctor = class extends clazz {
            //     constructor( args ){
            //         resolveDependencies( this ); // *sigh*
            //         super(...args);
            //     }
            // };

            function resolveDependencies(binds, obj) {
                var slotset = context[context.length - 1];
                for (var _key3 in injections) {
                    if (binds && injections[_key3] in binds) {
                        obj[_key3] = binds[injections[_key3]];
                        continue;
                    }

                    var slot = slotset[injections[_key3]];
                    var policy = slot.getViable(_key3, tags[_key3], multiple[_key3]);
                    if (!multiple[_key3]) obj[_key3] = policy([]);else {
                        var out = obj[_key3] = [];
                        for (var _i2 = 0; _i2 < policy.length; ++_i2) {
                            out[_i2] = policy[_i2]([]);
                        }
                    }
                }
            }
        }
    }]);

    return Inject;
}();

function inject(dependencies) {

    return new Inject(dependencies);
}

function getInstanceOf(_interface) {
    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key4 = 1; _key4 < _len3; _key4++) {
        args[_key4 - 1] = arguments[_key4];
    }

    // let ifid = knownInterfaces.indexOf( _interface );
    // let slot = context[ context.length-1 ][ ifid ];

    // if( !slot )
    //     throw new Error("No providers for " + (_interface.name || _interface) + ". #467");

    // let policy = slot.getViable( _interface.name || _interface );

    // return policy.call( null, args );
    return getPolicy({ _interface: _interface, args: args });
}

function getPolicy(desc) {
    desc = desc || {};
    if (!desc._interface) throw new Error("Policy descriptor has no interface.");
    var name = desc._interface.name || desc._interface;
    var tags = desc.tags;
    var multiple = desc.multiple;
    var args = desc.args;

    var ifid = knownInterfaces.indexOf(desc._interface);
    var slot = context[context.length - 1][ifid];

    if (!slot) throw new Error("No providers for " + name + ". #467");

    var policy = slot.getViable(name, tags, multiple);
    if (args) {
        if (multiple) policy = policy.map(function (p) {
            return p.call(null, args);
        });else policy = policy.call(null, args);
    }
    return policy;
}

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (global,Buffer){
/*!

JSZip v3.1.5 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/
!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.JSZip=a()}}(function(){return function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){"use strict";var d=a("./utils"),e=a("./support"),f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";c.encode=function(a){for(var b,c,e,g,h,i,j,k=[],l=0,m=a.length,n=m,o="string"!==d.getTypeOf(a);l<a.length;)n=m-l,o?(b=a[l++],c=l<m?a[l++]:0,e=l<m?a[l++]:0):(b=a.charCodeAt(l++),c=l<m?a.charCodeAt(l++):0,e=l<m?a.charCodeAt(l++):0),g=b>>2,h=(3&b)<<4|c>>4,i=n>1?(15&c)<<2|e>>6:64,j=n>2?63&e:64,k.push(f.charAt(g)+f.charAt(h)+f.charAt(i)+f.charAt(j));return k.join("")},c.decode=function(a){var b,c,d,g,h,i,j,k=0,l=0,m="data:";if(a.substr(0,m.length)===m)throw new Error("Invalid base64 input, it looks like a data url.");a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");var n=3*a.length/4;if(a.charAt(a.length-1)===f.charAt(64)&&n--,a.charAt(a.length-2)===f.charAt(64)&&n--,n%1!==0)throw new Error("Invalid base64 input, bad content length.");var o;for(o=e.uint8array?new Uint8Array(0|n):new Array(0|n);k<a.length;)g=f.indexOf(a.charAt(k++)),h=f.indexOf(a.charAt(k++)),i=f.indexOf(a.charAt(k++)),j=f.indexOf(a.charAt(k++)),b=g<<2|h>>4,c=(15&h)<<4|i>>2,d=(3&i)<<6|j,o[l++]=b,64!==i&&(o[l++]=c),64!==j&&(o[l++]=d);return o}},{"./support":30,"./utils":32}],2:[function(a,b,c){"use strict";function d(a,b,c,d,e){this.compressedSize=a,this.uncompressedSize=b,this.crc32=c,this.compression=d,this.compressedContent=e}var e=a("./external"),f=a("./stream/DataWorker"),g=a("./stream/DataLengthProbe"),h=a("./stream/Crc32Probe"),g=a("./stream/DataLengthProbe");d.prototype={getContentWorker:function(){var a=new f(e.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new g("data_length")),b=this;return a.on("end",function(){if(this.streamInfo.data_length!==b.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),a},getCompressedWorker:function(){return new f(e.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},d.createWorkerFrom=function(a,b,c){return a.pipe(new h).pipe(new g("uncompressedSize")).pipe(b.compressWorker(c)).pipe(new g("compressedSize")).withStreamInfo("compression",b)},b.exports=d},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(a,b,c){"use strict";var d=a("./stream/GenericWorker");c.STORE={magic:"\0\0",compressWorker:function(a){return new d("STORE compression")},uncompressWorker:function(){return new d("STORE decompression")}},c.DEFLATE=a("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(a,b,c){"use strict";function d(){for(var a,b=[],c=0;c<256;c++){a=c;for(var d=0;d<8;d++)a=1&a?3988292384^a>>>1:a>>>1;b[c]=a}return b}function e(a,b,c,d){var e=h,f=d+c;a^=-1;for(var g=d;g<f;g++)a=a>>>8^e[255&(a^b[g])];return a^-1}function f(a,b,c,d){var e=h,f=d+c;a^=-1;for(var g=d;g<f;g++)a=a>>>8^e[255&(a^b.charCodeAt(g))];return a^-1}var g=a("./utils"),h=d();b.exports=function(a,b){if("undefined"==typeof a||!a.length)return 0;var c="string"!==g.getTypeOf(a);return c?e(0|b,a,a.length,0):f(0|b,a,a.length,0)}},{"./utils":32}],5:[function(a,b,c){"use strict";c.base64=!1,c.binary=!1,c.dir=!1,c.createFolders=!0,c.date=null,c.compression=null,c.compressionOptions=null,c.comment=null,c.unixPermissions=null,c.dosPermissions=null},{}],6:[function(a,b,c){"use strict";var d=null;d="undefined"!=typeof Promise?Promise:a("lie"),b.exports={Promise:d}},{lie:58}],7:[function(a,b,c){"use strict";function d(a,b){h.call(this,"FlateWorker/"+a),this._pako=null,this._pakoAction=a,this._pakoOptions=b,this.meta={}}var e="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,f=a("pako"),g=a("./utils"),h=a("./stream/GenericWorker"),i=e?"uint8array":"array";c.magic="\b\0",g.inherits(d,h),d.prototype.processChunk=function(a){this.meta=a.meta,null===this._pako&&this._createPako(),this._pako.push(g.transformTo(i,a.data),!1)},d.prototype.flush=function(){h.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},d.prototype.cleanUp=function(){h.prototype.cleanUp.call(this),this._pako=null},d.prototype._createPako=function(){this._pako=new f[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var a=this;this._pako.onData=function(b){a.push({data:b,meta:a.meta})}},c.compressWorker=function(a){return new d("Deflate",a)},c.uncompressWorker=function(){return new d("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:59}],8:[function(a,b,c){"use strict";function d(a,b,c,d){f.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=b,this.zipPlatform=c,this.encodeFileName=d,this.streamFiles=a,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}var e=a("../utils"),f=a("../stream/GenericWorker"),g=a("../utf8"),h=a("../crc32"),i=a("../signature"),j=function(a,b){var c,d="";for(c=0;c<b;c++)d+=String.fromCharCode(255&a),a>>>=8;return d},k=function(a,b){var c=a;return a||(c=b?16893:33204),(65535&c)<<16},l=function(a,b){return 63&(a||0)},m=function(a,b,c,d,f,m){var n,o,p=a.file,q=a.compression,r=m!==g.utf8encode,s=e.transformTo("string",m(p.name)),t=e.transformTo("string",g.utf8encode(p.name)),u=p.comment,v=e.transformTo("string",m(u)),w=e.transformTo("string",g.utf8encode(u)),x=t.length!==p.name.length,y=w.length!==u.length,z="",A="",B="",C=p.dir,D=p.date,E={crc32:0,compressedSize:0,uncompressedSize:0};b&&!c||(E.crc32=a.crc32,E.compressedSize=a.compressedSize,E.uncompressedSize=a.uncompressedSize);var F=0;b&&(F|=8),r||!x&&!y||(F|=2048);var G=0,H=0;C&&(G|=16),"UNIX"===f?(H=798,G|=k(p.unixPermissions,C)):(H=20,G|=l(p.dosPermissions,C)),n=D.getUTCHours(),n<<=6,n|=D.getUTCMinutes(),n<<=5,n|=D.getUTCSeconds()/2,o=D.getUTCFullYear()-1980,o<<=4,o|=D.getUTCMonth()+1,o<<=5,o|=D.getUTCDate(),x&&(A=j(1,1)+j(h(s),4)+t,z+="up"+j(A.length,2)+A),y&&(B=j(1,1)+j(h(v),4)+w,z+="uc"+j(B.length,2)+B);var I="";I+="\n\0",I+=j(F,2),I+=q.magic,I+=j(n,2),I+=j(o,2),I+=j(E.crc32,4),I+=j(E.compressedSize,4),I+=j(E.uncompressedSize,4),I+=j(s.length,2),I+=j(z.length,2);var J=i.LOCAL_FILE_HEADER+I+s+z,K=i.CENTRAL_FILE_HEADER+j(H,2)+I+j(v.length,2)+"\0\0\0\0"+j(G,4)+j(d,4)+s+z+v;return{fileRecord:J,dirRecord:K}},n=function(a,b,c,d,f){var g="",h=e.transformTo("string",f(d));return g=i.CENTRAL_DIRECTORY_END+"\0\0\0\0"+j(a,2)+j(a,2)+j(b,4)+j(c,4)+j(h.length,2)+h},o=function(a){var b="";return b=i.DATA_DESCRIPTOR+j(a.crc32,4)+j(a.compressedSize,4)+j(a.uncompressedSize,4)};e.inherits(d,f),d.prototype.push=function(a){var b=a.meta.percent||0,c=this.entriesCount,d=this._sources.length;this.accumulate?this.contentBuffer.push(a):(this.bytesWritten+=a.data.length,f.prototype.push.call(this,{data:a.data,meta:{currentFile:this.currentFile,percent:c?(b+100*(c-d-1))/c:100}}))},d.prototype.openedSource=function(a){this.currentSourceOffset=this.bytesWritten,this.currentFile=a.file.name;var b=this.streamFiles&&!a.file.dir;if(b){var c=m(a,b,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:c.fileRecord,meta:{percent:0}})}else this.accumulate=!0},d.prototype.closedSource=function(a){this.accumulate=!1;var b=this.streamFiles&&!a.file.dir,c=m(a,b,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(c.dirRecord),b)this.push({data:o(a),meta:{percent:100}});else for(this.push({data:c.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},d.prototype.flush=function(){for(var a=this.bytesWritten,b=0;b<this.dirRecords.length;b++)this.push({data:this.dirRecords[b],meta:{percent:100}});var c=this.bytesWritten-a,d=n(this.dirRecords.length,c,a,this.zipComment,this.encodeFileName);this.push({data:d,meta:{percent:100}})},d.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},d.prototype.registerPrevious=function(a){this._sources.push(a);var b=this;return a.on("data",function(a){b.processChunk(a)}),a.on("end",function(){b.closedSource(b.previous.streamInfo),b._sources.length?b.prepareNextSource():b.end()}),a.on("error",function(a){b.error(a)}),this},d.prototype.resume=function(){return!!f.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},d.prototype.error=function(a){var b=this._sources;if(!f.prototype.error.call(this,a))return!1;for(var c=0;c<b.length;c++)try{b[c].error(a)}catch(a){}return!0},d.prototype.lock=function(){f.prototype.lock.call(this);for(var a=this._sources,b=0;b<a.length;b++)a[b].lock()},b.exports=d},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(a,b,c){"use strict";var d=a("../compressions"),e=a("./ZipFileWorker"),f=function(a,b){var c=a||b,e=d[c];if(!e)throw new Error(c+" is not a valid compression method !");return e};c.generateWorker=function(a,b,c){var d=new e(b.streamFiles,c,b.platform,b.encodeFileName),g=0;try{a.forEach(function(a,c){g++;var e=f(c.options.compression,b.compression),h=c.options.compressionOptions||b.compressionOptions||{},i=c.dir,j=c.date;c._compressWorker(e,h).withStreamInfo("file",{name:a,dir:i,date:j,comment:c.comment||"",unixPermissions:c.unixPermissions,dosPermissions:c.dosPermissions}).pipe(d)}),d.entriesCount=g}catch(h){d.error(h)}return d}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(a,b,c){"use strict";function d(){if(!(this instanceof d))return new d;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files={},this.comment=null,this.root="",this.clone=function(){var a=new d;for(var b in this)"function"!=typeof this[b]&&(a[b]=this[b]);return a}}d.prototype=a("./object"),d.prototype.loadAsync=a("./load"),d.support=a("./support"),d.defaults=a("./defaults"),d.version="3.1.5",d.loadAsync=function(a,b){return(new d).loadAsync(a,b)},d.external=a("./external"),b.exports=d},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(a,b,c){"use strict";function d(a){return new f.Promise(function(b,c){var d=a.decompressed.getContentWorker().pipe(new i);d.on("error",function(a){c(a)}).on("end",function(){d.streamInfo.crc32!==a.decompressed.crc32?c(new Error("Corrupted zip : CRC32 mismatch")):b()}).resume()})}var e=a("./utils"),f=a("./external"),g=a("./utf8"),e=a("./utils"),h=a("./zipEntries"),i=a("./stream/Crc32Probe"),j=a("./nodejsUtils");b.exports=function(a,b){var c=this;return b=e.extend(b||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:g.utf8decode}),j.isNode&&j.isStream(a)?f.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):e.prepareContent("the loaded zip file",a,!0,b.optimizedBinaryString,b.base64).then(function(a){var c=new h(b);return c.load(a),c}).then(function(a){var c=[f.Promise.resolve(a)],e=a.files;if(b.checkCRC32)for(var g=0;g<e.length;g++)c.push(d(e[g]));return f.Promise.all(c)}).then(function(a){for(var d=a.shift(),e=d.files,f=0;f<e.length;f++){var g=e[f];c.file(g.fileNameStr,g.decompressed,{binary:!0,optimizedBinaryString:!0,date:g.date,dir:g.dir,comment:g.fileCommentStr.length?g.fileCommentStr:null,unixPermissions:g.unixPermissions,dosPermissions:g.dosPermissions,createFolders:b.createFolders})}return d.zipComment.length&&(c.comment=d.zipComment),c})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(a,b,c){"use strict";function d(a,b){f.call(this,"Nodejs stream input adapter for "+a),this._upstreamEnded=!1,this._bindStream(b)}var e=a("../utils"),f=a("../stream/GenericWorker");e.inherits(d,f),d.prototype._bindStream=function(a){var b=this;this._stream=a,a.pause(),a.on("data",function(a){b.push({data:a,meta:{percent:0}})}).on("error",function(a){b.isPaused?this.generatedError=a:b.error(a)}).on("end",function(){b.isPaused?b._upstreamEnded=!0:b.end()})},d.prototype.pause=function(){return!!f.prototype.pause.call(this)&&(this._stream.pause(),!0)},d.prototype.resume=function(){return!!f.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},b.exports=d},{"../stream/GenericWorker":28,"../utils":32}],13:[function(a,b,c){"use strict";function d(a,b,c){e.call(this,b),this._helper=a;var d=this;a.on("data",function(a,b){d.push(a)||d._helper.pause(),c&&c(b)}).on("error",function(a){d.emit("error",a)}).on("end",function(){d.push(null)})}var e=a("readable-stream").Readable,f=a("../utils");f.inherits(d,e),d.prototype._read=function(){this._helper.resume()},b.exports=d},{"../utils":32,"readable-stream":16}],14:[function(a,b,c){"use strict";b.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(a,b){return new Buffer(a,b)},allocBuffer:function(a){return Buffer.alloc?Buffer.alloc(a):new Buffer(a)},isBuffer:function(a){return Buffer.isBuffer(a)},isStream:function(a){return a&&"function"==typeof a.on&&"function"==typeof a.pause&&"function"==typeof a.resume}}},{}],15:[function(a,b,c){"use strict";function d(a){return"[object RegExp]"===Object.prototype.toString.call(a)}var e=a("./utf8"),f=a("./utils"),g=a("./stream/GenericWorker"),h=a("./stream/StreamHelper"),i=a("./defaults"),j=a("./compressedObject"),k=a("./zipObject"),l=a("./generate"),m=a("./nodejsUtils"),n=a("./nodejs/NodejsStreamInputAdapter"),o=function(a,b,c){var d,e=f.getTypeOf(b),h=f.extend(c||{},i);h.date=h.date||new Date,null!==h.compression&&(h.compression=h.compression.toUpperCase()),"string"==typeof h.unixPermissions&&(h.unixPermissions=parseInt(h.unixPermissions,8)),h.unixPermissions&&16384&h.unixPermissions&&(h.dir=!0),h.dosPermissions&&16&h.dosPermissions&&(h.dir=!0),h.dir&&(a=q(a)),h.createFolders&&(d=p(a))&&r.call(this,d,!0);var l="string"===e&&h.binary===!1&&h.base64===!1;c&&"undefined"!=typeof c.binary||(h.binary=!l);var o=b instanceof j&&0===b.uncompressedSize;(o||h.dir||!b||0===b.length)&&(h.base64=!1,h.binary=!0,b="",h.compression="STORE",e="string");var s=null;s=b instanceof j||b instanceof g?b:m.isNode&&m.isStream(b)?new n(a,b):f.prepareContent(a,b,h.binary,h.optimizedBinaryString,h.base64);var t=new k(a,s,h);this.files[a]=t},p=function(a){"/"===a.slice(-1)&&(a=a.substring(0,a.length-1));var b=a.lastIndexOf("/");return b>0?a.substring(0,b):""},q=function(a){return"/"!==a.slice(-1)&&(a+="/"),a},r=function(a,b){return b="undefined"!=typeof b?b:i.createFolders,a=q(a),this.files[a]||o.call(this,a,null,{dir:!0,createFolders:b}),this.files[a]},s={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(a){var b,c,d;for(b in this.files)this.files.hasOwnProperty(b)&&(d=this.files[b],c=b.slice(this.root.length,b.length),c&&b.slice(0,this.root.length)===this.root&&a(c,d))},filter:function(a){var b=[];return this.forEach(function(c,d){a(c,d)&&b.push(d)}),b},file:function(a,b,c){if(1===arguments.length){if(d(a)){var e=a;return this.filter(function(a,b){return!b.dir&&e.test(a)})}var f=this.files[this.root+a];return f&&!f.dir?f:null}return a=this.root+a,o.call(this,a,b,c),this},folder:function(a){if(!a)return this;if(d(a))return this.filter(function(b,c){return c.dir&&a.test(b)});var b=this.root+a,c=r.call(this,b),e=this.clone();return e.root=c.name,e},remove:function(a){a=this.root+a;var b=this.files[a];if(b||("/"!==a.slice(-1)&&(a+="/"),b=this.files[a]),b&&!b.dir)delete this.files[a];else for(var c=this.filter(function(b,c){return c.name.slice(0,a.length)===a}),d=0;d<c.length;d++)delete this.files[c[d].name];return this},generate:function(a){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(a){var b,c={};try{if(c=f.extend(a||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:e.utf8encode}),c.type=c.type.toLowerCase(),c.compression=c.compression.toUpperCase(),"binarystring"===c.type&&(c.type="string"),!c.type)throw new Error("No output type specified.");f.checkSupport(c.type),"darwin"!==c.platform&&"freebsd"!==c.platform&&"linux"!==c.platform&&"sunos"!==c.platform||(c.platform="UNIX"),"win32"===c.platform&&(c.platform="DOS");var d=c.comment||this.comment||"";b=l.generateWorker(this,c,d)}catch(i){b=new g("error"),b.error(i)}return new h(b,c.type||"string",c.mimeType)},generateAsync:function(a,b){return this.generateInternalStream(a).accumulate(b)},generateNodeStream:function(a,b){return a=a||{},a.type||(a.type="nodebuffer"),this.generateInternalStream(a).toNodejsStream(b)}};b.exports=s},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(a,b,c){b.exports=a("stream")},{stream:void 0}],17:[function(a,b,c){"use strict";function d(a){e.call(this,a);for(var b=0;b<this.data.length;b++)a[b]=255&a[b]}var e=a("./DataReader"),f=a("../utils");f.inherits(d,e),d.prototype.byteAt=function(a){return this.data[this.zero+a]},d.prototype.lastIndexOfSignature=function(a){for(var b=a.charCodeAt(0),c=a.charCodeAt(1),d=a.charCodeAt(2),e=a.charCodeAt(3),f=this.length-4;f>=0;--f)if(this.data[f]===b&&this.data[f+1]===c&&this.data[f+2]===d&&this.data[f+3]===e)return f-this.zero;return-1},d.prototype.readAndCheckSignature=function(a){var b=a.charCodeAt(0),c=a.charCodeAt(1),d=a.charCodeAt(2),e=a.charCodeAt(3),f=this.readData(4);return b===f[0]&&c===f[1]&&d===f[2]&&e===f[3]},d.prototype.readData=function(a){if(this.checkOffset(a),0===a)return[];var b=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,b},b.exports=d},{"../utils":32,"./DataReader":18}],18:[function(a,b,c){"use strict";function d(a){this.data=a,this.length=a.length,this.index=0,this.zero=0}var e=a("../utils");d.prototype={checkOffset:function(a){this.checkIndex(this.index+a)},checkIndex:function(a){if(this.length<this.zero+a||a<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+a+"). Corrupted zip ?")},setIndex:function(a){this.checkIndex(a),this.index=a},skip:function(a){this.setIndex(this.index+a)},byteAt:function(a){},readInt:function(a){var b,c=0;for(this.checkOffset(a),b=this.index+a-1;b>=this.index;b--)c=(c<<8)+this.byteAt(b);return this.index+=a,c},readString:function(a){return e.transformTo("string",this.readData(a))},readData:function(a){},lastIndexOfSignature:function(a){},readAndCheckSignature:function(a){},readDate:function(){var a=this.readInt(4);return new Date(Date.UTC((a>>25&127)+1980,(a>>21&15)-1,a>>16&31,a>>11&31,a>>5&63,(31&a)<<1))}},b.exports=d},{"../utils":32}],19:[function(a,b,c){"use strict";function d(a){e.call(this,a)}var e=a("./Uint8ArrayReader"),f=a("../utils");f.inherits(d,e),d.prototype.readData=function(a){this.checkOffset(a);var b=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,b},b.exports=d},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(a,b,c){"use strict";function d(a){e.call(this,a)}var e=a("./DataReader"),f=a("../utils");f.inherits(d,e),d.prototype.byteAt=function(a){return this.data.charCodeAt(this.zero+a)},d.prototype.lastIndexOfSignature=function(a){return this.data.lastIndexOf(a)-this.zero},d.prototype.readAndCheckSignature=function(a){var b=this.readData(4);return a===b},d.prototype.readData=function(a){this.checkOffset(a);var b=this.data.slice(this.zero+this.index,this.zero+this.index+a);return this.index+=a,b},b.exports=d},{"../utils":32,"./DataReader":18}],21:[function(a,b,c){"use strict";function d(a){e.call(this,a)}var e=a("./ArrayReader"),f=a("../utils");f.inherits(d,e),d.prototype.readData=function(a){if(this.checkOffset(a),0===a)return new Uint8Array(0);var b=this.data.subarray(this.zero+this.index,this.zero+this.index+a);return this.index+=a,b},b.exports=d},{"../utils":32,"./ArrayReader":17}],22:[function(a,b,c){"use strict";var d=a("../utils"),e=a("../support"),f=a("./ArrayReader"),g=a("./StringReader"),h=a("./NodeBufferReader"),i=a("./Uint8ArrayReader");b.exports=function(a){var b=d.getTypeOf(a);return d.checkSupport(b),"string"!==b||e.uint8array?"nodebuffer"===b?new h(a):e.uint8array?new i(d.transformTo("uint8array",a)):new f(d.transformTo("array",a)):new g(a)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(a,b,c){"use strict";c.LOCAL_FILE_HEADER="PK",c.CENTRAL_FILE_HEADER="PK",c.CENTRAL_DIRECTORY_END="PK",c.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",c.ZIP64_CENTRAL_DIRECTORY_END="PK",c.DATA_DESCRIPTOR="PK\b"},{}],24:[function(a,b,c){"use strict";function d(a){e.call(this,"ConvertWorker to "+a),this.destType=a}var e=a("./GenericWorker"),f=a("../utils");f.inherits(d,e),d.prototype.processChunk=function(a){this.push({data:f.transformTo(this.destType,a.data),meta:a.meta})},b.exports=d},{"../utils":32,"./GenericWorker":28}],25:[function(a,b,c){"use strict";function d(){e.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}var e=a("./GenericWorker"),f=a("../crc32"),g=a("../utils");g.inherits(d,e),d.prototype.processChunk=function(a){this.streamInfo.crc32=f(a.data,this.streamInfo.crc32||0),this.push(a)},b.exports=d},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(a,b,c){"use strict";function d(a){f.call(this,"DataLengthProbe for "+a),this.propName=a,this.withStreamInfo(a,0)}var e=a("../utils"),f=a("./GenericWorker");e.inherits(d,f),d.prototype.processChunk=function(a){if(a){var b=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=b+a.data.length}f.prototype.processChunk.call(this,a)},b.exports=d},{"../utils":32,"./GenericWorker":28}],27:[function(a,b,c){"use strict";function d(a){f.call(this,"DataWorker");var b=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,a.then(function(a){b.dataIsReady=!0,b.data=a,b.max=a&&a.length||0,b.type=e.getTypeOf(a),b.isPaused||b._tickAndRepeat()},function(a){b.error(a)})}var e=a("../utils"),f=a("./GenericWorker"),g=16384;e.inherits(d,f),d.prototype.cleanUp=function(){f.prototype.cleanUp.call(this),this.data=null},d.prototype.resume=function(){return!!f.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,e.delay(this._tickAndRepeat,[],this)),!0)},d.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(e.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},d.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var a=g,b=null,c=Math.min(this.max,this.index+a);if(this.index>=this.max)return this.end();switch(this.type){case"string":b=this.data.substring(this.index,c);break;case"uint8array":b=this.data.subarray(this.index,c);break;case"array":case"nodebuffer":b=this.data.slice(this.index,c)}return this.index=c,this.push({data:b,meta:{percent:this.max?this.index/this.max*100:0}})},b.exports=d},{"../utils":32,"./GenericWorker":28}],28:[function(a,b,c){"use strict";function d(a){this.name=a||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}d.prototype={push:function(a){this.emit("data",a)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(a){this.emit("error",a)}return!0},error:function(a){return!this.isFinished&&(this.isPaused?this.generatedError=a:(this.isFinished=!0,this.emit("error",a),this.previous&&this.previous.error(a),this.cleanUp()),!0)},on:function(a,b){return this._listeners[a].push(b),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(a,b){if(this._listeners[a])for(var c=0;c<this._listeners[a].length;c++)this._listeners[a][c].call(this,b)},pipe:function(a){return a.registerPrevious(this)},registerPrevious:function(a){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=a.streamInfo,this.mergeStreamInfo(),this.previous=a;var b=this;return a.on("data",function(a){b.processChunk(a)}),a.on("end",function(){b.end()}),a.on("error",function(a){b.error(a)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;this.isPaused=!1;var a=!1;return this.generatedError&&(this.error(this.generatedError),a=!0),this.previous&&this.previous.resume(),!a},flush:function(){},processChunk:function(a){this.push(a)},withStreamInfo:function(a,b){return this.extraStreamInfo[a]=b,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var a in this.extraStreamInfo)this.extraStreamInfo.hasOwnProperty(a)&&(this.streamInfo[a]=this.extraStreamInfo[a])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var a="Worker "+this.name;return this.previous?this.previous+" -> "+a:a}},b.exports=d},{}],29:[function(a,b,c){"use strict";function d(a,b,c){switch(a){case"blob":return h.newBlob(h.transformTo("arraybuffer",b),c);case"base64":return k.encode(b);default:return h.transformTo(a,b)}}function e(a,b){var c,d=0,e=null,f=0;for(c=0;c<b.length;c++)f+=b[c].length;switch(a){case"string":return b.join("");case"array":return Array.prototype.concat.apply([],b);case"uint8array":for(e=new Uint8Array(f),c=0;c<b.length;c++)e.set(b[c],d),d+=b[c].length;return e;case"nodebuffer":return Buffer.concat(b);default:throw new Error("concat : unsupported type '"+a+"'")}}function f(a,b){return new m.Promise(function(c,f){var g=[],h=a._internalType,i=a._outputType,j=a._mimeType;a.on("data",function(a,c){g.push(a),b&&b(c)}).on("error",function(a){g=[],f(a)}).on("end",function(){try{var a=d(i,e(h,g),j);c(a)}catch(b){f(b)}g=[]}).resume()})}function g(a,b,c){var d=b;switch(b){case"blob":case"arraybuffer":d="uint8array";break;case"base64":d="string"}try{this._internalType=d,this._outputType=b,this._mimeType=c,h.checkSupport(d),this._worker=a.pipe(new i(d)),a.lock()}catch(e){this._worker=new j("error"),this._worker.error(e)}}var h=a("../utils"),i=a("./ConvertWorker"),j=a("./GenericWorker"),k=a("../base64"),l=a("../support"),m=a("../external"),n=null;if(l.nodestream)try{n=a("../nodejs/NodejsStreamOutputAdapter")}catch(o){}g.prototype={accumulate:function(a){return f(this,a)},on:function(a,b){var c=this;return"data"===a?this._worker.on(a,function(a){b.call(c,a.data,a.meta)}):this._worker.on(a,function(){h.delay(b,arguments,c)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(a){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new n(this,{objectMode:"nodebuffer"!==this._outputType},a)}},b.exports=g},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(a,b,c){"use strict";if(c.base64=!0,c.array=!0,c.string=!0,c.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,c.nodebuffer="undefined"!=typeof Buffer,c.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)c.blob=!1;else{var d=new ArrayBuffer(0);try{c.blob=0===new Blob([d],{type:"application/zip"}).size}catch(e){try{var f=self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder,g=new f;g.append(d),c.blob=0===g.getBlob("application/zip").size}catch(e){c.blob=!1}}}try{c.nodestream=!!a("readable-stream").Readable}catch(e){c.nodestream=!1}},{"readable-stream":16}],31:[function(a,b,c){"use strict";function d(){i.call(this,"utf-8 decode"),this.leftOver=null}function e(){i.call(this,"utf-8 encode")}for(var f=a("./utils"),g=a("./support"),h=a("./nodejsUtils"),i=a("./stream/GenericWorker"),j=new Array(256),k=0;k<256;k++)j[k]=k>=252?6:k>=248?5:k>=240?4:k>=224?3:k>=192?2:1;j[254]=j[254]=1;var l=function(a){var b,c,d,e,f,h=a.length,i=0;for(e=0;e<h;e++)c=a.charCodeAt(e),55296===(64512&c)&&e+1<h&&(d=a.charCodeAt(e+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),e++)),i+=c<128?1:c<2048?2:c<65536?3:4;for(b=g.uint8array?new Uint8Array(i):new Array(i),f=0,e=0;f<i;e++)c=a.charCodeAt(e),55296===(64512&c)&&e+1<h&&(d=a.charCodeAt(e+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),e++)),c<128?b[f++]=c:c<2048?(b[f++]=192|c>>>6,b[f++]=128|63&c):c<65536?(b[f++]=224|c>>>12,b[f++]=128|c>>>6&63,b[f++]=128|63&c):(b[f++]=240|c>>>18,b[f++]=128|c>>>12&63,b[f++]=128|c>>>6&63,b[f++]=128|63&c);return b},m=function(a,b){var c;for(b=b||a.length,b>a.length&&(b=a.length),c=b-1;c>=0&&128===(192&a[c]);)c--;return c<0?b:0===c?b:c+j[a[c]]>b?c:b},n=function(a){var b,c,d,e,g=a.length,h=new Array(2*g);for(c=0,b=0;b<g;)if(d=a[b++],d<128)h[c++]=d;else if(e=j[d],e>4)h[c++]=65533,b+=e-1;else{for(d&=2===e?31:3===e?15:7;e>1&&b<g;)d=d<<6|63&a[b++],e--;e>1?h[c++]=65533:d<65536?h[c++]=d:(d-=65536,h[c++]=55296|d>>10&1023,h[c++]=56320|1023&d)}return h.length!==c&&(h.subarray?h=h.subarray(0,c):h.length=c),f.applyFromCharCode(h)};c.utf8encode=function(a){return g.nodebuffer?h.newBufferFrom(a,"utf-8"):l(a)},c.utf8decode=function(a){return g.nodebuffer?f.transformTo("nodebuffer",a).toString("utf-8"):(a=f.transformTo(g.uint8array?"uint8array":"array",a),n(a))},f.inherits(d,i),d.prototype.processChunk=function(a){var b=f.transformTo(g.uint8array?"uint8array":"array",a.data);if(this.leftOver&&this.leftOver.length){if(g.uint8array){var d=b;b=new Uint8Array(d.length+this.leftOver.length),b.set(this.leftOver,0),b.set(d,this.leftOver.length)}else b=this.leftOver.concat(b);this.leftOver=null}var e=m(b),h=b;e!==b.length&&(g.uint8array?(h=b.subarray(0,e),this.leftOver=b.subarray(e,b.length)):(h=b.slice(0,e),this.leftOver=b.slice(e,b.length))),this.push({data:c.utf8decode(h),meta:a.meta})},d.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:c.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},c.Utf8DecodeWorker=d,f.inherits(e,i),e.prototype.processChunk=function(a){this.push({data:c.utf8encode(a.data),meta:a.meta})},c.Utf8EncodeWorker=e},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(a,b,c){"use strict";function d(a){var b=null;return b=i.uint8array?new Uint8Array(a.length):new Array(a.length),f(a,b)}function e(a){return a}function f(a,b){for(var c=0;c<a.length;++c)b[c]=255&a.charCodeAt(c);return b}function g(a){var b=65536,d=c.getTypeOf(a),e=!0;if("uint8array"===d?e=n.applyCanBeUsed.uint8array:"nodebuffer"===d&&(e=n.applyCanBeUsed.nodebuffer),e)for(;b>1;)try{return n.stringifyByChunk(a,d,b)}catch(f){b=Math.floor(b/2)}return n.stringifyByChar(a)}function h(a,b){for(var c=0;c<a.length;c++)b[c]=a[c];
return b}var i=a("./support"),j=a("./base64"),k=a("./nodejsUtils"),l=a("core-js/library/fn/set-immediate"),m=a("./external");c.newBlob=function(a,b){c.checkSupport("blob");try{return new Blob([a],{type:b})}catch(d){try{var e=self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder,f=new e;return f.append(a),f.getBlob(b)}catch(d){throw new Error("Bug : can't construct the Blob.")}}};var n={stringifyByChunk:function(a,b,c){var d=[],e=0,f=a.length;if(f<=c)return String.fromCharCode.apply(null,a);for(;e<f;)"array"===b||"nodebuffer"===b?d.push(String.fromCharCode.apply(null,a.slice(e,Math.min(e+c,f)))):d.push(String.fromCharCode.apply(null,a.subarray(e,Math.min(e+c,f)))),e+=c;return d.join("")},stringifyByChar:function(a){for(var b="",c=0;c<a.length;c++)b+=String.fromCharCode(a[c]);return b},applyCanBeUsed:{uint8array:function(){try{return i.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(a){return!1}}(),nodebuffer:function(){try{return i.nodebuffer&&1===String.fromCharCode.apply(null,k.allocBuffer(1)).length}catch(a){return!1}}()}};c.applyFromCharCode=g;var o={};o.string={string:e,array:function(a){return f(a,new Array(a.length))},arraybuffer:function(a){return o.string.uint8array(a).buffer},uint8array:function(a){return f(a,new Uint8Array(a.length))},nodebuffer:function(a){return f(a,k.allocBuffer(a.length))}},o.array={string:g,array:e,arraybuffer:function(a){return new Uint8Array(a).buffer},uint8array:function(a){return new Uint8Array(a)},nodebuffer:function(a){return k.newBufferFrom(a)}},o.arraybuffer={string:function(a){return g(new Uint8Array(a))},array:function(a){return h(new Uint8Array(a),new Array(a.byteLength))},arraybuffer:e,uint8array:function(a){return new Uint8Array(a)},nodebuffer:function(a){return k.newBufferFrom(new Uint8Array(a))}},o.uint8array={string:g,array:function(a){return h(a,new Array(a.length))},arraybuffer:function(a){return a.buffer},uint8array:e,nodebuffer:function(a){return k.newBufferFrom(a)}},o.nodebuffer={string:g,array:function(a){return h(a,new Array(a.length))},arraybuffer:function(a){return o.nodebuffer.uint8array(a).buffer},uint8array:function(a){return h(a,new Uint8Array(a.length))},nodebuffer:e},c.transformTo=function(a,b){if(b||(b=""),!a)return b;c.checkSupport(a);var d=c.getTypeOf(b),e=o[d][a](b);return e},c.getTypeOf=function(a){return"string"==typeof a?"string":"[object Array]"===Object.prototype.toString.call(a)?"array":i.nodebuffer&&k.isBuffer(a)?"nodebuffer":i.uint8array&&a instanceof Uint8Array?"uint8array":i.arraybuffer&&a instanceof ArrayBuffer?"arraybuffer":void 0},c.checkSupport=function(a){var b=i[a.toLowerCase()];if(!b)throw new Error(a+" is not supported by this platform")},c.MAX_VALUE_16BITS=65535,c.MAX_VALUE_32BITS=-1,c.pretty=function(a){var b,c,d="";for(c=0;c<(a||"").length;c++)b=a.charCodeAt(c),d+="\\x"+(b<16?"0":"")+b.toString(16).toUpperCase();return d},c.delay=function(a,b,c){l(function(){a.apply(c||null,b||[])})},c.inherits=function(a,b){var c=function(){};c.prototype=b.prototype,a.prototype=new c},c.extend=function(){var a,b,c={};for(a=0;a<arguments.length;a++)for(b in arguments[a])arguments[a].hasOwnProperty(b)&&"undefined"==typeof c[b]&&(c[b]=arguments[a][b]);return c},c.prepareContent=function(a,b,e,f,g){var h=m.Promise.resolve(b).then(function(a){var b=i.blob&&(a instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(a))!==-1);return b&&"undefined"!=typeof FileReader?new m.Promise(function(b,c){var d=new FileReader;d.onload=function(a){b(a.target.result)},d.onerror=function(a){c(a.target.error)},d.readAsArrayBuffer(a)}):a});return h.then(function(b){var h=c.getTypeOf(b);return h?("arraybuffer"===h?b=c.transformTo("uint8array",b):"string"===h&&(g?b=j.decode(b):e&&f!==!0&&(b=d(b))),b):m.Promise.reject(new Error("Can't read the data of '"+a+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,"core-js/library/fn/set-immediate":36}],33:[function(a,b,c){"use strict";function d(a){this.files=[],this.loadOptions=a}var e=a("./reader/readerFor"),f=a("./utils"),g=a("./signature"),h=a("./zipEntry"),i=(a("./utf8"),a("./support"));d.prototype={checkSignature:function(a){if(!this.reader.readAndCheckSignature(a)){this.reader.index-=4;var b=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+f.pretty(b)+", expected "+f.pretty(a)+")")}},isSignature:function(a,b){var c=this.reader.index;this.reader.setIndex(a);var d=this.reader.readString(4),e=d===b;return this.reader.setIndex(c),e},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var a=this.reader.readData(this.zipCommentLength),b=i.uint8array?"uint8array":"array",c=f.transformTo(b,a);this.zipComment=this.loadOptions.decodeFileName(c)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var a,b,c,d=this.zip64EndOfCentralSize-44,e=0;e<d;)a=this.reader.readInt(2),b=this.reader.readInt(4),c=this.reader.readData(b),this.zip64ExtensibleData[a]={id:a,length:b,value:c}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),this.disksCount>1)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var a,b;for(a=0;a<this.files.length;a++)b=this.files[a],this.reader.setIndex(b.localHeaderOffset),this.checkSignature(g.LOCAL_FILE_HEADER),b.readLocalPart(this.reader),b.handleUTF8(),b.processAttributes()},readCentralDir:function(){var a;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(g.CENTRAL_FILE_HEADER);)a=new h({zip64:this.zip64},this.loadOptions),a.readCentralPart(this.reader),this.files.push(a);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var a=this.reader.lastIndexOfSignature(g.CENTRAL_DIRECTORY_END);if(a<0){var b=!this.isSignature(0,g.LOCAL_FILE_HEADER);throw b?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory")}this.reader.setIndex(a);var c=a;if(this.checkSignature(g.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===f.MAX_VALUE_16BITS||this.diskWithCentralDirStart===f.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===f.MAX_VALUE_16BITS||this.centralDirRecords===f.MAX_VALUE_16BITS||this.centralDirSize===f.MAX_VALUE_32BITS||this.centralDirOffset===f.MAX_VALUE_32BITS){if(this.zip64=!0,a=this.reader.lastIndexOfSignature(g.ZIP64_CENTRAL_DIRECTORY_LOCATOR),a<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(a),this.checkSignature(g.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,g.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(g.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(g.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var d=this.centralDirOffset+this.centralDirSize;this.zip64&&(d+=20,d+=12+this.zip64EndOfCentralSize);var e=c-d;if(e>0)this.isSignature(c,g.CENTRAL_FILE_HEADER)||(this.reader.zero=e);else if(e<0)throw new Error("Corrupted zip: missing "+Math.abs(e)+" bytes.")},prepareReader:function(a){this.reader=e(a)},load:function(a){this.prepareReader(a),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},b.exports=d},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utf8":31,"./utils":32,"./zipEntry":34}],34:[function(a,b,c){"use strict";function d(a,b){this.options=a,this.loadOptions=b}var e=a("./reader/readerFor"),f=a("./utils"),g=a("./compressedObject"),h=a("./crc32"),i=a("./utf8"),j=a("./compressions"),k=a("./support"),l=0,m=3,n=function(a){for(var b in j)if(j.hasOwnProperty(b)&&j[b].magic===a)return j[b];return null};d.prototype={isEncrypted:function(){return 1===(1&this.bitFlag)},useUTF8:function(){return 2048===(2048&this.bitFlag)},readLocalPart:function(a){var b,c;if(a.skip(22),this.fileNameLength=a.readInt(2),c=a.readInt(2),this.fileName=a.readData(this.fileNameLength),a.skip(c),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(b=n(this.compressionMethod),null===b)throw new Error("Corrupted zip : compression "+f.pretty(this.compressionMethod)+" unknown (inner file : "+f.transformTo("string",this.fileName)+")");this.decompressed=new g(this.compressedSize,this.uncompressedSize,this.crc32,b,a.readData(this.compressedSize))},readCentralPart:function(a){this.versionMadeBy=a.readInt(2),a.skip(2),this.bitFlag=a.readInt(2),this.compressionMethod=a.readString(2),this.date=a.readDate(),this.crc32=a.readInt(4),this.compressedSize=a.readInt(4),this.uncompressedSize=a.readInt(4);var b=a.readInt(2);if(this.extraFieldsLength=a.readInt(2),this.fileCommentLength=a.readInt(2),this.diskNumberStart=a.readInt(2),this.internalFileAttributes=a.readInt(2),this.externalFileAttributes=a.readInt(4),this.localHeaderOffset=a.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");a.skip(b),this.readExtraFields(a),this.parseZIP64ExtraField(a),this.fileComment=a.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var a=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),a===l&&(this.dosPermissions=63&this.externalFileAttributes),a===m&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(a){if(this.extraFields[1]){var b=e(this.extraFields[1].value);this.uncompressedSize===f.MAX_VALUE_32BITS&&(this.uncompressedSize=b.readInt(8)),this.compressedSize===f.MAX_VALUE_32BITS&&(this.compressedSize=b.readInt(8)),this.localHeaderOffset===f.MAX_VALUE_32BITS&&(this.localHeaderOffset=b.readInt(8)),this.diskNumberStart===f.MAX_VALUE_32BITS&&(this.diskNumberStart=b.readInt(4))}},readExtraFields:function(a){var b,c,d,e=a.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});a.index<e;)b=a.readInt(2),c=a.readInt(2),d=a.readData(c),this.extraFields[b]={id:b,length:c,value:d}},handleUTF8:function(){var a=k.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=i.utf8decode(this.fileName),this.fileCommentStr=i.utf8decode(this.fileComment);else{var b=this.findExtraFieldUnicodePath();if(null!==b)this.fileNameStr=b;else{var c=f.transformTo(a,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(c)}var d=this.findExtraFieldUnicodeComment();if(null!==d)this.fileCommentStr=d;else{var e=f.transformTo(a,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(e)}}},findExtraFieldUnicodePath:function(){var a=this.extraFields[28789];if(a){var b=e(a.value);return 1!==b.readInt(1)?null:h(this.fileName)!==b.readInt(4)?null:i.utf8decode(b.readData(a.length-5))}return null},findExtraFieldUnicodeComment:function(){var a=this.extraFields[25461];if(a){var b=e(a.value);return 1!==b.readInt(1)?null:h(this.fileComment)!==b.readInt(4)?null:i.utf8decode(b.readData(a.length-5))}return null}},b.exports=d},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(a,b,c){"use strict";var d=a("./stream/StreamHelper"),e=a("./stream/DataWorker"),f=a("./utf8"),g=a("./compressedObject"),h=a("./stream/GenericWorker"),i=function(a,b,c){this.name=a,this.dir=c.dir,this.date=c.date,this.comment=c.comment,this.unixPermissions=c.unixPermissions,this.dosPermissions=c.dosPermissions,this._data=b,this._dataBinary=c.binary,this.options={compression:c.compression,compressionOptions:c.compressionOptions}};i.prototype={internalStream:function(a){var b=null,c="string";try{if(!a)throw new Error("No output type specified.");c=a.toLowerCase();var e="string"===c||"text"===c;"binarystring"!==c&&"text"!==c||(c="string"),b=this._decompressWorker();var g=!this._dataBinary;g&&!e&&(b=b.pipe(new f.Utf8EncodeWorker)),!g&&e&&(b=b.pipe(new f.Utf8DecodeWorker))}catch(i){b=new h("error"),b.error(i)}return new d(b,c,"")},async:function(a,b){return this.internalStream(a).accumulate(b)},nodeStream:function(a,b){return this.internalStream(a||"nodebuffer").toNodejsStream(b)},_compressWorker:function(a,b){if(this._data instanceof g&&this._data.compression.magic===a.magic)return this._data.getCompressedWorker();var c=this._decompressWorker();return this._dataBinary||(c=c.pipe(new f.Utf8EncodeWorker)),g.createWorkerFrom(c,a,b)},_decompressWorker:function(){return this._data instanceof g?this._data.getContentWorker():this._data instanceof h?this._data:new e(this._data)}};for(var j=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],k=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},l=0;l<j.length;l++)i.prototype[j[l]]=k;b.exports=i},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(a,b,c){a("../modules/web.immediate"),b.exports=a("../modules/_core").setImmediate},{"../modules/_core":40,"../modules/web.immediate":56}],37:[function(a,b,c){b.exports=function(a){if("function"!=typeof a)throw TypeError(a+" is not a function!");return a}},{}],38:[function(a,b,c){var d=a("./_is-object");b.exports=function(a){if(!d(a))throw TypeError(a+" is not an object!");return a}},{"./_is-object":51}],39:[function(a,b,c){var d={}.toString;b.exports=function(a){return d.call(a).slice(8,-1)}},{}],40:[function(a,b,c){var d=b.exports={version:"2.3.0"};"number"==typeof __e&&(__e=d)},{}],41:[function(a,b,c){var d=a("./_a-function");b.exports=function(a,b,c){if(d(a),void 0===b)return a;switch(c){case 1:return function(c){return a.call(b,c)};case 2:return function(c,d){return a.call(b,c,d)};case 3:return function(c,d,e){return a.call(b,c,d,e)}}return function(){return a.apply(b,arguments)}}},{"./_a-function":37}],42:[function(a,b,c){b.exports=!a("./_fails")(function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})},{"./_fails":45}],43:[function(a,b,c){var d=a("./_is-object"),e=a("./_global").document,f=d(e)&&d(e.createElement);b.exports=function(a){return f?e.createElement(a):{}}},{"./_global":46,"./_is-object":51}],44:[function(a,b,c){var d=a("./_global"),e=a("./_core"),f=a("./_ctx"),g=a("./_hide"),h="prototype",i=function(a,b,c){var j,k,l,m=a&i.F,n=a&i.G,o=a&i.S,p=a&i.P,q=a&i.B,r=a&i.W,s=n?e:e[b]||(e[b]={}),t=s[h],u=n?d:o?d[b]:(d[b]||{})[h];n&&(c=b);for(j in c)k=!m&&u&&void 0!==u[j],k&&j in s||(l=k?u[j]:c[j],s[j]=n&&"function"!=typeof u[j]?c[j]:q&&k?f(l,d):r&&u[j]==l?function(a){var b=function(b,c,d){if(this instanceof a){switch(arguments.length){case 0:return new a;case 1:return new a(b);case 2:return new a(b,c)}return new a(b,c,d)}return a.apply(this,arguments)};return b[h]=a[h],b}(l):p&&"function"==typeof l?f(Function.call,l):l,p&&((s.virtual||(s.virtual={}))[j]=l,a&i.R&&t&&!t[j]&&g(t,j,l)))};i.F=1,i.G=2,i.S=4,i.P=8,i.B=16,i.W=32,i.U=64,i.R=128,b.exports=i},{"./_core":40,"./_ctx":41,"./_global":46,"./_hide":47}],45:[function(a,b,c){b.exports=function(a){try{return!!a()}catch(b){return!0}}},{}],46:[function(a,b,c){var d=b.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=d)},{}],47:[function(a,b,c){var d=a("./_object-dp"),e=a("./_property-desc");b.exports=a("./_descriptors")?function(a,b,c){return d.f(a,b,e(1,c))}:function(a,b,c){return a[b]=c,a}},{"./_descriptors":42,"./_object-dp":52,"./_property-desc":53}],48:[function(a,b,c){b.exports=a("./_global").document&&document.documentElement},{"./_global":46}],49:[function(a,b,c){b.exports=!a("./_descriptors")&&!a("./_fails")(function(){return 7!=Object.defineProperty(a("./_dom-create")("div"),"a",{get:function(){return 7}}).a})},{"./_descriptors":42,"./_dom-create":43,"./_fails":45}],50:[function(a,b,c){b.exports=function(a,b,c){var d=void 0===c;switch(b.length){case 0:return d?a():a.call(c);case 1:return d?a(b[0]):a.call(c,b[0]);case 2:return d?a(b[0],b[1]):a.call(c,b[0],b[1]);case 3:return d?a(b[0],b[1],b[2]):a.call(c,b[0],b[1],b[2]);case 4:return d?a(b[0],b[1],b[2],b[3]):a.call(c,b[0],b[1],b[2],b[3])}return a.apply(c,b)}},{}],51:[function(a,b,c){b.exports=function(a){return"object"==typeof a?null!==a:"function"==typeof a}},{}],52:[function(a,b,c){var d=a("./_an-object"),e=a("./_ie8-dom-define"),f=a("./_to-primitive"),g=Object.defineProperty;c.f=a("./_descriptors")?Object.defineProperty:function(a,b,c){if(d(a),b=f(b,!0),d(c),e)try{return g(a,b,c)}catch(h){}if("get"in c||"set"in c)throw TypeError("Accessors not supported!");return"value"in c&&(a[b]=c.value),a}},{"./_an-object":38,"./_descriptors":42,"./_ie8-dom-define":49,"./_to-primitive":55}],53:[function(a,b,c){b.exports=function(a,b){return{enumerable:!(1&a),configurable:!(2&a),writable:!(4&a),value:b}}},{}],54:[function(a,b,c){var d,e,f,g=a("./_ctx"),h=a("./_invoke"),i=a("./_html"),j=a("./_dom-create"),k=a("./_global"),l=k.process,m=k.setImmediate,n=k.clearImmediate,o=k.MessageChannel,p=0,q={},r="onreadystatechange",s=function(){var a=+this;if(q.hasOwnProperty(a)){var b=q[a];delete q[a],b()}},t=function(a){s.call(a.data)};m&&n||(m=function(a){for(var b=[],c=1;arguments.length>c;)b.push(arguments[c++]);return q[++p]=function(){h("function"==typeof a?a:Function(a),b)},d(p),p},n=function(a){delete q[a]},"process"==a("./_cof")(l)?d=function(a){l.nextTick(g(s,a,1))}:o?(e=new o,f=e.port2,e.port1.onmessage=t,d=g(f.postMessage,f,1)):k.addEventListener&&"function"==typeof postMessage&&!k.importScripts?(d=function(a){k.postMessage(a+"","*")},k.addEventListener("message",t,!1)):d=r in j("script")?function(a){i.appendChild(j("script"))[r]=function(){i.removeChild(this),s.call(a)}}:function(a){setTimeout(g(s,a,1),0)}),b.exports={set:m,clear:n}},{"./_cof":39,"./_ctx":41,"./_dom-create":43,"./_global":46,"./_html":48,"./_invoke":50}],55:[function(a,b,c){var d=a("./_is-object");b.exports=function(a,b){if(!d(a))return a;var c,e;if(b&&"function"==typeof(c=a.toString)&&!d(e=c.call(a)))return e;if("function"==typeof(c=a.valueOf)&&!d(e=c.call(a)))return e;if(!b&&"function"==typeof(c=a.toString)&&!d(e=c.call(a)))return e;throw TypeError("Can't convert object to primitive value")}},{"./_is-object":51}],56:[function(a,b,c){var d=a("./_export"),e=a("./_task");d(d.G+d.B,{setImmediate:e.set,clearImmediate:e.clear})},{"./_export":44,"./_task":54}],57:[function(a,b,c){(function(a){"use strict";function c(){k=!0;for(var a,b,c=l.length;c;){for(b=l,l=[],a=-1;++a<c;)b[a]();c=l.length}k=!1}function d(a){1!==l.push(a)||k||e()}var e,f=a.MutationObserver||a.WebKitMutationObserver;if(f){var g=0,h=new f(c),i=a.document.createTextNode("");h.observe(i,{characterData:!0}),e=function(){i.data=g=++g%2}}else if(a.setImmediate||"undefined"==typeof a.MessageChannel)e="document"in a&&"onreadystatechange"in a.document.createElement("script")?function(){var b=a.document.createElement("script");b.onreadystatechange=function(){c(),b.onreadystatechange=null,b.parentNode.removeChild(b),b=null},a.document.documentElement.appendChild(b)}:function(){setTimeout(c,0)};else{var j=new a.MessageChannel;j.port1.onmessage=c,e=function(){j.port2.postMessage(0)}}var k,l=[];b.exports=d}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],58:[function(a,b,c){"use strict";function d(){}function e(a){if("function"!=typeof a)throw new TypeError("resolver must be a function");this.state=s,this.queue=[],this.outcome=void 0,a!==d&&i(this,a)}function f(a,b,c){this.promise=a,"function"==typeof b&&(this.onFulfilled=b,this.callFulfilled=this.otherCallFulfilled),"function"==typeof c&&(this.onRejected=c,this.callRejected=this.otherCallRejected)}function g(a,b,c){o(function(){var d;try{d=b(c)}catch(e){return p.reject(a,e)}d===a?p.reject(a,new TypeError("Cannot resolve promise with itself")):p.resolve(a,d)})}function h(a){var b=a&&a.then;if(a&&("object"==typeof a||"function"==typeof a)&&"function"==typeof b)return function(){b.apply(a,arguments)}}function i(a,b){function c(b){f||(f=!0,p.reject(a,b))}function d(b){f||(f=!0,p.resolve(a,b))}function e(){b(d,c)}var f=!1,g=j(e);"error"===g.status&&c(g.value)}function j(a,b){var c={};try{c.value=a(b),c.status="success"}catch(d){c.status="error",c.value=d}return c}function k(a){return a instanceof this?a:p.resolve(new this(d),a)}function l(a){var b=new this(d);return p.reject(b,a)}function m(a){function b(a,b){function d(a){g[b]=a,++h!==e||f||(f=!0,p.resolve(j,g))}c.resolve(a).then(d,function(a){f||(f=!0,p.reject(j,a))})}var c=this;if("[object Array]"!==Object.prototype.toString.call(a))return this.reject(new TypeError("must be an array"));var e=a.length,f=!1;if(!e)return this.resolve([]);for(var g=new Array(e),h=0,i=-1,j=new this(d);++i<e;)b(a[i],i);return j}function n(a){function b(a){c.resolve(a).then(function(a){f||(f=!0,p.resolve(h,a))},function(a){f||(f=!0,p.reject(h,a))})}var c=this;if("[object Array]"!==Object.prototype.toString.call(a))return this.reject(new TypeError("must be an array"));var e=a.length,f=!1;if(!e)return this.resolve([]);for(var g=-1,h=new this(d);++g<e;)b(a[g]);return h}var o=a("immediate"),p={},q=["REJECTED"],r=["FULFILLED"],s=["PENDING"];b.exports=e,e.prototype["catch"]=function(a){return this.then(null,a)},e.prototype.then=function(a,b){if("function"!=typeof a&&this.state===r||"function"!=typeof b&&this.state===q)return this;var c=new this.constructor(d);if(this.state!==s){var e=this.state===r?a:b;g(c,e,this.outcome)}else this.queue.push(new f(c,a,b));return c},f.prototype.callFulfilled=function(a){p.resolve(this.promise,a)},f.prototype.otherCallFulfilled=function(a){g(this.promise,this.onFulfilled,a)},f.prototype.callRejected=function(a){p.reject(this.promise,a)},f.prototype.otherCallRejected=function(a){g(this.promise,this.onRejected,a)},p.resolve=function(a,b){var c=j(h,b);if("error"===c.status)return p.reject(a,c.value);var d=c.value;if(d)i(a,d);else{a.state=r,a.outcome=b;for(var e=-1,f=a.queue.length;++e<f;)a.queue[e].callFulfilled(b)}return a},p.reject=function(a,b){a.state=q,a.outcome=b;for(var c=-1,d=a.queue.length;++c<d;)a.queue[c].callRejected(b);return a},e.resolve=k,e.reject=l,e.all=m,e.race=n},{immediate:57}],59:[function(a,b,c){"use strict";var d=a("./lib/utils/common").assign,e=a("./lib/deflate"),f=a("./lib/inflate"),g=a("./lib/zlib/constants"),h={};d(h,e,f,g),b.exports=h},{"./lib/deflate":60,"./lib/inflate":61,"./lib/utils/common":62,"./lib/zlib/constants":65}],60:[function(a,b,c){"use strict";function d(a){if(!(this instanceof d))return new d(a);this.options=i.assign({level:s,method:u,chunkSize:16384,windowBits:15,memLevel:8,strategy:t,to:""},a||{});var b=this.options;b.raw&&b.windowBits>0?b.windowBits=-b.windowBits:b.gzip&&b.windowBits>0&&b.windowBits<16&&(b.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new l,this.strm.avail_out=0;var c=h.deflateInit2(this.strm,b.level,b.method,b.windowBits,b.memLevel,b.strategy);if(c!==p)throw new Error(k[c]);if(b.header&&h.deflateSetHeader(this.strm,b.header),b.dictionary){var e;if(e="string"==typeof b.dictionary?j.string2buf(b.dictionary):"[object ArrayBuffer]"===m.call(b.dictionary)?new Uint8Array(b.dictionary):b.dictionary,c=h.deflateSetDictionary(this.strm,e),c!==p)throw new Error(k[c]);this._dict_set=!0}}function e(a,b){var c=new d(b);if(c.push(a,!0),c.err)throw c.msg||k[c.err];return c.result}function f(a,b){return b=b||{},b.raw=!0,e(a,b)}function g(a,b){return b=b||{},b.gzip=!0,e(a,b)}var h=a("./zlib/deflate"),i=a("./utils/common"),j=a("./utils/strings"),k=a("./zlib/messages"),l=a("./zlib/zstream"),m=Object.prototype.toString,n=0,o=4,p=0,q=1,r=2,s=-1,t=0,u=8;d.prototype.push=function(a,b){var c,d,e=this.strm,f=this.options.chunkSize;if(this.ended)return!1;d=b===~~b?b:b===!0?o:n,"string"==typeof a?e.input=j.string2buf(a):"[object ArrayBuffer]"===m.call(a)?e.input=new Uint8Array(a):e.input=a,e.next_in=0,e.avail_in=e.input.length;do{if(0===e.avail_out&&(e.output=new i.Buf8(f),e.next_out=0,e.avail_out=f),c=h.deflate(e,d),c!==q&&c!==p)return this.onEnd(c),this.ended=!0,!1;0!==e.avail_out&&(0!==e.avail_in||d!==o&&d!==r)||("string"===this.options.to?this.onData(j.buf2binstring(i.shrinkBuf(e.output,e.next_out))):this.onData(i.shrinkBuf(e.output,e.next_out)))}while((e.avail_in>0||0===e.avail_out)&&c!==q);return d===o?(c=h.deflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===p):d!==r||(this.onEnd(p),e.avail_out=0,!0)},d.prototype.onData=function(a){this.chunks.push(a)},d.prototype.onEnd=function(a){a===p&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=a,this.msg=this.strm.msg},c.Deflate=d,c.deflate=e,c.deflateRaw=f,c.gzip=g},{"./utils/common":62,"./utils/strings":63,"./zlib/deflate":67,"./zlib/messages":72,"./zlib/zstream":74}],61:[function(a,b,c){"use strict";function d(a){if(!(this instanceof d))return new d(a);this.options=h.assign({chunkSize:16384,windowBits:0,to:""},a||{});var b=this.options;b.raw&&b.windowBits>=0&&b.windowBits<16&&(b.windowBits=-b.windowBits,0===b.windowBits&&(b.windowBits=-15)),!(b.windowBits>=0&&b.windowBits<16)||a&&a.windowBits||(b.windowBits+=32),b.windowBits>15&&b.windowBits<48&&0===(15&b.windowBits)&&(b.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new l,this.strm.avail_out=0;var c=g.inflateInit2(this.strm,b.windowBits);if(c!==j.Z_OK)throw new Error(k[c]);this.header=new m,g.inflateGetHeader(this.strm,this.header)}function e(a,b){var c=new d(b);if(c.push(a,!0),c.err)throw c.msg||k[c.err];return c.result}function f(a,b){return b=b||{},b.raw=!0,e(a,b)}var g=a("./zlib/inflate"),h=a("./utils/common"),i=a("./utils/strings"),j=a("./zlib/constants"),k=a("./zlib/messages"),l=a("./zlib/zstream"),m=a("./zlib/gzheader"),n=Object.prototype.toString;d.prototype.push=function(a,b){var c,d,e,f,k,l,m=this.strm,o=this.options.chunkSize,p=this.options.dictionary,q=!1;if(this.ended)return!1;d=b===~~b?b:b===!0?j.Z_FINISH:j.Z_NO_FLUSH,"string"==typeof a?m.input=i.binstring2buf(a):"[object ArrayBuffer]"===n.call(a)?m.input=new Uint8Array(a):m.input=a,m.next_in=0,m.avail_in=m.input.length;do{if(0===m.avail_out&&(m.output=new h.Buf8(o),m.next_out=0,m.avail_out=o),c=g.inflate(m,j.Z_NO_FLUSH),c===j.Z_NEED_DICT&&p&&(l="string"==typeof p?i.string2buf(p):"[object ArrayBuffer]"===n.call(p)?new Uint8Array(p):p,c=g.inflateSetDictionary(this.strm,l)),c===j.Z_BUF_ERROR&&q===!0&&(c=j.Z_OK,q=!1),c!==j.Z_STREAM_END&&c!==j.Z_OK)return this.onEnd(c),this.ended=!0,!1;m.next_out&&(0!==m.avail_out&&c!==j.Z_STREAM_END&&(0!==m.avail_in||d!==j.Z_FINISH&&d!==j.Z_SYNC_FLUSH)||("string"===this.options.to?(e=i.utf8border(m.output,m.next_out),f=m.next_out-e,k=i.buf2string(m.output,e),m.next_out=f,m.avail_out=o-f,f&&h.arraySet(m.output,m.output,e,f,0),this.onData(k)):this.onData(h.shrinkBuf(m.output,m.next_out)))),0===m.avail_in&&0===m.avail_out&&(q=!0)}while((m.avail_in>0||0===m.avail_out)&&c!==j.Z_STREAM_END);return c===j.Z_STREAM_END&&(d=j.Z_FINISH),d===j.Z_FINISH?(c=g.inflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===j.Z_OK):d!==j.Z_SYNC_FLUSH||(this.onEnd(j.Z_OK),m.avail_out=0,!0)},d.prototype.onData=function(a){this.chunks.push(a)},d.prototype.onEnd=function(a){a===j.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=h.flattenChunks(this.chunks)),this.chunks=[],this.err=a,this.msg=this.strm.msg},c.Inflate=d,c.inflate=e,c.inflateRaw=f,c.ungzip=e},{"./utils/common":62,"./utils/strings":63,"./zlib/constants":65,"./zlib/gzheader":68,"./zlib/inflate":70,"./zlib/messages":72,"./zlib/zstream":74}],62:[function(a,b,c){"use strict";var d="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;c.assign=function(a){for(var b=Array.prototype.slice.call(arguments,1);b.length;){var c=b.shift();if(c){if("object"!=typeof c)throw new TypeError(c+"must be non-object");for(var d in c)c.hasOwnProperty(d)&&(a[d]=c[d])}}return a},c.shrinkBuf=function(a,b){return a.length===b?a:a.subarray?a.subarray(0,b):(a.length=b,a)};var e={arraySet:function(a,b,c,d,e){if(b.subarray&&a.subarray)return void a.set(b.subarray(c,c+d),e);for(var f=0;f<d;f++)a[e+f]=b[c+f]},flattenChunks:function(a){var b,c,d,e,f,g;for(d=0,b=0,c=a.length;b<c;b++)d+=a[b].length;for(g=new Uint8Array(d),e=0,b=0,c=a.length;b<c;b++)f=a[b],g.set(f,e),e+=f.length;return g}},f={arraySet:function(a,b,c,d,e){for(var f=0;f<d;f++)a[e+f]=b[c+f]},flattenChunks:function(a){return[].concat.apply([],a)}};c.setTyped=function(a){a?(c.Buf8=Uint8Array,c.Buf16=Uint16Array,c.Buf32=Int32Array,c.assign(c,e)):(c.Buf8=Array,c.Buf16=Array,c.Buf32=Array,c.assign(c,f))},c.setTyped(d)},{}],63:[function(a,b,c){"use strict";function d(a,b){if(b<65537&&(a.subarray&&g||!a.subarray&&f))return String.fromCharCode.apply(null,e.shrinkBuf(a,b));for(var c="",d=0;d<b;d++)c+=String.fromCharCode(a[d]);return c}var e=a("./common"),f=!0,g=!0;try{String.fromCharCode.apply(null,[0])}catch(h){f=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(h){g=!1}for(var i=new e.Buf8(256),j=0;j<256;j++)i[j]=j>=252?6:j>=248?5:j>=240?4:j>=224?3:j>=192?2:1;i[254]=i[254]=1,c.string2buf=function(a){var b,c,d,f,g,h=a.length,i=0;for(f=0;f<h;f++)c=a.charCodeAt(f),55296===(64512&c)&&f+1<h&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),i+=c<128?1:c<2048?2:c<65536?3:4;for(b=new e.Buf8(i),g=0,f=0;g<i;f++)c=a.charCodeAt(f),55296===(64512&c)&&f+1<h&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),c<128?b[g++]=c:c<2048?(b[g++]=192|c>>>6,b[g++]=128|63&c):c<65536?(b[g++]=224|c>>>12,b[g++]=128|c>>>6&63,b[g++]=128|63&c):(b[g++]=240|c>>>18,b[g++]=128|c>>>12&63,b[g++]=128|c>>>6&63,b[g++]=128|63&c);return b},c.buf2binstring=function(a){return d(a,a.length)},c.binstring2buf=function(a){for(var b=new e.Buf8(a.length),c=0,d=b.length;c<d;c++)b[c]=a.charCodeAt(c);return b},c.buf2string=function(a,b){var c,e,f,g,h=b||a.length,j=new Array(2*h);for(e=0,c=0;c<h;)if(f=a[c++],f<128)j[e++]=f;else if(g=i[f],g>4)j[e++]=65533,c+=g-1;else{for(f&=2===g?31:3===g?15:7;g>1&&c<h;)f=f<<6|63&a[c++],g--;g>1?j[e++]=65533:f<65536?j[e++]=f:(f-=65536,j[e++]=55296|f>>10&1023,j[e++]=56320|1023&f)}return d(j,e)},c.utf8border=function(a,b){var c;for(b=b||a.length,b>a.length&&(b=a.length),c=b-1;c>=0&&128===(192&a[c]);)c--;return c<0?b:0===c?b:c+i[a[c]]>b?c:b}},{"./common":62}],64:[function(a,b,c){"use strict";function d(a,b,c,d){for(var e=65535&a|0,f=a>>>16&65535|0,g=0;0!==c;){g=c>2e3?2e3:c,c-=g;do e=e+b[d++]|0,f=f+e|0;while(--g);e%=65521,f%=65521}return e|f<<16|0;
}b.exports=d},{}],65:[function(a,b,c){"use strict";b.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],66:[function(a,b,c){"use strict";function d(){for(var a,b=[],c=0;c<256;c++){a=c;for(var d=0;d<8;d++)a=1&a?3988292384^a>>>1:a>>>1;b[c]=a}return b}function e(a,b,c,d){var e=f,g=d+c;a^=-1;for(var h=d;h<g;h++)a=a>>>8^e[255&(a^b[h])];return a^-1}var f=d();b.exports=e},{}],67:[function(a,b,c){"use strict";function d(a,b){return a.msg=I[b],b}function e(a){return(a<<1)-(a>4?9:0)}function f(a){for(var b=a.length;--b>=0;)a[b]=0}function g(a){var b=a.state,c=b.pending;c>a.avail_out&&(c=a.avail_out),0!==c&&(E.arraySet(a.output,b.pending_buf,b.pending_out,c,a.next_out),a.next_out+=c,b.pending_out+=c,a.total_out+=c,a.avail_out-=c,b.pending-=c,0===b.pending&&(b.pending_out=0))}function h(a,b){F._tr_flush_block(a,a.block_start>=0?a.block_start:-1,a.strstart-a.block_start,b),a.block_start=a.strstart,g(a.strm)}function i(a,b){a.pending_buf[a.pending++]=b}function j(a,b){a.pending_buf[a.pending++]=b>>>8&255,a.pending_buf[a.pending++]=255&b}function k(a,b,c,d){var e=a.avail_in;return e>d&&(e=d),0===e?0:(a.avail_in-=e,E.arraySet(b,a.input,a.next_in,e,c),1===a.state.wrap?a.adler=G(a.adler,b,e,c):2===a.state.wrap&&(a.adler=H(a.adler,b,e,c)),a.next_in+=e,a.total_in+=e,e)}function l(a,b){var c,d,e=a.max_chain_length,f=a.strstart,g=a.prev_length,h=a.nice_match,i=a.strstart>a.w_size-la?a.strstart-(a.w_size-la):0,j=a.window,k=a.w_mask,l=a.prev,m=a.strstart+ka,n=j[f+g-1],o=j[f+g];a.prev_length>=a.good_match&&(e>>=2),h>a.lookahead&&(h=a.lookahead);do if(c=b,j[c+g]===o&&j[c+g-1]===n&&j[c]===j[f]&&j[++c]===j[f+1]){f+=2,c++;do;while(j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&f<m);if(d=ka-(m-f),f=m-ka,d>g){if(a.match_start=b,g=d,d>=h)break;n=j[f+g-1],o=j[f+g]}}while((b=l[b&k])>i&&0!==--e);return g<=a.lookahead?g:a.lookahead}function m(a){var b,c,d,e,f,g=a.w_size;do{if(e=a.window_size-a.lookahead-a.strstart,a.strstart>=g+(g-la)){E.arraySet(a.window,a.window,g,g,0),a.match_start-=g,a.strstart-=g,a.block_start-=g,c=a.hash_size,b=c;do d=a.head[--b],a.head[b]=d>=g?d-g:0;while(--c);c=g,b=c;do d=a.prev[--b],a.prev[b]=d>=g?d-g:0;while(--c);e+=g}if(0===a.strm.avail_in)break;if(c=k(a.strm,a.window,a.strstart+a.lookahead,e),a.lookahead+=c,a.lookahead+a.insert>=ja)for(f=a.strstart-a.insert,a.ins_h=a.window[f],a.ins_h=(a.ins_h<<a.hash_shift^a.window[f+1])&a.hash_mask;a.insert&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[f+ja-1])&a.hash_mask,a.prev[f&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=f,f++,a.insert--,!(a.lookahead+a.insert<ja)););}while(a.lookahead<la&&0!==a.strm.avail_in)}function n(a,b){var c=65535;for(c>a.pending_buf_size-5&&(c=a.pending_buf_size-5);;){if(a.lookahead<=1){if(m(a),0===a.lookahead&&b===J)return ua;if(0===a.lookahead)break}a.strstart+=a.lookahead,a.lookahead=0;var d=a.block_start+c;if((0===a.strstart||a.strstart>=d)&&(a.lookahead=a.strstart-d,a.strstart=d,h(a,!1),0===a.strm.avail_out))return ua;if(a.strstart-a.block_start>=a.w_size-la&&(h(a,!1),0===a.strm.avail_out))return ua}return a.insert=0,b===M?(h(a,!0),0===a.strm.avail_out?wa:xa):a.strstart>a.block_start&&(h(a,!1),0===a.strm.avail_out)?ua:ua}function o(a,b){for(var c,d;;){if(a.lookahead<la){if(m(a),a.lookahead<la&&b===J)return ua;if(0===a.lookahead)break}if(c=0,a.lookahead>=ja&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+ja-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart),0!==c&&a.strstart-c<=a.w_size-la&&(a.match_length=l(a,c)),a.match_length>=ja)if(d=F._tr_tally(a,a.strstart-a.match_start,a.match_length-ja),a.lookahead-=a.match_length,a.match_length<=a.max_lazy_match&&a.lookahead>=ja){a.match_length--;do a.strstart++,a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+ja-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart;while(0!==--a.match_length);a.strstart++}else a.strstart+=a.match_length,a.match_length=0,a.ins_h=a.window[a.strstart],a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+1])&a.hash_mask;else d=F._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++;if(d&&(h(a,!1),0===a.strm.avail_out))return ua}return a.insert=a.strstart<ja-1?a.strstart:ja-1,b===M?(h(a,!0),0===a.strm.avail_out?wa:xa):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?ua:va}function p(a,b){for(var c,d,e;;){if(a.lookahead<la){if(m(a),a.lookahead<la&&b===J)return ua;if(0===a.lookahead)break}if(c=0,a.lookahead>=ja&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+ja-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart),a.prev_length=a.match_length,a.prev_match=a.match_start,a.match_length=ja-1,0!==c&&a.prev_length<a.max_lazy_match&&a.strstart-c<=a.w_size-la&&(a.match_length=l(a,c),a.match_length<=5&&(a.strategy===U||a.match_length===ja&&a.strstart-a.match_start>4096)&&(a.match_length=ja-1)),a.prev_length>=ja&&a.match_length<=a.prev_length){e=a.strstart+a.lookahead-ja,d=F._tr_tally(a,a.strstart-1-a.prev_match,a.prev_length-ja),a.lookahead-=a.prev_length-1,a.prev_length-=2;do++a.strstart<=e&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+ja-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart);while(0!==--a.prev_length);if(a.match_available=0,a.match_length=ja-1,a.strstart++,d&&(h(a,!1),0===a.strm.avail_out))return ua}else if(a.match_available){if(d=F._tr_tally(a,0,a.window[a.strstart-1]),d&&h(a,!1),a.strstart++,a.lookahead--,0===a.strm.avail_out)return ua}else a.match_available=1,a.strstart++,a.lookahead--}return a.match_available&&(d=F._tr_tally(a,0,a.window[a.strstart-1]),a.match_available=0),a.insert=a.strstart<ja-1?a.strstart:ja-1,b===M?(h(a,!0),0===a.strm.avail_out?wa:xa):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?ua:va}function q(a,b){for(var c,d,e,f,g=a.window;;){if(a.lookahead<=ka){if(m(a),a.lookahead<=ka&&b===J)return ua;if(0===a.lookahead)break}if(a.match_length=0,a.lookahead>=ja&&a.strstart>0&&(e=a.strstart-1,d=g[e],d===g[++e]&&d===g[++e]&&d===g[++e])){f=a.strstart+ka;do;while(d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&e<f);a.match_length=ka-(f-e),a.match_length>a.lookahead&&(a.match_length=a.lookahead)}if(a.match_length>=ja?(c=F._tr_tally(a,1,a.match_length-ja),a.lookahead-=a.match_length,a.strstart+=a.match_length,a.match_length=0):(c=F._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++),c&&(h(a,!1),0===a.strm.avail_out))return ua}return a.insert=0,b===M?(h(a,!0),0===a.strm.avail_out?wa:xa):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?ua:va}function r(a,b){for(var c;;){if(0===a.lookahead&&(m(a),0===a.lookahead)){if(b===J)return ua;break}if(a.match_length=0,c=F._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++,c&&(h(a,!1),0===a.strm.avail_out))return ua}return a.insert=0,b===M?(h(a,!0),0===a.strm.avail_out?wa:xa):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?ua:va}function s(a,b,c,d,e){this.good_length=a,this.max_lazy=b,this.nice_length=c,this.max_chain=d,this.func=e}function t(a){a.window_size=2*a.w_size,f(a.head),a.max_lazy_match=D[a.level].max_lazy,a.good_match=D[a.level].good_length,a.nice_match=D[a.level].nice_length,a.max_chain_length=D[a.level].max_chain,a.strstart=0,a.block_start=0,a.lookahead=0,a.insert=0,a.match_length=a.prev_length=ja-1,a.match_available=0,a.ins_h=0}function u(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=$,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new E.Buf16(2*ha),this.dyn_dtree=new E.Buf16(2*(2*fa+1)),this.bl_tree=new E.Buf16(2*(2*ga+1)),f(this.dyn_ltree),f(this.dyn_dtree),f(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new E.Buf16(ia+1),this.heap=new E.Buf16(2*ea+1),f(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new E.Buf16(2*ea+1),f(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function v(a){var b;return a&&a.state?(a.total_in=a.total_out=0,a.data_type=Z,b=a.state,b.pending=0,b.pending_out=0,b.wrap<0&&(b.wrap=-b.wrap),b.status=b.wrap?na:sa,a.adler=2===b.wrap?0:1,b.last_flush=J,F._tr_init(b),O):d(a,Q)}function w(a){var b=v(a);return b===O&&t(a.state),b}function x(a,b){return a&&a.state?2!==a.state.wrap?Q:(a.state.gzhead=b,O):Q}function y(a,b,c,e,f,g){if(!a)return Q;var h=1;if(b===T&&(b=6),e<0?(h=0,e=-e):e>15&&(h=2,e-=16),f<1||f>_||c!==$||e<8||e>15||b<0||b>9||g<0||g>X)return d(a,Q);8===e&&(e=9);var i=new u;return a.state=i,i.strm=a,i.wrap=h,i.gzhead=null,i.w_bits=e,i.w_size=1<<i.w_bits,i.w_mask=i.w_size-1,i.hash_bits=f+7,i.hash_size=1<<i.hash_bits,i.hash_mask=i.hash_size-1,i.hash_shift=~~((i.hash_bits+ja-1)/ja),i.window=new E.Buf8(2*i.w_size),i.head=new E.Buf16(i.hash_size),i.prev=new E.Buf16(i.w_size),i.lit_bufsize=1<<f+6,i.pending_buf_size=4*i.lit_bufsize,i.pending_buf=new E.Buf8(i.pending_buf_size),i.d_buf=1*i.lit_bufsize,i.l_buf=3*i.lit_bufsize,i.level=b,i.strategy=g,i.method=c,w(a)}function z(a,b){return y(a,b,$,aa,ba,Y)}function A(a,b){var c,h,k,l;if(!a||!a.state||b>N||b<0)return a?d(a,Q):Q;if(h=a.state,!a.output||!a.input&&0!==a.avail_in||h.status===ta&&b!==M)return d(a,0===a.avail_out?S:Q);if(h.strm=a,c=h.last_flush,h.last_flush=b,h.status===na)if(2===h.wrap)a.adler=0,i(h,31),i(h,139),i(h,8),h.gzhead?(i(h,(h.gzhead.text?1:0)+(h.gzhead.hcrc?2:0)+(h.gzhead.extra?4:0)+(h.gzhead.name?8:0)+(h.gzhead.comment?16:0)),i(h,255&h.gzhead.time),i(h,h.gzhead.time>>8&255),i(h,h.gzhead.time>>16&255),i(h,h.gzhead.time>>24&255),i(h,9===h.level?2:h.strategy>=V||h.level<2?4:0),i(h,255&h.gzhead.os),h.gzhead.extra&&h.gzhead.extra.length&&(i(h,255&h.gzhead.extra.length),i(h,h.gzhead.extra.length>>8&255)),h.gzhead.hcrc&&(a.adler=H(a.adler,h.pending_buf,h.pending,0)),h.gzindex=0,h.status=oa):(i(h,0),i(h,0),i(h,0),i(h,0),i(h,0),i(h,9===h.level?2:h.strategy>=V||h.level<2?4:0),i(h,ya),h.status=sa);else{var m=$+(h.w_bits-8<<4)<<8,n=-1;n=h.strategy>=V||h.level<2?0:h.level<6?1:6===h.level?2:3,m|=n<<6,0!==h.strstart&&(m|=ma),m+=31-m%31,h.status=sa,j(h,m),0!==h.strstart&&(j(h,a.adler>>>16),j(h,65535&a.adler)),a.adler=1}if(h.status===oa)if(h.gzhead.extra){for(k=h.pending;h.gzindex<(65535&h.gzhead.extra.length)&&(h.pending!==h.pending_buf_size||(h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending!==h.pending_buf_size));)i(h,255&h.gzhead.extra[h.gzindex]),h.gzindex++;h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),h.gzindex===h.gzhead.extra.length&&(h.gzindex=0,h.status=pa)}else h.status=pa;if(h.status===pa)if(h.gzhead.name){k=h.pending;do{if(h.pending===h.pending_buf_size&&(h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending===h.pending_buf_size)){l=1;break}l=h.gzindex<h.gzhead.name.length?255&h.gzhead.name.charCodeAt(h.gzindex++):0,i(h,l)}while(0!==l);h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),0===l&&(h.gzindex=0,h.status=qa)}else h.status=qa;if(h.status===qa)if(h.gzhead.comment){k=h.pending;do{if(h.pending===h.pending_buf_size&&(h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending===h.pending_buf_size)){l=1;break}l=h.gzindex<h.gzhead.comment.length?255&h.gzhead.comment.charCodeAt(h.gzindex++):0,i(h,l)}while(0!==l);h.gzhead.hcrc&&h.pending>k&&(a.adler=H(a.adler,h.pending_buf,h.pending-k,k)),0===l&&(h.status=ra)}else h.status=ra;if(h.status===ra&&(h.gzhead.hcrc?(h.pending+2>h.pending_buf_size&&g(a),h.pending+2<=h.pending_buf_size&&(i(h,255&a.adler),i(h,a.adler>>8&255),a.adler=0,h.status=sa)):h.status=sa),0!==h.pending){if(g(a),0===a.avail_out)return h.last_flush=-1,O}else if(0===a.avail_in&&e(b)<=e(c)&&b!==M)return d(a,S);if(h.status===ta&&0!==a.avail_in)return d(a,S);if(0!==a.avail_in||0!==h.lookahead||b!==J&&h.status!==ta){var o=h.strategy===V?r(h,b):h.strategy===W?q(h,b):D[h.level].func(h,b);if(o!==wa&&o!==xa||(h.status=ta),o===ua||o===wa)return 0===a.avail_out&&(h.last_flush=-1),O;if(o===va&&(b===K?F._tr_align(h):b!==N&&(F._tr_stored_block(h,0,0,!1),b===L&&(f(h.head),0===h.lookahead&&(h.strstart=0,h.block_start=0,h.insert=0))),g(a),0===a.avail_out))return h.last_flush=-1,O}return b!==M?O:h.wrap<=0?P:(2===h.wrap?(i(h,255&a.adler),i(h,a.adler>>8&255),i(h,a.adler>>16&255),i(h,a.adler>>24&255),i(h,255&a.total_in),i(h,a.total_in>>8&255),i(h,a.total_in>>16&255),i(h,a.total_in>>24&255)):(j(h,a.adler>>>16),j(h,65535&a.adler)),g(a),h.wrap>0&&(h.wrap=-h.wrap),0!==h.pending?O:P)}function B(a){var b;return a&&a.state?(b=a.state.status,b!==na&&b!==oa&&b!==pa&&b!==qa&&b!==ra&&b!==sa&&b!==ta?d(a,Q):(a.state=null,b===sa?d(a,R):O)):Q}function C(a,b){var c,d,e,g,h,i,j,k,l=b.length;if(!a||!a.state)return Q;if(c=a.state,g=c.wrap,2===g||1===g&&c.status!==na||c.lookahead)return Q;for(1===g&&(a.adler=G(a.adler,b,l,0)),c.wrap=0,l>=c.w_size&&(0===g&&(f(c.head),c.strstart=0,c.block_start=0,c.insert=0),k=new E.Buf8(c.w_size),E.arraySet(k,b,l-c.w_size,c.w_size,0),b=k,l=c.w_size),h=a.avail_in,i=a.next_in,j=a.input,a.avail_in=l,a.next_in=0,a.input=b,m(c);c.lookahead>=ja;){d=c.strstart,e=c.lookahead-(ja-1);do c.ins_h=(c.ins_h<<c.hash_shift^c.window[d+ja-1])&c.hash_mask,c.prev[d&c.w_mask]=c.head[c.ins_h],c.head[c.ins_h]=d,d++;while(--e);c.strstart=d,c.lookahead=ja-1,m(c)}return c.strstart+=c.lookahead,c.block_start=c.strstart,c.insert=c.lookahead,c.lookahead=0,c.match_length=c.prev_length=ja-1,c.match_available=0,a.next_in=i,a.input=j,a.avail_in=h,c.wrap=g,O}var D,E=a("../utils/common"),F=a("./trees"),G=a("./adler32"),H=a("./crc32"),I=a("./messages"),J=0,K=1,L=3,M=4,N=5,O=0,P=1,Q=-2,R=-3,S=-5,T=-1,U=1,V=2,W=3,X=4,Y=0,Z=2,$=8,_=9,aa=15,ba=8,ca=29,da=256,ea=da+1+ca,fa=30,ga=19,ha=2*ea+1,ia=15,ja=3,ka=258,la=ka+ja+1,ma=32,na=42,oa=69,pa=73,qa=91,ra=103,sa=113,ta=666,ua=1,va=2,wa=3,xa=4,ya=3;D=[new s(0,0,0,0,n),new s(4,4,8,4,o),new s(4,5,16,8,o),new s(4,6,32,32,o),new s(4,4,16,16,p),new s(8,16,32,32,p),new s(8,16,128,128,p),new s(8,32,128,256,p),new s(32,128,258,1024,p),new s(32,258,258,4096,p)],c.deflateInit=z,c.deflateInit2=y,c.deflateReset=w,c.deflateResetKeep=v,c.deflateSetHeader=x,c.deflate=A,c.deflateEnd=B,c.deflateSetDictionary=C,c.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":62,"./adler32":64,"./crc32":66,"./messages":72,"./trees":73}],68:[function(a,b,c){"use strict";function d(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}b.exports=d},{}],69:[function(a,b,c){"use strict";var d=30,e=12;b.exports=function(a,b){var c,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C;c=a.state,f=a.next_in,B=a.input,g=f+(a.avail_in-5),h=a.next_out,C=a.output,i=h-(b-a.avail_out),j=h+(a.avail_out-257),k=c.dmax,l=c.wsize,m=c.whave,n=c.wnext,o=c.window,p=c.hold,q=c.bits,r=c.lencode,s=c.distcode,t=(1<<c.lenbits)-1,u=(1<<c.distbits)-1;a:do{q<15&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=r[p&t];b:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,0===w)C[h++]=65535&v;else{if(!(16&w)){if(0===(64&w)){v=r[(65535&v)+(p&(1<<w)-1)];continue b}if(32&w){c.mode=e;break a}a.msg="invalid literal/length code",c.mode=d;break a}x=65535&v,w&=15,w&&(q<w&&(p+=B[f++]<<q,q+=8),x+=p&(1<<w)-1,p>>>=w,q-=w),q<15&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=s[p&u];c:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,!(16&w)){if(0===(64&w)){v=s[(65535&v)+(p&(1<<w)-1)];continue c}a.msg="invalid distance code",c.mode=d;break a}if(y=65535&v,w&=15,q<w&&(p+=B[f++]<<q,q+=8,q<w&&(p+=B[f++]<<q,q+=8)),y+=p&(1<<w)-1,y>k){a.msg="invalid distance too far back",c.mode=d;break a}if(p>>>=w,q-=w,w=h-i,y>w){if(w=y-w,w>m&&c.sane){a.msg="invalid distance too far back",c.mode=d;break a}if(z=0,A=o,0===n){if(z+=l-w,w<x){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}else if(n<w){if(z+=l+n-w,w-=n,w<x){x-=w;do C[h++]=o[z++];while(--w);if(z=0,n<x){w=n,x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}}else if(z+=n-w,w<x){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}for(;x>2;)C[h++]=A[z++],C[h++]=A[z++],C[h++]=A[z++],x-=3;x&&(C[h++]=A[z++],x>1&&(C[h++]=A[z++]))}else{z=h-y;do C[h++]=C[z++],C[h++]=C[z++],C[h++]=C[z++],x-=3;while(x>2);x&&(C[h++]=C[z++],x>1&&(C[h++]=C[z++]))}break}}break}}while(f<g&&h<j);x=q>>3,f-=x,q-=x<<3,p&=(1<<q)-1,a.next_in=f,a.next_out=h,a.avail_in=f<g?5+(g-f):5-(f-g),a.avail_out=h<j?257+(j-h):257-(h-j),c.hold=p,c.bits=q}},{}],70:[function(a,b,c){"use strict";function d(a){return(a>>>24&255)+(a>>>8&65280)+((65280&a)<<8)+((255&a)<<24)}function e(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new s.Buf16(320),this.work=new s.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function f(a){var b;return a&&a.state?(b=a.state,a.total_in=a.total_out=b.total=0,a.msg="",b.wrap&&(a.adler=1&b.wrap),b.mode=L,b.last=0,b.havedict=0,b.dmax=32768,b.head=null,b.hold=0,b.bits=0,b.lencode=b.lendyn=new s.Buf32(pa),b.distcode=b.distdyn=new s.Buf32(qa),b.sane=1,b.back=-1,D):G}function g(a){var b;return a&&a.state?(b=a.state,b.wsize=0,b.whave=0,b.wnext=0,f(a)):G}function h(a,b){var c,d;return a&&a.state?(d=a.state,b<0?(c=0,b=-b):(c=(b>>4)+1,b<48&&(b&=15)),b&&(b<8||b>15)?G:(null!==d.window&&d.wbits!==b&&(d.window=null),d.wrap=c,d.wbits=b,g(a))):G}function i(a,b){var c,d;return a?(d=new e,a.state=d,d.window=null,c=h(a,b),c!==D&&(a.state=null),c):G}function j(a){return i(a,sa)}function k(a){if(ta){var b;for(q=new s.Buf32(512),r=new s.Buf32(32),b=0;b<144;)a.lens[b++]=8;for(;b<256;)a.lens[b++]=9;for(;b<280;)a.lens[b++]=7;for(;b<288;)a.lens[b++]=8;for(w(y,a.lens,0,288,q,0,a.work,{bits:9}),b=0;b<32;)a.lens[b++]=5;w(z,a.lens,0,32,r,0,a.work,{bits:5}),ta=!1}a.lencode=q,a.lenbits=9,a.distcode=r,a.distbits=5}function l(a,b,c,d){var e,f=a.state;return null===f.window&&(f.wsize=1<<f.wbits,f.wnext=0,f.whave=0,f.window=new s.Buf8(f.wsize)),d>=f.wsize?(s.arraySet(f.window,b,c-f.wsize,f.wsize,0),f.wnext=0,f.whave=f.wsize):(e=f.wsize-f.wnext,e>d&&(e=d),s.arraySet(f.window,b,c-d,e,f.wnext),d-=e,d?(s.arraySet(f.window,b,c-d,d,0),f.wnext=d,f.whave=f.wsize):(f.wnext+=e,f.wnext===f.wsize&&(f.wnext=0),f.whave<f.wsize&&(f.whave+=e))),0}function m(a,b){var c,e,f,g,h,i,j,m,n,o,p,q,r,pa,qa,ra,sa,ta,ua,va,wa,xa,ya,za,Aa=0,Ba=new s.Buf8(4),Ca=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!a||!a.state||!a.output||!a.input&&0!==a.avail_in)return G;c=a.state,c.mode===W&&(c.mode=X),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,o=i,p=j,xa=D;a:for(;;)switch(c.mode){case L:if(0===c.wrap){c.mode=X;break}for(;n<16;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(2&c.wrap&&35615===m){c.check=0,Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=u(c.check,Ba,2,0),m=0,n=0,c.mode=M;break}if(c.flags=0,c.head&&(c.head.done=!1),!(1&c.wrap)||(((255&m)<<8)+(m>>8))%31){a.msg="incorrect header check",c.mode=ma;break}if((15&m)!==K){a.msg="unknown compression method",c.mode=ma;break}if(m>>>=4,n-=4,wa=(15&m)+8,0===c.wbits)c.wbits=wa;else if(wa>c.wbits){a.msg="invalid window size",c.mode=ma;break}c.dmax=1<<wa,a.adler=c.check=1,c.mode=512&m?U:W,m=0,n=0;break;case M:for(;n<16;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.flags=m,(255&c.flags)!==K){a.msg="unknown compression method",c.mode=ma;break}if(57344&c.flags){a.msg="unknown header flags set",c.mode=ma;break}c.head&&(c.head.text=m>>8&1),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=u(c.check,Ba,2,0)),m=0,n=0,c.mode=N;case N:for(;n<32;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.time=m),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,Ba[2]=m>>>16&255,Ba[3]=m>>>24&255,c.check=u(c.check,Ba,4,0)),m=0,n=0,c.mode=O;case O:for(;n<16;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.xflags=255&m,c.head.os=m>>8),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=u(c.check,Ba,2,0)),m=0,n=0,c.mode=P;case P:if(1024&c.flags){for(;n<16;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length=m,c.head&&(c.head.extra_len=m),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=u(c.check,Ba,2,0)),m=0,n=0}else c.head&&(c.head.extra=null);c.mode=Q;case Q:if(1024&c.flags&&(q=c.length,q>i&&(q=i),q&&(c.head&&(wa=c.head.extra_len-c.length,c.head.extra||(c.head.extra=new Array(c.head.extra_len)),s.arraySet(c.head.extra,e,g,q,wa)),512&c.flags&&(c.check=u(c.check,e,q,g)),i-=q,g+=q,c.length-=q),c.length))break a;c.length=0,c.mode=R;case R:if(2048&c.flags){if(0===i)break a;q=0;do wa=e[g+q++],c.head&&wa&&c.length<65536&&(c.head.name+=String.fromCharCode(wa));while(wa&&q<i);if(512&c.flags&&(c.check=u(c.check,e,q,g)),i-=q,g+=q,wa)break a}else c.head&&(c.head.name=null);c.length=0,c.mode=S;case S:if(4096&c.flags){if(0===i)break a;q=0;do wa=e[g+q++],c.head&&wa&&c.length<65536&&(c.head.comment+=String.fromCharCode(wa));while(wa&&q<i);if(512&c.flags&&(c.check=u(c.check,e,q,g)),i-=q,g+=q,wa)break a}else c.head&&(c.head.comment=null);c.mode=T;case T:if(512&c.flags){for(;n<16;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(65535&c.check)){a.msg="header crc mismatch",c.mode=ma;break}m=0,n=0}c.head&&(c.head.hcrc=c.flags>>9&1,c.head.done=!0),a.adler=c.check=0,c.mode=W;break;case U:for(;n<32;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}a.adler=c.check=d(m),m=0,n=0,c.mode=V;case V:if(0===c.havedict)return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,F;a.adler=c.check=1,c.mode=W;case W:if(b===B||b===C)break a;case X:if(c.last){m>>>=7&n,n-=7&n,c.mode=ja;break}for(;n<3;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}switch(c.last=1&m,m>>>=1,n-=1,3&m){case 0:c.mode=Y;break;case 1:if(k(c),c.mode=ca,b===C){m>>>=2,n-=2;break a}break;case 2:c.mode=_;break;case 3:a.msg="invalid block type",c.mode=ma}m>>>=2,n-=2;break;case Y:for(m>>>=7&n,n-=7&n;n<32;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if((65535&m)!==(m>>>16^65535)){a.msg="invalid stored block lengths",c.mode=ma;break}if(c.length=65535&m,m=0,n=0,c.mode=Z,b===C)break a;case Z:c.mode=$;case $:if(q=c.length){if(q>i&&(q=i),q>j&&(q=j),0===q)break a;s.arraySet(f,e,g,q,h),i-=q,g+=q,j-=q,h+=q,c.length-=q;break}c.mode=W;break;case _:for(;n<14;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.nlen=(31&m)+257,m>>>=5,n-=5,c.ndist=(31&m)+1,m>>>=5,n-=5,c.ncode=(15&m)+4,m>>>=4,n-=4,c.nlen>286||c.ndist>30){a.msg="too many length or distance symbols",c.mode=ma;break}c.have=0,c.mode=aa;case aa:for(;c.have<c.ncode;){for(;n<3;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.lens[Ca[c.have++]]=7&m,m>>>=3,n-=3}for(;c.have<19;)c.lens[Ca[c.have++]]=0;if(c.lencode=c.lendyn,c.lenbits=7,ya={bits:c.lenbits},xa=w(x,c.lens,0,19,c.lencode,0,c.work,ya),c.lenbits=ya.bits,xa){a.msg="invalid code lengths set",c.mode=ma;break}c.have=0,c.mode=ba;case ba:for(;c.have<c.nlen+c.ndist;){for(;Aa=c.lencode[m&(1<<c.lenbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(qa<=n);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(sa<16)m>>>=qa,n-=qa,c.lens[c.have++]=sa;else{if(16===sa){for(za=qa+2;n<za;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m>>>=qa,n-=qa,0===c.have){a.msg="invalid bit length repeat",c.mode=ma;break}wa=c.lens[c.have-1],q=3+(3&m),m>>>=2,n-=2}else if(17===sa){for(za=qa+3;n<za;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qa,n-=qa,wa=0,q=3+(7&m),m>>>=3,n-=3}else{for(za=qa+7;n<za;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qa,n-=qa,wa=0,q=11+(127&m),m>>>=7,n-=7}if(c.have+q>c.nlen+c.ndist){a.msg="invalid bit length repeat",c.mode=ma;break}for(;q--;)c.lens[c.have++]=wa}}if(c.mode===ma)break;if(0===c.lens[256]){a.msg="invalid code -- missing end-of-block",c.mode=ma;break}if(c.lenbits=9,ya={bits:c.lenbits},xa=w(y,c.lens,0,c.nlen,c.lencode,0,c.work,ya),c.lenbits=ya.bits,xa){a.msg="invalid literal/lengths set",c.mode=ma;break}if(c.distbits=6,c.distcode=c.distdyn,ya={bits:c.distbits},xa=w(z,c.lens,c.nlen,c.ndist,c.distcode,0,c.work,ya),c.distbits=ya.bits,xa){a.msg="invalid distances set",c.mode=ma;break}if(c.mode=ca,b===C)break a;case ca:c.mode=da;case da:if(i>=6&&j>=258){a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,v(a,p),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,c.mode===W&&(c.back=-1);break}for(c.back=0;Aa=c.lencode[m&(1<<c.lenbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(qa<=n);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(ra&&0===(240&ra)){for(ta=qa,ua=ra,va=sa;Aa=c.lencode[va+((m&(1<<ta+ua)-1)>>ta)],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(ta+qa<=n);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=ta,n-=ta,c.back+=ta}if(m>>>=qa,n-=qa,c.back+=qa,c.length=sa,0===ra){c.mode=ia;break}if(32&ra){c.back=-1,c.mode=W;break}if(64&ra){a.msg="invalid literal/length code",c.mode=ma;break}c.extra=15&ra,c.mode=ea;case ea:if(c.extra){for(za=c.extra;n<za;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}c.was=c.length,c.mode=fa;case fa:for(;Aa=c.distcode[m&(1<<c.distbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(qa<=n);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(0===(240&ra)){for(ta=qa,ua=ra,va=sa;Aa=c.distcode[va+((m&(1<<ta+ua)-1)>>ta)],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(ta+qa<=n);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=ta,n-=ta,c.back+=ta}if(m>>>=qa,n-=qa,c.back+=qa,64&ra){a.msg="invalid distance code",c.mode=ma;break}c.offset=sa,c.extra=15&ra,c.mode=ga;case ga:if(c.extra){for(za=c.extra;n<za;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.offset+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}if(c.offset>c.dmax){a.msg="invalid distance too far back",c.mode=ma;break}c.mode=ha;case ha:if(0===j)break a;if(q=p-j,c.offset>q){if(q=c.offset-q,q>c.whave&&c.sane){a.msg="invalid distance too far back",c.mode=ma;break}q>c.wnext?(q-=c.wnext,r=c.wsize-q):r=c.wnext-q,q>c.length&&(q=c.length),pa=c.window}else pa=f,r=h-c.offset,q=c.length;q>j&&(q=j),j-=q,c.length-=q;do f[h++]=pa[r++];while(--q);0===c.length&&(c.mode=da);break;case ia:if(0===j)break a;f[h++]=c.length,j--,c.mode=da;break;case ja:if(c.wrap){for(;n<32;){if(0===i)break a;i--,m|=e[g++]<<n,n+=8}if(p-=j,a.total_out+=p,c.total+=p,p&&(a.adler=c.check=c.flags?u(c.check,f,p,h-p):t(c.check,f,p,h-p)),p=j,(c.flags?m:d(m))!==c.check){a.msg="incorrect data check",c.mode=ma;break}m=0,n=0}c.mode=ka;case ka:if(c.wrap&&c.flags){for(;n<32;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(4294967295&c.total)){a.msg="incorrect length check",c.mode=ma;break}m=0,n=0}c.mode=la;case la:xa=E;break a;case ma:xa=H;break a;case na:return I;case oa:default:return G}return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,(c.wsize||p!==a.avail_out&&c.mode<ma&&(c.mode<ja||b!==A))&&l(a,a.output,a.next_out,p-a.avail_out)?(c.mode=na,I):(o-=a.avail_in,p-=a.avail_out,a.total_in+=o,a.total_out+=p,c.total+=p,c.wrap&&p&&(a.adler=c.check=c.flags?u(c.check,f,p,a.next_out-p):t(c.check,f,p,a.next_out-p)),a.data_type=c.bits+(c.last?64:0)+(c.mode===W?128:0)+(c.mode===ca||c.mode===Z?256:0),(0===o&&0===p||b===A)&&xa===D&&(xa=J),xa)}function n(a){if(!a||!a.state)return G;var b=a.state;return b.window&&(b.window=null),a.state=null,D}function o(a,b){var c;return a&&a.state?(c=a.state,0===(2&c.wrap)?G:(c.head=b,b.done=!1,D)):G}function p(a,b){var c,d,e,f=b.length;return a&&a.state?(c=a.state,0!==c.wrap&&c.mode!==V?G:c.mode===V&&(d=1,d=t(d,b,f,0),d!==c.check)?H:(e=l(a,b,f,f))?(c.mode=na,I):(c.havedict=1,D)):G}var q,r,s=a("../utils/common"),t=a("./adler32"),u=a("./crc32"),v=a("./inffast"),w=a("./inftrees"),x=0,y=1,z=2,A=4,B=5,C=6,D=0,E=1,F=2,G=-2,H=-3,I=-4,J=-5,K=8,L=1,M=2,N=3,O=4,P=5,Q=6,R=7,S=8,T=9,U=10,V=11,W=12,X=13,Y=14,Z=15,$=16,_=17,aa=18,ba=19,ca=20,da=21,ea=22,fa=23,ga=24,ha=25,ia=26,ja=27,ka=28,la=29,ma=30,na=31,oa=32,pa=852,qa=592,ra=15,sa=ra,ta=!0;c.inflateReset=g,c.inflateReset2=h,c.inflateResetKeep=f,c.inflateInit=j,c.inflateInit2=i,c.inflate=m,c.inflateEnd=n,c.inflateGetHeader=o,c.inflateSetDictionary=p,c.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":62,"./adler32":64,"./crc32":66,"./inffast":69,"./inftrees":71}],71:[function(a,b,c){"use strict";var d=a("../utils/common"),e=15,f=852,g=592,h=0,i=1,j=2,k=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],l=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],m=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],n=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];b.exports=function(a,b,c,o,p,q,r,s){var t,u,v,w,x,y,z,A,B,C=s.bits,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=null,O=0,P=new d.Buf16(e+1),Q=new d.Buf16(e+1),R=null,S=0;for(D=0;D<=e;D++)P[D]=0;for(E=0;E<o;E++)P[b[c+E]]++;for(H=C,G=e;G>=1&&0===P[G];G--);if(H>G&&(H=G),0===G)return p[q++]=20971520,p[q++]=20971520,s.bits=1,0;for(F=1;F<G&&0===P[F];F++);for(H<F&&(H=F),K=1,D=1;D<=e;D++)if(K<<=1,K-=P[D],K<0)return-1;if(K>0&&(a===h||1!==G))return-1;for(Q[1]=0,D=1;D<e;D++)Q[D+1]=Q[D]+P[D];for(E=0;E<o;E++)0!==b[c+E]&&(r[Q[b[c+E]]++]=E);if(a===h?(N=R=r,y=19):a===i?(N=k,O-=257,R=l,S-=257,y=256):(N=m,R=n,y=-1),M=0,E=0,D=F,x=q,I=H,J=0,v=-1,L=1<<H,w=L-1,a===i&&L>f||a===j&&L>g)return 1;for(;;){z=D-J,r[E]<y?(A=0,B=r[E]):r[E]>y?(A=R[S+r[E]],B=N[O+r[E]]):(A=96,B=0),t=1<<D-J,u=1<<I,F=u;do u-=t,p[x+(M>>J)+u]=z<<24|A<<16|B|0;while(0!==u);for(t=1<<D-1;M&t;)t>>=1;if(0!==t?(M&=t-1,M+=t):M=0,E++,0===--P[D]){if(D===G)break;D=b[c+r[E]]}if(D>H&&(M&w)!==v){for(0===J&&(J=H),x+=F,I=D-J,K=1<<I;I+J<G&&(K-=P[I+J],!(K<=0));)I++,K<<=1;if(L+=1<<I,a===i&&L>f||a===j&&L>g)return 1;v=M&w,p[v]=H<<24|I<<16|x-q|0}}return 0!==M&&(p[x+M]=D-J<<24|64<<16|0),s.bits=H,0}},{"../utils/common":62}],72:[function(a,b,c){"use strict";b.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],73:[function(a,b,c){"use strict";function d(a){for(var b=a.length;--b>=0;)a[b]=0}function e(a,b,c,d,e){this.static_tree=a,this.extra_bits=b,this.extra_base=c,this.elems=d,this.max_length=e,this.has_stree=a&&a.length}function f(a,b){this.dyn_tree=a,this.max_code=0,this.stat_desc=b}function g(a){return a<256?ia[a]:ia[256+(a>>>7)]}function h(a,b){a.pending_buf[a.pending++]=255&b,a.pending_buf[a.pending++]=b>>>8&255}function i(a,b,c){a.bi_valid>X-c?(a.bi_buf|=b<<a.bi_valid&65535,h(a,a.bi_buf),a.bi_buf=b>>X-a.bi_valid,a.bi_valid+=c-X):(a.bi_buf|=b<<a.bi_valid&65535,a.bi_valid+=c)}function j(a,b,c){i(a,c[2*b],c[2*b+1])}function k(a,b){var c=0;do c|=1&a,a>>>=1,c<<=1;while(--b>0);return c>>>1}function l(a){16===a.bi_valid?(h(a,a.bi_buf),a.bi_buf=0,a.bi_valid=0):a.bi_valid>=8&&(a.pending_buf[a.pending++]=255&a.bi_buf,a.bi_buf>>=8,a.bi_valid-=8)}function m(a,b){var c,d,e,f,g,h,i=b.dyn_tree,j=b.max_code,k=b.stat_desc.static_tree,l=b.stat_desc.has_stree,m=b.stat_desc.extra_bits,n=b.stat_desc.extra_base,o=b.stat_desc.max_length,p=0;for(f=0;f<=W;f++)a.bl_count[f]=0;for(i[2*a.heap[a.heap_max]+1]=0,
c=a.heap_max+1;c<V;c++)d=a.heap[c],f=i[2*i[2*d+1]+1]+1,f>o&&(f=o,p++),i[2*d+1]=f,d>j||(a.bl_count[f]++,g=0,d>=n&&(g=m[d-n]),h=i[2*d],a.opt_len+=h*(f+g),l&&(a.static_len+=h*(k[2*d+1]+g)));if(0!==p){do{for(f=o-1;0===a.bl_count[f];)f--;a.bl_count[f]--,a.bl_count[f+1]+=2,a.bl_count[o]--,p-=2}while(p>0);for(f=o;0!==f;f--)for(d=a.bl_count[f];0!==d;)e=a.heap[--c],e>j||(i[2*e+1]!==f&&(a.opt_len+=(f-i[2*e+1])*i[2*e],i[2*e+1]=f),d--)}}function n(a,b,c){var d,e,f=new Array(W+1),g=0;for(d=1;d<=W;d++)f[d]=g=g+c[d-1]<<1;for(e=0;e<=b;e++){var h=a[2*e+1];0!==h&&(a[2*e]=k(f[h]++,h))}}function o(){var a,b,c,d,f,g=new Array(W+1);for(c=0,d=0;d<Q-1;d++)for(ka[d]=c,a=0;a<1<<ba[d];a++)ja[c++]=d;for(ja[c-1]=d,f=0,d=0;d<16;d++)for(la[d]=f,a=0;a<1<<ca[d];a++)ia[f++]=d;for(f>>=7;d<T;d++)for(la[d]=f<<7,a=0;a<1<<ca[d]-7;a++)ia[256+f++]=d;for(b=0;b<=W;b++)g[b]=0;for(a=0;a<=143;)ga[2*a+1]=8,a++,g[8]++;for(;a<=255;)ga[2*a+1]=9,a++,g[9]++;for(;a<=279;)ga[2*a+1]=7,a++,g[7]++;for(;a<=287;)ga[2*a+1]=8,a++,g[8]++;for(n(ga,S+1,g),a=0;a<T;a++)ha[2*a+1]=5,ha[2*a]=k(a,5);ma=new e(ga,ba,R+1,S,W),na=new e(ha,ca,0,T,W),oa=new e(new Array(0),da,0,U,Y)}function p(a){var b;for(b=0;b<S;b++)a.dyn_ltree[2*b]=0;for(b=0;b<T;b++)a.dyn_dtree[2*b]=0;for(b=0;b<U;b++)a.bl_tree[2*b]=0;a.dyn_ltree[2*Z]=1,a.opt_len=a.static_len=0,a.last_lit=a.matches=0}function q(a){a.bi_valid>8?h(a,a.bi_buf):a.bi_valid>0&&(a.pending_buf[a.pending++]=a.bi_buf),a.bi_buf=0,a.bi_valid=0}function r(a,b,c,d){q(a),d&&(h(a,c),h(a,~c)),G.arraySet(a.pending_buf,a.window,b,c,a.pending),a.pending+=c}function s(a,b,c,d){var e=2*b,f=2*c;return a[e]<a[f]||a[e]===a[f]&&d[b]<=d[c]}function t(a,b,c){for(var d=a.heap[c],e=c<<1;e<=a.heap_len&&(e<a.heap_len&&s(b,a.heap[e+1],a.heap[e],a.depth)&&e++,!s(b,d,a.heap[e],a.depth));)a.heap[c]=a.heap[e],c=e,e<<=1;a.heap[c]=d}function u(a,b,c){var d,e,f,h,k=0;if(0!==a.last_lit)do d=a.pending_buf[a.d_buf+2*k]<<8|a.pending_buf[a.d_buf+2*k+1],e=a.pending_buf[a.l_buf+k],k++,0===d?j(a,e,b):(f=ja[e],j(a,f+R+1,b),h=ba[f],0!==h&&(e-=ka[f],i(a,e,h)),d--,f=g(d),j(a,f,c),h=ca[f],0!==h&&(d-=la[f],i(a,d,h)));while(k<a.last_lit);j(a,Z,b)}function v(a,b){var c,d,e,f=b.dyn_tree,g=b.stat_desc.static_tree,h=b.stat_desc.has_stree,i=b.stat_desc.elems,j=-1;for(a.heap_len=0,a.heap_max=V,c=0;c<i;c++)0!==f[2*c]?(a.heap[++a.heap_len]=j=c,a.depth[c]=0):f[2*c+1]=0;for(;a.heap_len<2;)e=a.heap[++a.heap_len]=j<2?++j:0,f[2*e]=1,a.depth[e]=0,a.opt_len--,h&&(a.static_len-=g[2*e+1]);for(b.max_code=j,c=a.heap_len>>1;c>=1;c--)t(a,f,c);e=i;do c=a.heap[1],a.heap[1]=a.heap[a.heap_len--],t(a,f,1),d=a.heap[1],a.heap[--a.heap_max]=c,a.heap[--a.heap_max]=d,f[2*e]=f[2*c]+f[2*d],a.depth[e]=(a.depth[c]>=a.depth[d]?a.depth[c]:a.depth[d])+1,f[2*c+1]=f[2*d+1]=e,a.heap[1]=e++,t(a,f,1);while(a.heap_len>=2);a.heap[--a.heap_max]=a.heap[1],m(a,b),n(f,j,a.bl_count)}function w(a,b,c){var d,e,f=-1,g=b[1],h=0,i=7,j=4;for(0===g&&(i=138,j=3),b[2*(c+1)+1]=65535,d=0;d<=c;d++)e=g,g=b[2*(d+1)+1],++h<i&&e===g||(h<j?a.bl_tree[2*e]+=h:0!==e?(e!==f&&a.bl_tree[2*e]++,a.bl_tree[2*$]++):h<=10?a.bl_tree[2*_]++:a.bl_tree[2*aa]++,h=0,f=e,0===g?(i=138,j=3):e===g?(i=6,j=3):(i=7,j=4))}function x(a,b,c){var d,e,f=-1,g=b[1],h=0,k=7,l=4;for(0===g&&(k=138,l=3),d=0;d<=c;d++)if(e=g,g=b[2*(d+1)+1],!(++h<k&&e===g)){if(h<l){do j(a,e,a.bl_tree);while(0!==--h)}else 0!==e?(e!==f&&(j(a,e,a.bl_tree),h--),j(a,$,a.bl_tree),i(a,h-3,2)):h<=10?(j(a,_,a.bl_tree),i(a,h-3,3)):(j(a,aa,a.bl_tree),i(a,h-11,7));h=0,f=e,0===g?(k=138,l=3):e===g?(k=6,l=3):(k=7,l=4)}}function y(a){var b;for(w(a,a.dyn_ltree,a.l_desc.max_code),w(a,a.dyn_dtree,a.d_desc.max_code),v(a,a.bl_desc),b=U-1;b>=3&&0===a.bl_tree[2*ea[b]+1];b--);return a.opt_len+=3*(b+1)+5+5+4,b}function z(a,b,c,d){var e;for(i(a,b-257,5),i(a,c-1,5),i(a,d-4,4),e=0;e<d;e++)i(a,a.bl_tree[2*ea[e]+1],3);x(a,a.dyn_ltree,b-1),x(a,a.dyn_dtree,c-1)}function A(a){var b,c=4093624447;for(b=0;b<=31;b++,c>>>=1)if(1&c&&0!==a.dyn_ltree[2*b])return I;if(0!==a.dyn_ltree[18]||0!==a.dyn_ltree[20]||0!==a.dyn_ltree[26])return J;for(b=32;b<R;b++)if(0!==a.dyn_ltree[2*b])return J;return I}function B(a){pa||(o(),pa=!0),a.l_desc=new f(a.dyn_ltree,ma),a.d_desc=new f(a.dyn_dtree,na),a.bl_desc=new f(a.bl_tree,oa),a.bi_buf=0,a.bi_valid=0,p(a)}function C(a,b,c,d){i(a,(L<<1)+(d?1:0),3),r(a,b,c,!0)}function D(a){i(a,M<<1,3),j(a,Z,ga),l(a)}function E(a,b,c,d){var e,f,g=0;a.level>0?(a.strm.data_type===K&&(a.strm.data_type=A(a)),v(a,a.l_desc),v(a,a.d_desc),g=y(a),e=a.opt_len+3+7>>>3,f=a.static_len+3+7>>>3,f<=e&&(e=f)):e=f=c+5,c+4<=e&&b!==-1?C(a,b,c,d):a.strategy===H||f===e?(i(a,(M<<1)+(d?1:0),3),u(a,ga,ha)):(i(a,(N<<1)+(d?1:0),3),z(a,a.l_desc.max_code+1,a.d_desc.max_code+1,g+1),u(a,a.dyn_ltree,a.dyn_dtree)),p(a),d&&q(a)}function F(a,b,c){return a.pending_buf[a.d_buf+2*a.last_lit]=b>>>8&255,a.pending_buf[a.d_buf+2*a.last_lit+1]=255&b,a.pending_buf[a.l_buf+a.last_lit]=255&c,a.last_lit++,0===b?a.dyn_ltree[2*c]++:(a.matches++,b--,a.dyn_ltree[2*(ja[c]+R+1)]++,a.dyn_dtree[2*g(b)]++),a.last_lit===a.lit_bufsize-1}var G=a("../utils/common"),H=4,I=0,J=1,K=2,L=0,M=1,N=2,O=3,P=258,Q=29,R=256,S=R+1+Q,T=30,U=19,V=2*S+1,W=15,X=16,Y=7,Z=256,$=16,_=17,aa=18,ba=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],ca=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],da=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],ea=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],fa=512,ga=new Array(2*(S+2));d(ga);var ha=new Array(2*T);d(ha);var ia=new Array(fa);d(ia);var ja=new Array(P-O+1);d(ja);var ka=new Array(Q);d(ka);var la=new Array(T);d(la);var ma,na,oa,pa=!1;c._tr_init=B,c._tr_stored_block=C,c._tr_flush_block=E,c._tr_tally=F,c._tr_align=D},{"../utils/common":62}],74:[function(a,b,c){"use strict";function d(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}b.exports=d},{}]},{},[10])(10)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"buffer":2}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
								value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('./lib/mvc.js');

var _IStore = require('./store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _dryDom = require('./lib/dry-dom.js');

var _dryDom2 = _interopRequireDefault(_dryDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

window.strldr = require("./lib/strldr.js");

var App = function () {
								function App() {
																_classCallCheck(this, App);

																window.store = this.store;

																this.pool.add(this);

																this.models = [];

																this.store.onload = this.init.bind(this);
								}

								_createClass(App, [{
																key: 'init',
																value: function init() {
																								var _this = this;

																								document.body.addEventListener("keydown", function (evt) {
																																_this.pool.call("onPress" + evt.code);
																																// console.log(evt);
																								});

																								document.body.addEventListener("keyup", function (evt) {
																																_this.pool.call("onRelease" + evt.code);
																																// console.log(evt);
																								});

																								this.controllers.forEach(function (controller) {
																																_this.pool.add(controller);
																								});

																								this.pool.call("enterSplash");

																								setInterval(this.commit.bind(this), 3000);

																								var pending = 2;
																								this.openModel("app", done.bind(this));
																								setTimeout(done.bind(this), 1000);

																								function done() {
																																pending--;
																																if (!pending) this.pool.call("exitSplash");
																								}
																}
								}, {
																key: 'openModel',
																value: function openModel(name, cb, model) {
																								var _this2 = this;

																								var oldModel = this.models.find(function (obj) {
																																return obj.name == name;
																								});

																								if (oldModel) {

																																if (oldModel == model) return;
																																this.closeModel(name);
																								}

																								var path = name;

																								if (typeof model == "string") {
																																path = model;
																																model = null;
																								}

																								if (!model) model = new _mvc.Model();

																								this.root.setItem(name, model.data);

																								this.models[this.models.length] = {
																																model: model,
																																name: name,
																																path: path,
																																dirty: false
																								};

																								this.store.getTextItem(path, function (data) {

																																if (data) {
																																								model.load(JSON.parse(data));
																																								if (model.getItem("expires") > new Date().getTime()) {
																																																model.dirty = false;
																																																cb.call();
																																																return;
																																								}
																																}

																																_this2.pool.call(name + "ModelInit", model, cb);
																								});
																}
								}, {
																key: 'closeModel',
																value: function closeModel(name) {
																								// to-do: find, commit, remove from this.models
																}
								}, {
																key: 'appModelInit',
																value: function appModelInit(model, cb) {

																								var repoURL = ["http://www.crait.net/arduboy/repo2.json", "http://arduboy.ried.cl/repo.json", "repo.json"];

																								if (navigator.userAgent.indexOf("Electron") == -1 && typeof cordova == "undefined") {
																																// model.setItem("proxy", "https://crossorigin.me/");
																																model.setItem("proxy", "https://cors-anywhere.herokuapp.com/");
																																repoURL = repoURL.map(function (url) {
																																								return (/^https?.*/.test(url) ? model.getItem("proxy") : "") + url;
																																});
																								} else {
																																model.setItem("proxy", "");
																								}

																								var items = [];
																								var pending = 3;

																								repoURL.forEach(function (url) {
																																return fetch(url).then(function (rsp) {
																																								return rsp.json();
																																}).then(add).catch(function (err) {
																																								console.log(err);
																																								done();
																																});
																								});

																								function add(json) {

																																if (json && json.items) {

																																								json.items.forEach(function (item) {

																																																item.author = item.author || "<<unknown>>";

																																																if (item.banner && (!item.screenshots || !item.screenshots[0] || !item.screenshots[0].filename)) item.screenshots = [{ filename: item.banner }];

																																																if (item.arduboy && (!item.binaries || !item.binaries[0] || !item.binaries[0].filename)) item.binaries = [{ filename: item.arduboy }];

																																																items.push(item);
																																								});
																																}

																																done();
																								}

																								function done() {
																																pending--;

																																if (!pending) {
																																								items = items.sort(function (a, b) {
																																																if (a.title > b.title) return 1;
																																																if (a.title < b.title) return -1;
																																																return 0;
																																								});
																																								model.removeItem("repo");
																																								model.setItem("repo", items);
																																								model.setItem("expires", new Date().getTime() + 60 * 60 * 1000);
																																								cb();
																																}
																								}
																}
								}, {
																key: 'commit',
																value: function commit() {

																								for (var i = 0; i < this.models.length; ++i) {

																																var obj = this.models[i];
																																if (!obj.dirty && obj.model.dirty) {

																																								obj.dirty = true;
																																								obj.model.dirty = false;
																																} else if (obj.dirty && !obj.model.dirty) {

																																								obj.dirty = false;
																																								this.store.setItem(obj.path, JSON.stringify(obj.model.data));
																																} else if (obj.dirty && obj.model.dirty) {

																																								obj.model.dirty = false;
																																}
																								}
																}
								}, {
																key: 'setActiveView',
																value: function setActiveView(view) {
																								[].concat(_toConsumableArray(this.DOM.element.children)).forEach(function (node) {
																																return node.parentElement.removeChild(node);
																								});
																}
								}]);

								return App;
}();

App["@inject"] = {
								DOM: _dryDom2.default,
								store: _IStore2.default,
								pool: "pool",
								controllers: [_mvc.IController, []],
								root: [_mvc.Model, { scope: "root" }]
};
exports.default = App;

},{"./lib/dry-dom.js":24,"./lib/mvc.js":26,"./lib/strldr.js":28,"./store/IStore.js":30}],7:[function(require,module,exports){
"use strict";

var _write, _read;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = {

    write: (_write = {}, _defineProperty(_write, 0x15 + 0x20, function (value) {

        this.TOV0 = value & 1;
        this.OCF0A = value >> 1 & 1;
        this.OCF0B = value >> 2 & 1;
    }), _defineProperty(_write, 0x24 + 0x20, function (value) {

        this.WGM00 = value >> 0 & 1;
        this.WGM01 = value >> 1 & 1;
        this.COM0B0 = value >> 4 & 1;
        this.COM0B1 = value >> 5 & 1;
        this.COM0A0 = value >> 6 & 1;
        this.COM0A1 = value >> 7 & 1;

        this.updateState();

        // console.log(`TCCR0A:\n  WGM00:${this.WGM00}\n  WGM01:${this.WGM01}\n  COM0B0:${this.COM0B0}\n  COM0B1:${this.COM0B1}\n  COM0A0:${this.COM0A0}\n  COM0A1:${this.COM0A1}`);
    }), _defineProperty(_write, 0x25 + 0x20, function (value) {

        this.FOC0A = value >> 7 & 1;
        this.FOC0B = value >> 6 & 1;
        this.WGM02 = value >> 3 & 1;
        this.CS = value & 7;

        this.updateState();

        // console.log(`TCCR0B:\n  FOC0A:${this.FOC0A}\n  FOC0B:${this.FOC0B}\n  WGM02:${this.WGM02}`);

        // console.log( "PC=" + (this.core.pc<<1).toString(16) + " WRITE TCCR0B: #" + value.toString(16) + " : " + value );
    }), _defineProperty(_write, 0x27 + 0x20, function (value) {
        this.OCR0A = value;
        // console.log( "OCR0A = " + value );
    }), _defineProperty(_write, 0x28 + 0x20, function (value) {
        this.OCR0B = value;
        // console.log( "OCR0B = " + value );
    }), _defineProperty(_write, 0x6E, function _(value) {
        this.TOIE0 = value & 1;
        this.OCIE0A = value >> 1 & 1;
        this.OCIE0B = value >> 2 & 1;
    }), _write),

    init: function init() {
        this.tick = 0;
        this.WGM00 = 0;
        this.WGM01 = 0;
        this.COM0B0 = 0;
        this.COM0B1 = 0;
        this.COM0A0 = 0;
        this.COM0A1 = 0;
        this.FOC0A = 0;
        this.FOC0B = 0;
        this.WGM02 = 0;
        this.CS = 0;
        this.TOV0 = 0;

        this.TOIE0 = 0;
        this.OCIE0A = 0;
        this.OCIE0B = 0;

        this.time = 0;

        this.updateState = function () {

            var MAX = 0xFF,
                BOTTOM = 0,
                WGM00 = this.WGM00,
                WGM01 = this.WGM01,
                WGM02 = this.WGM02;

            if (WGM02 == 0 && WGM01 == 0 && WGM00 == 0) {
                this.mode = 0;
                console.log("Timer Mode: Normal (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 0 && WGM00 == 1) {
                this.mode = 1;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 1 && WGM00 == 0) {
                this.mode = 2;
                console.log("Timer Mode: CTC (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 1 && WGM00 == 1) {
                this.mode = 3;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 0 && WGM00 == 0) {
                this.mode = 4;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 0 && WGM00 == 1) {
                this.mode = 5;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 1 && WGM00 == 0) {
                this.mode = 6;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 1 && WGM00 == 1) {
                this.mode = 7;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            }

            switch (this.CS) {
                case 0:
                    this.prescale = 0;break;
                case 1:
                    this.prescale = 1;break;
                case 2:
                    this.prescale = 8;break;
                case 3:
                    this.prescale = 64;break;
                case 4:
                    this.prescale = 256;break;
                case 5:
                    this.prescale = 1024;break;
                default:
                    this.prescale = 1;break;
            }
        };
    },

    read: (_read = {}, _defineProperty(_read, 0x15 + 0x20, function () {
        return !!this.TOV0 & 1 | this.OCF0A << 1 | this.OCF0B << 2;
    }), _defineProperty(_read, 0x26 + 0x20, function () {

        var tick = this.core.tick;

        var ticksSinceOVF = tick - this.tick;
        var interval = ticksSinceOVF / this.prescale | 0;
        if (!interval) return;

        var TCNT0 = 0x26 + 0x20;
        var cnt = this.core.memory[TCNT0] + interval;

        this.core.memory[TCNT0] += interval;

        this.tick += interval * this.prescale;

        this.TOV0 += cnt / 0xFF | 0;
    }), _read),

    update: function update(tick, ie) {

        var ticksSinceOVF = tick - this.tick;
        var interval = ticksSinceOVF / this.prescale | 0;

        if (interval) {
            var TCNT0 = 0x26 + 0x20;
            var cnt = this.core.memory[TCNT0] + interval;

            this.core.memory[TCNT0] += interval;

            this.tick += interval * this.prescale;

            this.TOV0 += cnt / 0xFF | 0;
        }

        if (this.TOV0 > 0 && ie) {
            this.TOV0--;
            return "TIMER0O";
        }
    }

};

},{}],8:[function(require,module,exports){
"use strict";

module.exports = {

    write: {
        0xC0: function _(value) {
            return this.UCSR0A = this.UCSR0A & 188 | value & 67;
        },
        0xC1: function _(value) {
            return this.UCSR0B = value;
        },
        0xC2: function _(value) {
            return this.UCSR0C = value;
        },
        0xC4: function _(value) {
            return this.UBRR0L = value;
        },
        0xC5: function _(value) {
            return this.UBRR0H = value;
        },
        0xC6: function _(value) {
            this.core.pins.serial0 = (this.core.pins.serial0 || "") + String.fromCharCode(value);return this.UDR0 = value;
        }
    },

    read: {
        0xC0: function _() {
            return this.UCSR0A;
        },
        0xC1: function _() {
            return this.UCSR0B;
        },
        0xC2: function _() {
            return this.UCSR0C;
        },
        0xC4: function _() {
            return this.UBRR0L;
        },
        0xC5: function _() {
            return this.UBRR0H & 0x0F;
        },
        0xC6: function _() {
            return this.UDR0;
        }
    },

    init: function init() {
        this.UCSR0A = 0x20;
        this.UCSR0B = 0;
        this.UCSR0C = 0x06;
        this.UBRR0L = 0; // USART Baud Rate 0 Register Low
        this.UBRR0H = 0; // USART Baud Rate 0 Register High            
        this.UDR0 = 0;
    },

    update: function update(tick, ie) {}

};

},{}],9:[function(require,module,exports){
'use strict';

var _write, _write2, _write3;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = {

    PORTB: {
        write: (_write = {}, _defineProperty(_write, 0x04 + 0x20, function (value) {
            this.core.pins.DDRB = value;
        }), _defineProperty(_write, 0x05 + 0x20, function (value, oldValue) {

            if (oldValue == value) return;

            /*
                          if( typeof document != "undefined" ){
                              if( value & 0x20 ) document.body.style.backgroundColor = "black";
                              else document.body.style.backgroundColor = "white";
                          }else if( typeof WorkerGlobalScope == "undefined" ){
                              if( value & 0x20 ) console.log( "LED ON #", (this.core.pc<<1).toString(16) );
                              else console.log( "LED OFF #", (this.core.pc<<1).toString(16) );
                          }
            */

            this.core.pins.PORTB = value;

            // console.log("worker@" + this.core.pc.toString(16) + "[tick " + (this.core.tick / this.core.clock * 1000).toFixed(3) + "]", " PORTB = ", value.toString(2));
        }), _write),
        read: _defineProperty({}, 0x03 + 0x20, function () {
            return this.PINB & 0xFF | 0;
        }),
        init: function init() {
            var _this = this;

            this.PINB = 0;
            Object.defineProperty(this.core.pins, "PINB", {
                set: function set(v) {
                    return _this.PINB = v >>> 0 & 0xFF;
                },
                get: function get() {
                    return _this.PINB;
                }
            });
        }
    },

    PORTC: {
        write: (_write2 = {}, _defineProperty(_write2, 0x07 + 0x20, function (value) {
            this.core.pins.DDRC = value;
        }), _defineProperty(_write2, 0x08 + 0x20, function (value) {
            this.core.pins.PORTC = value;
        }), _write2),
        read: _defineProperty({}, 0x06 + 0x20, function () {
            return this.core.pins.PINC = this.core.pins.PINC & 0xFF || 0;
        })
    },

    PORTD: {
        write: (_write3 = {}, _defineProperty(_write3, 0x0A + 0x20, function (value) {
            this.core.pins.DDRD = value;
        }), _defineProperty(_write3, 0x0B + 0x20, function (value) {
            this.core.pins.PORTD = value;
        }), _write3),
        read: _defineProperty({}, 0x09 + 0x20, function () {
            return this.core.pins.PIND = this.core.pins.PIND & 0xFF || 0;
        })
    },

    TC: require('./At328P-TC.js'),

    USART: require('./At328P-USART.js')

};

},{"./At328P-TC.js":7,"./At328P-USART.js":8}],10:[function(require,module,exports){
"use strict";

module.exports = {
			init: function init() {
						this.SPDR = 0;
						this.SPIF = 0;
						this.WCOL = 0;
						this.SPI2X = 0;
						this.SPIE = 0;
						this.SPE = 0;
						this.DORD = 0;
						this.MSTR = 0;
						this.CPOL = 0;
						this.CPHA = 0;
						this.SPR1 = 0;
						this.SPR0 = 0;
						this.core.pins.spiOut = this.core.pins.spiOut || [];
			},

			write: {
						0x4C: function _(value, oldValue) {
									this.SPIE = value >> 7;
									this.SPE = value >> 6;
									this.DORD = value >> 5;
									this.MSTR = value >> 4;
									this.CPOL = value >> 3;
									this.CPHA = value >> 2;
									this.SPR1 = value >> 1;
									this.SPR0 = value >> 0;
						},

						0x4D: function _(value, oldValue) {
									this.SPI2X = value & 1;
									return this.SPIF << 7 | this.WCOL << 6 | this.SPI2X;
						},
						0x4E: function _(value) {
									this.SPDR = value;
									this.core.pins.spiOut.push(value);
									this.SPIF = 1;
						}
			},

			read: {
						0x4D: function _() {
									this.SPIF = !!this.core.pins.spiIn.length | 0;
									return this.SPIF << 7 | this.WCOL << 6 | this.SPI2X;
						},
						0x4E: function _() {
									var spiIn = this.core.pins.spiIn;
									if (spiIn.length) return this.SPDR = spiIn.shift();
									return this.SPDR;
						}
			},

			update: function update(tick, ie) {

						if (this.SPIF && this.SPIE && ie) {
									this.SPIF = 0;
									return "SPI";
						}
			}
};

},{}],11:[function(require,module,exports){
'use strict';

function port(obj) {

	var out = { write: {}, read: {}, init: null };

	for (var k in obj) {

		var addr = obj[k];
		if (/DDR.|PORT./.test(k)) {

			out.write[addr] = setter(k);
		} else {

			out.read[addr] = getter(k);
			out.init = init(k);
		}
	}

	function setter(k) {
		return function (value, oldValue) {
			if (value != oldValue) this.core.pins[k] = value;
		};
	}

	function getter(k) {
		return function () {
			return this[k] & 0xFF | 0;
		};
	}

	function init(k) {
		return function () {
			this[k] = 0;
			var _this = this;
			Object.defineProperty(this.core.pins, k, {
				set: function set(v) {
					return _this[k] = v >>> 0 & 0xFF;
				},
				get: function get() {
					return _this[k];
				}
			});
		};
	}

	return out;
}

module.exports = {

	PORTB: port({ PINB: 0x23, DDRB: 0x24, PORTB: 0x25 }),
	PORTC: port({ PINC: 0x26, DDRC: 0x27, PORTC: 0x28 }),
	PORTD: port({ PIND: 0x29, DDRD: 0x2A, PORTD: 0x2B }),
	PORTE: port({ PINE: 0x2C, DDRE: 0x2D, PORTE: 0x2E }),
	PORTF: port({ PINF: 0x2F, DDRF: 0x30, PORTF: 0x31 }),

	TC: require('./At328P-TC.js'),

	USART: require('./At328P-USART.js'),

	PLL: {
		read: {
			0x49: function _(value) {
				return this.PINDIV << 4 | this.PLLE << 1 | this.PLOCK;
			}
		},
		write: {
			0x49: function _(value, oldValue) {
				if (value === oldValue) return;
				this.PINDIV = value >> 4 & 1;
				this.PLLE = value >> 1 & 1;
				this.PLOCK = 1;
			}
		},
		init: function init() {
			this.PINDIV = 0;
			this.PLLE = 0;
			this.PLOCK = 0;
		}
	},

	SPI: require('./At32u4-SPI.js'),

	EEPROM: {
		write: {
			0x3F: function _(value, oldValue) {
				value &= ~2;
				return value;
			}
		},
		read: {},
		init: function init() {}
	},

	ADCSRA: {

		write: {
			0x7A: function _(value, oldValue) {
				this.ADEN = value >> 7 & 1;
				this.ADSC = value >> 6 & 1;
				this.ADATE = value >> 5 & 1;
				this.ADIF = value >> 4 & 1;
				this.ADIE = value >> 3 & 1;
				this.ADPS2 = value >> 2 & 1;
				this.ADPS1 = value >> 1 & 1;
				this.ADPS0 = value & 1;
				if (this.ADEN) {
					if (this.ADSC) {
						this.ADCH = Math.random() * 0xFF >>> 0;
						this.ADCL = Math.random() * 0xFF >>> 0;
						this.ADSC = 0;
						value &= ~(1 << 6);
					}
				}
				return value;
			}
		},

		read: {
			0x79: function _() {
				return this.ADCH;
			},
			0x78: function _() {
				return this.ADCL;
			}
		},

		init: function init() {
			this.ADEN = 0;
			this.ADSC = 0;
			this.ADATE = 0;
			this.ADIF = 0;
			this.ADIE = 0;
			this.ADPS2 = 0;
			this.ADPS1 = 0;
			this.ADPS0 = 0;
		},

		update: function update(tick, ie) {
			if (this.ADEN && this.ADIE) {
				this.ADIF = 1;
				this.ADSC = 0;
				this.ADCH = Math.random() * 0xFF >>> 0;
				this.ADCL = Math.random() * 0xFF >>> 0;
			}

			if (this.ADIF && this.ADIE && ie) {
				this.ADIF = 0;
				return "ADC";
			}
		}

	}

};

},{"./At328P-TC.js":7,"./At328P-USART.js":8,"./At32u4-SPI.js":10}],12:[function(require,module,exports){
(function (global){
"use strict";

// http://www.atmel.com/webdoc/avrassembler/avrassembler.wb_instruction_list.html

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function bin(bytes, size) {

    var s = (bytes >>> 0).toString(2);
    while (s.length < size) {
        s = "0" + s;
    }return s.replace(/([01]{4,4})/g, "$1 ") + "  #" + (bytes >>> 0).toString(16).toUpperCase();
}

if (typeof performance === "undefined") {
    if (Date.now) global.performance = { now: function now() {
            return Date.now();
        } };else global.performance = { now: function now() {
            return new Date().getTime();
        } };
}

var Atcore = function () {
    function Atcore(desc) {
        var _this = this;

        _classCallCheck(this, Atcore);

        if (!desc) return;

        this.sleeping = false;
        this.sreg = 0;
        this.pc = 0;
        this.sp = 0;
        this.clock = desc.clock;
        this.codec = desc.codec;
        this.interruptMap = desc.interrupt;
        this.error = 0;
        this.flags = desc.flags;
        this.tick = 0;
        this.startTick = 0;
        this.endTick = 0;
        this.execTime = 0;
        this.time = performance.now();

        this.i8a = new Int8Array(4);

        self.BREAKPOINTS = { 0: 0 };
        self.DUMP = function () {
            console.log('PC: #' + (_this.pc << 1).toString(16) + '\nSR: ' + _this.memory[0x5F].toString(2) + '\nSP: #' + _this.sp.toString(16) + '\n' + Array.prototype.map.call(_this.reg, function (v, i) {
                return 'R' + (i + '') + ' ' + (i < 10 ? ' ' : '') + '=\t#' + v.toString(16) + '\t' + v;
            }).join('\n'));
        };

        /*
        The I/O memory space contains 64 addresses for CPU peripheral functions as control registers, SPI, and other I/O functions.
        The I/O memory can be accessed directly, or as the data space locations following those of the register file, 0x20 - 0x5F. In
        addition, the ATmega328P has extended I/O space from 0x60 - 0xFF in SRAM where only the ST/STS/STD and
        LD/LDS/LDD instructions can be used.        
        */
        this.memory = new Uint8Array(32 // register file
        + (0xFF - 0x1F) // io
        + desc.sram);

        this.flash = new Uint8Array(desc.flash);
        this.eeprom = new Uint8Array(desc.eeprom);

        this.initMapping();
        this.instruction = null;
        this.periferals = {};
        this.pins = {};

        for (var periferalName in desc.periferals) {

            var addr = void 0,
                periferal = desc.periferals[periferalName];
            var obj = this.periferals[periferalName] = { core: this };

            for (addr in periferal.write) {
                this.writeMap[addr] = periferal.write[addr].bind(obj);
            }for (addr in periferal.read) {
                this.readMap[addr] = periferal.read[addr].bind(obj);
            }if (periferal.update) this.updateList.push(periferal.update.bind(obj));

            if (periferal.init) periferal.init.call(obj);
        }
    }

    _createClass(Atcore, [{
        key: "initMapping",
        value: function initMapping() {
            Object.defineProperties(this, {
                writeMap: { value: {}, enumerable: false, writable: false },
                readMap: { value: {}, enumerable: false, writable: false },
                updateList: { value: [], enumerable: false, writable: false },
                reg: { value: new Uint8Array(this.memory.buffer, 0, 0x20), enumerable: false },
                wreg: { value: new Uint16Array(this.memory.buffer, 0x20 - 8, 4), enumerable: false },
                sram: { value: new Uint8Array(this.memory.buffer, 0x100), enumerable: false },
                io: { value: new Uint8Array(this.memory.buffer, 0x20, 0xFF - 0x20), enumerable: false },
                prog: { value: new Uint16Array(this.flash.buffer), enumerable: false },
                native: { value: {}, enumerable: false }
            });

            this.codec.forEach(function (op) {
                if (op.str) parse(op);
                op.argv = Object.assign({}, op.args);
                op.bytes = op.bytes || 2;
                op.cycles = op.cycles || 1;
            });
        }
    }, {
        key: "read",
        value: function read(addr, pc) {
            var value = this.memory[addr];

            var periferal = this.readMap[addr];
            if (periferal) {
                var ret = periferal(value);
                if (ret !== undefined) value = ret;
            }

            // if( !({
            //     0x5d:1, // Stack Pointer Low
            //     0x5e:1, // Stack Pointer High
            //     0x5f:1, // status register
            //     0x25:1, // PORTB
            //     0x35:1, // TOV0
            //     0x23:1,  // PINB
            //     0x14B:1 // verbose USART stuff
            // })[addr] )
            // console.log( "READ: #", addr.toString(16) );

            return value;
        }
    }, {
        key: "readBit",
        value: function readBit(addr, bit, pc) {

            // if( !({
            //     0x5d:1, // Stack Pointer Low
            //     0x5e:1, // Stack Pointer High
            //     0x5f:1, // status register
            //     0x25:1, // PORTB
            //     0x35:1, // TOV0
            //     0x23:1  // PINB
            // })[addr] )
            // console.log( "PC=" + (pc<<1).toString(16) + " READ #" + (addr !== undefined ? addr.toString(16) : 'undefined') + " @ " + bit );

            var value = this.memory[addr];

            var periferal = this.readMap[addr];
            if (periferal) {
                var ret = periferal(value);
                if (ret !== undefined) value = ret;
            }

            return value >>> bit & 1;
        }
    }, {
        key: "write",
        value: function write(addr, value) {

            var periferal = this.writeMap[addr];

            if (periferal) {
                var ret = periferal(value, this.memory[addr]);
                if (ret === false) return;
                if (ret !== undefined) value = ret;
            }

            return this.memory[addr] = value;
        }
    }, {
        key: "writeBit",
        value: function writeBit(addr, bit, bvalue) {
            bvalue = !!bvalue | 0;
            var value = this.memory[addr];
            value = value & ~(1 << bit) | bvalue << bit;

            var periferal = this.writeMap[addr];

            if (periferal) {
                var ret = periferal(value, this.memory[addr]);
                if (ret === false) return;
                if (ret !== undefined) value = ret;
            }

            return this.memory[addr] = value;
        }
    }, {
        key: "exec",
        value: function exec(time) {
            var cycles = time * this.clock | 0;

            var start = this.tick;
            this.endTick = this.startTick + cycles;
            this.execTime = time;
            var lastUpdate = start;

            try {

                while (this.tick < this.endTick) {
                    if (!this.sleeping) {

                        if (this.pc > 0xFFFF) break;

                        var func = this.native[this.pc];
                        // if( !func ) 		    console.log( this.pc );
                        if (func) func.call(this);else if (!this.getBlock()) break;
                    } else {
                        this.tick += 100;
                    }

                    if (this.tick >= this.endTick || this.tick - lastUpdate > 1000) {
                        lastUpdate = this.tick;
                        this.updatePeriferals();
                    }
                }
            } finally {

                this.startTick = this.endTick;
            }
        }
    }, {
        key: "updatePeriferals",
        value: function updatePeriferals() {

            var interruptsEnabled = this.memory[0x5F] & 1 << 7;

            var updateList = this.updateList;

            for (var i = 0, l = updateList.length; i < l; ++i) {

                var ret = updateList[i](this.tick, interruptsEnabled);

                if (ret && interruptsEnabled) {
                    interruptsEnabled = 0;
                    this.sleeping = false;
                    this.interrupt(ret);
                }
            }
        }
    }, {
        key: "update",
        value: function update() {
            var now = performance.now();
            var delta = now - this.time;

            delta = Math.max(0, Math.min(33, delta));

            this.exec(delta / 1000);

            this.time = now;
        }
    }, {
        key: "getBlock",
        value: function getBlock() {
            var _this2 = this;

            var startPC = this.pc;

            var skip = false,
                prev = false;
            var nop = { name: 'NOP', cycles: 1, end: true, argv: {} };
            var cacheList = ['reg', 'wreg', 'io', 'memory', 'sram', 'flash'];
            var code = '"use strict";\nvar sp=this.sp, r, t1, i8a=this.i8a, SKIP=false, ';
            code += cacheList.map(function (c) {
                return c + " = this." + c;
            }).join(', ');
            code += ';\n';
            code += 'var sr = memory[0x5F]';
            for (var i = 0; i < 8; ++i) {
                code += ", sr" + i + " = (sr>>" + i + ")&1";
            }code += ';\n';

            // code += "console.log('\\nENTER BLOCK: " + (this.pc<<1).toString(16).toUpperCase() + " @ ', (this.pc<<1).toString(16).toUpperCase() );\n";
            // console.log('CREATE BLOCK: ', (this.pc<<1).toString(16).toUpperCase() );
            code += 'switch( this.pc ){\n';

            var addrs = [];

            do {

                var inst = this.identify();
                if (!inst) {
                    // inst = nop;
                    console.warn(this.error);
                    (function () {
                        debugger;
                    })();
                    return;
                }

                addrs.push(this.pc);

                code += "\ncase " + this.pc + ": // #" + (this.pc << 1).toString(16) + ": " + inst.name + ' [' + inst.decbytes.toString(2).padStart(16, "0") + ']' + '\n';

                var chunk = "\n                this.pc = " + this.pc + ";\n                if( (this.tick += " + inst.cycles + ") >= this.endTick ) break;\n                ";

                // BREAKPOINTS
                if (self.BREAKPOINTS && self.BREAKPOINTS[this.pc << 1] || inst.debug) {
                    chunk += "console.log('PC: #'+(this.pc<<1).toString(16)+'\\nSR: ' + memory[0x5F].toString(2) + '\\nSP: #' + sp.toString(16) + '\\n' + Array.prototype.map.call( reg, (v,i) => 'R'+(i+'')+' '+(i<10?' ':'')+'=\\t#'+v.toString(16) + '\\t' + v ).join('\\n') );\n";
                    chunk += '  debugger;\n';
                }

                var op = this.getOpcodeImpl(inst, inst.impl);
                var srDirty = op.srDirty;
                var line = op.begin,
                    endline = op.end;
                if (inst.flags) {
                    for (var i = 0, l = inst.flags.length; i < l; ++i) {
                        var flagOp = this.getOpcodeImpl(inst, this.flags[inst.flags[i]]);
                        line += flagOp.begin;
                        endline += flagOp.end;
                        srDirty |= flagOp.srDirty;
                    }
                }

                if (srDirty) {
                    var pres = (~srDirty >>> 0 & 0xFF).toString(2);
                    endline += "sr = (sr&0b" + pres + ") ";
                    for (var i = 0; i < 8; i++) {
                        if (srDirty & 1 << i) endline += " | (sr" + i + "<<" + i + ")";
                    }endline += ';\nmemory[0x5F] = sr;\n';
                }

                chunk += line + endline;

                if (skip) code += "  if( !SKIP ){\n    " + chunk + "\n  }\nSKIP = false;\n";else code += chunk;

                prev = skip;
                skip = inst.skip;

                this.pc += inst.bytes >> 1;
            } while (this.pc < this.prog.length && (!inst.end || skip || prev));

            code += "\nthis.pc = " + this.pc + ";\n";
            code += "break;\ndefault: this.tick += 2; console.warn('fell through #' + (this.pc++<<1).toString(16));\n";
            code += "\n\n}";
            // code += cacheList.map(c=>`this.${c} = ${c};`).join('\n');
            code += 'this.sp = sp;\n';

            var endPC = this.pc;
            this.pc = startPC;

            code = "return (function _" + (startPC << 1).toString(16) + "(){\n" + code + "});";

            try {
                var func = new Function(code)();

                for (var i = 0; i < addrs.length; ++i) {
                    this.native[addrs[i]] = func;
                }func.call(this);
            } catch (ex) {

                setTimeout(function () {
                    debugger;
                    var func = new Function(code);
                    func.call(_this2);
                }, 1);
                throw ex;
            }

            return true;
        }
    }, {
        key: "identify",
        value: function identify() {

            // if( this.pc<<1 == 0x966 ) debugger;

            var prog = this.prog,
                codec = this.codec,
                bytes = void 0,
                h = void 0,
                j = void 0,
                i = 0,
                l = codec.length,
                pc = this.pc;

            var bytes2 = void 0,
                bytes4 = void 0;
            bytes2 = prog[pc] >>> 0;
            bytes4 = (bytes2 << 16 | prog[pc + 1]) >>> 0;

            var verbose = 1;

            for (; i < l; ++i) {

                var desc = codec[i];
                var opcode = desc.opcode >>> 0;
                var mask = desc.mask >>> 0;
                var size = desc.bytes;

                if (size === 4) {

                    if (verbose == 2 || verbose == desc.name) console.log(desc.name + "\n" + bin(bytes4 & mask, 8 * 4) + "\n" + bin(opcode, 8 * 4));

                    if ((bytes4 & mask) >>> 0 !== opcode) continue;
                    bytes = bytes4;
                } else {

                    if (verbose == 2 || verbose == desc.name) console.log(desc.name + "\n" + bin(bytes2 & mask, 8 * 2) + "\n" + bin(opcode, 8 * 2));

                    if ((bytes2 & mask) >>> 0 !== opcode) continue;
                    bytes = bytes2;
                }

                this.instruction = desc;

                // var log = desc.name + " ";

                for (var k in desc.args) {
                    mask = desc.args[k];
                    var value = 0;
                    h = 0;
                    j = 0;
                    while (mask) {
                        if (mask & 1) {
                            value |= (bytes >> h & 1) << j;
                            j++;
                        }
                        mask = mask >>> 1;
                        h++;
                    }
                    desc.argv[k] = value;
                    // log += k + ":" + value + "  "
                }
                desc.decbytes = bytes;
                // console.log(log);

                return this.instruction;
            }

            this.error = "#" + (this.pc << 1).toString(16).toUpperCase() + " opcode: " + bin(bytes2, 16);

            return null;
        }
    }, {
        key: "interrupt",
        value: function interrupt(source) {

            // console.log("INTERRUPT " + source);

            var addr = this.interruptMap[source];
            var pc = this.pc;
            this.memory[this.sp--] = pc >> 8;
            this.memory[this.sp--] = pc;
            this.memory[0x5F] &= ~(1 << 7); // disable interrupts
            this.pc = addr;
        }
    }, {
        key: "getOpcodeImpl",
        value: function getOpcodeImpl(inst, str) {
            var i,
                l,
                op = { begin: "", end: "", srDirty: 0 };

            if (Array.isArray(str)) {
                for (i = 0, l = str.length; i < l; ++i) {
                    var tmp = this.getOpcodeImpl(inst, str[i]);
                    op.begin += tmp.begin + "\n";
                    op.end += tmp.end + "\n";
                    op.srDirty |= tmp.srDirty;
                }
                return op;
            }

            var src = str,
                argv = inst.argv;

            for (var k in argv) {
                str = str.split(k.toLowerCase()).join(argv[k]);
            }var SRSync = "",
                SRDirty = 0;

            str = str.replace(/SR@([0-9]+)\s*←\s*1;?\s*$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = 1;\n";
            });
            str = str.replace(/SR@([0-9]+)\s*←\s*0;?\s*$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = 0;\n";
            });
            str = str.replace(/SR([0-9]+)\s*=(.*)/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = " + assign + ";\n";
            });
            str = str.replace(/SR\s*←/g, function () {
                SRSync = 'memory[0x5F] = sr; sr0=sr&1; sr1=(sr>>1)&1; sr2=(sr>>2)&1; sr3=(sr>>3)&1; sr4=(sr>>4)&1; sr5=(sr>>5)&1; sr6=(sr>>6)&1; sr7=(sr>>7)&1;';
                return 'sr =';
            });
            str = str.replace(/SR@([0-9]+)\s*←(.*)$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = (!!(" + assign + "))|0;";
            });
            str = str.replace(/SR\s*¯/g, '(~sr)');
            str = str.replace(/SR@([0-9]+)\s*¯/g, '(~sr$1) ');
            str = str.replace(/SR@([0-9]+)\s*/g, '(sr$1) ');
            str = str.replace(/SR/g, 'sr');

            str = str.replace(/WR([0-9]+)\s*←/g, 'r = wreg[$1] =');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*←(.*)$/g, function (m, num, bit, assign) {
                return "r = wreg[" + num + "] = (wreg[" + num + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });
            str = str.replace(/WR([0-9]+)\s*¯/g, '(~wreg[$1]) ');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*¯/g, '(~(wreg[$1]>>>$2)&1) ');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*/g, '((wreg[$1]>>>$2)&1) ');
            str = str.replace(/WR([0-9]+)/g, 'wreg[$1]');

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*←/g, function (m, num, numadd) {
                numadd = numadd || "";
                op.end += "reg[(" + num + ")" + numadd + "] = r;\n";
                return 'r = ';
            });
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*←(.*)$/g, function (m, num, numadd, bit, assign) {
                numadd = numadd || "";
                op.end += "reg[(" + num + ")" + numadd + "] = r;\n";
                return "r = (reg[(" + num + ")" + numadd + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*=\s+/g, function (m, num, numadd) {
                numadd = numadd || "";
                return "r = reg[(" + num + ")" + numadd + "] = ";
            });
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*=\s+(.*)$/g, function (m, num, numadd, bit, assign) {
                numadd = numadd || "";
                return "r = reg[(" + num + ")" + numadd + "] = (reg[(" + num + ")" + numadd + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*¯/g, '(~reg[($1)$2]) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*¯/g, '(~(reg[($1)$2]>>>$3)&1) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*/g, '((reg[($1)$2]>>>$3)&1) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?/g, '(reg[($1)$2]>>>0)');

            str = str.replace(/R@([0-9]+)\s*¯/g, '(~(r>>>$1)&1) ');
            str = str.replace(/R@([0-9]+)\s*/g, '((r>>>$1)&1) ');
            str = str.replace(/I\/O/g, 'io');
            str = str.replace(/R/g, 'r');

            str = str.replace(/FLASH\(([XYZ])\)\s*←(.*);?$/g, function (m, n, v) {
                return 'flash[ wreg[' + (n.charCodeAt(0) - 87) + '] ] = ' + v + ';';
            });
            str = str.replace(/FLASH\(([XYZ])\)/g, function (m, n) {
                return 'flash[ wreg[' + (n.charCodeAt(0) - 87) + '] ]';
            });
            str = str.replace(/\(([XYZ])(\+[0-9]+)?\)\s*←(.*);?$/g, function (m, n, off, v) {
                return 'this.write( wreg[' + (n.charCodeAt(0) - 87) + ']' + (off || '') + ', ' + v + ');';
            });
            str = str.replace(/\(([XYZ])(\+[0-9]+)?\)/g, function (m, n, off) {
                return 'this.read( wreg[' + (n.charCodeAt(0) - 87) + ']' + (off || '') + ', this.pc )';
            });

            str = str.replace(/\(STACK\)\s*←/g, function (m, n) {
                return 'memory[sp--] =';
            });
            str = str.replace(/\((STACK)\)/g, function (m, n) {
                return 'memory[++sp]';
            });
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nmemory[sp--] = t1>>8;\nmemory[sp--] = t1;\n');
            str = str.replace(/\((STACK2)\)/g, '(memory[++sp] + (memory[++sp]<<8))');

            str = str.replace(/⊕/g, '^');
            str = str.replace(/•/g, '&');

            str = str.replace(/io\[([0-9]+)\]\s*←(.*?);?$/g, 'this.write( 32+$1, $2 )');
            str = str.replace(/io\[([0-9]+)@([0-9]+)\]\s*←(.*?);?$/g, 'this.writeBit( 32+$1, $2, $3 )');
            str = str.replace(/io\[([0-9+<]+)@([0-9]+)\]/g, 'this.readBit( 32+$1, $2, this.pc )');
            str = str.replace(/io\[([0-9+<]+)\]/g, 'this.read( 32+$1, this.pc )');
            str = str.replace(/SP/g, 'sp');
            str = str.replace(/PC\s*←(.*)$/g, 't1 = $1;\nif( !t1 ) (function(){debugger;})(); this.pc = t1; break;\n');
            str = str.replace(/PC/g, 'this.pc');
            str = str.replace(/←/g, '=');

            str = '// ' + src.replace(/[\n\r]+\s*/g, '\n\t// ') + "\n" + str + "\n";

            op.srDirty = SRDirty;

            op.begin = str;
            op.end += SRSync;

            return op;
        }
    }, {
        key: "statusI",
        get: function get() {
            return this.sreg & 1 << 7;
        }
    }, {
        key: "statusT",
        get: function get() {
            return this.sreg & 1 << 6;
        }
    }, {
        key: "statusH",
        get: function get() {
            return this.sreg & 1 << 5;
        }
    }, {
        key: "statusS",
        get: function get() {
            return this.sreg & 1 << 4;
        }
    }, {
        key: "statusV",
        get: function get() {
            return this.sreg & 1 << 3;
        }
    }, {
        key: "statusN",
        get: function get() {
            return this.sreg & 1 << 2;
        }
    }, {
        key: "statusZ",
        get: function get() {
            return this.sreg & 1 << 1;
        }
    }, {
        key: "statusC",
        get: function get() {
            return this.sreg & 1 << 0;
        }
    }], [{
        key: "ATmega328P",
        value: function ATmega328P() {

            var core = new Atcore({
                flash: 32 * 1024,
                eeprom: 1 * 1024,
                sram: 2 * 1024,
                codec: AtCODEC,
                flags: AtFlags,
                clock: 16 * 1000 * 1000, // speed in kHz
                periferals: require('./At328P-periferals.js'),
                interrupt: {
                    RESET: 0x0000, //  External pin, power-on reset, brown-out reset and watchdog system reset
                    INT0: 0x002, //  External interrupt request 0
                    INT1: 0x0004, //  External interrupt request 1
                    PCINT0: 0x0006, //  Pin change interrupt request 0
                    PCINT1: 0x0008, //  Pin change interrupt request 1
                    PCINT2: 0x000A, //  Pin change interrupt request 2
                    WDT: 0x000C, //  Watchdog time-out interrupt
                    TIMER2A: 0x000E, //  COMPA Timer/Counter2 compare match A
                    TIMER2B: 0x0010, //  COMPB Timer/Counter2 compare match B
                    TIMER2O: 0x0012, //  OVF Timer/Counter2 overflow
                    TIMER1C: 0x0014, //  CAPT Timer/Counter1 capture event
                    TIMER1A: 0x0016, //  COMPA Timer/Counter1 compare match A
                    TIMER1B: 0x0018, //  COMPB Timer/Counter1 compare match B
                    TIMER1O: 0x001A, //  OVF Timer/Counter1 overflow
                    TIMER0A: 0x001C, //  COMPA Timer/Counter0 compare match A
                    TIMER0B: 0x001E, //  COMPB Timer/Counter0 compare match B
                    TIMER0O: 0x0020, //  OVF Timer/Counter0 overflow
                    SPI: 0x0022, // , STC SPI serial transfer complete
                    USARTRX: 0x0024, // , RX USART Rx complete
                    USARTE: 0x0026, // , UDRE USART, data register empty
                    USARTTX: 0x0028, // , TX USART, Tx complete
                    ADC: 0x002A, //  ADC conversion complete
                    EEREADY: 0x002C, //  READY EEPROM ready
                    ANALOG: 0x002E, //  COMP Analog comparator
                    TWI: 0x0030, //  2-wire serial interface
                    SPM: 0x0032 //  READY Store program memory ready                
                }
            });

            return core;
        }
    }, {
        key: "ATmega32u4",
        value: function ATmega32u4() {
            var _interrupt;

            var core = new Atcore({
                flash: 32 * 1024,
                eeprom: 1 * 1024,
                sram: 2 * 1024 + 512,
                codec: AtCODEC,
                flags: AtFlags,
                clock: 16 * 1000 * 1000, // speed in kHz
                periferals: require('./At32u4-periferals.js'),
                interrupt: (_interrupt = {
                    RESET: 0x0000, //  External pin, power-on reset, brown-out reset and watchdog system reset
                    INT0: 0x002, //  External interrupt request 0
                    INT1: 0x0004, //  External interrupt request 1
                    INT2: 0x0006, //  External interrupt request 2
                    INT3: 0x0008, //  External interrupt request 3
                    RESERVED0: 0x000A,
                    RESERVED1: 0x000C,
                    INT6: 0x000E, //  External interrupt request 6
                    PCINT0: 0x0012, //  Pin change interrupt request 0
                    USBGEN: 0x0014, // USB General Interrupt request
                    USBEND: 0x0016, // USB Endpoint Interrupt request
                    WDT: 0x0018, //  Watchdog time-out interrupt

                    TIMER1C: 0x0020, //  CAPT Timer/Counter1 capture event
                    TIMER1A: 0x0022, //  COMPA Timer/Counter1 compare match A
                    TIMER1B: 0x0024 }, _defineProperty(_interrupt, "TIMER1C", 0x0026), _defineProperty(_interrupt, "TIMER1O", 0x0028), _defineProperty(_interrupt, "TIMER0A", 0x002A), _defineProperty(_interrupt, "TIMER0B", 0x002C), _defineProperty(_interrupt, "TIMER0O", 0x002E), _defineProperty(_interrupt, "SPI", 0x0030), _defineProperty(_interrupt, "USARTRX", 0x0032), _defineProperty(_interrupt, "USARTE", 0x0034), _defineProperty(_interrupt, "USARTTX", 0x0036), _defineProperty(_interrupt, "ANALOG", 0x0038), _defineProperty(_interrupt, "ADC", 0x003A), _defineProperty(_interrupt, "EEREADY", 0x003C), _defineProperty(_interrupt, "TIMER3C", 0x003E), _defineProperty(_interrupt, "TIMER3A", 0x0040), _defineProperty(_interrupt, "TIMER3B", 0x0042), _defineProperty(_interrupt, "TIMER3C", 0x0044), _defineProperty(_interrupt, "TIMER3O", 0x0046), _defineProperty(_interrupt, "TWI", 0x0048), _defineProperty(_interrupt, "SPM", 0x004A), _defineProperty(_interrupt, "TIMER4A", 0x004C), _defineProperty(_interrupt, "TIMER4B", 0x004E), _defineProperty(_interrupt, "TIMER4D", 0x0050), _defineProperty(_interrupt, "TIMER4O", 0x0052), _defineProperty(_interrupt, "TIMER4FPF", 0x0054), _interrupt)
            });

            return core;
        }
    }]);

    return Atcore;
}();

function parse(out) {
    var opcode = 0;
    var mask = 0;
    var args = {};

    var str = out.str,
        l = str.length;
    for (var i = 0; i < l; ++i) {
        var chr = str[i];
        var bit = l - i - 1 >>> 0;
        if (chr == '0') {
            mask |= 1 << bit;
        } else if (chr == '1') {
            mask |= 1 << bit;
            opcode |= 1 << bit;
        } else {
            if (!(chr in args)) args[chr] = 0;
            args[chr] |= 1 << bit;
        }
    }

    out.opcode = opcode;
    out.mask = mask;
    out.args = args;
    out.bytes = l / 8 | 0;
}

var AtCODEC = [{
    name: 'ADC',
    str: '000111rdddddrrrr',
    impl: 'Rd ← Rd + Rr + SR@0;',
    flags: 'hzvnsc'
}, {
    name: 'ADD',
    str: '000011rdddddrrrr',
    impl: 'Rd ← Rd + Rr;',
    flags: 'hzvnsc'
}, {
    name: 'MUL',
    str: '100111rdddddrrrr',
    impl: ['t1 = Rd * Rr', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1'],
    flags: 'hvnsc'
}, {
    name: 'ADIW',
    str: '10010110KKddKKKK',
    impl: ['WRd ← WRd + k;'],
    flags: 'ZVNSC'
}, {
    name: 'AND',
    str: '001000rdddddrrrr',
    impl: ['Rd ← Rd • Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ANDI',
    str: '0111KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 • k;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ASR',
    str: '1001010ddddd0101',
    impl: ['SR@0 ← Rd • 1', 'Rd ← Rd >> 1;'],
    flags: 'zns'
}, {
    name: 'BCLRi',
    str: '1001010011111000',
    impl: 'SR@7 ← 0'
}, {
    name: 'BCLRt',
    str: '1001010011101000',
    impl: 'SR@6 ← 0'
}, {
    name: 'BCLRh',
    str: '1001010011011000',
    impl: 'SR@5 ← 0'
}, {
    name: 'BCLRs',
    str: '1001010011001000',
    impl: 'SR@4 ← 0'
}, {
    name: 'BCLRv',
    str: '1001010010111000',
    impl: 'SR@3 ← 0'
}, {
    name: 'BCLRn',
    str: '1001010010101000',
    impl: 'SR@2 ← 0'
}, {
    name: 'BCLRz',
    str: '1001010010011000',
    impl: 'SR@1 ← 0'
}, {
    name: 'BCLRc',
    str: '1001010010001000',
    impl: 'SR@0 ← 0'
}, {
    name: 'BRCC',
    str: '111101kkkkkkk000',
    impl: ['if( !SR@0 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRBS',
    str: '111100kkkkkkksss',
    impl: ['if( SR@s ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRBC',
    str: '111101kkkkkkksss',
    impl: ['if( !SR@s ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRCS',
    str: '111100kkkkkkk000',
    impl: ['if( SR@0 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BREQ',
    str: '111100kkkkkkk001',
    impl: ['if( SR@1 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRLT',
    str: '111100kkkkkkk100',
    impl: ['if( SR@4 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRGE',
    str: '111101kkkkkkk100',
    impl: ['if( !SR@4 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRNE',
    str: '111101kkkkkkk001',
    impl: ['if( !SR@1 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRPL',
    str: '111101kkkkkkk010',
    impl: ['if( !SR@2 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRMI',
    str: '111100kkkkkkk010',
    impl: ['if( SR@2 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRTC',
    str: '111101kkkkkkk110',
    impl: ['if( !SR@6 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BST',
    str: '1111101ddddd0bbb',
    impl: 'SR6 = Rd@b'
    //,debug: true
}, {
    name: 'BLD',
    str: '1111100ddddd0bbb',
    impl: 'Rd@b ← SR@6'
}, {
    name: 'CALL',
    str: '1001010kkkkk111kkkkkkkkkkkkkkkkk',
    cycles: 4,
    impl: ['(STACK2) ← PC + 2', 'PC ← k']
}, {
    name: 'CBI',
    str: '10011000AAAAAbbb',
    impl: 'I/O[a@b] ← 0;'
}, {
    name: 'COM',
    str: '1001010ddddd0000',
    impl: ['Rd ← ~ Rd;', 'SR@3 ← 0', 'SR@0 ← 1'],
    flags: 'zns'
}, {
    name: 'FMUL',
    str: '000000110ddd1rrr',
    impl: ['t1 = Rd+16 * Rr+16 << 1', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'NOP',
    str: '0000000000000000',
    impl: ''
}, {
    name: 'NEG',
    str: '1001010ddddd0001',
    impl: ['Rd ← - Rd;', 'SR3 = R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯', 'SR0 = (!!R)|0', 'SR@5 ← R@3 | Rd3 ¯'],
    flags: 'zns'
}, {
    name: 'CP',
    str: '000101rdddddrrrr',
    impl: ['R = ((Rd - Rr) >>> 0) & 0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) + (Rd@7 ¯ • Rr@7 • R@7)'],
    flags: 'zns'
}, {
    name: 'CPI',
    str: '0011KKKKddddKKKK',
    impl: ['R = ((Rd+16 - k) >>> 0) & 0xFF;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) + (Rd+16@7 ¯ • ((k>>7)&1) • R@7)'],
    flags: 'zns'
}, {
    name: 'CPC',
    str: '000001rdddddrrrr',
    impl: ['R = (Rd - Rr - SR@0) & 0xFF', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'CPSE',
    str: '000100rdddddrrrr',
    impl: 'SKIP ← Rr == Rd',
    skip: true
}, {
    name: 'DEC',
    str: '1001010ddddd1010',
    impl: ['Rd ← Rd - 1', 'SR@3 ← R@7 ¯ • R@6 • R@5 • R@4 • R@3 • R@2 • R@1 • R@0'],
    flags: 'zns'
}, {
    name: 'EOR',
    str: '001001rdddddrrrr',
    impl: ['Rd ← Rd ⊕ Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ICALL',
    str: '1001010100001001',
    cycles: 3,
    impl: ['(STACK2) ← PC + 2', 'PC ← WR3']
    // end:true
}, {
    name: 'INSR',
    str: '1011011ddddd1111',
    impl: "Rd \u2190 SR",
    cycles: 1
    // debug: true
}, {
    name: 'IN',
    str: '10110AAddddd1110',
    impl: "Rd \u2190 sp>>>8",
    cycles: 1
}, {
    name: 'IN',
    str: '10110AAddddd1101',
    impl: "Rd \u2190 sp&0xFF",
    cycles: 1
}, {
    name: 'IN',
    str: '10110AAdddddAAAA',
    impl: "Rd \u2190 I/O[a]",
    cycles: 1
}, {
    name: 'INC',
    str: '1001010ddddd0011',
    impl: ['Rd ← Rd + 1;', 'SR@3 ← R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯'],
    flags: 'zns'
}, {
    name: 'IJMP',
    str: '1001010000001001',
    impl: "PC \u2190 WR3",
    cycles: 2,
    end: true
}, {
    name: 'JMP',
    str: '1001010kkkkk110kkkkkkkkkkkkkkkkk',
    impl: "PC \u2190 k",
    cycles: 3,
    end: true
}, {
    name: 'LDI',
    str: '1110KKKKddddKKKK',
    impl: 'Rd+16 ← k'
}, {
    name: 'LDS',
    str: '1001000xxxxx0000kkkkkkkkkkkkkkkk',
    impl: 'Rx ← this.read(k)',
    bytes: 4
}, {
    name: 'LDX',
    str: '1001000ddddd1100',
    impl: "Rd \u2190 (X);",
    cycles: 2
}, {
    name: 'LDX+',
    str: '1001000ddddd1101',
    impl: ["Rd \u2190 (X);", "WR1 ++;"],
    cycles: 2
}, {
    name: 'LDX-',
    str: '1001000ddddd1110',
    impl: ["WR1 --;", "Rd \u2190 (X);"],
    cycles: 2
}, {
    name: 'LDY',
    str: '1000000ddddd1000',
    impl: "Rd \u2190 (Y)",
    cycles: 2
}, {
    name: 'LDY+',
    str: '1001000ddddd1001',
    impl: ["Rd \u2190 (Y);", "WR3 ++;"],
    cycles: 2
}, {
    name: 'LDY-',
    str: '1001000ddddd1010',
    impl: ["WR3 --;", "Rd \u2190 (Y);"],
    cycles: 2
}, {
    name: 'LDYQ',
    str: '10q0qq0ddddd1qqq',
    impl: ["Rd \u2190 (Y+q);"],
    cycles: 2
}, {
    name: 'LDZ',
    str: '1000000ddddd0000',
    impl: "Rd \u2190 (Z);",
    cycles: 2
}, {
    name: 'LDZ+',
    str: '1001000ddddd0001',
    impl: ["Rd \u2190 (Z);", "WR3 ++;"],
    cycles: 2
}, {
    name: 'LDZ-',
    str: '1001000ddddd0010',
    impl: ["WR3 --;", "Rd \u2190 (Z);"],
    cycles: 2
}, {
    name: 'LDZQ',
    str: '10q0qq0ddddd0qqq',
    impl: ["Rd \u2190 (Z+q);"],
    cycles: 2
}, {
    name: 'LPMi',
    str: '1001010111001000',
    impl: 'R0 ← FLASH(Z)'
}, {
    name: 'LPMii',
    str: '1001000ddddd0100',
    impl: 'Rd ← FLASH(Z)'
}, {
    name: 'LPMiii',
    str: '1001000ddddd0101',
    impl: ['Rd ← FLASH(Z);', 'WR3 ++;']
}, {
    name: 'LSR',
    str: '1001010ddddd0110',
    // debug:true,
    impl: ['SR0 = Rd@0', 'Rd ← Rd >>> 1', 'SR2 = 0', 'SR3 = SR@2 ^ SR0'],
    flags: 'zs'
}, {
    name: 'MOV',
    str: '001011rdddddrrrr',
    impl: ['Rd ← Rr;']
}, {
    name: 'MOVW',
    str: '00000001ddddrrrr',
    impl: ['Rd<<1 = Rr<<1', 'Rd<<1+1 = Rr<<1+1']
}, {
    name: 'MULSU',
    str: '000000110ddd0rrr',
    impl: ['i8a[0] = Rd+16', 't1 = i8a[0] * Rr+16', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'MULS',
    str: '00000010ddddrrrr',
    impl: ['i8a[0] = Rd+16', 'i8a[1] = Rr+16', 't1 = i8a[0] * i8a[1]', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'OR',
    str: '001010rdddddrrrr',
    impl: ['Rd ← Rd | Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ORI',
    str: '0110KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 | k;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'OUTsr',
    str: '1011111rrrrr1111',
    impl: 'I/O[63] ← SR ← Rr',
    cycles: 1
}, {
    name: 'OUTsph',
    str: '1011111rrrrr1110',
    impl: ['I/O[62] ← Rr;', 'sp = (io[62]<<8) | (sp&0xFF);'],
    cycles: 1
}, {
    name: 'OUTspl',
    str: '1011111rrrrr1101',
    impl: ['I/O[61] ← Rr;', 'sp = (sp&0xFF00) | io[61];'],
    cycles: 1
}, {
    name: 'OUT',
    str: '10111AArrrrrAAAA',
    impl: "I/O[a] \u2190 Rr",
    cycles: 1
}, {
    name: 'PUSH',
    str: '1001001ddddd1111',
    impl: '(STACK) ← Rd',
    cycles: 2
}, {
    name: 'POP',
    str: '1001000ddddd1111',
    impl: 'Rd ← (STACK)',
    cycles: 2
}, {
    name: 'RET',
    str: '1001010100001000',
    cycles: 4,
    end: true,
    impl: 'PC ← (STACK2)'
}, {
    name: 'RETI',
    str: '1001010100011000',
    cycles: 4,
    end: true,
    impl: ['memory[0x5F] = (SR |= 1<<7);', 'PC ← (STACK2)']
}, {
    name: 'ROR',
    str: '1001010ddddd0111',
    impl: ['SR0 = Rd@0', 'Rd ← Rd >>> 1 | (SR<<7&0x80)', 'SR2 = R>>7', 'SR3 = SR@2 ^ SR0'],
    flags: 'zs'
}, {
    name: 'HALT',
    str: '1100111111111111',
    impl: "PC \u2190 PC - 1",
    end: true
}, {
    name: 'RCALL',
    str: '1101kkkkkkkkkkkk',
    cycles: 3,
    impl: ['(STACK2) ← PC + 1', "PC \u2190 PC + (k << 20 >> 20) + 1"],
    end: false
}, {
    name: 'RJMP',
    str: '1100kkkkkkkkkkkk',
    impl: "PC \u2190 PC + (k << 20 >> 20) + 1",
    end: true
}, {
    name: 'SEC',
    str: '1001010000001000',
    impl: "SR@0 \u2190 1"
}, {
    name: 'SET',
    str: '1001010001101000',
    impl: "SR@6 \u2190 1"
}, {
    name: 'SEI',
    str: '1001010001111000',
    impl: "SR@7 \u2190 1"
}, {
    name: 'SFMUL',
    str: '000000111ddd0rrr',
    impl: ['i8a[0] = Rd+16', 'i8a[1] = Rr+16', 't1 = i8a[0] * i8a[1] << 1', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'STS',
    str: '1001001ddddd0000kkkkkkkkkkkkkkkk',
    impl: "this.write( k, Rd )",
    bytes: 4
}, {
    name: 'STX',
    str: '1001001rrrrr1100',
    impl: "(X) \u2190 Rr"
}, {
    name: 'STX+',
    str: '1001001rrrrr1101',
    impl: ["(X) \u2190 Rr", "WR1 ++;"]
}, {
    name: 'STX-',
    str: '1001001rrrrr1110',
    impl: ["WR1 --;", "(X) \u2190 Rr"]
}, {
    name: 'STY',
    str: '1000001rrrrr1000',
    impl: "(Y) \u2190 Rr"
}, {
    name: 'STY+',
    str: '1001001rrrrr1001',
    impl: ["(Y) \u2190 Rr", "WR1 ++;"]
}, {
    name: 'STY-',
    str: '1001001rrrrr1010',
    impl: ["WR1 --;", "(Y) \u2190 Rr"]
}, {
    name: 'STYQ',
    str: '10q0qq1rrrrr1qqq',
    impl: ["(Y+q) \u2190 Rr"]
}, {
    name: 'STZ',
    str: '1000001rrrrr0000',
    impl: "(Z) \u2190 Rr"
}, {
    name: 'STZ+',
    str: '1001001rrrrr0001',
    impl: ["(Z) \u2190 Rr", "WR3 ++;"]
}, {
    name: 'STZ-',
    str: '1001001rrrrr0010',
    impl: ["WR3 --;", "(Z) \u2190 Rr"]
}, {
    name: 'STZQ',
    str: '10q0qq1rrrrr0qqq',
    impl: ["(Z+q) \u2190 Rr"]
}, {
    name: 'SBC',
    str: '000010rdddddrrrr',
    impl: ['Rd ← (Rd - Rr - SR@0) & 0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'SUB',
    str: '000110rdddddrrrr',
    impl: ['Rd ← (Rd - Rr)&0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)'],
    flags: 'zns'
}, {
    name: 'SBCI',
    str: '0100KKKKddddKKKK',
    impl: ['Rd+16 ← (Rd+16 - k - SR@0)&0xFF;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd+16@7 ¯ • ((k>>7)&1) • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'SUBI',
    str: '0101KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 - k;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd+16@7 ¯ • ((k>>7)&1) • R@7)'],
    flags: 'zns'
}, {
    name: 'SBI',
    str: '10011010AAAAAbbb',
    impl: 'I/O[a@b] ← 1;'
}, {
    name: 'SBIW',
    str: '10010111KKddKKKK',
    impl: ['WRd ← WRd - k;'],
    flags: 'ZVNS'
}, {
    name: 'SBIC',
    str: '10011001AAAAAbbb',
    impl: 'SKIP ← !I/O[a@b]',
    skip: true
}, {
    name: 'SBIS',
    str: '10011011AAAAAbbb',
    impl: 'SKIP ← I/O[a@b]',
    skip: true
}, {
    name: 'SBRC',
    str: '1111110rrrrr0bbb',
    // debug: true,
    impl: 'SKIP ← !(Rr & (1<<b))',
    skip: true
}, {
    name: 'SBRS',
    str: '1111111rrrrr0bbb',
    // debug: true,
    impl: 'SKIP ← Rr & (1<<b)',
    skip: true
}, {
    name: 'SLEEP',
    str: '1001010110001000',
    impl: ['this.sleeping = true', 'PC ← PC + 1'],
    // debug: true,
    cycles: 0
}, {
    name: 'SWAP',
    str: '1001010ddddd0010',
    impl: ['Rd ← (Rd >>> 4) | (Rd << 4)']
}];

var AtFlags = {

    h: 'SR@5 ← (Rd@3 • Rr@3) + (Rr@3 • R@3 ¯) | (R@3 ¯ • Rd@3)',
    H: '',
    z: 'SR1 = !(R&0xFF)|0',
    Z: 'SR1 = !(R&0xFF)|0',
    v: 'SR3 = (Rd@7 • Rr@7 • R@7 ¯) | (Rd@7 ¯ • Rr@7 ¯ • R@7)',
    V: 'SR3 = WRd@15 ¯ • R@15',
    n: 'SR2 = R@7',
    N: 'SR2 = R@15',
    s: 'SR4 = SR@2 ⊕ SR@3',
    S: 'SR4 = SR@2 ⊕ SR@3',
    c: 'SR0 = (Rd@7 • Rr@7) | (Rr@7 • R@7 ¯) | (R@7 ¯ • Rd@7)',
    C: 'SR0 = (R@15 ¯ • WRd@15)',

    /*
    Bit 7 – I: Global Interrupt Enable
    The global interrupt enable bit must be set for the interrupts to be enabled. The individual interrupt enable control is then
    performed in separate control registers. If the global interrupt enable register is cleared, none of the interrupts are enabled
    independent of the individual interrupt enable settings. The I-bit is cleared by hardware after an interrupt has occurred, and is
    set by the RETI instruction to enable subsequent interrupts. The I-bit can also be set and cleared by the application with the
    SEI and CLI instructions, as described in the instruction set reference    
    */
    SEI: function SEI() {
        this.sreg |= 1 << 7;
    },
    CLI: function CLI() {
        this.sreg &= ~(1 << 7);
    },


    /*
    Bit 6 – T: Bit Copy Storage
    The bit copy instructions BLD (bit LoaD) and BST (Bit STore) use the T-bit as source or destination for the operated bit. A bit
    from a register in the register file can be copied into T by the BST instruction, and a bit in T can be copied into a bit in a
    register in the register file by the BLD instruction.
    */
    BLD: function BLD(REG, BIT) {
        if (this.reg & 1 << 6) this.reg[REG] |= 1 << BIT;else this.reg[REG] &= ~(1 << BIT);
    },
    BST: function BST(REG, BIT) {
        var v = this.reg[REG] >> BIT & 1;
        if (v) this.sreg |= 1 << 6;else this.sreg &= ~(1 << 6);
    }
};

module.exports = Atcore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./At328P-periferals.js":9,"./At32u4-periferals.js":11}],13:[function(require,module,exports){
'use strict';

var Hex = {
    parseURL: function parseURL(url, buffer, cb) {

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                try {
                    Hex.parse(xhr.responseText, buffer);
                } catch (ex) {
                    cb(false);
                    return;
                }
                cb(true);
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    },
    parse: function parse(src, buffer) {

        var state = 0,
            size = 0,
            num = void 0,
            byte = void 0,
            offset = void 0,
            sum = 0;

        for (var i = 0, l = src.length; i < l;) {

            byte = src.charCodeAt(i++);

            if (byte === 58) {
                state = 0;
                continue;
            }

            if (byte >= 65 && byte <= 70) {
                num = byte - 55 << 4;
            } else if (byte >= 48 && byte <= 57) {
                num = byte - 48 << 4;
            } else continue;

            while (i < l) {
                byte = src.charCodeAt(i++);
                if (byte >= 65 && byte <= 70) {
                    num += byte - 55;
                    break;
                } else if (byte >= 48 && byte <= 57) {
                    num += byte - 48;
                    break;
                } else continue;
            }

            switch (state) {
                case 0:
                    size = num;
                    state++;
                    sum = num;
                    break;

                case 1:
                    offset = num << 8;
                    state++;
                    sum += num;
                    break;

                case 2:
                    offset += num;
                    state++;
                    sum += num;
                    break;

                case 3:
                    if (num === 1) return;
                    if (num === 3 || num === 5) {
                        state++;
                    } else if (num !== 0) throw 'Unsupported record type: ' + num;
                    state++;
                    sum += num;
                    break;

                case 4:
                    buffer[offset++] = num;
                case 5:
                    sum += num;
                    if (! --size) state = 6;
                    break;

                case 6:
                    sum += num;
                    sum = -sum & 0xFF;
                    if (!sum) state++;else throw 'Checksum mismatch: ' + sum;
                    break;

                case 7:
                default:
                    throw 'Illegal state ' + state;
            }
        }
    }
};

module.exports = Hex;

},{}],14:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BTN = function () {
			function BTN(DOM) {
						var _this = this;

						_classCallCheck(this, BTN);

						this.on = {
									connect: null,
									init: function init() {
												this.on.value = !this.active;
									}
						};


						DOM.element.controller = this;
						DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));
						this.on.connect = DOM.element.getAttribute("pin-on");
						this.active = DOM.element.getAttribute("active") != "low";

						DOM.element.addEventListener("mousedown", function (_) {
									return _this.on.value = _this.active;
						});
						DOM.element.addEventListener("mouseup", function (_) {
									return _this.on.value = !_this.active;
						});
						DOM.element.addEventListener("touchstart", function (_) {
									return _this.on.value = _this.active;
						});
						DOM.element.addEventListener("touchend", function (_) {
									return _this.on.value = !_this.active;
						});

						(DOM.element.getAttribute("bind-key") || "").split(/\s*,\s*/).forEach(function (k) {
									_this["onPress" + k] = function (_) {
												return _this.on.value = _this.active;
									};
									_this["onRelease" + k] = function (_) {
												return _this.on.value = !_this.active;
									};
						});

						this.pool.add(this);
			}

			_createClass(BTN, [{
						key: "setActiveView",
						value: function setActiveView() {
									this.pool.remove(this);
						}
			}]);

			return BTN;
}();

BTN["@inject"] = {
			pool: "pool"
};


module.exports = BTN;

},{}],15:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LED = function LED(DOM) {
			_classCallCheck(this, LED);

			this.on = {

						connect: null,

						onLowToHigh: function onLowToHigh() {
									this.el.style.opacity = "0";
						},
						onHighToLow: function onHighToLow() {
									this.el.style.opacity = "1";
						}
			};


			this.el = DOM.element;
			DOM.element.controller = this;
			DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));
			this.on.connect = DOM.element.getAttribute("pin-on");
			this.el.style.opacity = 0;
};

module.exports = LED;

},{}],16:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SCREEN = function () {
			function SCREEN(DOM) {
						_classCallCheck(this, SCREEN);

						this.state = function (data) {
									// console.log( "DATA: " + data.toString(16) );
									var cs = this.colStart;
									var ce = this.colEnd;
									var cd = ce - cs;
									var ps = this.pageStart;
									var pe = this.pageEnd;
									var pd = pe - ps;

									var x = cs + this.col;
									var y = (ps + this.page) * 8;

									for (var i = 0; i < 8; ++i) {
												var offset = ((y + i) * 128 + x) * 4;
												var bit = (data >>> i & 1) * 0xE0;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
									}

									this.col++;
									if (this.col > cd) {
												this.col = 0;
												this.page++;
												if (this.page > pd) this.page = 0;
									}

									this.dirty = true;
						};

						this.sck = {
									connect: null
						};
						this.sda = {
									connect: null,
									MOSI: function MOSI(data) {

												if (this.mode == 0) {
															// data is a command
															var cmd = "cmd" + data.toString(16).toUpperCase();
															if (this.cmd.length) {
																		this.cmd.push(data);
																		cmd = this.cmd[0];
															} else this.cmd.push(cmd);

															var fnc = this[cmd];

															if (!fnc) return console.warn("Unknown SSD1306 command: " + cmd.toString(16));

															if (fnc.length == this.cmd.length - 1) {
																		this.cmd.shift();
																		this[cmd].apply(this, this.cmd);
																		this.cmd.length = 0;
															}
												} else {
															this.state(data);
												}
									}
						};
						this.res = {
									connect: null,
									onLowToHigh: function onLowToHigh() {
												this.reset();
									}
						};
						this.dc = {
									connect: null,
									onLowToHigh: function onLowToHigh() {
												this.mode = 1; // data
									},
									onHighToLow: function onHighToLow() {
												this.mode = 0; // command
									}

									// Display Off
						};


						var canvas = this.canvas = DOM.screen;
						if (!canvas) throw "No canvas in Arduboy element";

						this.pool.add(this);

						canvas.width = 128;
						canvas.height = 64;

						this.ctx = canvas.getContext("2d");
						this.ctx.imageSmoothingEnabled = false;
						this.ctx.msImageSmoothingEnabled = false;

						this.fb = this.createBuffer();
						this.fbON = this.createBuffer();
						this.fbOFF = this.createBuffer();
						this.activeBuffer = this.fbON;
						this.dirty = true;

						this.fbON.data.fill(0xFF);

						DOM.element.controller = this;
						DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));

						this.sck.connect = DOM.element.getAttribute("pin-sck");
						this.sda.connect = DOM.element.getAttribute("pin-sda");
						this.res.connect = DOM.element.getAttribute("pin-res");
						this.dc.connect = DOM.element.getAttribute("pin-dc");

						this.reset();
			}

			_createClass(SCREEN, [{
						key: "setActiveView",
						value: function setActiveView() {
									this.pool.remove(this);
						}
			}, {
						key: "onPressKeyF",
						value: function onPressKeyF() {
									var docEl = this.canvas; // doc.documentElement;

									toggleFullScreen();

									return;

									function isFullScreen() {
												var doc = window.document;
												return doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || false;
									}

									function toggleFullScreen(toggle) {
												var doc = window.document;

												var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
												var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
												var state = isFullScreen();

												if (toggle == undefined) toggle = !state;else if (toggle == state) return;

												if (toggle) requestFullScreen.call(docEl);else cancelFullScreen.call(doc);
									}
						}
			}, {
						key: "tick",
						value: function tick() {
									if (this.dirty) {
												this.ctx.putImageData(this.activeBuffer, 0, 0);
												this.dirty = false;
									}
						}
			}, {
						key: "createBuffer",
						value: function createBuffer() {
									var canvas = this.canvas;
									try {
												return new ImageData(new Uint8ClampedArray(canvas.width * canvas.height * 4), canvas.width, canvas.height);
									} catch (e) {
												return this.ctx.createImageData(canvas.width, canvas.height);
									}
						}
			}, {
						key: "reset",
						value: function reset() {
									this.mode = 0;
									this.clockDivisor = 0x80;
									this.cmd = [];
									this.pos = 0;
									this.fb.data.fill(0);
									this.colStart = 0;
									this.colEnd = 127;
									this.pageStart = 0;
									this.pageEnd = 7;
									this.col = 0;
									this.page = 0;
						}
			}, {
						key: "cmdAE",
						value: function cmdAE() {
									this.activeBuffer = this.fbOFF;
						}

						// Set Display Clock Divisor v = 0xF0

			}, {
						key: "cmdD5",
						value: function cmdD5(v) {
									this.clockDivisor = v;
						}

						// Charge Pump Setting v = enable (0x14)

			}, {
						key: "cmd8D",
						value: function cmd8D(v) {
									this.chargePumpEnabled = v;
						}

						// Set Segment Re-map (A0) | (b0001)

			}, {
						key: "cmdA0",
						value: function cmdA0() {
									this.segmentRemap = 0;
						}
			}, {
						key: "cmdA1",
						value: function cmdA1() {
									this.segmentRemap = 1;
						}
			}, {
						key: "cmdA5",
						value: function cmdA5() {}
			}, {
						key: "cmd0",
						// multiplex something or other

						value: function cmd0() {
									this.colStart = this.colStart & 0xF0 | 0;
						}
			}, {
						key: "cmd1",
						value: function cmd1() {
									this.colStart = this.colStart & 0xF0 | 0x1;
						}
			}, {
						key: "cmd2",
						value: function cmd2() {
									this.colStart = this.colStart & 0xF0 | 0x2;
						}
			}, {
						key: "cmd3",
						value: function cmd3() {
									this.colStart = this.colStart & 0xF0 | 0x3;
						}
			}, {
						key: "cmd4",
						value: function cmd4() {
									this.colStart = this.colStart & 0xF0 | 0x4;
						}
			}, {
						key: "cmd5",
						value: function cmd5() {
									this.colStart = this.colStart & 0xF0 | 0x5;
						}
			}, {
						key: "cmd6",
						value: function cmd6() {
									this.colStart = this.colStart & 0xF0 | 0x6;
						}
			}, {
						key: "cmd7",
						value: function cmd7() {
									this.colStart = this.colStart & 0xF0 | 0x7;
						}
			}, {
						key: "cmd8",
						value: function cmd8() {
									this.colStart = this.colStart & 0xF0 | 0x8;
						}
			}, {
						key: "cmd9",
						value: function cmd9() {
									this.colStart = this.colStart & 0xF0 | 0x9;
						}
			}, {
						key: "cmdA",
						value: function cmdA() {
									this.colStart = this.colStart & 0xF0 | 0xA;
						}
			}, {
						key: "cmdB",
						value: function cmdB() {
									this.colStart = this.colStart & 0xF0 | 0xB;
						}
			}, {
						key: "cmdC",
						value: function cmdC() {
									this.colStart = this.colStart & 0xF0 | 0xC;
						}
			}, {
						key: "cmdD",
						value: function cmdD() {
									this.colStart = this.colStart & 0xF0 | 0xD;
						}
			}, {
						key: "cmdE",
						value: function cmdE() {
									this.colStart = this.colStart & 0xF0 | 0xE;
						}
			}, {
						key: "cmdF",
						value: function cmdF() {
									this.colStart = this.colStart & 0xF0 | 0xF;
						}
			}, {
						key: "cmd10",
						value: function cmd10() {
									this.colStart = this.colStart & 0x0F;
						}
			}, {
						key: "cmd11",
						value: function cmd11() {
									this.colStart = 0x1 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd12",
						value: function cmd12() {
									this.colStart = 0x2 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd13",
						value: function cmd13() {
									this.colStart = 0x3 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd14",
						value: function cmd14() {
									this.colStart = 0x4 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd15",
						value: function cmd15() {
									this.colStart = 0x5 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd16",
						value: function cmd16() {
									this.colStart = 0x6 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd17",
						value: function cmd17() {
									this.colStart = 0x7 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd18",
						value: function cmd18() {
									this.colStart = 0x8 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd19",
						value: function cmd19() {
									this.colStart = 0x9 << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1A",
						value: function cmd1A() {
									this.colStart = 0xA << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1B",
						value: function cmd1B() {
									this.colStart = 0xB << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1C",
						value: function cmd1C() {
									this.colStart = 0xC << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1D",
						value: function cmd1D() {
									this.colStart = 0xD << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1E",
						value: function cmd1E() {
									this.colStart = 0xE << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmd1F",
						value: function cmd1F() {
									this.colStart = 0xF << 4 | this.colStart & 0x0F;
						}
			}, {
						key: "cmdB0",
						value: function cmdB0() {
									this.page = 0;
						}
			}, {
						key: "cmdB1",
						value: function cmdB1() {
									this.page = 1;
						}
			}, {
						key: "cmdB2",
						value: function cmdB2() {
									this.page = 2;
						}
			}, {
						key: "cmdB3",
						value: function cmdB3() {
									this.page = 3;
						}
			}, {
						key: "cmdB4",
						value: function cmdB4() {
									this.page = 4;
						}
			}, {
						key: "cmdB5",
						value: function cmdB5() {
									this.page = 5;
						}
			}, {
						key: "cmdB6",
						value: function cmdB6() {
									this.page = 6;
						}
			}, {
						key: "cmdB7",
						value: function cmdB7() {
									this.page = 7;
						}

						// Set COM Output Scan Direction

			}, {
						key: "cmdC8",
						value: function cmdC8() {}

						// Set COM Pins v

			}, {
						key: "cmdDA",
						value: function cmdDA(v) {}

						// Set Contrast v = 0xCF

			}, {
						key: "cmd81",
						value: function cmd81(v) {}

						// Set Precharge = 0xF1

			}, {
						key: "cmdD9",
						value: function cmdD9(v) {}

						// Set VCom Detect

			}, {
						key: "cmdDB",
						value: function cmdDB(v) {}

						// Entire Display ON

			}, {
						key: "cmdA4",
						value: function cmdA4(v) {
									this.activeBuffer = v ? this.fbON : this.fb;
						}

						// Set normal/inverse display

			}, {
						key: "cmdA6",
						value: function cmdA6(v) {}

						// Display On

			}, {
						key: "cmdAF",
						value: function cmdAF(v) {
									this.activeBuffer = this.fb;
						}

						// set display mode = horizontal addressing mode (0x00)

			}, {
						key: "cmd20",
						value: function cmd20(v) {}

						// set col address range

			}, {
						key: "cmd21",
						value: function cmd21(v, e) {
									this.colStart = v;
									this.colEnd = e;
									this.col = 0;
						}

						// set page address range

			}, {
						key: "cmd22",
						value: function cmd22(v, e) {
									this.pageStart = v;
									this.pageEnd = e;
									this.page = 0;
						}
			}]);

			return SCREEN;
}();

SCREEN["@inject"] = {
			pool: "pool"
};


module.exports = SCREEN;

},{}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('../lib/mvc.js');

var _dryDi = require('dry-di');

var _Atcore = require('../atcore/Atcore.js');

var _Atcore2 = _interopRequireDefault(_Atcore);

var _Hex = require('../atcore/Hex.js');

var _Hex2 = _interopRequireDefault(_Hex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Arduboy = function () {
										function Arduboy(DOM) {
																				var _this = this;

																				_classCallCheck(this, Arduboy);

																				this.tick = [];


																				this.pool.add(this);

																				this.DOM = DOM;
																				this.parent = DOM.element.parentElement;
																				this.width = 0;
																				this.height = 0;
																				this.dead = false;

																				DOM.element.addEventListener("addperiferal", function (evt) {
																														return _this.addPeriferal(evt.target.controller);
																				});

																				this.periferals = [];

																				this.update = this._update.bind(this);
																				this.resize();

																				var url = this.root.getItem("app.AT328P.url", null);
																				if (url) {

																														this.core = _Atcore2.default.ATmega328P();

																														_Hex2.default.parseURL(url, this.core.flash, function (success) {
																																								if (success) _this.initCore();
																														});
																														return;
																				}

																				var hex = this.root.getItem("app.AT328P.hex", null);
																				if (hex) {

																														this.core = _Atcore2.default.ATmega328P();
																														_Hex2.default.parse(hex, this.core.flash);
																														this.initCore();
																														return;
																				}

																				url = this.root.getItem("app.AT32u4.url", null);
																				if (url) {

																														this.core = _Atcore2.default.ATmega32u4();
																														_Hex2.default.parseURL(url, this.core.flash, function (success) {
																																								if (success) _this.initCore();
																														});
																														return;
																				}

																				hex = this.root.getItem("app.AT32u4.hex", null);
																				if (hex) {

																														this.core = _Atcore2.default.ATmega32u4();
																														_Hex2.default.parse(hex, this.core.flash);
																														this.initCore();
																														return;
																				}

																				console.error("Nothing to load");
										}

										_createClass(Arduboy, [{
																				key: 'onPressEscape',
																				value: function onPressEscape() {
																														this.powerOff();
																				}
										}, {
																				key: 'setActiveView',
																				value: function setActiveView() {
																														this.pool.remove(this);
																				}
										}, {
																				key: 'powerOff',
																				value: function powerOff() {
																														this.pool.remove(this);
																														this.dead = true;
																														this.DOM.element.dispatchEvent(new Event("poweroff", { bubbles: true }));
																				}
										}, {
																				key: 'initCore',
																				value: function initCore() {
																														var _this2 = this;

																														var core = this.core,
																														    oldValues = {},
																														    DDRB = void 0,
																														    serial0Buffer = "",
																														    callbacks = {
																																								DDRB: {},
																																								DDRC: {},
																																								DDRD: {},
																																								PORTB: {},
																																								PORTC: {},
																																								PORTD: {},
																																								PORTE: {},
																																								PORTF: {}
																														};

																														Object.keys(callbacks).forEach(function (k) {
																																								return Object.assign(callbacks[k], {
																																																		onHighToLow: [],
																																																		onLowToHigh: []
																																								});
																														});

																														Object.defineProperties(core.pins, {

																																								onHighToLow: { value: function value(port, bit, cb) {
																																																												(callbacks[port].onHighToLow[bit] = callbacks[port][bit] || []).push(cb);
																																																		} },

																																								onLowToHigh: { value: function value(port, bit, cb) {
																																																												(callbacks[port].onLowToHigh[bit] = callbacks[port][bit] || []).push(cb);
																																																		} },

																																								0: { value: { out: { port: "PORTD", bit: 2 }, in: { port: "PIND", bit: 2 } } },
																																								1: { value: { out: { port: "PORTD", bit: 3 }, in: { port: "PIND", bit: 3 } } },
																																								2: { value: { out: { port: "PORTD", bit: 1 }, in: { port: "PIND", bit: 1 } } },
																																								3: { value: { out: { port: "PORTD", bit: 0 }, in: { port: "PIND", bit: 0 } } },
																																								4: { value: { out: { port: "PORTD", bit: 4 }, in: { port: "PIND", bit: 4 } } },
																																								5: { value: { out: { port: "PORTC", bit: 6 }, in: { port: "PINC", bit: 6 } } },
																																								6: { value: { out: { port: "PORTD", bit: 7 }, in: { port: "PIND", bit: 7 } } },
																																								7: { value: { out: { port: "PORTE", bit: 6 }, in: { port: "PINE", bit: 6 } } },
																																								8: { value: { out: { port: "PORTB", bit: 4 }, in: { port: "PINB", bit: 4 } } },
																																								9: { value: { out: { port: "PORTB", bit: 5 }, in: { port: "PINB", bit: 5 } } },
																																								10: { value: { out: { port: "PORTB", bit: 6 }, in: { port: "PINB", bit: 6 } } },
																																								11: { value: { out: { port: "PORTB", bit: 7 }, in: { port: "PINB", bit: 7 } } },

																																								16: { value: { out: { port: "PORTB", bit: 2 }, in: { port: "PINB", bit: 2 } } },
																																								14: { value: { out: { port: "PORTB", bit: 3 }, in: { port: "PINB", bit: 3 } } },
																																								15: { value: { out: { port: "PORTB", bit: 1 }, in: { port: "PINB", bit: 1 } } },
																																								17: { value: { out: { port: "PORTB", bit: 0 }, in: { port: "PINB", bit: 0 } } },

																																								18: { value: { out: { port: "PORTF", bit: 7 }, in: { port: "PINF", bit: 7 } } },
																																								A0: { value: { out: { port: "PORTF", bit: 7 }, in: { port: "PINF", bit: 7 } } },
																																								19: { value: { out: { port: "PORTF", bit: 6 }, in: { port: "PINF", bit: 6 } } },
																																								A1: { value: { out: { port: "PORTF", bit: 6 }, in: { port: "PINF", bit: 6 } } },
																																								20: { value: { out: { port: "PORTF", bit: 5 }, in: { port: "PINF", bit: 5 } } },
																																								A2: { value: { out: { port: "PORTF", bit: 5 }, in: { port: "PINF", bit: 5 } } },
																																								21: { value: { out: { port: "PORTF", bit: 4 }, in: { port: "PINF", bit: 4 } } },
																																								A3: { value: { out: { port: "PORTF", bit: 4 }, in: { port: "PINF", bit: 4 } } },

																																								MOSI: { value: {} },
																																								MISO: { value: {} },

																																								spiIn: {
																																																		value: []
																																								},

																																								spiOut: {
																																																		value: {
																																																												listeners: [],
																																																												push: function push(data) {
																																																																						var i = 0,
																																																																						    listeners = this.listeners,
																																																																						    l = listeners.length;
																																																																						for (; i < l; ++i) {
																																																																																listeners[i](data);
																																																																						}
																																																												}
																																																		}
																																								},

																																								serial0: {
																																																		set: function set(str) {
																																																												str = (str || "").replace(/\r\n?/, '\n');
																																																												serial0Buffer += str;

																																																												var br = serial0Buffer.indexOf("\n");
																																																												if (br != -1) {

																																																																						var parts = serial0Buffer.split("\n");
																																																																						while (parts.length > 1) {
																																																																																console.log('SERIAL: ', parts.shift());
																																																																						}serial0Buffer = parts[0];
																																																												}
																																																		}
																																								},

																																								DDRB: {
																																																		set: setDDR.bind(null, "DDRB"),
																																																		get: function get() {
																																																												return oldValues.DDRB | 0;
																																																		}
																																								},
																																								DDRC: {
																																																		set: setDDR.bind(null, "DDRC")
																																								},
																																								DDRD: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								DDRE: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								DDRF: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								PORTB: {
																																																		set: setPort.bind(null, "PORTB")
																																								},
																																								PORTC: {
																																																		set: setPort.bind(null, "PORTC")
																																								},
																																								PORTD: {
																																																		set: setPort.bind(null, "PORTD")
																																								},
																																								PORTE: {
																																																		set: setPort.bind(null, "PORTE")
																																								},
																																								PORTF: {
																																																		set: setPort.bind(null, "PORTF")
																																								}

																														});

																														setTimeout(function (_) {
																																								_this2.setupPeriferals();
																																								_this2._update();
																														}, 5);

																														function setDDR(name, cur) {
																																								var old = oldValues[name];
																																								if (old === cur) return;
																																								oldValues[name] = cur;
																														}

																														function setPort(name, cur) {
																																								var old = oldValues[name];

																																								if (old === cur) return;
																																								var s,
																																								    j,
																																								    l,
																																								    lth = callbacks[name].onLowToHigh,
																																								    htl = callbacks[name].onHighToLow,
																																								    tick = core.tick;

																																								for (var i = 0; i < 8; ++i) {

																																																		var ob = old >>> i & 1,
																																																		    nb = cur >>> i & 1;
																																																		if (lth[i] && !ob && nb) {
																																																												for (j = 0, s = lth[i], l = s.length; j < l; ++j) {
																																																																						s[j](tick);
																																																												}
																																																		}
																																																		if (htl[i] && ob && !nb) {
																																																												for (j = 0, s = htl[i], l = s.length; j < l; ++j) {
																																																																						s[j](tick);
																																																												}
																																																		}
																																								}

																																								oldValues[name] = cur;
																														}
																				}
										}, {
																				key: 'addPeriferal',
																				value: function addPeriferal(ctrl) {

																														this.periferals.push(ctrl);
																				}
										}, {
																				key: 'setupPeriferals',
																				value: function setupPeriferals() {
																														var _this3 = this;

																														var pins = this.core.pins;
																														var map = { cpu: this.core.pins };

																														this.periferals.forEach(function (ctrl) {

																																								if (ctrl.tick) _this3.tick.push(ctrl);

																																								for (var k in ctrl) {

																																																		var v = ctrl[k];
																																																		if (!v || !v.connect) continue;

																																																		var target = v.connect;
																																																		if (typeof target == "number") target = "cpu." + target;

																																																		var tobj = map;
																																																		var tparts = target.split(".");
																																																		while (tparts.length && tobj) {
																																																												tobj = tobj[tparts.shift()];
																																																		}if (v.MOSI) pins.spiOut.listeners.push(v.MOSI.bind(ctrl));

																																																		if (!tobj) {
																																																												console.warn("Could not attach wire from ", k, " to ", target);
																																																												continue;
																																																		}

																																																		if (v.onLowToHigh) pins.onLowToHigh(tobj.out.port, tobj.out.bit, v.onLowToHigh.bind(ctrl));

																																																		if (v.onHighToLow) pins.onHighToLow(tobj.out.port, tobj.out.bit, v.onHighToLow.bind(ctrl));

																																																		var setter = function (tobj, nv) {

																																																												if (nv) pins[tobj.in.port] |= 1 << tobj.in.bit;else pins[tobj.in.port] &= ~(1 << tobj.in.bit);
																																																		}.bind(_this3, tobj);

																																																		var getter = function (tobj) {
																																																												return pins[tobj.out.port] >>> tobj.out.bit & 1;
																																																		}.bind(_this3, tobj);

																																																		Object.defineProperty(v, "value", {
																																																												set: setter,
																																																												get: getter
																																																		});

																																																		if (v.init) v.init.call(ctrl);
																																								}
																														});
																				}
										}, {
																				key: '_update',
																				value: function _update() {
																														if (this.dead) return;

																														requestAnimationFrame(this.update);
																														this.core.update();
																														this.resize();
																														for (var i = 0, l = this.tick.length; i < l; ++i) {
																																								this.tick[i].tick();
																														}
																				}
										}, {
																				key: 'resize',
																				value: function resize() {

																														var maxHeight = this.parent.clientHeight;
																														var maxWidth = this.parent.clientWidth;

																														if (this.width == maxWidth && this.height == maxHeight) return;

																														this.width = maxWidth;
																														this.height = maxHeight;

																														var ratio = 393 / 624;

																														if (this.height * ratio > this.width) {
																																								this.DOM.element.style.width = this.width + "px";
																																								this.DOM.element.style.height = this.width / ratio + "px";
																														} else {
																																								this.DOM.element.style.width = this.height * ratio + "px";
																																								this.DOM.element.style.height = this.height + "px";
																														}
																				}
										}]);

										return Arduboy;
}();

Arduboy["@inject"] = {
										root: [_mvc.Model, { scope: "root" }],
										pool: "pool"
};


module.exports = Arduboy;

},{"../atcore/Atcore.js":12,"../atcore/Hex.js":13,"../lib/mvc.js":26,"dry-di":3}],18:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = function Config(DOM) {
    _classCallCheck(this, Config);

    DOM.element.innerHTML = "C O N F I G";
};

module.exports = Config;

},{}],19:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Files = function Files(DOM) {
    _classCallCheck(this, Files);

    DOM.element.innerHTML = "C O N F I G";
};

module.exports = Files;

},{}],20:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Market = function () {
    function Market(DOM) {
        _classCallCheck(this, Market);
    }

    _createClass(Market, [{
        key: "run",
        value: function run() {
            this.pool.call("runSim");
        }
    }]);

    return Market;
}();

Market["@inject"] = {
    root: [_mvc.Model, { scope: "root" }]
};


module.exports = Market;

},{"../lib/mvc.js":26}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _IStore = require('../store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _mvc = require('../lib/mvc.js');

var _jszipMin = require('jszip/dist/jszip.min.js');

var _jszipMin2 = _interopRequireDefault(_jszipMin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Env = function (_IController) {
	_inherits(Env, _IController);

	function Env() {
		_classCallCheck(this, Env);

		return _possibleConstructorReturn(this, (Env.__proto__ || Object.getPrototypeOf(Env)).apply(this, arguments));
	}

	_createClass(Env, [{
		key: 'exitSplash',
		value: function exitSplash() {
			/* */
			this._show();
			/*/
   this.model.setItem("app.AT32u4.url", "HelloWorld32u4.hex");
   this.pool.call("runSim");
   /* */
		}
	}, {
		key: 'exitSim',
		value: function exitSim() {
			this._show();
		}
	}, {
		key: 'onDropFile',
		value: function onDropFile(dom, event) {
			event.stopPropagation();
			event.preventDefault();

			var dt = event.dataTransfer;
			var files = dt.files;

			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (/.*\.arduboy$|.*\.hex$/i.test(file.name)) return loadFile.call(this, file);
			}

			function loadFile(file) {
				var _this2 = this;

				var fr = new FileReader();
				fr.onload = function (evt) {
					_this2.model.setItem("app.AT32u4.hex", fr.result);
					_this2.pool.call("runSim");
				};
				fr.readAsText(file);
			}
		}
	}, {
		key: 'play',
		value: function play(opt) {
			var _this3 = this;

			var url = opt.element.dataset.url;

			this.model.removeItem("app.AT32u4");

			if (/\.arduboy$/i.test(url)) {

				var zip = null;
				fetch(this.model.getItem("app.proxy") + url).then(function (rsp) {
					return rsp.arrayBuffer();
				}).then(function (buff) {
					return _jszipMin2.default.loadAsync(buff);
				}).then(function (z) {
					return (zip = z).file("info.json").async("text");
				}).then(function (info) {
					return zip.file(JSON.parse(fixJSON(info)).binaries[0].filename).async("text");
				}).then(function (hex) {
					_this3.model.setItem("app.AT32u4.hex", hex);
					_this3.pool.call("runSim");
				}).catch(function (err) {
					console.error(err);
				});
			} else {
				this.model.setItem("app.AT32u4.url", this.model.getItem("app.proxy") + url);
				this.pool.call("runSim");
			}

			function fixJSON(str) {

				if (str.charCodeAt(0) == 0xFEFF) str = str.substr(1);

				return str.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
			}
		}
	}]);

	return Env;
}(_mvc.IController);

Env["@inject"] = {
	store: _IStore2.default,
	pool: "pool",
	viewFactory: [_mvc.IView, { controller: Env }],
	model: [_mvc.Model, { scope: "root" }]
};
exports.default = Env;

},{"../lib/mvc.js":26,"../store/IStore.js":30,"jszip/dist/jszip.min.js":5}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Sim = function (_IController) {
    _inherits(Sim, _IController);

    function Sim() {
        _classCallCheck(this, Sim);

        return _possibleConstructorReturn(this, (Sim.__proto__ || Object.getPrototypeOf(Sim)).apply(this, arguments));
    }

    _createClass(Sim, [{
        key: "runSim",
        value: function runSim() {
            this._show();
        }
    }, {
        key: "onEndSim",
        value: function onEndSim() {
            this.pool.call("exitSim");
        }
    }]);

    return Sim;
}(_mvc.IController);

Sim["@inject"] = {
    pool: "pool",
    viewFactory: [_mvc.IView, { controller: Sim }],
    model: [_mvc.Model, { scope: "root" }]
};
exports.default = Sim;

},{"../lib/mvc.js":26}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // import IStore from '../store/IStore.js';


var Splash = function (_IController) {
    _inherits(Splash, _IController);

    function Splash() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Splash);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Splash.__proto__ || Object.getPrototypeOf(Splash)).call.apply(_ref, [this].concat(args))), _this), _this.BODY = {
            bound: function bound(evt) {
                var target = evt.target;
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Splash, [{
        key: "enterSplash",
        value: function enterSplash() {
            this._show();
        }
    }]);

    return Splash;
}(_mvc.IController);

Splash["@inject"] = {
    pool: "pool",
    viewFactory: [_mvc.IView, { controller: Splash }]
};
exports.default = Splash;

},{"../lib/mvc.js":26}],24:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = DOM;

function DOM(element) {

    if (!element && document && document.body) element = document.body;

    this.element = element;
}

var spare = null;
function getThis(that) {

    if (!that || typeof that == "function") return spare = spare || new DOM();

    return that;
}

function prototype(obj) {

    var desc = {};
    for (var k in obj) {
        desc[k] = {
            enumerable: false,
            value: obj[k]
        };
    }

    var ret = {};
    Object.defineProperties(ret, desc);

    return ret;
}

var impl = {

    create: function create(strTagName, objProperties, arrChildren, elParent) {
        var args = Array.from(arguments);
        strTagName = objProperties = arrChildren = elParent = undefined;

        for (var i = 0, l = args.length; i < l; ++i) {
            var arg = args[i];
            if (typeof arg == "string") strTagName = arg;else if ((typeof arg === "undefined" ? "undefined" : _typeof(arg)) == "object") {
                if (Array.isArray(arg)) arrChildren = arg;else if (arg instanceof Element) elParent = arg;else objProperties = arg;
            }
        }

        if (!elParent && this.element) elParent = this.element;

        if (!strTagName) {
            if (!elParent) strTagName = "span";else strTagName = {
                table: "tr",
                tr: "td",
                select: "option",
                ul: "li",
                ol: "li",
                dl: "dt",
                optgroup: "option",
                datalist: "option"
            }[elParent.tagName] || elParent.tagName;
        }

        var element = document.createElement(strTagName);
        if (elParent) elParent.appendChild(element);

        var listener;

        for (var key in objProperties) {
            var value = objProperties[key];
            if (key == "text") element.appendChild(document.createTextNode(value));else if (key == "listener") listener = value;else if (key == "attr") {
                for (var attr in value) {
                    element.setAttribute(attr, value[attr]);
                }
            } else if (element[key] && _typeof(element[key]) == "object" && (typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") Object.assign(element[key], value);else element[key] = value;
        }

        if (this.element && element.id) this[element.id] = element;

        for (i = 0, l = arrChildren && arrChildren.length; i < l; ++i) {
            this.create.apply(this, arrChildren[i].concat(element));
        }

        if (listener) new DOM(element).listen(listener);

        return element;
    },

    listen: function listen(listeners, that, prefix) {
        prefix = prefix || "";
        if (that === undefined) that = listeners;

        var THIS = getThis(this);

        var keys = Object.keys(listeners);

        THIS.forEach(function (element) {

            if (listeners[prefix + element.tagName]) bind(listeners[prefix + element.tagName], element);

            if (listeners[prefix + element.id]) bind(listeners[prefix + element.id], element);

            if (listeners[prefix + element.className]) bind(listeners[prefix + element.className], element);

            if (listeners[prefix + element.name]) bind(listeners[prefix + element.name], element);
        });

        return THIS;

        function bind(obj, element) {

            for (var event in obj) {
                var func = obj[event];
                if (!func.call) continue;
                element.addEventListener(event, that ? func.bind(that) : func);
            }
        }
    },

    index: function index(keys, multiple, property) {
        var THIS = getThis(this);

        var index = Object.create(DOM.prototype);

        if (typeof keys == "string") keys = [keys];

        for (var i = 0, l = keys.length; i < l; ++i) {

            var key = keys[i];
            if (typeof key != "string") continue;

            if (!property && !multiple) {

                THIS.forEach(function (child) {
                    return child[key] !== undefined && (index[child[key]] = child);
                });
            } else if (property && !multiple) {

                THIS.forEach(function (child) {
                    if (child[property] && _typeof(child[property]) == "object" && child[property][key] !== undefined) index[child[property][key]] = child;
                });
            } else if (!property && typeof multiple == "function") {

                THIS.forEach(function (child) {
                    if (child[key] !== undefined) multiple(child[key], child);
                });
            } else if (property && typeof multiple == "function") {

                THIS.forEach(function (child) {

                    if (!child[property] || _typeof(child[property]) != "object") return;

                    var v = child[property][key];
                    if (v !== undefined) multiple(v, child);
                });
            } else if (!property && multiple) {

                THIS.forEach(function (child) {
                    if (child[key] !== undefined) {
                        if (!index[child[key]]) index[child[key]] = [child];else index[child[key]].push(child);
                    }
                });
            } else if (property && multiple) {

                THIS.forEach(function (child) {

                    if (!child[property] || _typeof(child[property]) != "object") return;

                    var v = child[property][key];
                    if (v !== undefined) {
                        if (!index[v]) index[v] = [child];else index[v].push(child);
                    }
                });
            }
        }

        return index;
    },

    forEach: function forEach(cb, element) {
        var THIS = getThis(this);

        element = element || THIS.element;

        if (!element) return;

        if (cb(element) === false) return;

        if (!element.children) return;

        for (var i = 0, l = element.children.length; i < l; ++i) {
            THIS.forEach(cb, element.children[i]);
        }
    }

};

Object.assign(DOM, impl);
DOM.prototype = prototype(impl);

},{}],25:[function(require,module,exports){
"use strict";

/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.
  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:
  var m = new MersenneTwister(123);
  and that will always produce the same random sequence.
  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

var MersenneTwister = function MersenneTwister(seed) {
  if (seed == undefined) {
    seed = new Date().getTime();
  }
  /* Period parameters */
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df; /* constant vector a */
  this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
  this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

  this.mt = new Array(this.N); /* the array for the state vector */
  this.mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */

  this.init_genrand(seed);
};

/* initializes mt[N] with a seed */
MersenneTwister.prototype.init_genrand = function (s) {
  this.mt[0] = s >>> 0;
  for (this.mti = 1; this.mti < this.N; this.mti++) {
    var s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
    this.mt[this.mti] = (((s & 0xffff0000) >>> 16) * 1812433253 << 16) + (s & 0x0000ffff) * 1812433253 + this.mti;
    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
    /* In the previous versions, MSBs of the seed affect   */
    /* only MSBs of the array mt[].                        */
    /* 2002/01/09 modified by Makoto Matsumoto             */
    this.mt[this.mti] >>>= 0;
    /* for >32 bit machines */
  }
};

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
  var i, j, k;
  this.init_genrand(19650218);
  i = 1;j = 0;
  k = this.N > key_length ? this.N : key_length;
  for (; k; k--) {
    var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
    this.mt[i] = (this.mt[i] ^ (((s & 0xffff0000) >>> 16) * 1664525 << 16) + (s & 0x0000ffff) * 1664525) + init_key[j] + j; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;j++;
    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];i = 1;
    }
    if (j >= key_length) j = 0;
  }
  for (k = this.N - 1; k; k--) {
    var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
    this.mt[i] = (this.mt[i] ^ (((s & 0xffff0000) >>> 16) * 1566083941 << 16) + (s & 0x0000ffff) * 1566083941) - i; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;
    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];i = 1;
    }
  }

  this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
};

/* generates a random number on [0,0xffffffff]-interval */
MersenneTwister.prototype.genrand_int32 = function () {
  var y;
  var mag01 = new Array(0x0, this.MATRIX_A);
  /* mag01[x] = x * MATRIX_A  for x=0,1 */

  if (this.mti >= this.N) {
    /* generate N words at one time */
    var kk;

    if (this.mti == this.N + 1) /* if init_genrand() has not been called, */
      this.init_genrand(5489); /* a default initial seed is used */

    for (kk = 0; kk < this.N - this.M; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 0x1];
    }
    for (; kk < this.N - 1; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 0x1];
    }
    y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;
    this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 0x1];

    this.mti = 0;
  }

  y = this.mt[this.mti++];

  /* Tempering */
  y ^= y >>> 11;
  y ^= y << 7 & 0x9d2c5680;
  y ^= y << 15 & 0xefc60000;
  y ^= y >>> 18;

  return y >>> 0;
};

/* generates a random number on [0,0x7fffffff]-interval */
MersenneTwister.prototype.genrand_int31 = function () {
  return this.genrand_int32() >>> 1;
};

/* generates a random number on [0,1]-real-interval */
MersenneTwister.prototype.genrand_real1 = function () {
  return this.genrand_int32() * (1.0 / 4294967295.0);
  /* divided by 2^32-1 */
};

/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function () {
  return this.genrand_int32() * (1.0 / 4294967296.0);
  /* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */
MersenneTwister.prototype.genrand_real3 = function () {
  return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
  /* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/
MersenneTwister.prototype.genrand_res53 = function () {
  var a = this.genrand_int32() >>> 5,
      b = this.genrand_int32() >>> 6;
  return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
};

/* These real versions are due to Isaku Wada, 2002/01/09 added */

module.exports = MersenneTwister;

},{}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.boot = exports.IController = exports.IView = exports.Model = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dryDi = require('dry-di');

var _strldr = require('./strldr.js');

var _strldr2 = _interopRequireDefault(_strldr);

var _IStore = require('../store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _dryDom = require('./dry-dom.js');

var _dryDom2 = _interopRequireDefault(_dryDom);

var _pool = require('./pool.js');

var _pool2 = _interopRequireDefault(_pool);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function read(str, ctx) {

    var parts = str.split("."),
        i = 0;

    while (i < parts.length && ctx) {
        ctx = ctx[parts[i++]];
    }return ctx;
}

function readMethod(str, ctx) {
    var _ctx;

    var parts = str.split("."),
        i = 0;

    var pctx = ctx;

    while (i < parts.length && ctx) {
        pctx = ctx;
        ctx = ctx[parts[i++]];
    }

    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
    }

    if (ctx && typeof ctx === "function") return (_ctx = ctx).bind.apply(_ctx, [pctx].concat(args));

    return null;
}

function write(str, value, ctx) {

    var parts = str.split("."),
        i = 0;

    while (parts.length - 1 && ctx) {
        if (!(parts[i] in ctx)) ctx[parts[i]] = {};
        ctx = ctx[parts[i++]];
    }

    if (ctx) ctx[parts[i]] = value;

    return !!ctx;
}

var pending = [];
var nextModelId = 0;

var Model = function () {
    function Model() {
        var _this = this;

        _classCallCheck(this, Model);

        var listeners = {};
        var data = {};
        var children = {};
        var revChildren = {};
        var parents = {};

        Object.defineProperty(data, "__model__", { value: this, writable: false, enumerable: false });

        Object.defineProperties(this, {
            root: { value: this, enumerable: false, writable: true },
            listeners: { value: listeners, enumerable: false, writable: false },
            data: { value: data, enumerable: false, writable: true },
            children: { value: children, enumerable: false, writable: false },
            revChildren: { value: revChildren, enumerable: false, writable: false },
            parents: { value: parents, enumerable: false, writable: false },
            id: { value: ++nextModelId, enumerable: false, writable: false },
            dirty: {
                get: function get() {
                    return _this.root.__dirty;
                },
                set: function set(v) {
                    return _this.root.__dirty = v;
                }
            }
        });
    }

    _createClass(Model, [{
        key: 'store',
        value: function store() {
            var binary = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            return _strldr2.default.store(this.data, binary);
        }
    }, {
        key: 'load',
        value: function load(data) {
            var doRaise = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;


            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                    data = _strldr2.default.load(data);
                } catch (ex) {}
            }

            if (data && data.buffer && data.buffer instanceof ArrayBuffer) {
                if (!(data instanceof Uint8Array)) data = new Uint8Array(data.buffer);
                data = _strldr2.default.load(data, true);
            }

            for (var k in data) {
                this.setItem(k, data[k], doRaise);
            }

            return this;
        }
    }, {
        key: 'setItem',
        value: function setItem(k, v) {
            var doRaise = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


            if (k.charCodeAt) k = k.split(".");
            var prop = k.shift(),
                child;
            var data = this.data,
                children = this.children,
                revChildren = this.revChildren;

            if (k.length) {

                child = children[prop];
                if (!child) {
                    child = children[prop] = new Model();
                    child.root = this.root;
                    child.parents[this.id] = this;
                    data[prop] = child.data;
                    this.dirty = true;
                    revChildren[child.id] = [prop];
                    this.raise(prop, false);
                }

                return children[prop].setItem(k, v, doRaise);
            }

            if (children[prop]) {

                if (children[prop].data !== v) return;

                child = children[prop];

                var index = revChildren[child.id].indexOf(prop);
                if (index === -1) throw new Error("Integrity compromised");

                revChildren[child.id].splice(index, 1);

                delete child.parents[this.id];
            }

            if (v && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) == "object") {

                var doLoad = false;
                if (!v.__model__) {
                    child = new Model();
                    child.root = this.root;
                    doLoad = true;
                } else {
                    child = v.__model__;
                }

                if (!revChildren[child.id]) revChildren[child.id] = [prop];else revChildren[child.id].push(prop);
                children[prop] = child;
                child.parents[this.id] = this;

                if (doLoad) {
                    child.load(v, false);
                    child.data = v;
                    Object.defineProperty(v, "__model__", { value: child, writable: false });
                }
            }

            data[prop] = v;

            this.dirty = true;
            this.raise(prop, doRaise);

            return this;
        }
    }, {
        key: 'getModel',
        value: function getModel(k, create) {

            if (k.charCodeAt) k = k.split(".");

            var ctx = this,
                i = 0;
            if (create) {
                while (ctx && i < k.length) {
                    if (!ctx.children[k[i]]) ctx.setItem(k[i], {});
                    ctx = ctx.children[k[i++]];
                }
            } else {
                while (ctx && i < k.length) {
                    ctx = ctx.children[k[i++]];
                }
            }

            return ctx;
        }
    }, {
        key: 'getItem',
        value: function getItem(k, defaultValue) {
            var v = read(k, this.data);
            if (v === undefined) v = defaultValue;
            return v;
        }
    }, {
        key: 'removeItem',
        value: function removeItem(k, cb) {

            var parent = k.split(".");
            var key = parent.pop();

            var model = this.getModel(parent);
            var data = model.data,
                children = model.children;

            if (!(key in data)) return;

            if (children[key]) {

                var child = children[key],
                    revChildren = model.revChildren[child.id];

                var index = revChildren.indexOf(key);
                if (index == -1) throw "Integrity compromised";

                revChildren.splice(index, 1);

                if (revChildren.length == 0) {
                    delete child.parents[model.id];
                    delete model.revChildren[child.id];
                }

                delete children[key];
            }

            delete data[key];

            model.raise(key, true);
        }
    }, {
        key: 'raise',
        value: function raise(k, doRaise) {

            pending[pending.length++] = { model: this, key: k };

            if (!doRaise) return;

            for (var i = 0, l = pending.length; i < l; ++i) {

                k = pending[i].key;
                var model = pending[i].model;

                if (k) {

                    dispatch(model.listeners[k], model.data[k], k);
                } else {

                    for (var pid in model.parents) {

                        var parent = model.parents[pid];
                        var revChildren = parent.revChildren[model.id];
                        if (!revChildren) throw "Integrity compromised";

                        for (var j = 0, rcl = revChildren.length; j < rcl; ++j) {

                            dispatch(parent.listeners[revChildren[j]], parent.data, revChildren[j]);
                        }
                    }
                }
            }

            pending.length = 0;

            function dispatch(listeners, value, key) {

                if (!listeners) return;

                for (var i = 0, l = listeners.length; i < l; ++i) {
                    listeners[i](value, key);
                }
            }
        }

        // attach( k:String, cb:Function )
        // listen to notifications from a particular key
        // attach( cb:Function )
        // listen to key additions/removals

    }, {
        key: 'attach',
        value: function attach(k, cb) {
            var key = k.split(".");
            var model;
            if (key.length == 1) {
                key = k;
                model = this;
            } else {
                k = key.pop();
                model = this.getModel(key, true);
                key = k;
            }

            if (!model.listeners[key]) model.listeners[key] = [cb];else model.listeners[key].push(cb);
        }

        // stop listening

    }, {
        key: 'detach',
        value: function detach(k, cb) {

            var index, listeners;

            if (typeof k == "function") {
                cb = k;
                k = "";
            }

            listeners = this.listeners[k];
            if (!listeners[k]) return;

            index = listeners.indexOf(cb);
            if (index == -1) return;

            listeners.splice(index, 1);
        }
    }]);

    return Model;
}();

var cache = {};

var IView = function () {
    function IView(controller) {
        var _this2 = this;

        _classCallCheck(this, IView);

        var layout = "layouts/" + controller.constructor.name + ".html";
        this.controller = controller;
        this.dom = null;

        if (!cache[layout]) {

            fetch(layout).then(function (rsp) {

                if (!rsp.ok && rsp.status !== 0) throw new Error("Not OK!");
                return rsp.text();
            }).then(function (text) {
                return new window.DOMParser().parseFromString(text, "text/html");
            }).then(function (html) {
                cache[layout] = html;
                _this2.loadLayout(html);
            }).catch(function (ex) {

                _this2.parentElement.innerHTML = '<div>' + (ex.message || ex) + (': ' + layout + '!</div>');
            });
        } else this.loadLayout(cache[layout]);
    }

    _createClass(IView, [{
        key: 'loadLayout',
        value: function loadLayout(doc) {
            var _this3 = this;

            doc = doc.cloneNode(true);
            [].concat(_toConsumableArray(doc.body.children)).forEach(function (child) {
                return _this3.parentElement.appendChild(child);
            });

            var dom = new _dryDom2.default(this.parentElement);
            this.dom = dom;

            prepareDOM(dom, this.controller, this.model);
        }
    }]);

    return IView;
}();

IView["@inject"] = {
    parentElement: "ParentElement",
    model: [Model, { scope: 'root' }]
};


function prepareDOM(dom, controller, _model) {

    dom.forEach(function (element) {

        if (element.dataset.src && !element.dataset.inject) {
            switch (element.tagName) {
                case 'UL':
                case 'OL':
                    var template = element.cloneNode(true);
                    _model.attach(element.dataset.src, renderList.bind(element, template));
                    renderList(element, template, _model.getItem(element.dataset.src));
                    break;

                default:
                    break;
            }
            return false;
        }

        for (var i = 0; i < element.attributes.length; ++i) {
            var key = element.attributes[i].name;
            var value = element.attributes[i].value;

            var parts = key.split("-");

            if (parts.length == 2) switch (parts[1]) {
                case "call":
                    var target = readMethod(value, controller, dom);
                    if (target) element.addEventListener(parts[0], target);else console.warn("Could not bind event to " + controller.constructor.name + "." + name);

                    break;

                case "toggle":
                    var vparts = value.match(/^([^@]+)\@([^=]+)\=(.+)$/);

                    if (vparts) bindToggle(element, parts[0], vparts);else console.warn("Could not parse toggle: " + value);
                    break;

            }

            var memo = { __src: value, __hnd: 0 };
            value.replace(/\{\{([^\}]+)\}\}/g, bindAttribute.bind(null, element.attributes[i], memo));
            updateAttribute(element.attributes[i], memo);
        }

        if (element.dataset.inject && element != dom.element) {

            var childDom = new _dryDom2.default(element);
            Object.assign(childDom, childDom.index("id"));

            var ctrl = (0, _dryDi.getInstanceOf)(element.dataset.inject, childDom);
            dom[element.dataset.inject] = ctrl;

            prepareDOM(childDom, ctrl);

            return false;
        }
    });

    function bindToggle(element, event, cmd) {
        element.addEventListener(event, function () {
            [].concat(_toConsumableArray(dom.element.querySelectorAll(cmd[1]))).forEach(function (target) {
                return target.setAttribute(cmd[2], cmd[3]);
            });
        });
    }

    function renderList(element, template, arr) {

        while (element.children.length) {
            element.removeChild(element.children[0]);
        }for (var key in arr) {

            var childModel = new Model();
            childModel.load(_model.data);
            childModel.setItem("key", key);
            childModel.setItem("value", arr[key]);
            childModel.root = _model.root;

            [].concat(_toConsumableArray(template.cloneNode(true).children)).forEach(function (child) {

                element.appendChild(child);
                prepareDOM(new _dryDom2.default(child), controller, childModel);
            });
        }
    }

    function bindAttribute(attr, memo, match, inner) {

        if (inner in memo) return "";

        _model.attach(inner, function (value) {
            memo[inner] = value;
            if (memo.__hnd) return;
            memo.__hnd = setTimeout(updateAttribute.bind(null, attr, memo), 1);
        });

        memo[inner] = _model.getItem(inner);

        return "";
    }

    function updateAttribute(attr, memo) {
        memo.__hnd = 0;
        attr.value = memo.__src.replace(/\{\{([^\}]+)\}\}/g, function (match, path) {
            return _typeof(memo[path]) == "object" ? JSON.stringify(memo[path]) : memo[path];
        });
    }
}

var defaultModel = null;

var IController = function () {
    function IController() {
        _classCallCheck(this, IController);

        this.pool.add(this);
    }

    _createClass(IController, [{
        key: '_show',
        value: function _show() {
            console.log("created view");
            this.pool.call("setActiveView", null);
            var view = this.viewFactory(this);
            return view;
        }
    }]);

    return IController;
}();

IController["@inject"] = {
    viewFactory: IView,
    pool: "pool",
    model: Model
};


function boot(_ref) {
    var main = _ref.main,
        element = _ref.element,
        components = _ref.components,
        entities = _ref.entities;


    (0, _dryDi.bind)(_pool2.default).to('pool').singleton();
    (0, _dryDi.bind)(Model).to(Model).withTags({ scope: 'root' }).singleton();

    for (var k in components) {
        (0, _dryDi.bind)(components[k]).to(k);
    }for (var k in entities) {
        var ctrl = entities[k];
        // console.log( "Adding entity " + k, ctrl );
        (0, _dryDi.bind)(ctrl).to(IController);
        (0, _dryDi.bind)(IView).to(IView).injecting([document.body, 'ParentElement']).withTags({ controller: ctrl }).factory();
    }

    (0, _dryDi.bind)(main).to(main).injecting([new _dryDom2.default(element), _dryDom2.default]);
    (0, _dryDi.getInstanceOf)(main);
}

exports.Model = Model;
exports.IView = IView;
exports.IController = IController;
exports.boot = boot;

},{"../store/IStore.js":30,"./dry-dom.js":24,"./pool.js":27,"./strldr.js":28,"dry-di":3}],27:[function(require,module,exports){
"use strict";

var nextUID = 0;

function getUID() {
    return ++nextUID;
}

function Pool() {
    var methods = {
        constructor: []
    };
    var silence = {
        "onTick": 1,
        "onPostTick": 1,
        "onRender": 1
    };
    var debug = null;
    var proxies = [];
    var contents = {};

    function onEvent(e) {
        var target = e.target;
        var names = (target.className || "").split(/\s+/).filter(function (n) {
            return n.length > 0;
        });

        var event = e.type;
        event = event.substr(0, 1).toUpperCase() + event.substr(1);

        while (target) {
            var id = target.id;
            if (target.onclick) return;
            if (id) {
                id = id.substr(0, 1).toUpperCase() + id.substr(1);

                var i = 0,
                    name;
                if (names.length) {
                    while (name = names[i++]) {
                        name = name.substr(0, 1).toUpperCase() + name.substr(1);
                        $$("on" + event + id + name, target);
                    }
                } else {
                    $$("on" + event + id, target);
                }
                break;
            }
            target = target.parentNode;
        }
    }

    this.registerEvents = function (target, args) {
        if (!args && target && DOC.typeOf(target) == "array") {
            args = target;
            target = null;
        }
        if (!target) target = document.body;
        if (!args) {
            args = [];
            for (var k in target) {
                var m = k.match(/^on(.+)/);
                if (!m) continue;
                args.push(m[1]);
            }
        }
        args.forEach(function (arg) {
            target.addEventListener(arg, onEvent);
        });
    };

    this.debug = function (m) {
        debug = m;
    };

    this.silence = function (m) {
        silence[m] = 1;
    };

    this.addProxy = function (obj) {
        if (obj && obj.call) proxies.push(obj);
    };

    this.removeProxy = function (obj) {
        var i = proxies.indexOf(obj);
        if (i == -1) return;
        proxies.splice(i, 1);
    };

    this.add = function (obj, enableDirectMsg) {
        if (!obj) return;
        if (debug && obj.constructor.name == debug) console.log("add", obj);

        if (!("__uid" in obj)) obj.__uid = getUID();

        if (!("__uid" in obj)) console.warn("Could not add __uid to ", obj, obj.constructor.name);

        contents[obj.__uid] = obj;
        var clazz = obj.constructor;
        if (obj.methods || clazz.methods) {
            var arr = obj.methods || clazz.methods;
            if (!(arr instanceof Array)) arr = Object.keys(arr);
            var l = arr.length;
            for (var i = 0; i < l; ++i) {
                var m = arr[i];
                if (m && m[0] != "_") {
                    this.listen(obj, m, enableDirectMsg);
                    if (clazz.meta[m] && clazz.meta[m].silence) this.silence(m);
                }
            }
        } else {
            var properties = {},
                cobj = obj;
            do {
                Object.assign(properties, Object.getOwnPropertyDescriptors(cobj));
            } while (cobj = Object.getPrototypeOf(cobj));

            for (var k in properties) {
                if (typeof obj[k] != "function") continue;
                if (k && k[0] != "_") this.listen(obj, k);
            }
        }
    };

    this.remove = function (obj) {
        if (obj.constructor.name == debug) console.log("remove", obj);

        delete contents[obj.__uid];

        if (obj.methods || obj.constructor.methods) {
            for (var k in obj.methods || obj.constructor.methods) {
                this.mute(obj, k);
            }
        } else {
            var properties = {},
                cobj = obj;
            do {
                Object.assign(properties, Object.getOwnPropertyDescriptors(cobj));
            } while (cobj = Object.getPrototypeOf(cobj));

            for (var k in properties) {
                this.mute(obj, k);
            }
        }
    };

    this.poll = function (t) {
        if (!t) return contents;
        var keys = Object.keys(contents);
        var ret = [];
        var count = 0;
        for (; count < keys.length; ++count) {
            ret.push(t(contents[keys[count]]));
        }return ret;
    };

    this.listen = function (obj, name, enableDirectMsg) {
        var method = obj[name];
        if (typeof method != "function") return;

        var arr = methods[name];
        if (!arr) arr = methods[name] = {};
        arr[obj.__uid] = {
            THIS: obj,
            method: method
        };

        if (enableDirectMsg) {
            arr = methods[name + obj.__uid];
            if (!arr) arr = methods[name + obj.__uid] = {};
            arr[obj.__uid] = {
                THIS: obj,
                method: method
            };
        }
    };

    this.mute = function (obj, name) {
        var method = obj[name];
        var listeners = methods[name];
        if (!listeners) return;
        delete listeners[obj.__uid];
    };

    this.call = function (method) {
        if (method === undefined) {
            console.error("Undefined call");
            return;
        }

        var i, l;

        /* * /
        var args = Array.prototype.slice.call(arguments, 1);
        /*/
        var args = new Array(arguments.length - 1);
        for (i = 1, l = arguments.length; i < l; i++) {
            args[i - 1] = arguments[i];
        } /* */

        for (i = 0; i < proxies.length; ++i) {
            proxies[i].call(method, args);
        }

        var listeners = methods[method];
        if (!listeners) {
            if (!(method in silence)) console.log(method + ": 0");
            return;
        }

        var keys = Object.keys(listeners);
        var ret; //=undefined
        var count = 0,
            c;
        for (; count < keys.length; ++count) {
            c = listeners[keys[count]];

            // DEBUG
            if (debug && (method == debug || c.THIS.constructor.name == debug)) console.log(c.THIS, method, args);
            // END-DEBUG

            var lret = c && c.method.apply(c.THIS, args);
            if (lret !== undefined) ret = lret;
        }
        if (!(method in silence)) console.log(method + ": " + count);
        return ret;
    };
}

module.exports = Pool;

},{}],28:[function(require,module,exports){
(function (global){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function store(obj, asBuffer) {

    if (typeof obj == "function") obj = undefined;
    if (!obj || (typeof obj === "undefined" ? "undefined" : _typeof(obj)) != "object") return obj;

    var inst = [],
        strIndex = { "Object": -2, "Array": -3 },
        arrIndex = {},
        objIndex = [];

    add(obj);

    if (asBuffer) return toBuffer(inst);

    return inst;

    function add(obj) {
        var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
        if (type == "function") {
            obj = undefined;
            type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
        }

        var index;
        if (obj === undefined) {
            index = -4;
        } else if (type == "string") {
            index = strIndex[obj];
            if (index === undefined) index = -1;
        } else index = inst.indexOf(obj);

        if (index != -1) return index;

        if (type == "object") {
            index = objIndex.indexOf(obj);
            if (index != -1) return index;
        }

        index = inst.length;
        inst[index] = obj;

        if (type == "string") strIndex[obj] = index;

        if (!obj || type != "object") return index;

        objIndex[index] = obj;

        var ctorIndex = add(obj.constructor.fullName || obj.constructor.name);

        if (obj.buffer && obj.buffer instanceof ArrayBuffer) {

            if (!asBuffer) obj = Array.from(obj);

            inst[index] = [ctorIndex, -3, obj];
            return index;
        }

        var key,
            keySet = [];
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                var keyIndex = strIndex[key];
                if (keyIndex === undefined) {
                    keyIndex = inst.length;
                    inst[keyIndex] = key;
                    strIndex[key] = keyIndex;
                    keyIndex = -1;
                }
                keySet[keySet.length] = keyIndex;
            }
        }

        var strKeySet = JSON.stringify(keySet);
        keyIndex = arrIndex[strKeySet];
        if (keyIndex === undefined) {
            keyIndex = inst.length;
            inst[keyIndex] = keySet;
            arrIndex[strKeySet] = keyIndex;
        }

        var valueSet = [ctorIndex, keyIndex];

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                var valueIndex = add(value);
                valueSet[valueSet.length] = valueIndex;
            }
        }

        strKeySet = JSON.stringify(valueSet);
        keyIndex = arrIndex[strKeySet];
        if (keyIndex === undefined) {
            arrIndex[strKeySet] = index;
            inst[index] = valueSet;
        } else {
            inst[index] = [keyIndex];
        }

        return index;
    }
}

function load(arr, isBuffer) {

    if (isBuffer || arr && arr.buffer) arr = fromBuffer(arr);

    var SELF = null;

    if (!arr || (typeof arr === "undefined" ? "undefined" : _typeof(arr)) !== "object") return arr;

    if (!Array.isArray(arr)) return undefined;

    (function () {
        try {
            SELF = window;
        } catch (ex) {}
    })();
    if (!SELF) (function () {
        try {
            SELF = global;
        } catch (ex) {}
    })();

    var objects = [];

    var cursor = 0;
    return read(-1);

    function read(pos) {

        switch (pos) {
            case -1:
                pos = cursor;
                break;
            case -2:
                return "Object";
            case -3:
                return "Array";
            default:
                if (objects[pos]) return objects[pos];

                break;
        }

        if (pos == cursor) cursor++;

        var value = arr[pos];
        if (!value) return value;

        var type = typeof value === "undefined" ? "undefined" : _typeof(value);
        if (type != "object") return value;

        if (value.length == 1) value = arr[value[0]];

        var className = read(value[0]);

        if (!className.split) console.log(className, value[0]);

        var ctor = SELF,
            obj;
        className.split(".").forEach(function (part) {
            return ctor = ctor[part];
        });

        if (value[1] !== -3) {
            obj = new ctor();
            objects[pos] = obj;

            var fieldRefList,
                mustAdd = value[1] > pos;

            fieldRefList = arr[value[1]];

            var fieldList = fieldRefList.map(function (ref) {
                return read(ref);
            });

            if (mustAdd) cursor++;

            for (var i = 2; i < value.length; ++i) {
                var vi = value[i];
                if (vi !== -4) obj[fieldList[i - 2]] = read(vi);
            }
        } else {

            obj = value[2];
            if (!isBuffer) objects[pos] = obj = ctor.from(obj);else objects[pos] = obj = new ctor(obj);

            cursor++;
        }

        return obj;
    }
}

function toBuffer(src) {
    var out = [];

    var dab = new Float64Array(1);
    var bab = new Uint8Array(dab.buffer);
    var sab = new Int32Array(dab.buffer);
    var fab = new Float32Array(dab.buffer);

    var p = 0;

    for (var i = 0, l = src.length; i < l; ++i) {
        var value = src[i],
            type = typeof value === "undefined" ? "undefined" : _typeof(value);

        switch (type) {
            case "boolean":
                // 1, 2
                out[p++] = 1 + (value | 0);
                break;

            case "number":
                var isFloat = Math.floor(value) !== value;
                if (isFloat) {

                    fab[0] = value;

                    if (fab[0] === value || isNaN(value)) {
                        out[p++] = 3;
                        out[p++] = bab[0];out[p++] = bab[1];
                        out[p++] = bab[2];out[p++] = bab[3];
                    } else {
                        dab[0] = value;
                        out[p++] = 4;
                        out[p++] = bab[0];out[p++] = bab[1];
                        out[p++] = bab[2];out[p++] = bab[3];
                        out[p++] = bab[4];out[p++] = bab[5];
                        out[p++] = bab[6];out[p++] = bab[7];
                    }
                } else {
                    saveInt(0, value);
                }
                break;

            case "string":
                var start = p,
                    restart = false;
                saveInt(1, value.length);
                for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                    var byte = value.charCodeAt(bi);
                    if (byte > 0xFF) {
                        restart = true;
                        break;
                    }
                    out[p++] = byte;
                }

                if (!restart) break;

                p = start;
                saveInt(2, value.length);

                for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                    var byte = value.charCodeAt(bi);
                    out[p++] = byte & 0xFF;
                    out[p++] = byte >> 8 & 0xFF;
                }

                break;

            case "object":
                if (_typeof(value[2]) == "object") {
                    var typed = new Uint8Array(value[2].buffer);

                    saveInt(3, -typed.length);
                    saveInt(0, value[0]);

                    for (var bi = 0, bl = typed.length; bi < bl; ++bi) {
                        out[p++] = typed[bi];
                    }
                } else {
                    saveInt(3, value.length);
                    for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                        saveInt(0, value[bi]);
                    }
                }

                break;
        }
    }

    return Uint8Array.from(out);

    function saveInt(type, value) {

        var bitCount = Math.ceil(Math.log2(Math.abs(value)));
        var byte = type << 6;

        if (bitCount < 3 || value === -8) {
            byte |= 0x30;
            byte |= value & 0xF;
            out[p++] = byte;
            return;
        }

        if (bitCount <= 8 + 3 || value === -2048) {
            byte |= 0x10;
            byte |= value >>> 8 & 0xF;
            out[p++] = byte;
            out[p++] = value & 0xFF;
            return;
        }

        if (bitCount <= 16 + 3 || value === -524288) {
            byte |= 0x20;
            byte |= value >>> 16 & 0xF;
            out[p++] = byte;
            out[p++] = value >>> 8 & 0xFF;
            out[p++] = value & 0xFF;
            return;
        }

        sab[0] = value;
        out[p++] = byte;
        out[p++] = bab[0];out[p++] = bab[1];
        out[p++] = bab[2];out[p++] = bab[3];
        return;
    }
}

function fromBuffer(src) {
    var out = [];
    var dab = new Float64Array(1);
    var bab = new Uint8Array(dab.buffer);
    var sab = new Int32Array(dab.buffer);
    var fab = new Float32Array(dab.buffer);

    var pos = 0;

    for (var l = src.length; pos < l;) {
        out[out.length] = read();
    }return out;

    function read() {
        var tmp;
        var byte = src[pos++];
        switch (byte) {
            case 0:
                break;
            case 1:
                return false;
            case 2:
                return true;
            case 3:
                return decodeFloat32();
            case 4:
                return decodeFloat64();
        }

        var hb = byte >>> 4;
        var lb = byte & 0xF;
        switch (hb & 3) {
            case 0:
                // 32 bit int
                tmp = decodeInt32();
                break;
            case 1:
                // 12 bit int
                tmp = src[pos++] | lb << 28 >> 20;
                break;
            case 2:
                // 19 bit int
                tmp = lb << 28 >> 12 | src[pos] | src[pos + 1] << 8;
                pos += 2;
                break;
            case 3:
                // 4-bit int
                tmp = lb << 28 >> 28;
        }

        switch (hb >> 2) {
            case 0:
                return tmp;
            case 1:
                return decodeStr8(tmp);
            case 2:
                return decodeStr16(tmp);
            case 3:
                return decodeArray(tmp);
        }
    }

    function decodeStr8(size) {
        var acc = "";
        for (var i = 0; i < size; ++i) {
            acc += String.fromCharCode(src[pos++]);
        }return acc;
    }

    function decodeStr16(size) {
        var acc = "";
        for (var i = 0; i < size; ++i) {
            var h = src[pos++];
            acc += String.fromCharCode(h << 8 | src[pos++]);
        }
        return acc;
    }

    function decodeArray(size) {

        var ret = [];
        if (size < 0) {

            ret[0] = read(); // type
            ret[1] = -3;

            size = -size;

            var bytes = new Uint8Array(size);

            for (var i = 0; i < size; ++i) {
                bytes[i] = src[pos++];
            }ret[2] = bytes.buffer;
        } else {

            for (var i = 0; i < size; ++i) {
                ret[i] = read();
            }
        }

        return ret;
    }

    function decodeInt32() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        return sab[0];
    }

    function decodeFloat32() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        return fab[0];
    }

    function decodeFloat64() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        bab[4] = src[pos++];bab[5] = src[pos++];
        bab[6] = src[pos++];bab[7] = src[pos++];
        return dab[0];
    }
}

module.exports = { store: store, load: load };

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],29:[function(require,module,exports){
'use strict';

var _dryDi = require('dry-di');

var _App = require('./App.js');

var _App2 = _interopRequireDefault(_App);

var _IStore = require('./store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _Node = require('./store/Node.js');

var _Node2 = _interopRequireDefault(_Node);

var _mt = require('./lib/mt.js');

var _mt2 = _interopRequireDefault(_mt);

var _mvc = require('./lib/mvc.js');

var _Env = require('./entities\\Env.js');

var _Env2 = _interopRequireDefault(_Env);

var _Sim = require('./entities\\Sim.js');

var _Sim2 = _interopRequireDefault(_Sim);

var _Splash = require('./entities\\Splash.js');

var _Splash2 = _interopRequireDefault(_Splash);

var _arduboy = require('./components\\arduboy.js');

var _arduboy2 = _interopRequireDefault(_arduboy);

var _BTN = require('./components\\BTN.js');

var _BTN2 = _interopRequireDefault(_BTN);

var _config = require('./components\\config.js');

var _config2 = _interopRequireDefault(_config);

var _files = require('./components\\files.js');

var _files2 = _interopRequireDefault(_files);

var _LED = require('./components\\LED.js');

var _LED2 = _interopRequireDefault(_LED);

var _market = require('./components\\market.js');

var _market2 = _interopRequireDefault(_market);

var _SCREEN = require('./components\\SCREEN.js');

var _SCREEN2 = _interopRequireDefault(_SCREEN);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entities = {
    Env: _Env2.default,
    Sim: _Sim2.default,
    Splash: _Splash2.default
}; // let {bind, inject, getInstanceOf} = require('./lib/dry-di.js');

Object.freeze(entities);
var components = {
    arduboy: _arduboy2.default,
    BTN: _BTN2.default,
    config: _config2.default,
    files: _files2.default,
    LED: _LED2.default,
    market: _market2.default,
    SCREEN: _SCREEN2.default
};
Object.freeze(components);
var scenecomponents = {};
Object.freeze(scenecomponents);
var scenecontrollers = {};
Object.freeze(scenecontrollers);


function makeRNG(seed) {
    var rng = new _mt2.default(Math.round(seed || 0));
    return rng.random.bind(rng);
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {

        (0, _dryDi.bind)(_Node2.default).to(_IStore2.default).singleton();
        (0, _dryDi.bind)(makeRNG).to("RNG").factory();

        for (var k in scenecomponents) {
            (0, _dryDi.bind)(scenecomponents[k]).to(k).withTags({ scenecomponent: true });
        }for (var _k in scenecontrollers) {
            (0, _dryDi.bind)(scenecontrollers[_k]).to(_k).withTags({ scenecontroller: true });
        }(0, _mvc.boot)({
            main: _App2.default,
            element: document.body,
            components: components,
            entities: entities,
            modelName: 'default'
        });
    }, 2000);
});

},{"./App.js":6,"./components\\BTN.js":14,"./components\\LED.js":15,"./components\\SCREEN.js":16,"./components\\arduboy.js":17,"./components\\config.js":18,"./components\\files.js":19,"./components\\market.js":20,"./entities\\Env.js":21,"./entities\\Sim.js":22,"./entities\\Splash.js":23,"./lib/mt.js":25,"./lib/mvc.js":26,"./store/IStore.js":30,"./store/Node.js":31,"dry-di":3}],30:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = null;

function mkdirp(base, path, callback) {
    var acc = base || "";
    var paths = path.split(/[\/\\]+/);
    paths.pop(); // remove last file/empty entry
    work();
    return;

    function work() {
        if (!paths.length) return callback(true);
        var current = paths.shift();
        fs.mkdir(acc + current, function (err) {
            if (err && err.code != 'EEXIST') {
                callback(false);
            } else {
                acc += current + '/';
                work();
            }
        });
    }
}

var onload = [],
    wasInit = false;
var lock = {};

var IStore = function () {
    function IStore() {
        _classCallCheck(this, IStore);
    }

    _createClass(IStore, [{
        key: 'getTextItem',
        value: function getTextItem(k, cb) {

            if (lock[k]) cb(lock[k]);else fs.readFile(this.root + k, "utf-8", function (err, data) {
                return cb(data);
            });
        }
    }, {
        key: 'getItemBuffer',
        value: function getItemBuffer(k, cb) {

            if (lock[k]) cb(lock[k]);else {
                console.log("Reading ", k);
                fs.readFile(this.root + k, function (err, data) {
                    console.log("Read ", k, err);
                    cb(data);
                });
            }
        }
    }, {
        key: 'setItem',
        value: function setItem(k, v, cb) {
            var _this = this;

            mkdirp(this.root, k, function (success) {

                if (!success) {
                    cb(false);
                } else if (lock[k]) {
                    setTimeout(_this.setItem.bind(_this, k, v, cb), 200);
                } else {
                    lock[k] = v;
                    fs.writeFile(_this.root + k, v, function (err) {

                        delete lock[k];
                        if (cb) cb(!err);
                    });
                }
            });
        }
    }, {
        key: 'onload',
        set: function set(cb) {
            if (wasInit) cb();else onload.push(cb);
        }
    }, {
        key: 'fs',
        set: function set(_fs) {
            var _this2 = this;

            if (fs) return;

            fs = _fs;

            mkdirp(this.root, "store/", function () {

                _this2.root += "store/";

                wasInit = true;

                for (var i = 0, cb; cb = onload[i]; ++i) {
                    cb();
                }
            });
        }
    }]);

    return IStore;
}();

module.exports = IStore;

},{}],31:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IStore = require('./IStore.js');

if (window.require) {

    var fs = window.require('fs');

    var _window$require = window.require('electron'),
        app = _window$require.remote.app;

    var _window$require2 = window.require('electron'),
        webFrame = _window$require2.webFrame;

    webFrame.registerURLSchemeAsPrivileged('file', {});
} else {

    fs = {
        mkdir: function mkdir(path, cb) {
            cb();
        },
        readFile: function readFile(path, enc, cb) {

            var data = localStorage.getItem(path);

            if (typeof enc === "function") {

                cb = enc;
                if (data === null) return cb("ENOENT");

                data = data.split(",");
                var buffer = new Uint8Array(data.length);
                for (var i = 0, l = data.length; i < l; ++i) {
                    buffer[i] = data[i] | 0;
                }data = buffer;
            } else if (data === null) return cb("ENOENT");

            cb(undefined, data);
        },
        writeFile: function writeFile(path, data, cb) {

            localStorage.setItem(path, data);
            cb(true);
        }
    };
}

var NodeStore = function (_IStore) {
    _inherits(NodeStore, _IStore);

    function NodeStore() {
        _classCallCheck(this, NodeStore);

        var _this = _possibleConstructorReturn(this, (NodeStore.__proto__ || Object.getPrototypeOf(NodeStore)).call(this));

        if (app) _this.root = app.getPath("userData") + "/";else _this.root = "";

        _this.fs = fs;

        return _this;
    }

    return NodeStore;
}(IStore);

module.exports = NodeStore;

},{"./IStore.js":30}]},{},[29])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9kcnktZGkvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGpzemlwXFxkaXN0XFxub2RlX21vZHVsZXNcXGpzemlwXFxkaXN0XFxqc3ppcC5taW4uanMiLCIuLlxcc3JjXFxBcHAuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzI4UC1UQy5qcyIsIi4uXFxzcmNcXGF0Y29yZVxcQXQzMjhQLVVTQVJULmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxBdDMyOFAtcGVyaWZlcmFscy5qcyIsIi4uXFxzcmNcXGF0Y29yZVxcQXQzMnU0LVNQSS5qcyIsIi4uXFxzcmNcXGF0Y29yZVxcQXQzMnU0LXBlcmlmZXJhbHMuanMiLCIuLlxcc3JjXFxhdGNvcmVcXHNyY1xcYXRjb3JlXFxBdGNvcmUuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEhleC5qcyIsIi4uXFxzcmNcXGNvbXBvbmVudHNcXEJUTi5qcyIsIi4uXFxzcmNcXGNvbXBvbmVudHNcXExFRC5qcyIsIi4uXFxzcmNcXGNvbXBvbmVudHNcXFNDUkVFTi5qcyIsIi4uXFxzcmNcXGNvbXBvbmVudHNcXGFyZHVib3kuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxjb25maWcuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxmaWxlcy5qcyIsIi4uXFxzcmNcXGNvbXBvbmVudHNcXG1hcmtldC5qcyIsIi4uXFxzcmNcXGVudGl0aWVzXFxFbnYuanMiLCIuLlxcc3JjXFxlbnRpdGllc1xcU2ltLmpzIiwiLi5cXHNyY1xcZW50aXRpZXNcXFNwbGFzaC5qcyIsIi4uXFxzcmNcXGxpYlxcZHJ5LWRvbS5qcyIsIi4uXFxzcmNcXGxpYlxcbXQuanMiLCIuLlxcc3JjXFxsaWJcXG12Yy5qcyIsIi4uXFxzcmNcXGxpYlxccG9vbC5qcyIsIi4uXFxzcmNcXGxpYlxcc3JjXFxsaWJcXHN0cmxkci5qcyIsIi4uXFxzcmNcXHBjLmpzIiwiLi5cXHNyY1xcc3RvcmVcXElTdG9yZS5qcyIsIi4uXFxzcmNcXHN0b3JlXFxOb2RlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxcURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FB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WSxxQ0FBcUMsS0FBSyxJQUExQyxHQUFpRCxHQUE3RDtBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSxzQkFBc0IsS0FBSyxJQUEzQixHQUFrQyxHQUE5QztBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSwyQkFBMkIsS0FBSyxJQUFoQyxHQUF1QyxHQUFuRDtBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSwyQkFBMkIsS0FBSyxJQUFoQyxHQUF1QyxHQUFuRDtBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSxxQ0FBcUMsS0FBSyxJQUExQyxHQUFpRCxHQUE3RDtBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSwyQkFBMkIsS0FBSyxJQUFoQyxHQUF1QyxHQUFuRDtBQUNILGFBSEssTUFHQSxJQUFJLFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBdkIsSUFBNEIsU0FBUyxDQUF6QyxFQUE0QztBQUM5QyxxQkFBSyxJQUFMLEdBQVksQ0FBWjtBQUNBLHdCQUFRLEdBQVIsQ0FBWSwyQkFBMkIsS0FBSyxJQUFo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O0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBQ2xEO0FBQUUsY0FBSyxRQUFMLEdBQWlCLE9BQUssQ0FBTixHQUFXLEtBQUssUUFBTCxHQUFjLElBQXpDO0FBQWdEOzs7OEJBRWxEO0FBQUUsY0FBSyxJQUFMLEdBQVks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QUFESixpQkFFQSxPQUFPLE1BQVA7QUFFSCxhQVpELE1BWU0sSUFBSSxTQUFTLElBQWIsRUFDRixPQUFPLEdBQUksUUFBSixDQUFQOztBQUVKLGVBQUksU0FBSixFQUFlLElBQWY7QUFFSCxTQTNCQTtBQTZCRCxpQkE3QkMscUJBNkJVLElBN0JWLEVBNkJnQixJQTdCaEIsRUE2QnNCLEVBN0J0QixFQTZCMEI7O0FBRXZCLHlCQUFhLE9BQWIsQ0FBc0IsSUFBdEIsRUFBNEIsSUFBNUI7QUFDQSxlQUFHLElBQUg7QUFFSDtBQWxDQSxLQUFMO0FBcUNIOztJQUVLLFM7OztBQUVGLHlCQUFhO0FBQUE7O0FBQUE7O0FBR1QsWUFBSSxHQUFKLEVBQ0ksTUFBSyxJQUFMLEdBQVksSUFBSSxPQUFKLENBQVksVUFBWixJQUEwQixHQUF0QyxDQURKLEtBR0ksTUFBSyxJQUFMLEdBQVksRUFBWjs7QUFFSixjQUFLLEVBQUwsR0FBVSxFQUFWOztBQVJTO0FBVVo7OztFQVptQixNOztBQWlCeEIsT0FBTyxPQUFQLEdBQWlCLFNBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIHBsYWNlSG9sZGVyc0NvdW50IChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG4gIC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcbiAgLy8gcmVwcmVzZW50IG9uZSBieXRlXG4gIC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuICAvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG4gIHJldHVybiBiNjRbbGVuIC0gMl0gPT09ICc9JyA/IDIgOiBiNjRbbGVuIC0gMV0gPT09ICc9JyA/IDEgOiAwXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICAvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbiAgcmV0dXJuIGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVyc0NvdW50KGI2NClcbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuICBwbGFjZUhvbGRlcnMgPSBwbGFjZUhvbGRlcnNDb3VudChiNjQpXG5cbiAgYXJyID0gbmV3IEFycihsZW4gKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gbGVuIC0gNCA6IGxlblxuXG4gIHZhciBMID0gMFxuXG4gIGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcbiAgICB0bXAgPSAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHwgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltMKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbTCsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcbiAgICB0bXAgPSAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltMKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbTCsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICsgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIG91dHB1dCA9ICcnXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBvdXRwdXQgKz0gbG9va3VwW3RtcCA+PiAyXVxuICAgIG91dHB1dCArPSBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdXG4gICAgb3V0cHV0ICs9ICc9PSdcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgKHVpbnQ4W2xlbiAtIDFdKVxuICAgIG91dHB1dCArPSBsb29rdXBbdG1wID4+IDEwXVxuICAgIG91dHB1dCArPSBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gJz0nXG4gIH1cblxuICBwYXJ0cy5wdXNoKG91dHB1dClcblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7X19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9fVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnSWYgZW5jb2RpbmcgaXMgc3BlY2lmaWVkIHRoZW4gdGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIHJldHVybiBmcm9tT2JqZWN0KHZhbHVlKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBuZWdhdGl2ZScpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImVuY29kaW5nXCIgbXVzdCBiZSBhIHZhbGlkIHN0cmluZyBlbmNvZGluZycpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1xcJ29mZnNldFxcJyBpcyBvdXQgb2YgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXFwnbGVuZ3RoXFwnIGlzIG91dCBvZiBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoaXNBcnJheUJ1ZmZlclZpZXcob2JqKSB8fCAnbGVuZ3RoJyBpbiBvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICAgIH1cblxuICAgIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBhcnJheS1saWtlIG9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWVcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKGlzQXJyYXlCdWZmZXJWaWV3KHN0cmluZykgfHwgc3RyaW5nIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmcgPSAnJyArIHN0cmluZ1xuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0ICAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDApIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmIChjb2RlIDwgMjU2KSB7XG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gTm9kZSAwLjEwIHN1cHBvcnRzIGBBcnJheUJ1ZmZlcmAgYnV0IGxhY2tzIGBBcnJheUJ1ZmZlci5pc1ZpZXdgXG5mdW5jdGlvbiBpc0FycmF5QnVmZmVyVmlldyAob2JqKSB7XG4gIHJldHVybiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KG9iailcbn1cblxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xyXG5cclxudmFyIF9zbGljZWRUb0FycmF5ID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSkgX2lbXCJyZXR1cm5cIl0oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2VcIik7IH0gfTsgfSgpO1xyXG5cclxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcclxuXHJcbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7IGFycjJbaV0gPSBhcnJbaV07IH0gcmV0dXJuIGFycjI7IH0gZWxzZSB7IHJldHVybiBBcnJheS5mcm9tKGFycik7IH0gfVxyXG5cclxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XHJcblxyXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cclxuXHJcbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgYmluZDogYmluZCwgaW5qZWN0OiBpbmplY3QsIGdldEluc3RhbmNlT2Y6IGdldEluc3RhbmNlT2YsIGdldFBvbGljeTogZ2V0UG9saWN5IH07XHJcblxyXG4vKlxyXG5cclxuV2VsY29tZSB0byBEUlktREkuXHJcblxyXG4qL1xyXG5cclxudmFyIGtub3duSW50ZXJmYWNlcyA9IFtdO1xyXG52YXIgaW50ZXJmYWNlcyA9IHt9O1xyXG52YXIgY29uY3JldGlvbnMgPSB7fTtcclxuXHJcbnZhciBjb250ZXh0ID0gW3t9XTtcclxuXHJcbnZhciBSZWYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBSZWYocHJvdmlkZXIsIGlmaWQsIHNjb3BlKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlZik7XHJcblxyXG4gICAgICAgIHRoaXMuaWZpZCA9IGlmaWQ7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IHByb3ZpZGVyLmRlcGVuZGVuY3lDb3VudDtcclxuICAgICAgICB0aGlzLmRlcGVuZGVuY3lDb3VudCA9IHByb3ZpZGVyLmRlcGVuZGVuY3lDb3VudDtcclxuICAgICAgICB0aGlzLnNjb3BlID0gc2NvcGU7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZHMgPSB7fTtcclxuICAgICAgICB0aGlzLmluamVjdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlcjtcclxuXHJcbiAgICAgICAgdmFyIHBzbG90ID0gc2NvcGVbaWZpZF0gfHwgKHNjb3BlW2lmaWRdID0gbmV3IFNsb3QoKSk7XHJcblxyXG4gICAgICAgIGlmIChwcm92aWRlci5pbmplY3Rpb25zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuaW5qZWN0aW9ucywgcHJvdmlkZXIuaW5qZWN0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbmplY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX2lmaWQgPSB0aGlzLmluamVjdGlvbnNba2V5XTtcclxuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gc2NvcGVbX2lmaWRdIHx8IChzY29wZVtfaWZpZF0gPSBuZXcgU2xvdCgpKTtcclxuICAgICAgICAgICAgICAgIHNsb3QuYWRkSW5qZWN0b3IodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBzbG90LmFkZFByb3ZpZGVyKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhSZWYsIFt7XHJcbiAgICAgICAga2V5OiBcImJpbmRJbmplY3Rpb25zXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRJbmplY3Rpb25zKGluamVjdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGluamVjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMiksXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhenogPSBfcmVmMlswXSxcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX3JlZjJbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKF9pbnRlcmZhY2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluamVjdGlvbiA9IGluamVjdGlvbnNba2V5XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gX3RoaXMuYmluZHMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmaWQgPSBfdGhpcy5pbmplY3Rpb25zW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2NvcGVbX3RoaXMuaWZpZF0ucmVtb3ZlSW5qZWN0b3IoX3RoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNhdGlzZnkoKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kZXBlbmRlbmN5Q291bnQtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBfdGhpcy5iaW5kc1trZXldID0gY2xheno7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgICBrZXk6IFwic2F0aXNmeVwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzYXRpc2Z5KCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb3VudC0tO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY291bnQgPT0gMCkgdGhpcy5zY29wZVt0aGlzLmlmaWRdLmFkZFZpYWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gUmVmO1xyXG59KCk7XHJcblxyXG52YXIgU2xvdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFNsb3QoKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFNsb3QpO1xyXG5cclxuICAgICAgICB0aGlzLnZpYWJsZVByb3ZpZGVycyA9IDA7XHJcbiAgICAgICAgdGhpcy5wcm92aWRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmluamVjdG9ycyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhTbG90LCBbe1xyXG4gICAgICAgIGtleTogXCJhZGRJbmplY3RvclwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRJbmplY3RvcihyZWYpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0b3JzLnB1c2gocmVmKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID4gMCkgcmVmLnNhdGlzZnkoKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInJlbW92ZUluamVjdG9yXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUluamVjdG9yKHJlZikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5pbmplY3RvcnMuaW5kZXhPZihyZWYpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkgdGhpcy5pbmplY3RvcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImFkZFByb3ZpZGVyXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFByb3ZpZGVyKHJlZikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wcm92aWRlcnMucHVzaChyZWYpO1xyXG4gICAgICAgICAgICBpZiAocmVmLmNvdW50ID09IDApIHRoaXMuYWRkVmlhYmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJhZGRWaWFibGVcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYWRkVmlhYmxlKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52aWFibGVQcm92aWRlcnMrKztcclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID09IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5qZWN0b3JzID0gdGhpcy5pbmplY3RvcnM7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGluamVjdG9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmplY3RvcnNbaV0uc2F0aXNmeSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJnZXRWaWFibGVcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VmlhYmxlKGNsYXp6LCB0YWdzLCBtdWx0aXBsZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghbXVsdGlwbGUpIHRocm93IG5ldyBFcnJvcihcIk5vIHZpYWJsZSBwcm92aWRlcnMgZm9yIFwiICsgY2xhenogKyBcIi4gIzEyNlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHJldCA9IG11bHRpcGxlID8gW10gOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgdmFyIG1vc3RWaWFibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgbWF4UG9pbnRzID0gLTE7XHJcbiAgICAgICAgICAgIG5vdFZpYWJsZTogZm9yICh2YXIgaSA9IDAsIGM7IGMgPSB0aGlzLnByb3ZpZGVyc1tpXTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYy5jb3VudCkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRzID0gYy5kZXBlbmRlbmN5Q291bnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFncyAmJiBjLnRhZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGFncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy50YWdzW3RhZ10gIT09IHRhZ3NbdGFnXSkgY29udGludWUgbm90VmlhYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobXVsdGlwbGUpIHJldFtyZXQubGVuZ3RoXSA9IGMucHJvdmlkZXIucG9saWN5LmJpbmQoYy5wcm92aWRlciwgYy5iaW5kcyk7ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvaW50cyA+IG1heFBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhQb2ludHMgPSBwb2ludHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vc3RWaWFibGUgPSBjO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFtdWx0aXBsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtb3N0VmlhYmxlKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB2aWFibGUgcHJvdmlkZXJzIGZvciBcIiArIGNsYXp6ICsgXCIuIFRhZyBtaXNtYXRjaC5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vc3RWaWFibGUucHJvdmlkZXIucG9saWN5LmJpbmQobW9zdFZpYWJsZS5wcm92aWRlciwgbW9zdFZpYWJsZS5iaW5kcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gU2xvdDtcclxufSgpO1xyXG5cclxuZnVuY3Rpb24gcmVnaXN0ZXJJbnRlcmZhY2UoaWZjKSB7XHJcblxyXG4gICAgdmFyIHByb3BzID0ge30sXHJcbiAgICAgICAgY3VycmlmYyA9IHZvaWQgMDtcclxuXHJcbiAgICBpZiAodHlwZW9mIGlmYyA9PSBcImZ1bmN0aW9uXCIpIGN1cnJpZmMgPSBpZmMucHJvdG90eXBlO2Vsc2UgaWYgKCh0eXBlb2YgaWZjID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YoaWZjKSkgPT0gXCJvYmplY3RcIikgY3VycmlmYyA9IGlmYztcclxuXHJcbiAgICB3aGlsZSAoY3VycmlmYyAmJiBjdXJyaWZjICE9PSBPYmplY3QucHJvdG90eXBlKSB7XHJcblxyXG4gICAgICAgIHZhciBuYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGlmYy5wcm90b3R5cGUpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwcm9wc1tuYW1lXSkgcHJvcHNbbmFtZV0gPSBfdHlwZW9mKGlmYy5wcm90b3R5cGVbbmFtZV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmlmYyA9IGN1cnJpZmMucHJvdG90eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW4gPSBrbm93bkludGVyZmFjZXMubGVuZ3RoO1xyXG4gICAgaW50ZXJmYWNlc1tsZW5dID0gcHJvcHM7XHJcbiAgICBrbm93bkludGVyZmFjZXNbbGVuXSA9IGlmYztcclxuXHJcbiAgICByZXR1cm4gbGVuO1xyXG59XHJcblxyXG52YXIgUHJvdmlkZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFByb3ZpZGUoKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFByb3ZpZGUpO1xyXG5cclxuICAgICAgICB0aGlzLmluamVjdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZGVwZW5kZW5jeUNvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmNsYXp6ID0gbnVsbDtcclxuICAgICAgICB0aGlzLmN0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuYmluZHMgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IHBvbGljeSBpcyB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2UgZm9yIGVhY2ggaW5qZWN0aW9uXHJcbiAgICAgICAgdGhpcy5wb2xpY3kgPSBmdW5jdGlvbiAoYmluZHMsIGFyZ3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmN0b3IoYmluZHMsIGFyZ3MpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUNsYXNzKFByb3ZpZGUsIFt7XHJcbiAgICAgICAga2V5OiBcImNsb25lXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb25lKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHJldCA9IG5ldyBQcm92aWRlKCk7XHJcblxyXG4gICAgICAgICAgICByZXQuaW5qZWN0aW9ucyA9IHRoaXMuaW5qZWN0aW9ucztcclxuICAgICAgICAgICAgcmV0LmRlcGVuZGVuY3lDb3VudCA9IHRoaXMuZGVwZW5kZW5jeUNvdW50O1xyXG4gICAgICAgICAgICByZXQuY2xhenogPSB0aGlzLmNsYXp6O1xyXG4gICAgICAgICAgICByZXQucG9saWN5ID0gdGhpcy5wb2xpY3k7XHJcbiAgICAgICAgICAgIHJldC5jdG9yID0gdGhpcy5jdG9yO1xyXG4gICAgICAgICAgICByZXQuYmluZHMgPSB0aGlzLmJpbmRzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImJpbmRJbmplY3Rpb25zXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRJbmplY3Rpb25zKGluamVjdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBiaW5kcyA9IHRoaXMuYmluZHMgPSB0aGlzLmJpbmRzIHx8IFtdO1xyXG4gICAgICAgICAgICB2YXIgYmluZENvdW50ID0gdGhpcy5iaW5kcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBpbmplY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKF9yZWYzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3JlZjQgPSBfc2xpY2VkVG9BcnJheShfcmVmMywgMiksXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhenogPSBfcmVmNFswXSxcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX3JlZjRbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kQ291bnQ7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaW5kc1tpXVswXSA9PSBjbGF6eikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYmluZHNbYmluZHMubGVuZ3RoXSA9IFtjbGF6eiwgX2ludGVyZmFjZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJnZXRSZWZcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UmVmKGlmaWQsIF9pbnRlcmZhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBtYXAgPSBpbnRlcmZhY2VzW2lmaWRdLFxyXG4gICAgICAgICAgICAgICAgY2xhenogPSB0aGlzLmNsYXp6O1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKF90eXBlb2YoY2xhenoucHJvdG90eXBlW2tleV0pID09IG1hcFtrZXldKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNsYXNzIFwiICsgY2xhenoubmFtZSArIFwiIGNhbid0IHByb3ZpZGUgdG8gaW50ZXJmYWNlIFwiICsgX2ludGVyZmFjZS5uYW1lICsgXCIgYmVjYXVzZSBcIiArIGtleSArIFwiIGlzIFwiICsgX3R5cGVvZihjbGF6eltrZXldKSArIFwiIGluc3RlYWQgb2YgXCIgKyBtYXBba2V5XSArIFwiLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWYodGhpcywgaWZpZCwgY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInNldENvbmNyZXRpb25cIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0Q29uY3JldGlvbihjbGF6eikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jbGF6eiA9IGNsYXp6O1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNsYXp6ID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdG9yID0gZnVuY3Rpb24gKF9jbGF6eikge1xyXG4gICAgICAgICAgICAgICAgICAgIF9pbmhlcml0cyhfY2xhc3MsIF9jbGF6eik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9jbGFzcyhiaW5kcywgYXJncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3JlZjU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX2NsYXNzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoX3JlZjUgPSBfY2xhc3MuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihfY2xhc3MpKS5jYWxsLmFwcGx5KF9yZWY1LCBbdGhpc10uY29uY2F0KF90b0NvbnN1bWFibGVBcnJheShhcmdzKSkpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfY2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9KGNsYXp6KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGNsYXp6LnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvbGljeSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2xheno7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY2lkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoY2xhenopO1xyXG4gICAgICAgICAgICBpZiAoY2lkID09IC0xKSBjaWQgPSByZWdpc3RlckludGVyZmFjZShjbGF6eik7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbmNyZXRpb25zW2NpZF0pIGNvbmNyZXRpb25zW2NpZF0gPSBbdGhpc107ZWxzZSBjb25jcmV0aW9uc1tjaWRdLnB1c2godGhpcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImZhY3RvcnlcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZmFjdG9yeSgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9saWN5ID0gZnVuY3Rpb24gKGJpbmRzLCBhcmdzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgVEhJUyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJnczIgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczJbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRISVMuY3RvcihiaW5kcywgYXJncy5jb25jYXQoYXJnczIpKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInNpbmdsZXRvblwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzaW5nbGV0b24oKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnBvbGljeSA9IGZ1bmN0aW9uIChiaW5kcywgYXJncykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZSkgcmV0dXJuIGluc3RhbmNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gT2JqZWN0LmNyZWF0ZSh0aGlzLmN0b3IucHJvdG90eXBlKTtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlLmNvbnN0cnVjdG9yID0gdGhpcy5jdG9yO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdG9yLmNhbGwoaW5zdGFuY2UsIGJpbmRzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuZXcgKGNsYXNzIGV4dGVuZHMgdGhpcy5jdG9ye1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnN0cnVjdG9yKCBhcmdzICl7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGluc3RhbmNlID0gdGhpczsgLy8gY2FudCBkbyB0aGlzIDooXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHN1cGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIFByb3ZpZGU7XHJcbn0oKTtcclxuXHJcbmZ1bmN0aW9uIGJpbmQoY2xhenopIHtcclxuXHJcbiAgICB2YXIgY2lkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoY2xhenopO1xyXG4gICAgaWYgKGNpZCA9PSAtMSkge1xyXG4gICAgICAgIGNpZCA9IHJlZ2lzdGVySW50ZXJmYWNlKGNsYXp6KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJvdmlkZXJzID0gY29uY3JldGlvbnNbY2lkXTtcclxuICAgIHZhciBsb2NhbFByb3ZpZGVycyA9IFtdO1xyXG5cclxuICAgIGlmICghcHJvdmlkZXJzKSB7XHJcblxyXG4gICAgICAgIGlmIChjbGF6eiAmJiBjbGF6eltcIkBpbmplY3RcIl0pIGluamVjdChjbGF6eltcIkBpbmplY3RcIl0pLmludG8oY2xhenopO2Vsc2UgbmV3IFByb3ZpZGUoKS5zZXRDb25jcmV0aW9uKGNsYXp6KTtcclxuXHJcbiAgICAgICAgcHJvdmlkZXJzID0gY29uY3JldGlvbnNbY2lkXTtcclxuICAgIH1cclxuXHJcbiAgICBsb2NhbFByb3ZpZGVycyA9IHByb3ZpZGVycy5tYXAoZnVuY3Rpb24gKHBhcnRpYWwpIHtcclxuICAgICAgICByZXR1cm4gcGFydGlhbC5jbG9uZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJlZnMgPSBbXTtcclxuICAgIHZhciB0YWdzID0gbnVsbDtcclxuICAgIHZhciBpZmlkID0gdm9pZCAwO1xyXG5cclxuICAgIHZhciBwYXJ0aWFsQmluZCA9IHtcclxuICAgICAgICB0bzogZnVuY3Rpb24gdG8oX2ludGVyZmFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihfaW50ZXJmYWNlKTtcclxuICAgICAgICAgICAgaWYgKGlmaWQgPT0gLTEpIGlmaWQgPSByZWdpc3RlckludGVyZmFjZShfaW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlZiA9IHByb3ZpZGVyLmdldFJlZihpZmlkLCBfaW50ZXJmYWNlKTtcclxuICAgICAgICAgICAgICAgIHJlZi50YWdzID0gdGFncztcclxuICAgICAgICAgICAgICAgIHJlZnMucHVzaChyZWYpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdpdGhUYWdzOiBmdW5jdGlvbiB3aXRoVGFncyh0YWdzKSB7XHJcbiAgICAgICAgICAgIHJlZnMuZm9yRWFjaChmdW5jdGlvbiAocmVmKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVmLnRhZ3MgPSB0YWdzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2luZ2xldG9uOiBmdW5jdGlvbiBzaW5nbGV0b24oKSB7XHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdmlkZXIuc2luZ2xldG9uKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uIGZhY3RvcnkoKSB7XHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdmlkZXIuZmFjdG9yeSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmplY3Q6IGZ1bmN0aW9uIGluamVjdChtYXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0aW5nKG1hcCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmplY3Rpbmc6IGZ1bmN0aW9uIGluamVjdGluZygpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcclxuICAgICAgICAgICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVmcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWYpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWYuYmluZEluamVjdGlvbnMoYXJncyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBsb2NhbFByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3ZpZGVyLmJpbmRJbmplY3Rpb25zKGFyZ3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHBhcnRpYWxCaW5kO1xyXG59XHJcblxyXG52YXIgSW5qZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gSW5qZWN0KGRlcGVuZGVuY2llcykge1xyXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmplY3QpO1xyXG5cclxuICAgICAgICB0aGlzLmRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcztcclxuICAgICAgICB2YXIgdGFncyA9IHRoaXMudGFncyA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICAgICAgdGFnc1trZXldID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhJbmplY3QsIFt7XHJcbiAgICAgICAga2V5OiBcImludG9cIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW50byhjbGF6eikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGNsYXp6KTtcclxuICAgICAgICAgICAgaWYgKGNpZCA9PSAtMSkgY2lkID0gcmVnaXN0ZXJJbnRlcmZhY2UoY2xhenopO1xyXG5cclxuICAgICAgICAgICAgdmFyIGluamVjdGlvbnMgPSB7fSxcclxuICAgICAgICAgICAgICAgIG1hcCA9IHRoaXMuZGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jeUNvdW50ID0gMCxcclxuICAgICAgICAgICAgICAgIHRhZ3MgPSB0aGlzLnRhZ3MsXHJcbiAgICAgICAgICAgICAgICBtdWx0aXBsZSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG1hcCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBfaW50ZXJmYWNlID0gbWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVwZW5kZW5jeSA9IF9pbnRlcmZhY2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZXBlbmRlbmN5KSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX2ludGVyZmFjZVswXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGRlcGVuZGVuY3kubGVuZ3RoOyArK2kpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVwZW5kZW5jeVtpXSA9PSBcInN0cmluZ1wiKSB0YWdzW2tleV1bZGVwZW5kZW5jeVtpXV0gPSB0cnVlO2Vsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGVwZW5kZW5jeVtpXSkpIG11bHRpcGxlW2tleV0gPSB0cnVlO2Vsc2UgaWYgKGRlcGVuZGVuY3lbaV0pIE9iamVjdC5hc3NpZ24odGFnc1trZXldLCBkZXBlbmRlbmN5W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihfaW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaWZpZCA9PSAtMSkgaWZpZCA9IHJlZ2lzdGVySW50ZXJmYWNlKF9pbnRlcmZhY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGluamVjdGlvbnNba2V5XSA9IGlmaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jeUNvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm92aWRlciA9IG5ldyBQcm92aWRlKCkuc2V0Q29uY3JldGlvbihjbGF6eiksXHJcbiAgICAgICAgICAgICAgICBwcm90byA9IGNsYXp6LnByb3RvdHlwZTtcclxuICAgICAgICAgICAgdmFyIHByb3ZpZGVycyA9IGNvbmNyZXRpb25zW2NpZF07XHJcblxyXG4gICAgICAgICAgICBwcm92aWRlci5pbmplY3Rpb25zID0gaW5qZWN0aW9ucztcclxuICAgICAgICAgICAgcHJvdmlkZXIuZGVwZW5kZW5jeUNvdW50ID0gZGVwZW5kZW5jeUNvdW50O1xyXG5cclxuICAgICAgICAgICAgcHJvdmlkZXIuY3RvciA9IGZ1bmN0aW9uIChiaW5kcywgYXJncykge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZURlcGVuZGVuY2llcyhiaW5kcywgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICBjbGF6ei5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcHJvdmlkZXIuY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGNsYXp6LnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIHByb3ZpZGVyLmN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY2xheno7XHJcblxyXG4gICAgICAgICAgICAvLyBwcm92aWRlci5jdG9yID0gY2xhc3MgZXh0ZW5kcyBjbGF6eiB7XHJcbiAgICAgICAgICAgIC8vICAgICBjb25zdHJ1Y3RvciggYXJncyApe1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlc29sdmVEZXBlbmRlbmNpZXMoIHRoaXMgKTsgLy8gKnNpZ2gqXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc3VwZXIoLi4uYXJncyk7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgIC8vIH07XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZXNvbHZlRGVwZW5kZW5jaWVzKGJpbmRzLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIHZhciBzbG90c2V0ID0gY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2tleTMgaW4gaW5qZWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaW5kcyAmJiBpbmplY3Rpb25zW19rZXkzXSBpbiBiaW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpbX2tleTNdID0gYmluZHNbaW5qZWN0aW9uc1tfa2V5M11dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzbG90ID0gc2xvdHNldFtpbmplY3Rpb25zW19rZXkzXV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvbGljeSA9IHNsb3QuZ2V0VmlhYmxlKF9rZXkzLCB0YWdzW19rZXkzXSwgbXVsdGlwbGVbX2tleTNdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlW19rZXkzXSkgb2JqW19rZXkzXSA9IHBvbGljeShbXSk7ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdXQgPSBvYmpbX2tleTNdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pMiA9IDA7IF9pMiA8IHBvbGljeS5sZW5ndGg7ICsrX2kyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRbX2kyXSA9IHBvbGljeVtfaTJdKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gSW5qZWN0O1xyXG59KCk7XHJcblxyXG5mdW5jdGlvbiBpbmplY3QoZGVwZW5kZW5jaWVzKSB7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbmplY3QoZGVwZW5kZW5jaWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SW5zdGFuY2VPZihfaW50ZXJmYWNlKSB7XHJcbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMyA+IDEgPyBfbGVuMyAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW4zOyBfa2V5NCsrKSB7XHJcbiAgICAgICAgYXJnc1tfa2V5NCAtIDFdID0gYXJndW1lbnRzW19rZXk0XTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsZXQgaWZpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKCBfaW50ZXJmYWNlICk7XHJcbiAgICAvLyBsZXQgc2xvdCA9IGNvbnRleHRbIGNvbnRleHQubGVuZ3RoLTEgXVsgaWZpZCBdO1xyXG5cclxuICAgIC8vIGlmKCAhc2xvdCApXHJcbiAgICAvLyAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcHJvdmlkZXJzIGZvciBcIiArIChfaW50ZXJmYWNlLm5hbWUgfHwgX2ludGVyZmFjZSkgKyBcIi4gIzQ2N1wiKTtcclxuXHJcbiAgICAvLyBsZXQgcG9saWN5ID0gc2xvdC5nZXRWaWFibGUoIF9pbnRlcmZhY2UubmFtZSB8fCBfaW50ZXJmYWNlICk7XHJcblxyXG4gICAgLy8gcmV0dXJuIHBvbGljeS5jYWxsKCBudWxsLCBhcmdzICk7XHJcbiAgICByZXR1cm4gZ2V0UG9saWN5KHsgX2ludGVyZmFjZTogX2ludGVyZmFjZSwgYXJnczogYXJncyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UG9saWN5KGRlc2MpIHtcclxuICAgIGRlc2MgPSBkZXNjIHx8IHt9O1xyXG4gICAgaWYgKCFkZXNjLl9pbnRlcmZhY2UpIHRocm93IG5ldyBFcnJvcihcIlBvbGljeSBkZXNjcmlwdG9yIGhhcyBubyBpbnRlcmZhY2UuXCIpO1xyXG4gICAgdmFyIG5hbWUgPSBkZXNjLl9pbnRlcmZhY2UubmFtZSB8fCBkZXNjLl9pbnRlcmZhY2U7XHJcbiAgICB2YXIgdGFncyA9IGRlc2MudGFncztcclxuICAgIHZhciBtdWx0aXBsZSA9IGRlc2MubXVsdGlwbGU7XHJcbiAgICB2YXIgYXJncyA9IGRlc2MuYXJncztcclxuXHJcbiAgICB2YXIgaWZpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGRlc2MuX2ludGVyZmFjZSk7XHJcbiAgICB2YXIgc2xvdCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXVtpZmlkXTtcclxuXHJcbiAgICBpZiAoIXNsb3QpIHRocm93IG5ldyBFcnJvcihcIk5vIHByb3ZpZGVycyBmb3IgXCIgKyBuYW1lICsgXCIuICM0NjdcIik7XHJcblxyXG4gICAgdmFyIHBvbGljeSA9IHNsb3QuZ2V0VmlhYmxlKG5hbWUsIHRhZ3MsIG11bHRpcGxlKTtcclxuICAgIGlmIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKG11bHRpcGxlKSBwb2xpY3kgPSBwb2xpY3kubWFwKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwLmNhbGwobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfSk7ZWxzZSBwb2xpY3kgPSBwb2xpY3kuY2FsbChudWxsLCBhcmdzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwb2xpY3k7XHJcbn1cclxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIvKiFcblxuSlNaaXAgdjMuMS41IC0gQSBKYXZhU2NyaXB0IGNsYXNzIGZvciBnZW5lcmF0aW5nIGFuZCByZWFkaW5nIHppcCBmaWxlc1xuPGh0dHA6Ly9zdHVhcnRrLmNvbS9qc3ppcD5cblxuKGMpIDIwMDktMjAxNiBTdHVhcnQgS25pZ2h0bGV5IDxzdHVhcnQgW2F0XSBzdHVhcnRrLmNvbT5cbkR1YWwgbGljZW5jZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIG9yIEdQTHYzLiBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS9TdHVrL2pzemlwL21hc3Rlci9MSUNFTlNFLm1hcmtkb3duLlxuXG5KU1ppcCB1c2VzIHRoZSBsaWJyYXJ5IHBha28gcmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIDpcbmh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9ibG9iL21hc3Rlci9MSUNFTlNFXG4qL1xuIWZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWEoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sYSk7ZWxzZXt2YXIgYjtiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxiLkpTWmlwPWEoKX19KGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uIGEoYixjLGQpe2Z1bmN0aW9uIGUoZyxoKXtpZighY1tnXSl7aWYoIWJbZ10pe3ZhciBpPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWgmJmkpcmV0dXJuIGkoZywhMCk7aWYoZilyZXR1cm4gZihnLCEwKTt2YXIgaj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2crXCInXCIpO3Rocm93IGouY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixqfXZhciBrPWNbZ109e2V4cG9ydHM6e319O2JbZ11bMF0uY2FsbChrLmV4cG9ydHMsZnVuY3Rpb24oYSl7dmFyIGM9YltnXVsxXVthXTtyZXR1cm4gZShjP2M6YSl9LGssay5leHBvcnRzLGEsYixjLGQpfXJldHVybiBjW2ddLmV4cG9ydHN9Zm9yKHZhciBmPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsZz0wO2c8ZC5sZW5ndGg7ZysrKWUoZFtnXSk7cmV0dXJuIGV9KHsxOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGQ9YShcIi4vdXRpbHNcIiksZT1hKFwiLi9zdXBwb3J0XCIpLGY9XCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiO2MuZW5jb2RlPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYixjLGUsZyxoLGksaixrPVtdLGw9MCxtPWEubGVuZ3RoLG49bSxvPVwic3RyaW5nXCIhPT1kLmdldFR5cGVPZihhKTtsPGEubGVuZ3RoOyluPW0tbCxvPyhiPWFbbCsrXSxjPWw8bT9hW2wrK106MCxlPWw8bT9hW2wrK106MCk6KGI9YS5jaGFyQ29kZUF0KGwrKyksYz1sPG0/YS5jaGFyQ29kZUF0KGwrKyk6MCxlPWw8bT9hLmNoYXJDb2RlQXQobCsrKTowKSxnPWI+PjIsaD0oMyZiKTw8NHxjPj40LGk9bj4xPygxNSZjKTw8MnxlPj42OjY0LGo9bj4yPzYzJmU6NjQsay5wdXNoKGYuY2hhckF0KGcpK2YuY2hhckF0KGgpK2YuY2hhckF0KGkpK2YuY2hhckF0KGopKTtyZXR1cm4gay5qb2luKFwiXCIpfSxjLmRlY29kZT1mdW5jdGlvbihhKXt2YXIgYixjLGQsZyxoLGksaixrPTAsbD0wLG09XCJkYXRhOlwiO2lmKGEuc3Vic3RyKDAsbS5sZW5ndGgpPT09bSl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJhc2U2NCBpbnB1dCwgaXQgbG9va3MgbGlrZSBhIGRhdGEgdXJsLlwiKTthPWEucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9cXD1dL2csXCJcIik7dmFyIG49MyphLmxlbmd0aC80O2lmKGEuY2hhckF0KGEubGVuZ3RoLTEpPT09Zi5jaGFyQXQoNjQpJiZuLS0sYS5jaGFyQXQoYS5sZW5ndGgtMik9PT1mLmNoYXJBdCg2NCkmJm4tLSxuJTEhPT0wKXRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFzZTY0IGlucHV0LCBiYWQgY29udGVudCBsZW5ndGguXCIpO3ZhciBvO2ZvcihvPWUudWludDhhcnJheT9uZXcgVWludDhBcnJheSgwfG4pOm5ldyBBcnJheSgwfG4pO2s8YS5sZW5ndGg7KWc9Zi5pbmRleE9mKGEuY2hhckF0KGsrKykpLGg9Zi5pbmRleE9mKGEuY2hhckF0KGsrKykpLGk9Zi5pbmRleE9mKGEuY2hhckF0KGsrKykpLGo9Zi5pbmRleE9mKGEuY2hhckF0KGsrKykpLGI9Zzw8MnxoPj40LGM9KDE1JmgpPDw0fGk+PjIsZD0oMyZpKTw8NnxqLG9bbCsrXT1iLDY0IT09aSYmKG9bbCsrXT1jKSw2NCE9PWomJihvW2wrK109ZCk7cmV0dXJuIG99fSx7XCIuL3N1cHBvcnRcIjozMCxcIi4vdXRpbHNcIjozMn1dLDI6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYixjLGQsZSl7dGhpcy5jb21wcmVzc2VkU2l6ZT1hLHRoaXMudW5jb21wcmVzc2VkU2l6ZT1iLHRoaXMuY3JjMzI9Yyx0aGlzLmNvbXByZXNzaW9uPWQsdGhpcy5jb21wcmVzc2VkQ29udGVudD1lfXZhciBlPWEoXCIuL2V4dGVybmFsXCIpLGY9YShcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIiksZz1hKFwiLi9zdHJlYW0vRGF0YUxlbmd0aFByb2JlXCIpLGg9YShcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIiksZz1hKFwiLi9zdHJlYW0vRGF0YUxlbmd0aFByb2JlXCIpO2QucHJvdG90eXBlPXtnZXRDb250ZW50V29ya2VyOmZ1bmN0aW9uKCl7dmFyIGE9bmV3IGYoZS5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLnBpcGUodGhpcy5jb21wcmVzc2lvbi51bmNvbXByZXNzV29ya2VyKCkpLnBpcGUobmV3IGcoXCJkYXRhX2xlbmd0aFwiKSksYj10aGlzO3JldHVybiBhLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpZih0aGlzLnN0cmVhbUluZm8uZGF0YV9sZW5ndGghPT1iLnVuY29tcHJlc3NlZFNpemUpdGhyb3cgbmV3IEVycm9yKFwiQnVnIDogdW5jb21wcmVzc2VkIGRhdGEgc2l6ZSBtaXNtYXRjaFwiKX0pLGF9LGdldENvbXByZXNzZWRXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGYoZS5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3NlZFNpemVcIix0aGlzLmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbyhcInVuY29tcHJlc3NlZFNpemVcIix0aGlzLnVuY29tcHJlc3NlZFNpemUpLndpdGhTdHJlYW1JbmZvKFwiY3JjMzJcIix0aGlzLmNyYzMyKS53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzaW9uXCIsdGhpcy5jb21wcmVzc2lvbil9fSxkLmNyZWF0ZVdvcmtlckZyb209ZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhLnBpcGUobmV3IGgpLnBpcGUobmV3IGcoXCJ1bmNvbXByZXNzZWRTaXplXCIpKS5waXBlKGIuY29tcHJlc3NXb3JrZXIoYykpLnBpcGUobmV3IGcoXCJjb21wcmVzc2VkU2l6ZVwiKSkud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2lvblwiLGIpfSxiLmV4cG9ydHM9ZH0se1wiLi9leHRlcm5hbFwiOjYsXCIuL3N0cmVhbS9DcmMzMlByb2JlXCI6MjUsXCIuL3N0cmVhbS9EYXRhTGVuZ3RoUHJvYmVcIjoyNixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyN31dLDM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjt2YXIgZD1hKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtjLlNUT1JFPXttYWdpYzpcIlxcMFxcMFwiLGNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKGEpe3JldHVybiBuZXcgZChcIlNUT1JFIGNvbXByZXNzaW9uXCIpfSx1bmNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBkKFwiU1RPUkUgZGVjb21wcmVzc2lvblwiKX19LGMuREVGTEFURT1hKFwiLi9mbGF0ZVwiKX0se1wiLi9mbGF0ZVwiOjcsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6Mjh9XSw0OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe2Zvcih2YXIgYSxiPVtdLGM9MDtjPDI1NjtjKyspe2E9Yztmb3IodmFyIGQ9MDtkPDg7ZCsrKWE9MSZhPzM5ODgyOTIzODReYT4+PjE6YT4+PjE7YltjXT1hfXJldHVybiBifWZ1bmN0aW9uIGUoYSxiLGMsZCl7dmFyIGU9aCxmPWQrYzthXj0tMTtmb3IodmFyIGc9ZDtnPGY7ZysrKWE9YT4+PjheZVsyNTUmKGFeYltnXSldO3JldHVybiBhXi0xfWZ1bmN0aW9uIGYoYSxiLGMsZCl7dmFyIGU9aCxmPWQrYzthXj0tMTtmb3IodmFyIGc9ZDtnPGY7ZysrKWE9YT4+PjheZVsyNTUmKGFeYi5jaGFyQ29kZUF0KGcpKV07cmV0dXJuIGFeLTF9dmFyIGc9YShcIi4vdXRpbHNcIiksaD1kKCk7Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYil7aWYoXCJ1bmRlZmluZWRcIj09dHlwZW9mIGF8fCFhLmxlbmd0aClyZXR1cm4gMDt2YXIgYz1cInN0cmluZ1wiIT09Zy5nZXRUeXBlT2YoYSk7cmV0dXJuIGM/ZSgwfGIsYSxhLmxlbmd0aCwwKTpmKDB8YixhLGEubGVuZ3RoLDApfX0se1wiLi91dGlsc1wiOjMyfV0sNTpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2MuYmFzZTY0PSExLGMuYmluYXJ5PSExLGMuZGlyPSExLGMuY3JlYXRlRm9sZGVycz0hMCxjLmRhdGU9bnVsbCxjLmNvbXByZXNzaW9uPW51bGwsYy5jb21wcmVzc2lvbk9wdGlvbnM9bnVsbCxjLmNvbW1lbnQ9bnVsbCxjLnVuaXhQZXJtaXNzaW9ucz1udWxsLGMuZG9zUGVybWlzc2lvbnM9bnVsbH0se31dLDY6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjt2YXIgZD1udWxsO2Q9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFByb21pc2U/UHJvbWlzZTphKFwibGllXCIpLGIuZXhwb3J0cz17UHJvbWlzZTpkfX0se2xpZTo1OH1dLDc6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7aC5jYWxsKHRoaXMsXCJGbGF0ZVdvcmtlci9cIithKSx0aGlzLl9wYWtvPW51bGwsdGhpcy5fcGFrb0FjdGlvbj1hLHRoaXMuX3Bha29PcHRpb25zPWIsdGhpcy5tZXRhPXt9fXZhciBlPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50MzJBcnJheSxmPWEoXCJwYWtvXCIpLGc9YShcIi4vdXRpbHNcIiksaD1hKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSxpPWU/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiO2MubWFnaWM9XCJcXGJcXDBcIixnLmluaGVyaXRzKGQsaCksZC5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKGEpe3RoaXMubWV0YT1hLm1ldGEsbnVsbD09PXRoaXMuX3Bha28mJnRoaXMuX2NyZWF0ZVBha28oKSx0aGlzLl9wYWtvLnB1c2goZy50cmFuc2Zvcm1UbyhpLGEuZGF0YSksITEpfSxkLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe2gucHJvdG90eXBlLmZsdXNoLmNhbGwodGhpcyksbnVsbD09PXRoaXMuX3Bha28mJnRoaXMuX2NyZWF0ZVBha28oKSx0aGlzLl9wYWtvLnB1c2goW10sITApfSxkLnByb3RvdHlwZS5jbGVhblVwPWZ1bmN0aW9uKCl7aC5wcm90b3R5cGUuY2xlYW5VcC5jYWxsKHRoaXMpLHRoaXMuX3Bha289bnVsbH0sZC5wcm90b3R5cGUuX2NyZWF0ZVBha289ZnVuY3Rpb24oKXt0aGlzLl9wYWtvPW5ldyBmW3RoaXMuX3Bha29BY3Rpb25dKHtyYXc6ITAsbGV2ZWw6dGhpcy5fcGFrb09wdGlvbnMubGV2ZWx8fC0xfSk7dmFyIGE9dGhpczt0aGlzLl9wYWtvLm9uRGF0YT1mdW5jdGlvbihiKXthLnB1c2goe2RhdGE6YixtZXRhOmEubWV0YX0pfX0sYy5jb21wcmVzc1dvcmtlcj1mdW5jdGlvbihhKXtyZXR1cm4gbmV3IGQoXCJEZWZsYXRlXCIsYSl9LGMudW5jb21wcmVzc1dvcmtlcj1mdW5jdGlvbigpe3JldHVybiBuZXcgZChcIkluZmxhdGVcIix7fSl9fSx7XCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3V0aWxzXCI6MzIscGFrbzo1OX1dLDg6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYixjLGQpe2YuY2FsbCh0aGlzLFwiWmlwRmlsZVdvcmtlclwiKSx0aGlzLmJ5dGVzV3JpdHRlbj0wLHRoaXMuemlwQ29tbWVudD1iLHRoaXMuemlwUGxhdGZvcm09Yyx0aGlzLmVuY29kZUZpbGVOYW1lPWQsdGhpcy5zdHJlYW1GaWxlcz1hLHRoaXMuYWNjdW11bGF0ZT0hMSx0aGlzLmNvbnRlbnRCdWZmZXI9W10sdGhpcy5kaXJSZWNvcmRzPVtdLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldD0wLHRoaXMuZW50cmllc0NvdW50PTAsdGhpcy5jdXJyZW50RmlsZT1udWxsLHRoaXMuX3NvdXJjZXM9W119dmFyIGU9YShcIi4uL3V0aWxzXCIpLGY9YShcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLGc9YShcIi4uL3V0ZjhcIiksaD1hKFwiLi4vY3JjMzJcIiksaT1hKFwiLi4vc2lnbmF0dXJlXCIpLGo9ZnVuY3Rpb24oYSxiKXt2YXIgYyxkPVwiXCI7Zm9yKGM9MDtjPGI7YysrKWQrPVN0cmluZy5mcm9tQ2hhckNvZGUoMjU1JmEpLGE+Pj49ODtyZXR1cm4gZH0saz1mdW5jdGlvbihhLGIpe3ZhciBjPWE7cmV0dXJuIGF8fChjPWI/MTY4OTM6MzMyMDQpLCg2NTUzNSZjKTw8MTZ9LGw9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gNjMmKGF8fDApfSxtPWZ1bmN0aW9uKGEsYixjLGQsZixtKXt2YXIgbixvLHA9YS5maWxlLHE9YS5jb21wcmVzc2lvbixyPW0hPT1nLnV0ZjhlbmNvZGUscz1lLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsbShwLm5hbWUpKSx0PWUudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixnLnV0ZjhlbmNvZGUocC5uYW1lKSksdT1wLmNvbW1lbnQsdj1lLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsbSh1KSksdz1lLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsZy51dGY4ZW5jb2RlKHUpKSx4PXQubGVuZ3RoIT09cC5uYW1lLmxlbmd0aCx5PXcubGVuZ3RoIT09dS5sZW5ndGgsej1cIlwiLEE9XCJcIixCPVwiXCIsQz1wLmRpcixEPXAuZGF0ZSxFPXtjcmMzMjowLGNvbXByZXNzZWRTaXplOjAsdW5jb21wcmVzc2VkU2l6ZTowfTtiJiYhY3x8KEUuY3JjMzI9YS5jcmMzMixFLmNvbXByZXNzZWRTaXplPWEuY29tcHJlc3NlZFNpemUsRS51bmNvbXByZXNzZWRTaXplPWEudW5jb21wcmVzc2VkU2l6ZSk7dmFyIEY9MDtiJiYoRnw9OCkscnx8IXgmJiF5fHwoRnw9MjA0OCk7dmFyIEc9MCxIPTA7QyYmKEd8PTE2KSxcIlVOSVhcIj09PWY/KEg9Nzk4LEd8PWsocC51bml4UGVybWlzc2lvbnMsQykpOihIPTIwLEd8PWwocC5kb3NQZXJtaXNzaW9ucyxDKSksbj1ELmdldFVUQ0hvdXJzKCksbjw8PTYsbnw9RC5nZXRVVENNaW51dGVzKCksbjw8PTUsbnw9RC5nZXRVVENTZWNvbmRzKCkvMixvPUQuZ2V0VVRDRnVsbFllYXIoKS0xOTgwLG88PD00LG98PUQuZ2V0VVRDTW9udGgoKSsxLG88PD01LG98PUQuZ2V0VVRDRGF0ZSgpLHgmJihBPWooMSwxKStqKGgocyksNCkrdCx6Kz1cInVwXCIraihBLmxlbmd0aCwyKStBKSx5JiYoQj1qKDEsMSkraihoKHYpLDQpK3cseis9XCJ1Y1wiK2ooQi5sZW5ndGgsMikrQik7dmFyIEk9XCJcIjtJKz1cIlxcblxcMFwiLEkrPWooRiwyKSxJKz1xLm1hZ2ljLEkrPWoobiwyKSxJKz1qKG8sMiksSSs9aihFLmNyYzMyLDQpLEkrPWooRS5jb21wcmVzc2VkU2l6ZSw0KSxJKz1qKEUudW5jb21wcmVzc2VkU2l6ZSw0KSxJKz1qKHMubGVuZ3RoLDIpLEkrPWooei5sZW5ndGgsMik7dmFyIEo9aS5MT0NBTF9GSUxFX0hFQURFUitJK3MreixLPWkuQ0VOVFJBTF9GSUxFX0hFQURFUitqKEgsMikrSStqKHYubGVuZ3RoLDIpK1wiXFwwXFwwXFwwXFwwXCIraihHLDQpK2ooZCw0KStzK3ordjtyZXR1cm57ZmlsZVJlY29yZDpKLGRpclJlY29yZDpLfX0sbj1mdW5jdGlvbihhLGIsYyxkLGYpe3ZhciBnPVwiXCIsaD1lLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsZihkKSk7cmV0dXJuIGc9aS5DRU5UUkFMX0RJUkVDVE9SWV9FTkQrXCJcXDBcXDBcXDBcXDBcIitqKGEsMikraihhLDIpK2ooYiw0KStqKGMsNCkraihoLmxlbmd0aCwyKStofSxvPWZ1bmN0aW9uKGEpe3ZhciBiPVwiXCI7cmV0dXJuIGI9aS5EQVRBX0RFU0NSSVBUT1IraihhLmNyYzMyLDQpK2ooYS5jb21wcmVzc2VkU2l6ZSw0KStqKGEudW5jb21wcmVzc2VkU2l6ZSw0KX07ZS5pbmhlcml0cyhkLGYpLGQucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oYSl7dmFyIGI9YS5tZXRhLnBlcmNlbnR8fDAsYz10aGlzLmVudHJpZXNDb3VudCxkPXRoaXMuX3NvdXJjZXMubGVuZ3RoO3RoaXMuYWNjdW11bGF0ZT90aGlzLmNvbnRlbnRCdWZmZXIucHVzaChhKToodGhpcy5ieXRlc1dyaXR0ZW4rPWEuZGF0YS5sZW5ndGgsZi5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMse2RhdGE6YS5kYXRhLG1ldGE6e2N1cnJlbnRGaWxlOnRoaXMuY3VycmVudEZpbGUscGVyY2VudDpjPyhiKzEwMCooYy1kLTEpKS9jOjEwMH19KSl9LGQucHJvdG90eXBlLm9wZW5lZFNvdXJjZT1mdW5jdGlvbihhKXt0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQ9dGhpcy5ieXRlc1dyaXR0ZW4sdGhpcy5jdXJyZW50RmlsZT1hLmZpbGUubmFtZTt2YXIgYj10aGlzLnN0cmVhbUZpbGVzJiYhYS5maWxlLmRpcjtpZihiKXt2YXIgYz1tKGEsYiwhMSx0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQsdGhpcy56aXBQbGF0Zm9ybSx0aGlzLmVuY29kZUZpbGVOYW1lKTt0aGlzLnB1c2goe2RhdGE6Yy5maWxlUmVjb3JkLG1ldGE6e3BlcmNlbnQ6MH19KX1lbHNlIHRoaXMuYWNjdW11bGF0ZT0hMH0sZC5wcm90b3R5cGUuY2xvc2VkU291cmNlPWZ1bmN0aW9uKGEpe3RoaXMuYWNjdW11bGF0ZT0hMTt2YXIgYj10aGlzLnN0cmVhbUZpbGVzJiYhYS5maWxlLmRpcixjPW0oYSxiLCEwLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCx0aGlzLnppcFBsYXRmb3JtLHRoaXMuZW5jb2RlRmlsZU5hbWUpO2lmKHRoaXMuZGlyUmVjb3Jkcy5wdXNoKGMuZGlyUmVjb3JkKSxiKXRoaXMucHVzaCh7ZGF0YTpvKGEpLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO2Vsc2UgZm9yKHRoaXMucHVzaCh7ZGF0YTpjLmZpbGVSZWNvcmQsbWV0YTp7cGVyY2VudDowfX0pO3RoaXMuY29udGVudEJ1ZmZlci5sZW5ndGg7KXRoaXMucHVzaCh0aGlzLmNvbnRlbnRCdWZmZXIuc2hpZnQoKSk7dGhpcy5jdXJyZW50RmlsZT1udWxsfSxkLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe2Zvcih2YXIgYT10aGlzLmJ5dGVzV3JpdHRlbixiPTA7Yjx0aGlzLmRpclJlY29yZHMubGVuZ3RoO2IrKyl0aGlzLnB1c2goe2RhdGE6dGhpcy5kaXJSZWNvcmRzW2JdLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO3ZhciBjPXRoaXMuYnl0ZXNXcml0dGVuLWEsZD1uKHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGgsYyxhLHRoaXMuemlwQ29tbWVudCx0aGlzLmVuY29kZUZpbGVOYW1lKTt0aGlzLnB1c2goe2RhdGE6ZCxtZXRhOntwZXJjZW50OjEwMH19KX0sZC5wcm90b3R5cGUucHJlcGFyZU5leHRTb3VyY2U9ZnVuY3Rpb24oKXt0aGlzLnByZXZpb3VzPXRoaXMuX3NvdXJjZXMuc2hpZnQoKSx0aGlzLm9wZW5lZFNvdXJjZSh0aGlzLnByZXZpb3VzLnN0cmVhbUluZm8pLHRoaXMuaXNQYXVzZWQ/dGhpcy5wcmV2aW91cy5wYXVzZSgpOnRoaXMucHJldmlvdXMucmVzdW1lKCl9LGQucHJvdG90eXBlLnJlZ2lzdGVyUHJldmlvdXM9ZnVuY3Rpb24oYSl7dGhpcy5fc291cmNlcy5wdXNoKGEpO3ZhciBiPXRoaXM7cmV0dXJuIGEub24oXCJkYXRhXCIsZnVuY3Rpb24oYSl7Yi5wcm9jZXNzQ2h1bmsoYSl9KSxhLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtiLmNsb3NlZFNvdXJjZShiLnByZXZpb3VzLnN0cmVhbUluZm8pLGIuX3NvdXJjZXMubGVuZ3RoP2IucHJlcGFyZU5leHRTb3VyY2UoKTpiLmVuZCgpfSksYS5vbihcImVycm9yXCIsZnVuY3Rpb24oYSl7Yi5lcnJvcihhKX0pLHRoaXN9LGQucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhZi5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5wcmV2aW91cyYmdGhpcy5fc291cmNlcy5sZW5ndGg/KHRoaXMucHJlcGFyZU5leHRTb3VyY2UoKSwhMCk6dGhpcy5wcmV2aW91c3x8dGhpcy5fc291cmNlcy5sZW5ndGh8fHRoaXMuZ2VuZXJhdGVkRXJyb3I/dm9pZCAwOih0aGlzLmVuZCgpLCEwKSl9LGQucHJvdG90eXBlLmVycm9yPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuX3NvdXJjZXM7aWYoIWYucHJvdG90eXBlLmVycm9yLmNhbGwodGhpcyxhKSlyZXR1cm4hMTtmb3IodmFyIGM9MDtjPGIubGVuZ3RoO2MrKyl0cnl7YltjXS5lcnJvcihhKX1jYXRjaChhKXt9cmV0dXJuITB9LGQucHJvdG90eXBlLmxvY2s9ZnVuY3Rpb24oKXtmLnByb3RvdHlwZS5sb2NrLmNhbGwodGhpcyk7Zm9yKHZhciBhPXRoaXMuX3NvdXJjZXMsYj0wO2I8YS5sZW5ndGg7YisrKWFbYl0ubG9jaygpfSxiLmV4cG9ydHM9ZH0se1wiLi4vY3JjMzJcIjo0LFwiLi4vc2lnbmF0dXJlXCI6MjMsXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi4vdXRmOFwiOjMxLFwiLi4vdXRpbHNcIjozMn1dLDk6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjt2YXIgZD1hKFwiLi4vY29tcHJlc3Npb25zXCIpLGU9YShcIi4vWmlwRmlsZVdvcmtlclwiKSxmPWZ1bmN0aW9uKGEsYil7dmFyIGM9YXx8YixlPWRbY107aWYoIWUpdGhyb3cgbmV3IEVycm9yKGMrXCIgaXMgbm90IGEgdmFsaWQgY29tcHJlc3Npb24gbWV0aG9kICFcIik7cmV0dXJuIGV9O2MuZ2VuZXJhdGVXb3JrZXI9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPW5ldyBlKGIuc3RyZWFtRmlsZXMsYyxiLnBsYXRmb3JtLGIuZW5jb2RlRmlsZU5hbWUpLGc9MDt0cnl7YS5mb3JFYWNoKGZ1bmN0aW9uKGEsYyl7ZysrO3ZhciBlPWYoYy5vcHRpb25zLmNvbXByZXNzaW9uLGIuY29tcHJlc3Npb24pLGg9Yy5vcHRpb25zLmNvbXByZXNzaW9uT3B0aW9uc3x8Yi5jb21wcmVzc2lvbk9wdGlvbnN8fHt9LGk9Yy5kaXIsaj1jLmRhdGU7Yy5fY29tcHJlc3NXb3JrZXIoZSxoKS53aXRoU3RyZWFtSW5mbyhcImZpbGVcIix7bmFtZTphLGRpcjppLGRhdGU6aixjb21tZW50OmMuY29tbWVudHx8XCJcIix1bml4UGVybWlzc2lvbnM6Yy51bml4UGVybWlzc2lvbnMsZG9zUGVybWlzc2lvbnM6Yy5kb3NQZXJtaXNzaW9uc30pLnBpcGUoZCl9KSxkLmVudHJpZXNDb3VudD1nfWNhdGNoKGgpe2QuZXJyb3IoaCl9cmV0dXJuIGR9fSx7XCIuLi9jb21wcmVzc2lvbnNcIjozLFwiLi9aaXBGaWxlV29ya2VyXCI6OH1dLDEwOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe2lmKCEodGhpcyBpbnN0YW5jZW9mIGQpKXJldHVybiBuZXcgZDtpZihhcmd1bWVudHMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIlRoZSBjb25zdHJ1Y3RvciB3aXRoIHBhcmFtZXRlcnMgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIik7dGhpcy5maWxlcz17fSx0aGlzLmNvbW1lbnQ9bnVsbCx0aGlzLnJvb3Q9XCJcIix0aGlzLmNsb25lPWZ1bmN0aW9uKCl7dmFyIGE9bmV3IGQ7Zm9yKHZhciBiIGluIHRoaXMpXCJmdW5jdGlvblwiIT10eXBlb2YgdGhpc1tiXSYmKGFbYl09dGhpc1tiXSk7cmV0dXJuIGF9fWQucHJvdG90eXBlPWEoXCIuL29iamVjdFwiKSxkLnByb3RvdHlwZS5sb2FkQXN5bmM9YShcIi4vbG9hZFwiKSxkLnN1cHBvcnQ9YShcIi4vc3VwcG9ydFwiKSxkLmRlZmF1bHRzPWEoXCIuL2RlZmF1bHRzXCIpLGQudmVyc2lvbj1cIjMuMS41XCIsZC5sb2FkQXN5bmM9ZnVuY3Rpb24oYSxiKXtyZXR1cm4obmV3IGQpLmxvYWRBc3luYyhhLGIpfSxkLmV4dGVybmFsPWEoXCIuL2V4dGVybmFsXCIpLGIuZXhwb3J0cz1kfSx7XCIuL2RlZmF1bHRzXCI6NSxcIi4vZXh0ZXJuYWxcIjo2LFwiLi9sb2FkXCI6MTEsXCIuL29iamVjdFwiOjE1LFwiLi9zdXBwb3J0XCI6MzB9XSwxMTpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSl7cmV0dXJuIG5ldyBmLlByb21pc2UoZnVuY3Rpb24oYixjKXt2YXIgZD1hLmRlY29tcHJlc3NlZC5nZXRDb250ZW50V29ya2VyKCkucGlwZShuZXcgaSk7ZC5vbihcImVycm9yXCIsZnVuY3Rpb24oYSl7YyhhKX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtkLnN0cmVhbUluZm8uY3JjMzIhPT1hLmRlY29tcHJlc3NlZC5jcmMzMj9jKG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBDUkMzMiBtaXNtYXRjaFwiKSk6YigpfSkucmVzdW1lKCl9KX12YXIgZT1hKFwiLi91dGlsc1wiKSxmPWEoXCIuL2V4dGVybmFsXCIpLGc9YShcIi4vdXRmOFwiKSxlPWEoXCIuL3V0aWxzXCIpLGg9YShcIi4vemlwRW50cmllc1wiKSxpPWEoXCIuL3N0cmVhbS9DcmMzMlByb2JlXCIpLGo9YShcIi4vbm9kZWpzVXRpbHNcIik7Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcztyZXR1cm4gYj1lLmV4dGVuZChifHx7fSx7YmFzZTY0OiExLGNoZWNrQ1JDMzI6ITEsb3B0aW1pemVkQmluYXJ5U3RyaW5nOiExLGNyZWF0ZUZvbGRlcnM6ITEsZGVjb2RlRmlsZU5hbWU6Zy51dGY4ZGVjb2RlfSksai5pc05vZGUmJmouaXNTdHJlYW0oYSk/Zi5Qcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJKU1ppcCBjYW4ndCBhY2NlcHQgYSBzdHJlYW0gd2hlbiBsb2FkaW5nIGEgemlwIGZpbGUuXCIpKTplLnByZXBhcmVDb250ZW50KFwidGhlIGxvYWRlZCB6aXAgZmlsZVwiLGEsITAsYi5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcsYi5iYXNlNjQpLnRoZW4oZnVuY3Rpb24oYSl7dmFyIGM9bmV3IGgoYik7cmV0dXJuIGMubG9hZChhKSxjfSkudGhlbihmdW5jdGlvbihhKXt2YXIgYz1bZi5Qcm9taXNlLnJlc29sdmUoYSldLGU9YS5maWxlcztpZihiLmNoZWNrQ1JDMzIpZm9yKHZhciBnPTA7ZzxlLmxlbmd0aDtnKyspYy5wdXNoKGQoZVtnXSkpO3JldHVybiBmLlByb21pc2UuYWxsKGMpfSkudGhlbihmdW5jdGlvbihhKXtmb3IodmFyIGQ9YS5zaGlmdCgpLGU9ZC5maWxlcyxmPTA7ZjxlLmxlbmd0aDtmKyspe3ZhciBnPWVbZl07Yy5maWxlKGcuZmlsZU5hbWVTdHIsZy5kZWNvbXByZXNzZWQse2JpbmFyeTohMCxvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6ITAsZGF0ZTpnLmRhdGUsZGlyOmcuZGlyLGNvbW1lbnQ6Zy5maWxlQ29tbWVudFN0ci5sZW5ndGg/Zy5maWxlQ29tbWVudFN0cjpudWxsLHVuaXhQZXJtaXNzaW9uczpnLnVuaXhQZXJtaXNzaW9ucyxkb3NQZXJtaXNzaW9uczpnLmRvc1Blcm1pc3Npb25zLGNyZWF0ZUZvbGRlcnM6Yi5jcmVhdGVGb2xkZXJzfSl9cmV0dXJuIGQuemlwQ29tbWVudC5sZW5ndGgmJihjLmNvbW1lbnQ9ZC56aXBDb21tZW50KSxjfSl9fSx7XCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIjoyNSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyaWVzXCI6MzN9XSwxMjpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSxiKXtmLmNhbGwodGhpcyxcIk5vZGVqcyBzdHJlYW0gaW5wdXQgYWRhcHRlciBmb3IgXCIrYSksdGhpcy5fdXBzdHJlYW1FbmRlZD0hMSx0aGlzLl9iaW5kU3RyZWFtKGIpfXZhciBlPWEoXCIuLi91dGlsc1wiKSxmPWEoXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtlLmluaGVyaXRzKGQsZiksZC5wcm90b3R5cGUuX2JpbmRTdHJlYW09ZnVuY3Rpb24oYSl7dmFyIGI9dGhpczt0aGlzLl9zdHJlYW09YSxhLnBhdXNlKCksYS5vbihcImRhdGFcIixmdW5jdGlvbihhKXtiLnB1c2goe2RhdGE6YSxtZXRhOntwZXJjZW50OjB9fSl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24oYSl7Yi5pc1BhdXNlZD90aGlzLmdlbmVyYXRlZEVycm9yPWE6Yi5lcnJvcihhKX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtiLmlzUGF1c2VkP2IuX3Vwc3RyZWFtRW5kZWQ9ITA6Yi5lbmQoKX0pfSxkLnByb3RvdHlwZS5wYXVzZT1mdW5jdGlvbigpe3JldHVybiEhZi5wcm90b3R5cGUucGF1c2UuY2FsbCh0aGlzKSYmKHRoaXMuX3N0cmVhbS5wYXVzZSgpLCEwKX0sZC5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFmLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKHRoaXMuX3Vwc3RyZWFtRW5kZWQ/dGhpcy5lbmQoKTp0aGlzLl9zdHJlYW0ucmVzdW1lKCksITApfSxiLmV4cG9ydHM9ZH0se1wiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0aWxzXCI6MzJ9XSwxMzpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSxiLGMpe2UuY2FsbCh0aGlzLGIpLHRoaXMuX2hlbHBlcj1hO3ZhciBkPXRoaXM7YS5vbihcImRhdGFcIixmdW5jdGlvbihhLGIpe2QucHVzaChhKXx8ZC5faGVscGVyLnBhdXNlKCksYyYmYyhiKX0pLm9uKFwiZXJyb3JcIixmdW5jdGlvbihhKXtkLmVtaXQoXCJlcnJvclwiLGEpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe2QucHVzaChudWxsKX0pfXZhciBlPWEoXCJyZWFkYWJsZS1zdHJlYW1cIikuUmVhZGFibGUsZj1hKFwiLi4vdXRpbHNcIik7Zi5pbmhlcml0cyhkLGUpLGQucHJvdG90eXBlLl9yZWFkPWZ1bmN0aW9uKCl7dGhpcy5faGVscGVyLnJlc3VtZSgpfSxiLmV4cG9ydHM9ZH0se1wiLi4vdXRpbHNcIjozMixcInJlYWRhYmxlLXN0cmVhbVwiOjE2fV0sMTQ6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtiLmV4cG9ydHM9e2lzTm9kZTpcInVuZGVmaW5lZFwiIT10eXBlb2YgQnVmZmVyLG5ld0J1ZmZlckZyb206ZnVuY3Rpb24oYSxiKXtyZXR1cm4gbmV3IEJ1ZmZlcihhLGIpfSxhbGxvY0J1ZmZlcjpmdW5jdGlvbihhKXtyZXR1cm4gQnVmZmVyLmFsbG9jP0J1ZmZlci5hbGxvYyhhKTpuZXcgQnVmZmVyKGEpfSxpc0J1ZmZlcjpmdW5jdGlvbihhKXtyZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGEpfSxpc1N0cmVhbTpmdW5jdGlvbihhKXtyZXR1cm4gYSYmXCJmdW5jdGlvblwiPT10eXBlb2YgYS5vbiYmXCJmdW5jdGlvblwiPT10eXBlb2YgYS5wYXVzZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgYS5yZXN1bWV9fX0se31dLDE1OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtyZXR1cm5cIltvYmplY3QgUmVnRXhwXVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpfXZhciBlPWEoXCIuL3V0ZjhcIiksZj1hKFwiLi91dGlsc1wiKSxnPWEoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLGg9YShcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKSxpPWEoXCIuL2RlZmF1bHRzXCIpLGo9YShcIi4vY29tcHJlc3NlZE9iamVjdFwiKSxrPWEoXCIuL3ppcE9iamVjdFwiKSxsPWEoXCIuL2dlbmVyYXRlXCIpLG09YShcIi4vbm9kZWpzVXRpbHNcIiksbj1hKFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCIpLG89ZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGU9Zi5nZXRUeXBlT2YoYiksaD1mLmV4dGVuZChjfHx7fSxpKTtoLmRhdGU9aC5kYXRlfHxuZXcgRGF0ZSxudWxsIT09aC5jb21wcmVzc2lvbiYmKGguY29tcHJlc3Npb249aC5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpKSxcInN0cmluZ1wiPT10eXBlb2YgaC51bml4UGVybWlzc2lvbnMmJihoLnVuaXhQZXJtaXNzaW9ucz1wYXJzZUludChoLnVuaXhQZXJtaXNzaW9ucyw4KSksaC51bml4UGVybWlzc2lvbnMmJjE2Mzg0JmgudW5peFBlcm1pc3Npb25zJiYoaC5kaXI9ITApLGguZG9zUGVybWlzc2lvbnMmJjE2JmguZG9zUGVybWlzc2lvbnMmJihoLmRpcj0hMCksaC5kaXImJihhPXEoYSkpLGguY3JlYXRlRm9sZGVycyYmKGQ9cChhKSkmJnIuY2FsbCh0aGlzLGQsITApO3ZhciBsPVwic3RyaW5nXCI9PT1lJiZoLmJpbmFyeT09PSExJiZoLmJhc2U2ND09PSExO2MmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBjLmJpbmFyeXx8KGguYmluYXJ5PSFsKTt2YXIgbz1iIGluc3RhbmNlb2YgaiYmMD09PWIudW5jb21wcmVzc2VkU2l6ZTsob3x8aC5kaXJ8fCFifHwwPT09Yi5sZW5ndGgpJiYoaC5iYXNlNjQ9ITEsaC5iaW5hcnk9ITAsYj1cIlwiLGguY29tcHJlc3Npb249XCJTVE9SRVwiLGU9XCJzdHJpbmdcIik7dmFyIHM9bnVsbDtzPWIgaW5zdGFuY2VvZiBqfHxiIGluc3RhbmNlb2YgZz9iOm0uaXNOb2RlJiZtLmlzU3RyZWFtKGIpP25ldyBuKGEsYik6Zi5wcmVwYXJlQ29udGVudChhLGIsaC5iaW5hcnksaC5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcsaC5iYXNlNjQpO3ZhciB0PW5ldyBrKGEscyxoKTt0aGlzLmZpbGVzW2FdPXR9LHA9ZnVuY3Rpb24oYSl7XCIvXCI9PT1hLnNsaWNlKC0xKSYmKGE9YS5zdWJzdHJpbmcoMCxhLmxlbmd0aC0xKSk7dmFyIGI9YS5sYXN0SW5kZXhPZihcIi9cIik7cmV0dXJuIGI+MD9hLnN1YnN0cmluZygwLGIpOlwiXCJ9LHE9ZnVuY3Rpb24oYSl7cmV0dXJuXCIvXCIhPT1hLnNsaWNlKC0xKSYmKGErPVwiL1wiKSxhfSxyPWZ1bmN0aW9uKGEsYil7cmV0dXJuIGI9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGI/YjppLmNyZWF0ZUZvbGRlcnMsYT1xKGEpLHRoaXMuZmlsZXNbYV18fG8uY2FsbCh0aGlzLGEsbnVsbCx7ZGlyOiEwLGNyZWF0ZUZvbGRlcnM6Yn0pLHRoaXMuZmlsZXNbYV19LHM9e2xvYWQ6ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0sZm9yRWFjaDpmdW5jdGlvbihhKXt2YXIgYixjLGQ7Zm9yKGIgaW4gdGhpcy5maWxlcyl0aGlzLmZpbGVzLmhhc093blByb3BlcnR5KGIpJiYoZD10aGlzLmZpbGVzW2JdLGM9Yi5zbGljZSh0aGlzLnJvb3QubGVuZ3RoLGIubGVuZ3RoKSxjJiZiLnNsaWNlKDAsdGhpcy5yb290Lmxlbmd0aCk9PT10aGlzLnJvb3QmJmEoYyxkKSl9LGZpbHRlcjpmdW5jdGlvbihhKXt2YXIgYj1bXTtyZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGMsZCl7YShjLGQpJiZiLnB1c2goZCl9KSxifSxmaWxlOmZ1bmN0aW9uKGEsYixjKXtpZigxPT09YXJndW1lbnRzLmxlbmd0aCl7aWYoZChhKSl7dmFyIGU9YTtyZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24oYSxiKXtyZXR1cm4hYi5kaXImJmUudGVzdChhKX0pfXZhciBmPXRoaXMuZmlsZXNbdGhpcy5yb290K2FdO3JldHVybiBmJiYhZi5kaXI/ZjpudWxsfXJldHVybiBhPXRoaXMucm9vdCthLG8uY2FsbCh0aGlzLGEsYixjKSx0aGlzfSxmb2xkZXI6ZnVuY3Rpb24oYSl7aWYoIWEpcmV0dXJuIHRoaXM7aWYoZChhKSlyZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24oYixjKXtyZXR1cm4gYy5kaXImJmEudGVzdChiKX0pO3ZhciBiPXRoaXMucm9vdCthLGM9ci5jYWxsKHRoaXMsYiksZT10aGlzLmNsb25lKCk7cmV0dXJuIGUucm9vdD1jLm5hbWUsZX0scmVtb3ZlOmZ1bmN0aW9uKGEpe2E9dGhpcy5yb290K2E7dmFyIGI9dGhpcy5maWxlc1thXTtpZihifHwoXCIvXCIhPT1hLnNsaWNlKC0xKSYmKGErPVwiL1wiKSxiPXRoaXMuZmlsZXNbYV0pLGImJiFiLmRpcilkZWxldGUgdGhpcy5maWxlc1thXTtlbHNlIGZvcih2YXIgYz10aGlzLmZpbHRlcihmdW5jdGlvbihiLGMpe3JldHVybiBjLm5hbWUuc2xpY2UoMCxhLmxlbmd0aCk9PT1hfSksZD0wO2Q8Yy5sZW5ndGg7ZCsrKWRlbGV0ZSB0aGlzLmZpbGVzW2NbZF0ubmFtZV07cmV0dXJuIHRoaXN9LGdlbmVyYXRlOmZ1bmN0aW9uKGEpe3Rocm93IG5ldyBFcnJvcihcIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpfSxnZW5lcmF0ZUludGVybmFsU3RyZWFtOmZ1bmN0aW9uKGEpe3ZhciBiLGM9e307dHJ5e2lmKGM9Zi5leHRlbmQoYXx8e30se3N0cmVhbUZpbGVzOiExLGNvbXByZXNzaW9uOlwiU1RPUkVcIixjb21wcmVzc2lvbk9wdGlvbnM6bnVsbCx0eXBlOlwiXCIscGxhdGZvcm06XCJET1NcIixjb21tZW50Om51bGwsbWltZVR5cGU6XCJhcHBsaWNhdGlvbi96aXBcIixlbmNvZGVGaWxlTmFtZTplLnV0ZjhlbmNvZGV9KSxjLnR5cGU9Yy50eXBlLnRvTG93ZXJDYXNlKCksYy5jb21wcmVzc2lvbj1jLmNvbXByZXNzaW9uLnRvVXBwZXJDYXNlKCksXCJiaW5hcnlzdHJpbmdcIj09PWMudHlwZSYmKGMudHlwZT1cInN0cmluZ1wiKSwhYy50eXBlKXRocm93IG5ldyBFcnJvcihcIk5vIG91dHB1dCB0eXBlIHNwZWNpZmllZC5cIik7Zi5jaGVja1N1cHBvcnQoYy50eXBlKSxcImRhcndpblwiIT09Yy5wbGF0Zm9ybSYmXCJmcmVlYnNkXCIhPT1jLnBsYXRmb3JtJiZcImxpbnV4XCIhPT1jLnBsYXRmb3JtJiZcInN1bm9zXCIhPT1jLnBsYXRmb3JtfHwoYy5wbGF0Zm9ybT1cIlVOSVhcIiksXCJ3aW4zMlwiPT09Yy5wbGF0Zm9ybSYmKGMucGxhdGZvcm09XCJET1NcIik7dmFyIGQ9Yy5jb21tZW50fHx0aGlzLmNvbW1lbnR8fFwiXCI7Yj1sLmdlbmVyYXRlV29ya2VyKHRoaXMsYyxkKX1jYXRjaChpKXtiPW5ldyBnKFwiZXJyb3JcIiksYi5lcnJvcihpKX1yZXR1cm4gbmV3IGgoYixjLnR5cGV8fFwic3RyaW5nXCIsYy5taW1lVHlwZSl9LGdlbmVyYXRlQXN5bmM6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gdGhpcy5nZW5lcmF0ZUludGVybmFsU3RyZWFtKGEpLmFjY3VtdWxhdGUoYil9LGdlbmVyYXRlTm9kZVN0cmVhbTpmdW5jdGlvbihhLGIpe3JldHVybiBhPWF8fHt9LGEudHlwZXx8KGEudHlwZT1cIm5vZGVidWZmZXJcIiksdGhpcy5nZW5lcmF0ZUludGVybmFsU3RyZWFtKGEpLnRvTm9kZWpzU3RyZWFtKGIpfX07Yi5leHBvcnRzPXN9LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL2RlZmF1bHRzXCI6NSxcIi4vZ2VuZXJhdGVcIjo5LFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCI6MTIsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIjoyOSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBPYmplY3RcIjozNX1dLDE2OltmdW5jdGlvbihhLGIsYyl7Yi5leHBvcnRzPWEoXCJzdHJlYW1cIil9LHtzdHJlYW06dm9pZCAwfV0sMTc6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe2UuY2FsbCh0aGlzLGEpO2Zvcih2YXIgYj0wO2I8dGhpcy5kYXRhLmxlbmd0aDtiKyspYVtiXT0yNTUmYVtiXX12YXIgZT1hKFwiLi9EYXRhUmVhZGVyXCIpLGY9YShcIi4uL3V0aWxzXCIpO2YuaW5oZXJpdHMoZCxlKSxkLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnplcm8rYV19LGQucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj1hLmNoYXJDb2RlQXQoMCksYz1hLmNoYXJDb2RlQXQoMSksZD1hLmNoYXJDb2RlQXQoMiksZT1hLmNoYXJDb2RlQXQoMyksZj10aGlzLmxlbmd0aC00O2Y+PTA7LS1mKWlmKHRoaXMuZGF0YVtmXT09PWImJnRoaXMuZGF0YVtmKzFdPT09YyYmdGhpcy5kYXRhW2YrMl09PT1kJiZ0aGlzLmRhdGFbZiszXT09PWUpcmV0dXJuIGYtdGhpcy56ZXJvO3JldHVybi0xfSxkLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmU9ZnVuY3Rpb24oYSl7dmFyIGI9YS5jaGFyQ29kZUF0KDApLGM9YS5jaGFyQ29kZUF0KDEpLGQ9YS5jaGFyQ29kZUF0KDIpLGU9YS5jaGFyQ29kZUF0KDMpLGY9dGhpcy5yZWFkRGF0YSg0KTtyZXR1cm4gYj09PWZbMF0mJmM9PT1mWzFdJiZkPT09ZlsyXSYmZT09PWZbM119LGQucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKGEpe2lmKHRoaXMuY2hlY2tPZmZzZXQoYSksMD09PWEpcmV0dXJuW107dmFyIGI9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K2EpO3JldHVybiB0aGlzLmluZGV4Kz1hLGJ9LGIuZXhwb3J0cz1kfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwxODpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSl7dGhpcy5kYXRhPWEsdGhpcy5sZW5ndGg9YS5sZW5ndGgsdGhpcy5pbmRleD0wLHRoaXMuemVybz0wfXZhciBlPWEoXCIuLi91dGlsc1wiKTtkLnByb3RvdHlwZT17Y2hlY2tPZmZzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5jaGVja0luZGV4KHRoaXMuaW5kZXgrYSl9LGNoZWNrSW5kZXg6ZnVuY3Rpb24oYSl7aWYodGhpcy5sZW5ndGg8dGhpcy56ZXJvK2F8fGE8MCl0aHJvdyBuZXcgRXJyb3IoXCJFbmQgb2YgZGF0YSByZWFjaGVkIChkYXRhIGxlbmd0aCA9IFwiK3RoaXMubGVuZ3RoK1wiLCBhc2tlZCBpbmRleCA9IFwiK2ErXCIpLiBDb3JydXB0ZWQgemlwID9cIil9LHNldEluZGV4OmZ1bmN0aW9uKGEpe3RoaXMuY2hlY2tJbmRleChhKSx0aGlzLmluZGV4PWF9LHNraXA6ZnVuY3Rpb24oYSl7dGhpcy5zZXRJbmRleCh0aGlzLmluZGV4K2EpfSxieXRlQXQ6ZnVuY3Rpb24oYSl7fSxyZWFkSW50OmZ1bmN0aW9uKGEpe3ZhciBiLGM9MDtmb3IodGhpcy5jaGVja09mZnNldChhKSxiPXRoaXMuaW5kZXgrYS0xO2I+PXRoaXMuaW5kZXg7Yi0tKWM9KGM8PDgpK3RoaXMuYnl0ZUF0KGIpO3JldHVybiB0aGlzLmluZGV4Kz1hLGN9LHJlYWRTdHJpbmc6ZnVuY3Rpb24oYSl7cmV0dXJuIGUudHJhbnNmb3JtVG8oXCJzdHJpbmdcIix0aGlzLnJlYWREYXRhKGEpKX0scmVhZERhdGE6ZnVuY3Rpb24oYSl7fSxsYXN0SW5kZXhPZlNpZ25hdHVyZTpmdW5jdGlvbihhKXt9LHJlYWRBbmRDaGVja1NpZ25hdHVyZTpmdW5jdGlvbihhKXt9LHJlYWREYXRlOmZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5yZWFkSW50KDQpO3JldHVybiBuZXcgRGF0ZShEYXRlLlVUQygoYT4+MjUmMTI3KSsxOTgwLChhPj4yMSYxNSktMSxhPj4xNiYzMSxhPj4xMSYzMSxhPj41JjYzLCgzMSZhKTw8MSkpfX0sYi5leHBvcnRzPWR9LHtcIi4uL3V0aWxzXCI6MzJ9XSwxOTpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSl7ZS5jYWxsKHRoaXMsYSl9dmFyIGU9YShcIi4vVWludDhBcnJheVJlYWRlclwiKSxmPWEoXCIuLi91dGlsc1wiKTtmLmluaGVyaXRzKGQsZSksZC5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24oYSl7dGhpcy5jaGVja09mZnNldChhKTt2YXIgYj10aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrYSk7cmV0dXJuIHRoaXMuaW5kZXgrPWEsYn0sYi5leHBvcnRzPWR9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIjoyMX1dLDIwOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtlLmNhbGwodGhpcyxhKX12YXIgZT1hKFwiLi9EYXRhUmVhZGVyXCIpLGY9YShcIi4uL3V0aWxzXCIpO2YuaW5oZXJpdHMoZCxlKSxkLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMuemVybythKX0sZC5wcm90b3R5cGUubGFzdEluZGV4T2ZTaWduYXR1cmU9ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuZGF0YS5sYXN0SW5kZXhPZihhKS10aGlzLnplcm99LGQucHJvdG90eXBlLnJlYWRBbmRDaGVja1NpZ25hdHVyZT1mdW5jdGlvbihhKXt2YXIgYj10aGlzLnJlYWREYXRhKDQpO3JldHVybiBhPT09Yn0sZC5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24oYSl7dGhpcy5jaGVja09mZnNldChhKTt2YXIgYj10aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrYSk7cmV0dXJuIHRoaXMuaW5kZXgrPWEsYn0sYi5leHBvcnRzPWR9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0RhdGFSZWFkZXJcIjoxOH1dLDIxOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtlLmNhbGwodGhpcyxhKX12YXIgZT1hKFwiLi9BcnJheVJlYWRlclwiKSxmPWEoXCIuLi91dGlsc1wiKTtmLmluaGVyaXRzKGQsZSksZC5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24oYSl7aWYodGhpcy5jaGVja09mZnNldChhKSwwPT09YSlyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMCk7dmFyIGI9dGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K2EpO3JldHVybiB0aGlzLmluZGV4Kz1hLGJ9LGIuZXhwb3J0cz1kfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9BcnJheVJlYWRlclwiOjE3fV0sMjI6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjt2YXIgZD1hKFwiLi4vdXRpbHNcIiksZT1hKFwiLi4vc3VwcG9ydFwiKSxmPWEoXCIuL0FycmF5UmVhZGVyXCIpLGc9YShcIi4vU3RyaW5nUmVhZGVyXCIpLGg9YShcIi4vTm9kZUJ1ZmZlclJlYWRlclwiKSxpPWEoXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIik7Yi5leHBvcnRzPWZ1bmN0aW9uKGEpe3ZhciBiPWQuZ2V0VHlwZU9mKGEpO3JldHVybiBkLmNoZWNrU3VwcG9ydChiKSxcInN0cmluZ1wiIT09Ynx8ZS51aW50OGFycmF5P1wibm9kZWJ1ZmZlclwiPT09Yj9uZXcgaChhKTplLnVpbnQ4YXJyYXk/bmV3IGkoZC50cmFuc2Zvcm1UbyhcInVpbnQ4YXJyYXlcIixhKSk6bmV3IGYoZC50cmFuc2Zvcm1UbyhcImFycmF5XCIsYSkpOm5ldyBnKGEpfX0se1wiLi4vc3VwcG9ydFwiOjMwLFwiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxNyxcIi4vTm9kZUJ1ZmZlclJlYWRlclwiOjE5LFwiLi9TdHJpbmdSZWFkZXJcIjoyMCxcIi4vVWludDhBcnJheVJlYWRlclwiOjIxfV0sMjM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtjLkxPQ0FMX0ZJTEVfSEVBREVSPVwiUEtcdTAwMDNcdTAwMDRcIixjLkNFTlRSQUxfRklMRV9IRUFERVI9XCJQS1x1MDAwMVx1MDAwMlwiLGMuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EPVwiUEtcdTAwMDVcdTAwMDZcIixjLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1I9XCJQS1x1MDAwNlx1MDAwN1wiLGMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EPVwiUEtcdTAwMDZcdTAwMDZcIixjLkRBVEFfREVTQ1JJUFRPUj1cIlBLXHUwMDA3XFxiXCJ9LHt9XSwyNDpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSl7ZS5jYWxsKHRoaXMsXCJDb252ZXJ0V29ya2VyIHRvIFwiK2EpLHRoaXMuZGVzdFR5cGU9YX12YXIgZT1hKFwiLi9HZW5lcmljV29ya2VyXCIpLGY9YShcIi4uL3V0aWxzXCIpO2YuaW5oZXJpdHMoZCxlKSxkLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oYSl7dGhpcy5wdXNoKHtkYXRhOmYudHJhbnNmb3JtVG8odGhpcy5kZXN0VHlwZSxhLmRhdGEpLG1ldGE6YS5tZXRhfSl9LGIuZXhwb3J0cz1kfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyNTpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoKXtlLmNhbGwodGhpcyxcIkNyYzMyUHJvYmVcIiksdGhpcy53aXRoU3RyZWFtSW5mbyhcImNyYzMyXCIsMCl9dmFyIGU9YShcIi4vR2VuZXJpY1dvcmtlclwiKSxmPWEoXCIuLi9jcmMzMlwiKSxnPWEoXCIuLi91dGlsc1wiKTtnLmluaGVyaXRzKGQsZSksZC5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKGEpe3RoaXMuc3RyZWFtSW5mby5jcmMzMj1mKGEuZGF0YSx0aGlzLnN0cmVhbUluZm8uY3JjMzJ8fDApLHRoaXMucHVzaChhKX0sYi5leHBvcnRzPWR9LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI2OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtmLmNhbGwodGhpcyxcIkRhdGFMZW5ndGhQcm9iZSBmb3IgXCIrYSksdGhpcy5wcm9wTmFtZT1hLHRoaXMud2l0aFN0cmVhbUluZm8oYSwwKX12YXIgZT1hKFwiLi4vdXRpbHNcIiksZj1hKFwiLi9HZW5lcmljV29ya2VyXCIpO2UuaW5oZXJpdHMoZCxmKSxkLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oYSl7aWYoYSl7dmFyIGI9dGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdfHwwO3RoaXMuc3RyZWFtSW5mb1t0aGlzLnByb3BOYW1lXT1iK2EuZGF0YS5sZW5ndGh9Zi5wcm90b3R5cGUucHJvY2Vzc0NodW5rLmNhbGwodGhpcyxhKX0sYi5leHBvcnRzPWR9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI3OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtmLmNhbGwodGhpcyxcIkRhdGFXb3JrZXJcIik7dmFyIGI9dGhpczt0aGlzLmRhdGFJc1JlYWR5PSExLHRoaXMuaW5kZXg9MCx0aGlzLm1heD0wLHRoaXMuZGF0YT1udWxsLHRoaXMudHlwZT1cIlwiLHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITEsYS50aGVuKGZ1bmN0aW9uKGEpe2IuZGF0YUlzUmVhZHk9ITAsYi5kYXRhPWEsYi5tYXg9YSYmYS5sZW5ndGh8fDAsYi50eXBlPWUuZ2V0VHlwZU9mKGEpLGIuaXNQYXVzZWR8fGIuX3RpY2tBbmRSZXBlYXQoKX0sZnVuY3Rpb24oYSl7Yi5lcnJvcihhKX0pfXZhciBlPWEoXCIuLi91dGlsc1wiKSxmPWEoXCIuL0dlbmVyaWNXb3JrZXJcIiksZz0xNjM4NDtlLmluaGVyaXRzKGQsZiksZC5wcm90b3R5cGUuY2xlYW5VcD1mdW5jdGlvbigpe2YucHJvdG90eXBlLmNsZWFuVXAuY2FsbCh0aGlzKSx0aGlzLmRhdGE9bnVsbH0sZC5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFmLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKCF0aGlzLl90aWNrU2NoZWR1bGVkJiZ0aGlzLmRhdGFJc1JlYWR5JiYodGhpcy5fdGlja1NjaGVkdWxlZD0hMCxlLmRlbGF5KHRoaXMuX3RpY2tBbmRSZXBlYXQsW10sdGhpcykpLCEwKX0sZC5wcm90b3R5cGUuX3RpY2tBbmRSZXBlYXQ9ZnVuY3Rpb24oKXt0aGlzLl90aWNrU2NoZWR1bGVkPSExLHRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZHx8KHRoaXMuX3RpY2soKSx0aGlzLmlzRmluaXNoZWR8fChlLmRlbGF5KHRoaXMuX3RpY2tBbmRSZXBlYXQsW10sdGhpcyksdGhpcy5fdGlja1NjaGVkdWxlZD0hMCkpfSxkLnByb3RvdHlwZS5fdGljaz1mdW5jdGlvbigpe2lmKHRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt2YXIgYT1nLGI9bnVsbCxjPU1hdGgubWluKHRoaXMubWF4LHRoaXMuaW5kZXgrYSk7aWYodGhpcy5pbmRleD49dGhpcy5tYXgpcmV0dXJuIHRoaXMuZW5kKCk7c3dpdGNoKHRoaXMudHlwZSl7Y2FzZVwic3RyaW5nXCI6Yj10aGlzLmRhdGEuc3Vic3RyaW5nKHRoaXMuaW5kZXgsYyk7YnJlYWs7Y2FzZVwidWludDhhcnJheVwiOmI9dGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuaW5kZXgsYyk7YnJlYWs7Y2FzZVwiYXJyYXlcIjpjYXNlXCJub2RlYnVmZmVyXCI6Yj10aGlzLmRhdGEuc2xpY2UodGhpcy5pbmRleCxjKX1yZXR1cm4gdGhpcy5pbmRleD1jLHRoaXMucHVzaCh7ZGF0YTpiLG1ldGE6e3BlcmNlbnQ6dGhpcy5tYXg/dGhpcy5pbmRleC90aGlzLm1heCoxMDA6MH19KX0sYi5leHBvcnRzPWR9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI4OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXt0aGlzLm5hbWU9YXx8XCJkZWZhdWx0XCIsdGhpcy5zdHJlYW1JbmZvPXt9LHRoaXMuZ2VuZXJhdGVkRXJyb3I9bnVsbCx0aGlzLmV4dHJhU3RyZWFtSW5mbz17fSx0aGlzLmlzUGF1c2VkPSEwLHRoaXMuaXNGaW5pc2hlZD0hMSx0aGlzLmlzTG9ja2VkPSExLHRoaXMuX2xpc3RlbmVycz17ZGF0YTpbXSxlbmQ6W10sZXJyb3I6W119LHRoaXMucHJldmlvdXM9bnVsbH1kLnByb3RvdHlwZT17cHVzaDpmdW5jdGlvbihhKXt0aGlzLmVtaXQoXCJkYXRhXCIsYSl9LGVuZDpmdW5jdGlvbigpe2lmKHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt0aGlzLmZsdXNoKCk7dHJ5e3RoaXMuZW1pdChcImVuZFwiKSx0aGlzLmNsZWFuVXAoKSx0aGlzLmlzRmluaXNoZWQ9ITB9Y2F0Y2goYSl7dGhpcy5lbWl0KFwiZXJyb3JcIixhKX1yZXR1cm4hMH0sZXJyb3I6ZnVuY3Rpb24oYSl7cmV0dXJuIXRoaXMuaXNGaW5pc2hlZCYmKHRoaXMuaXNQYXVzZWQ/dGhpcy5nZW5lcmF0ZWRFcnJvcj1hOih0aGlzLmlzRmluaXNoZWQ9ITAsdGhpcy5lbWl0KFwiZXJyb3JcIixhKSx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLmVycm9yKGEpLHRoaXMuY2xlYW5VcCgpKSwhMCl9LG9uOmZ1bmN0aW9uKGEsYil7cmV0dXJuIHRoaXMuX2xpc3RlbmVyc1thXS5wdXNoKGIpLHRoaXN9LGNsZWFuVXA6ZnVuY3Rpb24oKXt0aGlzLnN0cmVhbUluZm89dGhpcy5nZW5lcmF0ZWRFcnJvcj10aGlzLmV4dHJhU3RyZWFtSW5mbz1udWxsLHRoaXMuX2xpc3RlbmVycz1bXX0sZW1pdDpmdW5jdGlvbihhLGIpe2lmKHRoaXMuX2xpc3RlbmVyc1thXSlmb3IodmFyIGM9MDtjPHRoaXMuX2xpc3RlbmVyc1thXS5sZW5ndGg7YysrKXRoaXMuX2xpc3RlbmVyc1thXVtjXS5jYWxsKHRoaXMsYil9LHBpcGU6ZnVuY3Rpb24oYSl7cmV0dXJuIGEucmVnaXN0ZXJQcmV2aW91cyh0aGlzKX0scmVnaXN0ZXJQcmV2aW91czpmdW5jdGlvbihhKXtpZih0aGlzLmlzTG9ja2VkKXRocm93IG5ldyBFcnJvcihcIlRoZSBzdHJlYW0gJ1wiK3RoaXMrXCInIGhhcyBhbHJlYWR5IGJlZW4gdXNlZC5cIik7dGhpcy5zdHJlYW1JbmZvPWEuc3RyZWFtSW5mbyx0aGlzLm1lcmdlU3RyZWFtSW5mbygpLHRoaXMucHJldmlvdXM9YTt2YXIgYj10aGlzO3JldHVybiBhLm9uKFwiZGF0YVwiLGZ1bmN0aW9uKGEpe2IucHJvY2Vzc0NodW5rKGEpfSksYS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7Yi5lbmQoKX0pLGEub24oXCJlcnJvclwiLGZ1bmN0aW9uKGEpe2IuZXJyb3IoYSl9KSx0aGlzfSxwYXVzZTpmdW5jdGlvbigpe3JldHVybiF0aGlzLmlzUGF1c2VkJiYhdGhpcy5pc0ZpbmlzaGVkJiYodGhpcy5pc1BhdXNlZD0hMCx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLnBhdXNlKCksITApfSxyZXN1bWU6ZnVuY3Rpb24oKXtpZighdGhpcy5pc1BhdXNlZHx8dGhpcy5pc0ZpbmlzaGVkKXJldHVybiExO3RoaXMuaXNQYXVzZWQ9ITE7dmFyIGE9ITE7cmV0dXJuIHRoaXMuZ2VuZXJhdGVkRXJyb3ImJih0aGlzLmVycm9yKHRoaXMuZ2VuZXJhdGVkRXJyb3IpLGE9ITApLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMucmVzdW1lKCksIWF9LGZsdXNoOmZ1bmN0aW9uKCl7fSxwcm9jZXNzQ2h1bms6ZnVuY3Rpb24oYSl7dGhpcy5wdXNoKGEpfSx3aXRoU3RyZWFtSW5mbzpmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLmV4dHJhU3RyZWFtSW5mb1thXT1iLHRoaXMubWVyZ2VTdHJlYW1JbmZvKCksdGhpc30sbWVyZ2VTdHJlYW1JbmZvOmZ1bmN0aW9uKCl7Zm9yKHZhciBhIGluIHRoaXMuZXh0cmFTdHJlYW1JbmZvKXRoaXMuZXh0cmFTdHJlYW1JbmZvLmhhc093blByb3BlcnR5KGEpJiYodGhpcy5zdHJlYW1JbmZvW2FdPXRoaXMuZXh0cmFTdHJlYW1JbmZvW2FdKX0sbG9jazpmdW5jdGlvbigpe2lmKHRoaXMuaXNMb2NrZWQpdGhyb3cgbmV3IEVycm9yKFwiVGhlIHN0cmVhbSAnXCIrdGhpcytcIicgaGFzIGFscmVhZHkgYmVlbiB1c2VkLlwiKTt0aGlzLmlzTG9ja2VkPSEwLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMubG9jaygpfSx0b1N0cmluZzpmdW5jdGlvbigpe3ZhciBhPVwiV29ya2VyIFwiK3RoaXMubmFtZTtyZXR1cm4gdGhpcy5wcmV2aW91cz90aGlzLnByZXZpb3VzK1wiIC0+IFwiK2E6YX19LGIuZXhwb3J0cz1kfSx7fV0sMjk6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYixjKXtzd2l0Y2goYSl7Y2FzZVwiYmxvYlwiOnJldHVybiBoLm5ld0Jsb2IoaC50cmFuc2Zvcm1UbyhcImFycmF5YnVmZmVyXCIsYiksYyk7Y2FzZVwiYmFzZTY0XCI6cmV0dXJuIGsuZW5jb2RlKGIpO2RlZmF1bHQ6cmV0dXJuIGgudHJhbnNmb3JtVG8oYSxiKX19ZnVuY3Rpb24gZShhLGIpe3ZhciBjLGQ9MCxlPW51bGwsZj0wO2ZvcihjPTA7YzxiLmxlbmd0aDtjKyspZis9YltjXS5sZW5ndGg7c3dpdGNoKGEpe2Nhc2VcInN0cmluZ1wiOnJldHVybiBiLmpvaW4oXCJcIik7Y2FzZVwiYXJyYXlcIjpyZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSxiKTtjYXNlXCJ1aW50OGFycmF5XCI6Zm9yKGU9bmV3IFVpbnQ4QXJyYXkoZiksYz0wO2M8Yi5sZW5ndGg7YysrKWUuc2V0KGJbY10sZCksZCs9YltjXS5sZW5ndGg7cmV0dXJuIGU7Y2FzZVwibm9kZWJ1ZmZlclwiOnJldHVybiBCdWZmZXIuY29uY2F0KGIpO2RlZmF1bHQ6dGhyb3cgbmV3IEVycm9yKFwiY29uY2F0IDogdW5zdXBwb3J0ZWQgdHlwZSAnXCIrYStcIidcIil9fWZ1bmN0aW9uIGYoYSxiKXtyZXR1cm4gbmV3IG0uUHJvbWlzZShmdW5jdGlvbihjLGYpe3ZhciBnPVtdLGg9YS5faW50ZXJuYWxUeXBlLGk9YS5fb3V0cHV0VHlwZSxqPWEuX21pbWVUeXBlO2Eub24oXCJkYXRhXCIsZnVuY3Rpb24oYSxjKXtnLnB1c2goYSksYiYmYihjKX0pLm9uKFwiZXJyb3JcIixmdW5jdGlvbihhKXtnPVtdLGYoYSl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7dHJ5e3ZhciBhPWQoaSxlKGgsZyksaik7YyhhKX1jYXRjaChiKXtmKGIpfWc9W119KS5yZXN1bWUoKX0pfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWI7c3dpdGNoKGIpe2Nhc2VcImJsb2JcIjpjYXNlXCJhcnJheWJ1ZmZlclwiOmQ9XCJ1aW50OGFycmF5XCI7YnJlYWs7Y2FzZVwiYmFzZTY0XCI6ZD1cInN0cmluZ1wifXRyeXt0aGlzLl9pbnRlcm5hbFR5cGU9ZCx0aGlzLl9vdXRwdXRUeXBlPWIsdGhpcy5fbWltZVR5cGU9YyxoLmNoZWNrU3VwcG9ydChkKSx0aGlzLl93b3JrZXI9YS5waXBlKG5ldyBpKGQpKSxhLmxvY2soKX1jYXRjaChlKXt0aGlzLl93b3JrZXI9bmV3IGooXCJlcnJvclwiKSx0aGlzLl93b3JrZXIuZXJyb3IoZSl9fXZhciBoPWEoXCIuLi91dGlsc1wiKSxpPWEoXCIuL0NvbnZlcnRXb3JrZXJcIiksaj1hKFwiLi9HZW5lcmljV29ya2VyXCIpLGs9YShcIi4uL2Jhc2U2NFwiKSxsPWEoXCIuLi9zdXBwb3J0XCIpLG09YShcIi4uL2V4dGVybmFsXCIpLG49bnVsbDtpZihsLm5vZGVzdHJlYW0pdHJ5e249YShcIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyXCIpfWNhdGNoKG8pe31nLnByb3RvdHlwZT17YWNjdW11bGF0ZTpmdW5jdGlvbihhKXtyZXR1cm4gZih0aGlzLGEpfSxvbjpmdW5jdGlvbihhLGIpe3ZhciBjPXRoaXM7cmV0dXJuXCJkYXRhXCI9PT1hP3RoaXMuX3dvcmtlci5vbihhLGZ1bmN0aW9uKGEpe2IuY2FsbChjLGEuZGF0YSxhLm1ldGEpfSk6dGhpcy5fd29ya2VyLm9uKGEsZnVuY3Rpb24oKXtoLmRlbGF5KGIsYXJndW1lbnRzLGMpfSksdGhpc30scmVzdW1lOmZ1bmN0aW9uKCl7cmV0dXJuIGguZGVsYXkodGhpcy5fd29ya2VyLnJlc3VtZSxbXSx0aGlzLl93b3JrZXIpLHRoaXN9LHBhdXNlOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dvcmtlci5wYXVzZSgpLHRoaXN9LHRvTm9kZWpzU3RyZWFtOmZ1bmN0aW9uKGEpe2lmKGguY2hlY2tTdXBwb3J0KFwibm9kZXN0cmVhbVwiKSxcIm5vZGVidWZmZXJcIiE9PXRoaXMuX291dHB1dFR5cGUpdGhyb3cgbmV3IEVycm9yKHRoaXMuX291dHB1dFR5cGUrXCIgaXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIG1ldGhvZFwiKTtyZXR1cm4gbmV3IG4odGhpcyx7b2JqZWN0TW9kZTpcIm5vZGVidWZmZXJcIiE9PXRoaXMuX291dHB1dFR5cGV9LGEpfX0sYi5leHBvcnRzPWd9LHtcIi4uL2Jhc2U2NFwiOjEsXCIuLi9leHRlcm5hbFwiOjYsXCIuLi9ub2RlanMvTm9kZWpzU3RyZWFtT3V0cHV0QWRhcHRlclwiOjEzLFwiLi4vc3VwcG9ydFwiOjMwLFwiLi4vdXRpbHNcIjozMixcIi4vQ29udmVydFdvcmtlclwiOjI0LFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwzMDpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2lmKGMuYmFzZTY0PSEwLGMuYXJyYXk9ITAsYy5zdHJpbmc9ITAsYy5hcnJheWJ1ZmZlcj1cInVuZGVmaW5lZFwiIT10eXBlb2YgQXJyYXlCdWZmZXImJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5LGMubm9kZWJ1ZmZlcj1cInVuZGVmaW5lZFwiIT10eXBlb2YgQnVmZmVyLGMudWludDhhcnJheT1cInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDhBcnJheSxcInVuZGVmaW5lZFwiPT10eXBlb2YgQXJyYXlCdWZmZXIpYy5ibG9iPSExO2Vsc2V7dmFyIGQ9bmV3IEFycmF5QnVmZmVyKDApO3RyeXtjLmJsb2I9MD09PW5ldyBCbG9iKFtkXSx7dHlwZTpcImFwcGxpY2F0aW9uL3ppcFwifSkuc2l6ZX1jYXRjaChlKXt0cnl7dmFyIGY9c2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyLGc9bmV3IGY7Zy5hcHBlbmQoZCksYy5ibG9iPTA9PT1nLmdldEJsb2IoXCJhcHBsaWNhdGlvbi96aXBcIikuc2l6ZX1jYXRjaChlKXtjLmJsb2I9ITF9fX10cnl7Yy5ub2Rlc3RyZWFtPSEhYShcInJlYWRhYmxlLXN0cmVhbVwiKS5SZWFkYWJsZX1jYXRjaChlKXtjLm5vZGVzdHJlYW09ITF9fSx7XCJyZWFkYWJsZS1zdHJlYW1cIjoxNn1dLDMxOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe2kuY2FsbCh0aGlzLFwidXRmLTggZGVjb2RlXCIpLHRoaXMubGVmdE92ZXI9bnVsbH1mdW5jdGlvbiBlKCl7aS5jYWxsKHRoaXMsXCJ1dGYtOCBlbmNvZGVcIil9Zm9yKHZhciBmPWEoXCIuL3V0aWxzXCIpLGc9YShcIi4vc3VwcG9ydFwiKSxoPWEoXCIuL25vZGVqc1V0aWxzXCIpLGk9YShcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksaj1uZXcgQXJyYXkoMjU2KSxrPTA7azwyNTY7aysrKWpba109az49MjUyPzY6az49MjQ4PzU6az49MjQwPzQ6az49MjI0PzM6az49MTkyPzI6MTtqWzI1NF09alsyNTRdPTE7dmFyIGw9ZnVuY3Rpb24oYSl7dmFyIGIsYyxkLGUsZixoPWEubGVuZ3RoLGk9MDtmb3IoZT0wO2U8aDtlKyspYz1hLmNoYXJDb2RlQXQoZSksNTUyOTY9PT0oNjQ1MTImYykmJmUrMTxoJiYoZD1hLmNoYXJDb2RlQXQoZSsxKSw1NjMyMD09PSg2NDUxMiZkKSYmKGM9NjU1MzYrKGMtNTUyOTY8PDEwKSsoZC01NjMyMCksZSsrKSksaSs9YzwxMjg/MTpjPDIwNDg/MjpjPDY1NTM2PzM6NDtmb3IoYj1nLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkoaSk6bmV3IEFycmF5KGkpLGY9MCxlPTA7ZjxpO2UrKyljPWEuY2hhckNvZGVBdChlKSw1NTI5Nj09PSg2NDUxMiZjKSYmZSsxPGgmJihkPWEuY2hhckNvZGVBdChlKzEpLDU2MzIwPT09KDY0NTEyJmQpJiYoYz02NTUzNisoYy01NTI5Njw8MTApKyhkLTU2MzIwKSxlKyspKSxjPDEyOD9iW2YrK109YzpjPDIwNDg/KGJbZisrXT0xOTJ8Yz4+PjYsYltmKytdPTEyOHw2MyZjKTpjPDY1NTM2PyhiW2YrK109MjI0fGM+Pj4xMixiW2YrK109MTI4fGM+Pj42JjYzLGJbZisrXT0xMjh8NjMmYyk6KGJbZisrXT0yNDB8Yz4+PjE4LGJbZisrXT0xMjh8Yz4+PjEyJjYzLGJbZisrXT0xMjh8Yz4+PjYmNjMsYltmKytdPTEyOHw2MyZjKTtyZXR1cm4gYn0sbT1mdW5jdGlvbihhLGIpe3ZhciBjO2ZvcihiPWJ8fGEubGVuZ3RoLGI+YS5sZW5ndGgmJihiPWEubGVuZ3RoKSxjPWItMTtjPj0wJiYxMjg9PT0oMTkyJmFbY10pOyljLS07cmV0dXJuIGM8MD9iOjA9PT1jP2I6YytqW2FbY11dPmI/YzpifSxuPWZ1bmN0aW9uKGEpe3ZhciBiLGMsZCxlLGc9YS5sZW5ndGgsaD1uZXcgQXJyYXkoMipnKTtmb3IoYz0wLGI9MDtiPGc7KWlmKGQ9YVtiKytdLGQ8MTI4KWhbYysrXT1kO2Vsc2UgaWYoZT1qW2RdLGU+NCloW2MrK109NjU1MzMsYis9ZS0xO2Vsc2V7Zm9yKGQmPTI9PT1lPzMxOjM9PT1lPzE1Ojc7ZT4xJiZiPGc7KWQ9ZDw8Nnw2MyZhW2IrK10sZS0tO2U+MT9oW2MrK109NjU1MzM6ZDw2NTUzNj9oW2MrK109ZDooZC09NjU1MzYsaFtjKytdPTU1Mjk2fGQ+PjEwJjEwMjMsaFtjKytdPTU2MzIwfDEwMjMmZCl9cmV0dXJuIGgubGVuZ3RoIT09YyYmKGguc3ViYXJyYXk/aD1oLnN1YmFycmF5KDAsYyk6aC5sZW5ndGg9YyksZi5hcHBseUZyb21DaGFyQ29kZShoKX07Yy51dGY4ZW5jb2RlPWZ1bmN0aW9uKGEpe3JldHVybiBnLm5vZGVidWZmZXI/aC5uZXdCdWZmZXJGcm9tKGEsXCJ1dGYtOFwiKTpsKGEpfSxjLnV0ZjhkZWNvZGU9ZnVuY3Rpb24oYSl7cmV0dXJuIGcubm9kZWJ1ZmZlcj9mLnRyYW5zZm9ybVRvKFwibm9kZWJ1ZmZlclwiLGEpLnRvU3RyaW5nKFwidXRmLThcIik6KGE9Zi50cmFuc2Zvcm1UbyhnLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiLGEpLG4oYSkpfSxmLmluaGVyaXRzKGQsaSksZC5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKGEpe3ZhciBiPWYudHJhbnNmb3JtVG8oZy51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIixhLmRhdGEpO2lmKHRoaXMubGVmdE92ZXImJnRoaXMubGVmdE92ZXIubGVuZ3RoKXtpZihnLnVpbnQ4YXJyYXkpe3ZhciBkPWI7Yj1uZXcgVWludDhBcnJheShkLmxlbmd0aCt0aGlzLmxlZnRPdmVyLmxlbmd0aCksYi5zZXQodGhpcy5sZWZ0T3ZlciwwKSxiLnNldChkLHRoaXMubGVmdE92ZXIubGVuZ3RoKX1lbHNlIGI9dGhpcy5sZWZ0T3Zlci5jb25jYXQoYik7dGhpcy5sZWZ0T3Zlcj1udWxsfXZhciBlPW0oYiksaD1iO2UhPT1iLmxlbmd0aCYmKGcudWludDhhcnJheT8oaD1iLnN1YmFycmF5KDAsZSksdGhpcy5sZWZ0T3Zlcj1iLnN1YmFycmF5KGUsYi5sZW5ndGgpKTooaD1iLnNsaWNlKDAsZSksdGhpcy5sZWZ0T3Zlcj1iLnNsaWNlKGUsYi5sZW5ndGgpKSksdGhpcy5wdXNoKHtkYXRhOmMudXRmOGRlY29kZShoKSxtZXRhOmEubWV0YX0pfSxkLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe3RoaXMubGVmdE92ZXImJnRoaXMubGVmdE92ZXIubGVuZ3RoJiYodGhpcy5wdXNoKHtkYXRhOmMudXRmOGRlY29kZSh0aGlzLmxlZnRPdmVyKSxtZXRhOnt9fSksdGhpcy5sZWZ0T3Zlcj1udWxsKX0sYy5VdGY4RGVjb2RlV29ya2VyPWQsZi5pbmhlcml0cyhlLGkpLGUucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbihhKXt0aGlzLnB1c2goe2RhdGE6Yy51dGY4ZW5jb2RlKGEuZGF0YSksbWV0YTphLm1ldGF9KX0sYy5VdGY4RW5jb2RlV29ya2VyPWV9LHtcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGlsc1wiOjMyfV0sMzI6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe3ZhciBiPW51bGw7cmV0dXJuIGI9aS51aW50OGFycmF5P25ldyBVaW50OEFycmF5KGEubGVuZ3RoKTpuZXcgQXJyYXkoYS5sZW5ndGgpLGYoYSxiKX1mdW5jdGlvbiBlKGEpe3JldHVybiBhfWZ1bmN0aW9uIGYoYSxiKXtmb3IodmFyIGM9MDtjPGEubGVuZ3RoOysrYyliW2NdPTI1NSZhLmNoYXJDb2RlQXQoYyk7cmV0dXJuIGJ9ZnVuY3Rpb24gZyhhKXt2YXIgYj02NTUzNixkPWMuZ2V0VHlwZU9mKGEpLGU9ITA7aWYoXCJ1aW50OGFycmF5XCI9PT1kP2U9bi5hcHBseUNhbkJlVXNlZC51aW50OGFycmF5Olwibm9kZWJ1ZmZlclwiPT09ZCYmKGU9bi5hcHBseUNhbkJlVXNlZC5ub2RlYnVmZmVyKSxlKWZvcig7Yj4xOyl0cnl7cmV0dXJuIG4uc3RyaW5naWZ5QnlDaHVuayhhLGQsYil9Y2F0Y2goZil7Yj1NYXRoLmZsb29yKGIvMil9cmV0dXJuIG4uc3RyaW5naWZ5QnlDaGFyKGEpfWZ1bmN0aW9uIGgoYSxiKXtmb3IodmFyIGM9MDtjPGEubGVuZ3RoO2MrKyliW2NdPWFbY107XG5yZXR1cm4gYn12YXIgaT1hKFwiLi9zdXBwb3J0XCIpLGo9YShcIi4vYmFzZTY0XCIpLGs9YShcIi4vbm9kZWpzVXRpbHNcIiksbD1hKFwiY29yZS1qcy9saWJyYXJ5L2ZuL3NldC1pbW1lZGlhdGVcIiksbT1hKFwiLi9leHRlcm5hbFwiKTtjLm5ld0Jsb2I9ZnVuY3Rpb24oYSxiKXtjLmNoZWNrU3VwcG9ydChcImJsb2JcIik7dHJ5e3JldHVybiBuZXcgQmxvYihbYV0se3R5cGU6Yn0pfWNhdGNoKGQpe3RyeXt2YXIgZT1zZWxmLkJsb2JCdWlsZGVyfHxzZWxmLldlYktpdEJsb2JCdWlsZGVyfHxzZWxmLk1vekJsb2JCdWlsZGVyfHxzZWxmLk1TQmxvYkJ1aWxkZXIsZj1uZXcgZTtyZXR1cm4gZi5hcHBlbmQoYSksZi5nZXRCbG9iKGIpfWNhdGNoKGQpe3Rocm93IG5ldyBFcnJvcihcIkJ1ZyA6IGNhbid0IGNvbnN0cnVjdCB0aGUgQmxvYi5cIil9fX07dmFyIG49e3N0cmluZ2lmeUJ5Q2h1bms6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPVtdLGU9MCxmPWEubGVuZ3RoO2lmKGY8PWMpcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxhKTtmb3IoO2U8ZjspXCJhcnJheVwiPT09Ynx8XCJub2RlYnVmZmVyXCI9PT1iP2QucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsYS5zbGljZShlLE1hdGgubWluKGUrYyxmKSkpKTpkLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGEuc3ViYXJyYXkoZSxNYXRoLm1pbihlK2MsZikpKSksZSs9YztyZXR1cm4gZC5qb2luKFwiXCIpfSxzdHJpbmdpZnlCeUNoYXI6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPVwiXCIsYz0wO2M8YS5sZW5ndGg7YysrKWIrPVN0cmluZy5mcm9tQ2hhckNvZGUoYVtjXSk7cmV0dXJuIGJ9LGFwcGx5Q2FuQmVVc2VkOnt1aW50OGFycmF5OmZ1bmN0aW9uKCl7dHJ5e3JldHVybiBpLnVpbnQ4YXJyYXkmJjE9PT1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsbmV3IFVpbnQ4QXJyYXkoMSkpLmxlbmd0aH1jYXRjaChhKXtyZXR1cm4hMX19KCksbm9kZWJ1ZmZlcjpmdW5jdGlvbigpe3RyeXtyZXR1cm4gaS5ub2RlYnVmZmVyJiYxPT09U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGsuYWxsb2NCdWZmZXIoMSkpLmxlbmd0aH1jYXRjaChhKXtyZXR1cm4hMX19KCl9fTtjLmFwcGx5RnJvbUNoYXJDb2RlPWc7dmFyIG89e307by5zdHJpbmc9e3N0cmluZzplLGFycmF5OmZ1bmN0aW9uKGEpe3JldHVybiBmKGEsbmV3IEFycmF5KGEubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKGEpe3JldHVybiBvLnN0cmluZy51aW50OGFycmF5KGEpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbihhKXtyZXR1cm4gZihhLG5ldyBVaW50OEFycmF5KGEubGVuZ3RoKSl9LG5vZGVidWZmZXI6ZnVuY3Rpb24oYSl7cmV0dXJuIGYoYSxrLmFsbG9jQnVmZmVyKGEubGVuZ3RoKSl9fSxvLmFycmF5PXtzdHJpbmc6ZyxhcnJheTplLGFycmF5YnVmZmVyOmZ1bmN0aW9uKGEpe3JldHVybiBuZXcgVWludDhBcnJheShhKS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24oYSl7cmV0dXJuIG5ldyBVaW50OEFycmF5KGEpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKGEpe3JldHVybiBrLm5ld0J1ZmZlckZyb20oYSl9fSxvLmFycmF5YnVmZmVyPXtzdHJpbmc6ZnVuY3Rpb24oYSl7cmV0dXJuIGcobmV3IFVpbnQ4QXJyYXkoYSkpfSxhcnJheTpmdW5jdGlvbihhKXtyZXR1cm4gaChuZXcgVWludDhBcnJheShhKSxuZXcgQXJyYXkoYS5ieXRlTGVuZ3RoKSl9LGFycmF5YnVmZmVyOmUsdWludDhhcnJheTpmdW5jdGlvbihhKXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYSl9LG5vZGVidWZmZXI6ZnVuY3Rpb24oYSl7cmV0dXJuIGsubmV3QnVmZmVyRnJvbShuZXcgVWludDhBcnJheShhKSl9fSxvLnVpbnQ4YXJyYXk9e3N0cmluZzpnLGFycmF5OmZ1bmN0aW9uKGEpe3JldHVybiBoKGEsbmV3IEFycmF5KGEubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKGEpe3JldHVybiBhLmJ1ZmZlcn0sdWludDhhcnJheTplLG5vZGVidWZmZXI6ZnVuY3Rpb24oYSl7cmV0dXJuIGsubmV3QnVmZmVyRnJvbShhKX19LG8ubm9kZWJ1ZmZlcj17c3RyaW5nOmcsYXJyYXk6ZnVuY3Rpb24oYSl7cmV0dXJuIGgoYSxuZXcgQXJyYXkoYS5sZW5ndGgpKX0sYXJyYXlidWZmZXI6ZnVuY3Rpb24oYSl7cmV0dXJuIG8ubm9kZWJ1ZmZlci51aW50OGFycmF5KGEpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbihhKXtyZXR1cm4gaChhLG5ldyBVaW50OEFycmF5KGEubGVuZ3RoKSl9LG5vZGVidWZmZXI6ZX0sYy50cmFuc2Zvcm1Ubz1mdW5jdGlvbihhLGIpe2lmKGJ8fChiPVwiXCIpLCFhKXJldHVybiBiO2MuY2hlY2tTdXBwb3J0KGEpO3ZhciBkPWMuZ2V0VHlwZU9mKGIpLGU9b1tkXVthXShiKTtyZXR1cm4gZX0sYy5nZXRUeXBlT2Y9ZnVuY3Rpb24oYSl7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIGE/XCJzdHJpbmdcIjpcIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSk/XCJhcnJheVwiOmkubm9kZWJ1ZmZlciYmay5pc0J1ZmZlcihhKT9cIm5vZGVidWZmZXJcIjppLnVpbnQ4YXJyYXkmJmEgaW5zdGFuY2VvZiBVaW50OEFycmF5P1widWludDhhcnJheVwiOmkuYXJyYXlidWZmZXImJmEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcj9cImFycmF5YnVmZmVyXCI6dm9pZCAwfSxjLmNoZWNrU3VwcG9ydD1mdW5jdGlvbihhKXt2YXIgYj1pW2EudG9Mb3dlckNhc2UoKV07aWYoIWIpdGhyb3cgbmV3IEVycm9yKGErXCIgaXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIHBsYXRmb3JtXCIpfSxjLk1BWF9WQUxVRV8xNkJJVFM9NjU1MzUsYy5NQVhfVkFMVUVfMzJCSVRTPS0xLGMucHJldHR5PWZ1bmN0aW9uKGEpe3ZhciBiLGMsZD1cIlwiO2ZvcihjPTA7YzwoYXx8XCJcIikubGVuZ3RoO2MrKyliPWEuY2hhckNvZGVBdChjKSxkKz1cIlxcXFx4XCIrKGI8MTY/XCIwXCI6XCJcIikrYi50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtyZXR1cm4gZH0sYy5kZWxheT1mdW5jdGlvbihhLGIsYyl7bChmdW5jdGlvbigpe2EuYXBwbHkoY3x8bnVsbCxifHxbXSl9KX0sYy5pbmhlcml0cz1mdW5jdGlvbihhLGIpe3ZhciBjPWZ1bmN0aW9uKCl7fTtjLnByb3RvdHlwZT1iLnByb3RvdHlwZSxhLnByb3RvdHlwZT1uZXcgY30sYy5leHRlbmQ9ZnVuY3Rpb24oKXt2YXIgYSxiLGM9e307Zm9yKGE9MDthPGFyZ3VtZW50cy5sZW5ndGg7YSsrKWZvcihiIGluIGFyZ3VtZW50c1thXSlhcmd1bWVudHNbYV0uaGFzT3duUHJvcGVydHkoYikmJlwidW5kZWZpbmVkXCI9PXR5cGVvZiBjW2JdJiYoY1tiXT1hcmd1bWVudHNbYV1bYl0pO3JldHVybiBjfSxjLnByZXBhcmVDb250ZW50PWZ1bmN0aW9uKGEsYixlLGYsZyl7dmFyIGg9bS5Qcm9taXNlLnJlc29sdmUoYikudGhlbihmdW5jdGlvbihhKXt2YXIgYj1pLmJsb2ImJihhIGluc3RhbmNlb2YgQmxvYnx8W1wiW29iamVjdCBGaWxlXVwiLFwiW29iamVjdCBCbG9iXVwiXS5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSkhPT0tMSk7cmV0dXJuIGImJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBGaWxlUmVhZGVyP25ldyBtLlByb21pc2UoZnVuY3Rpb24oYixjKXt2YXIgZD1uZXcgRmlsZVJlYWRlcjtkLm9ubG9hZD1mdW5jdGlvbihhKXtiKGEudGFyZ2V0LnJlc3VsdCl9LGQub25lcnJvcj1mdW5jdGlvbihhKXtjKGEudGFyZ2V0LmVycm9yKX0sZC5yZWFkQXNBcnJheUJ1ZmZlcihhKX0pOmF9KTtyZXR1cm4gaC50aGVuKGZ1bmN0aW9uKGIpe3ZhciBoPWMuZ2V0VHlwZU9mKGIpO3JldHVybiBoPyhcImFycmF5YnVmZmVyXCI9PT1oP2I9Yy50cmFuc2Zvcm1UbyhcInVpbnQ4YXJyYXlcIixiKTpcInN0cmluZ1wiPT09aCYmKGc/Yj1qLmRlY29kZShiKTplJiZmIT09ITAmJihiPWQoYikpKSxiKTptLlByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbid0IHJlYWQgdGhlIGRhdGEgb2YgJ1wiK2ErXCInLiBJcyBpdCBpbiBhIHN1cHBvcnRlZCBKYXZhU2NyaXB0IHR5cGUgKFN0cmluZywgQmxvYiwgQXJyYXlCdWZmZXIsIGV0YykgP1wiKSl9KX19LHtcIi4vYmFzZTY0XCI6MSxcIi4vZXh0ZXJuYWxcIjo2LFwiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdXBwb3J0XCI6MzAsXCJjb3JlLWpzL2xpYnJhcnkvZm4vc2V0LWltbWVkaWF0ZVwiOjM2fV0sMzM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe3RoaXMuZmlsZXM9W10sdGhpcy5sb2FkT3B0aW9ucz1hfXZhciBlPWEoXCIuL3JlYWRlci9yZWFkZXJGb3JcIiksZj1hKFwiLi91dGlsc1wiKSxnPWEoXCIuL3NpZ25hdHVyZVwiKSxoPWEoXCIuL3ppcEVudHJ5XCIpLGk9KGEoXCIuL3V0ZjhcIiksYShcIi4vc3VwcG9ydFwiKSk7ZC5wcm90b3R5cGU9e2NoZWNrU2lnbmF0dXJlOmZ1bmN0aW9uKGEpe2lmKCF0aGlzLnJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmUoYSkpe3RoaXMucmVhZGVyLmluZGV4LT00O3ZhciBiPXRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk7dGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCBvciBidWc6IHVuZXhwZWN0ZWQgc2lnbmF0dXJlIChcIitmLnByZXR0eShiKStcIiwgZXhwZWN0ZWQgXCIrZi5wcmV0dHkoYSkrXCIpXCIpfX0saXNTaWduYXR1cmU6ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLnJlYWRlci5pbmRleDt0aGlzLnJlYWRlci5zZXRJbmRleChhKTt2YXIgZD10aGlzLnJlYWRlci5yZWFkU3RyaW5nKDQpLGU9ZD09PWI7cmV0dXJuIHRoaXMucmVhZGVyLnNldEluZGV4KGMpLGV9LHJlYWRCbG9ja0VuZE9mQ2VudHJhbDpmdW5jdGlvbigpe3RoaXMuZGlza051bWJlcj10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclJlY29yZHM9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5jZW50cmFsRGlyT2Zmc2V0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy56aXBDb21tZW50TGVuZ3RoPXRoaXMucmVhZGVyLnJlYWRJbnQoMik7dmFyIGE9dGhpcy5yZWFkZXIucmVhZERhdGEodGhpcy56aXBDb21tZW50TGVuZ3RoKSxiPWkudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCIsYz1mLnRyYW5zZm9ybVRvKGIsYSk7dGhpcy56aXBDb21tZW50PXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUoYyl9LHJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemU9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLnJlYWRlci5za2lwKDQpLHRoaXMuZGlza051bWJlcj10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpclJlY29yZHM9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyT2Zmc2V0PXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy56aXA2NEV4dGVuc2libGVEYXRhPXt9O2Zvcih2YXIgYSxiLGMsZD10aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZS00NCxlPTA7ZTxkOylhPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksYj10aGlzLnJlYWRlci5yZWFkSW50KDQpLGM9dGhpcy5yZWFkZXIucmVhZERhdGEoYiksdGhpcy56aXA2NEV4dGVuc2libGVEYXRhW2FdPXtpZDphLGxlbmd0aDpiLHZhbHVlOmN9fSxyZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbExvY2F0b3I6ZnVuY3Rpb24oKXtpZih0aGlzLmRpc2tXaXRoWmlwNjRDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmRpc2tzQ291bnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmRpc2tzQ291bnQ+MSl0aHJvdyBuZXcgRXJyb3IoXCJNdWx0aS12b2x1bWVzIHppcCBhcmUgbm90IHN1cHBvcnRlZFwiKX0scmVhZExvY2FsRmlsZXM6ZnVuY3Rpb24oKXt2YXIgYSxiO2ZvcihhPTA7YTx0aGlzLmZpbGVzLmxlbmd0aDthKyspYj10aGlzLmZpbGVzW2FdLHRoaXMucmVhZGVyLnNldEluZGV4KGIubG9jYWxIZWFkZXJPZmZzZXQpLHRoaXMuY2hlY2tTaWduYXR1cmUoZy5MT0NBTF9GSUxFX0hFQURFUiksYi5yZWFkTG9jYWxQYXJ0KHRoaXMucmVhZGVyKSxiLmhhbmRsZVVURjgoKSxiLnByb2Nlc3NBdHRyaWJ1dGVzKCl9LHJlYWRDZW50cmFsRGlyOmZ1bmN0aW9uKCl7dmFyIGE7Zm9yKHRoaXMucmVhZGVyLnNldEluZGV4KHRoaXMuY2VudHJhbERpck9mZnNldCk7dGhpcy5yZWFkZXIucmVhZEFuZENoZWNrU2lnbmF0dXJlKGcuQ0VOVFJBTF9GSUxFX0hFQURFUik7KWE9bmV3IGgoe3ppcDY0OnRoaXMuemlwNjR9LHRoaXMubG9hZE9wdGlvbnMpLGEucmVhZENlbnRyYWxQYXJ0KHRoaXMucmVhZGVyKSx0aGlzLmZpbGVzLnB1c2goYSk7aWYodGhpcy5jZW50cmFsRGlyUmVjb3JkcyE9PXRoaXMuZmlsZXMubGVuZ3RoJiYwIT09dGhpcy5jZW50cmFsRGlyUmVjb3JkcyYmMD09PXRoaXMuZmlsZXMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgb3IgYnVnOiBleHBlY3RlZCBcIit0aGlzLmNlbnRyYWxEaXJSZWNvcmRzK1wiIHJlY29yZHMgaW4gY2VudHJhbCBkaXIsIGdvdCBcIit0aGlzLmZpbGVzLmxlbmd0aCl9LHJlYWRFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShnLkNFTlRSQUxfRElSRUNUT1JZX0VORCk7aWYoYTwwKXt2YXIgYj0hdGhpcy5pc1NpZ25hdHVyZSgwLGcuTE9DQUxfRklMRV9IRUFERVIpO3Rocm93IGI/bmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgOiBpcyB0aGlzIGEgemlwIGZpbGUgPyBJZiBpdCBpcywgc2VlIGh0dHBzOi8vc3R1ay5naXRodWIuaW8vanN6aXAvZG9jdW1lbnRhdGlvbi9ob3d0by9yZWFkX3ppcC5odG1sXCIpOm5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IGNhbid0IGZpbmQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpfXRoaXMucmVhZGVyLnNldEluZGV4KGEpO3ZhciBjPWE7aWYodGhpcy5jaGVja1NpZ25hdHVyZShnLkNFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2tFbmRPZkNlbnRyYWwoKSx0aGlzLmRpc2tOdW1iZXI9PT1mLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9PT1mLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPT09Zi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPT09Zi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJTaXplPT09Zi5NQVhfVkFMVUVfMzJCSVRTfHx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9PT1mLk1BWF9WQUxVRV8zMkJJVFMpe2lmKHRoaXMuemlwNjQ9ITAsYT10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShnLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1IpLGE8MCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIHRoZSBaSVA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclwiKTtpZih0aGlzLnJlYWRlci5zZXRJbmRleChhKSx0aGlzLmNoZWNrU2lnbmF0dXJlKGcuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUiksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbExvY2F0b3IoKSwhdGhpcy5pc1NpZ25hdHVyZSh0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXIsZy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpJiYodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKGcuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI8MCkpdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpO3RoaXMucmVhZGVyLnNldEluZGV4KHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpciksdGhpcy5jaGVja1NpZ25hdHVyZShnLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbCgpfXZhciBkPXRoaXMuY2VudHJhbERpck9mZnNldCt0aGlzLmNlbnRyYWxEaXJTaXplO3RoaXMuemlwNjQmJihkKz0yMCxkKz0xMit0aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZSk7dmFyIGU9Yy1kO2lmKGU+MCl0aGlzLmlzU2lnbmF0dXJlKGMsZy5DRU5UUkFMX0ZJTEVfSEVBREVSKXx8KHRoaXMucmVhZGVyLnplcm89ZSk7ZWxzZSBpZihlPDApdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogbWlzc2luZyBcIitNYXRoLmFicyhlKStcIiBieXRlcy5cIil9LHByZXBhcmVSZWFkZXI6ZnVuY3Rpb24oYSl7dGhpcy5yZWFkZXI9ZShhKX0sbG9hZDpmdW5jdGlvbihhKXt0aGlzLnByZXBhcmVSZWFkZXIoYSksdGhpcy5yZWFkRW5kT2ZDZW50cmFsKCksdGhpcy5yZWFkQ2VudHJhbERpcigpLHRoaXMucmVhZExvY2FsRmlsZXMoKX19LGIuZXhwb3J0cz1kfSx7XCIuL3JlYWRlci9yZWFkZXJGb3JcIjoyMixcIi4vc2lnbmF0dXJlXCI6MjMsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyeVwiOjM0fV0sMzQ6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7dGhpcy5vcHRpb25zPWEsdGhpcy5sb2FkT3B0aW9ucz1ifXZhciBlPWEoXCIuL3JlYWRlci9yZWFkZXJGb3JcIiksZj1hKFwiLi91dGlsc1wiKSxnPWEoXCIuL2NvbXByZXNzZWRPYmplY3RcIiksaD1hKFwiLi9jcmMzMlwiKSxpPWEoXCIuL3V0ZjhcIiksaj1hKFwiLi9jb21wcmVzc2lvbnNcIiksaz1hKFwiLi9zdXBwb3J0XCIpLGw9MCxtPTMsbj1mdW5jdGlvbihhKXtmb3IodmFyIGIgaW4gailpZihqLmhhc093blByb3BlcnR5KGIpJiZqW2JdLm1hZ2ljPT09YSlyZXR1cm4galtiXTtyZXR1cm4gbnVsbH07ZC5wcm90b3R5cGU9e2lzRW5jcnlwdGVkOmZ1bmN0aW9uKCl7cmV0dXJuIDE9PT0oMSZ0aGlzLmJpdEZsYWcpfSx1c2VVVEY4OmZ1bmN0aW9uKCl7cmV0dXJuIDIwNDg9PT0oMjA0OCZ0aGlzLmJpdEZsYWcpfSxyZWFkTG9jYWxQYXJ0OmZ1bmN0aW9uKGEpe3ZhciBiLGM7aWYoYS5za2lwKDIyKSx0aGlzLmZpbGVOYW1lTGVuZ3RoPWEucmVhZEludCgyKSxjPWEucmVhZEludCgyKSx0aGlzLmZpbGVOYW1lPWEucmVhZERhdGEodGhpcy5maWxlTmFtZUxlbmd0aCksYS5za2lwKGMpLHRoaXMuY29tcHJlc3NlZFNpemU9PT0tMXx8dGhpcy51bmNvbXByZXNzZWRTaXplPT09LTEpdGhyb3cgbmV3IEVycm9yKFwiQnVnIG9yIGNvcnJ1cHRlZCB6aXAgOiBkaWRuJ3QgZ2V0IGVub3VnaCBpbmZvcm1hdGlvbnMgZnJvbSB0aGUgY2VudHJhbCBkaXJlY3RvcnkgKGNvbXByZXNzZWRTaXplID09PSAtMSB8fCB1bmNvbXByZXNzZWRTaXplID09PSAtMSlcIik7aWYoYj1uKHRoaXMuY29tcHJlc3Npb25NZXRob2QpLG51bGw9PT1iKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBjb21wcmVzc2lvbiBcIitmLnByZXR0eSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKStcIiB1bmtub3duIChpbm5lciBmaWxlIDogXCIrZi50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHRoaXMuZmlsZU5hbWUpK1wiKVwiKTt0aGlzLmRlY29tcHJlc3NlZD1uZXcgZyh0aGlzLmNvbXByZXNzZWRTaXplLHRoaXMudW5jb21wcmVzc2VkU2l6ZSx0aGlzLmNyYzMyLGIsYS5yZWFkRGF0YSh0aGlzLmNvbXByZXNzZWRTaXplKSl9LHJlYWRDZW50cmFsUGFydDpmdW5jdGlvbihhKXt0aGlzLnZlcnNpb25NYWRlQnk9YS5yZWFkSW50KDIpLGEuc2tpcCgyKSx0aGlzLmJpdEZsYWc9YS5yZWFkSW50KDIpLHRoaXMuY29tcHJlc3Npb25NZXRob2Q9YS5yZWFkU3RyaW5nKDIpLHRoaXMuZGF0ZT1hLnJlYWREYXRlKCksdGhpcy5jcmMzMj1hLnJlYWRJbnQoNCksdGhpcy5jb21wcmVzc2VkU2l6ZT1hLnJlYWRJbnQoNCksdGhpcy51bmNvbXByZXNzZWRTaXplPWEucmVhZEludCg0KTt2YXIgYj1hLnJlYWRJbnQoMik7aWYodGhpcy5leHRyYUZpZWxkc0xlbmd0aD1hLnJlYWRJbnQoMiksdGhpcy5maWxlQ29tbWVudExlbmd0aD1hLnJlYWRJbnQoMiksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9YS5yZWFkSW50KDIpLHRoaXMuaW50ZXJuYWxGaWxlQXR0cmlidXRlcz1hLnJlYWRJbnQoMiksdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPWEucmVhZEludCg0KSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PWEucmVhZEludCg0KSx0aGlzLmlzRW5jcnlwdGVkKCkpdGhyb3cgbmV3IEVycm9yKFwiRW5jcnlwdGVkIHppcCBhcmUgbm90IHN1cHBvcnRlZFwiKTthLnNraXAoYiksdGhpcy5yZWFkRXh0cmFGaWVsZHMoYSksdGhpcy5wYXJzZVpJUDY0RXh0cmFGaWVsZChhKSx0aGlzLmZpbGVDb21tZW50PWEucmVhZERhdGEodGhpcy5maWxlQ29tbWVudExlbmd0aCl9LHByb2Nlc3NBdHRyaWJ1dGVzOmZ1bmN0aW9uKCl7dGhpcy51bml4UGVybWlzc2lvbnM9bnVsbCx0aGlzLmRvc1Blcm1pc3Npb25zPW51bGw7dmFyIGE9dGhpcy52ZXJzaW9uTWFkZUJ5Pj44O3RoaXMuZGlyPSEhKDE2JnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksYT09PWwmJih0aGlzLmRvc1Blcm1pc3Npb25zPTYzJnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksYT09PW0mJih0aGlzLnVuaXhQZXJtaXNzaW9ucz10aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXM+PjE2JjY1NTM1KSx0aGlzLmRpcnx8XCIvXCIhPT10aGlzLmZpbGVOYW1lU3RyLnNsaWNlKC0xKXx8KHRoaXMuZGlyPSEwKX0scGFyc2VaSVA2NEV4dHJhRmllbGQ6ZnVuY3Rpb24oYSl7aWYodGhpcy5leHRyYUZpZWxkc1sxXSl7dmFyIGI9ZSh0aGlzLmV4dHJhRmllbGRzWzFdLnZhbHVlKTt0aGlzLnVuY29tcHJlc3NlZFNpemU9PT1mLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLnVuY29tcHJlc3NlZFNpemU9Yi5yZWFkSW50KDgpKSx0aGlzLmNvbXByZXNzZWRTaXplPT09Zi5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5jb21wcmVzc2VkU2l6ZT1iLnJlYWRJbnQoOCkpLHRoaXMubG9jYWxIZWFkZXJPZmZzZXQ9PT1mLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PWIucmVhZEludCg4KSksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9PT1mLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmRpc2tOdW1iZXJTdGFydD1iLnJlYWRJbnQoNCkpfX0scmVhZEV4dHJhRmllbGRzOmZ1bmN0aW9uKGEpe3ZhciBiLGMsZCxlPWEuaW5kZXgrdGhpcy5leHRyYUZpZWxkc0xlbmd0aDtmb3IodGhpcy5leHRyYUZpZWxkc3x8KHRoaXMuZXh0cmFGaWVsZHM9e30pO2EuaW5kZXg8ZTspYj1hLnJlYWRJbnQoMiksYz1hLnJlYWRJbnQoMiksZD1hLnJlYWREYXRhKGMpLHRoaXMuZXh0cmFGaWVsZHNbYl09e2lkOmIsbGVuZ3RoOmMsdmFsdWU6ZH19LGhhbmRsZVVURjg6ZnVuY3Rpb24oKXt2YXIgYT1rLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiO2lmKHRoaXMudXNlVVRGOCgpKXRoaXMuZmlsZU5hbWVTdHI9aS51dGY4ZGVjb2RlKHRoaXMuZmlsZU5hbWUpLHRoaXMuZmlsZUNvbW1lbnRTdHI9aS51dGY4ZGVjb2RlKHRoaXMuZmlsZUNvbW1lbnQpO2Vsc2V7dmFyIGI9dGhpcy5maW5kRXh0cmFGaWVsZFVuaWNvZGVQYXRoKCk7aWYobnVsbCE9PWIpdGhpcy5maWxlTmFtZVN0cj1iO2Vsc2V7dmFyIGM9Zi50cmFuc2Zvcm1UbyhhLHRoaXMuZmlsZU5hbWUpO3RoaXMuZmlsZU5hbWVTdHI9dGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShjKX12YXIgZD10aGlzLmZpbmRFeHRyYUZpZWxkVW5pY29kZUNvbW1lbnQoKTtpZihudWxsIT09ZCl0aGlzLmZpbGVDb21tZW50U3RyPWQ7ZWxzZXt2YXIgZT1mLnRyYW5zZm9ybVRvKGEsdGhpcy5maWxlQ29tbWVudCk7dGhpcy5maWxlQ29tbWVudFN0cj10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKGUpfX19LGZpbmRFeHRyYUZpZWxkVW5pY29kZVBhdGg6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmV4dHJhRmllbGRzWzI4Nzg5XTtpZihhKXt2YXIgYj1lKGEudmFsdWUpO3JldHVybiAxIT09Yi5yZWFkSW50KDEpP251bGw6aCh0aGlzLmZpbGVOYW1lKSE9PWIucmVhZEludCg0KT9udWxsOmkudXRmOGRlY29kZShiLnJlYWREYXRhKGEubGVuZ3RoLTUpKX1yZXR1cm4gbnVsbH0sZmluZEV4dHJhRmllbGRVbmljb2RlQ29tbWVudDpmdW5jdGlvbigpe3ZhciBhPXRoaXMuZXh0cmFGaWVsZHNbMjU0NjFdO2lmKGEpe3ZhciBiPWUoYS52YWx1ZSk7cmV0dXJuIDEhPT1iLnJlYWRJbnQoMSk/bnVsbDpoKHRoaXMuZmlsZUNvbW1lbnQpIT09Yi5yZWFkSW50KDQpP251bGw6aS51dGY4ZGVjb2RlKGIucmVhZERhdGEoYS5sZW5ndGgtNSkpfXJldHVybiBudWxsfX0sYi5leHBvcnRzPWR9LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL2NvbXByZXNzaW9uc1wiOjMsXCIuL2NyYzMyXCI6NCxcIi4vcmVhZGVyL3JlYWRlckZvclwiOjIyLFwiLi9zdXBwb3J0XCI6MzAsXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMn1dLDM1OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGQ9YShcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKSxlPWEoXCIuL3N0cmVhbS9EYXRhV29ya2VyXCIpLGY9YShcIi4vdXRmOFwiKSxnPWEoXCIuL2NvbXByZXNzZWRPYmplY3RcIiksaD1hKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSxpPWZ1bmN0aW9uKGEsYixjKXt0aGlzLm5hbWU9YSx0aGlzLmRpcj1jLmRpcix0aGlzLmRhdGU9Yy5kYXRlLHRoaXMuY29tbWVudD1jLmNvbW1lbnQsdGhpcy51bml4UGVybWlzc2lvbnM9Yy51bml4UGVybWlzc2lvbnMsdGhpcy5kb3NQZXJtaXNzaW9ucz1jLmRvc1Blcm1pc3Npb25zLHRoaXMuX2RhdGE9Yix0aGlzLl9kYXRhQmluYXJ5PWMuYmluYXJ5LHRoaXMub3B0aW9ucz17Y29tcHJlc3Npb246Yy5jb21wcmVzc2lvbixjb21wcmVzc2lvbk9wdGlvbnM6Yy5jb21wcmVzc2lvbk9wdGlvbnN9fTtpLnByb3RvdHlwZT17aW50ZXJuYWxTdHJlYW06ZnVuY3Rpb24oYSl7dmFyIGI9bnVsbCxjPVwic3RyaW5nXCI7dHJ5e2lmKCFhKXRocm93IG5ldyBFcnJvcihcIk5vIG91dHB1dCB0eXBlIHNwZWNpZmllZC5cIik7Yz1hLnRvTG93ZXJDYXNlKCk7dmFyIGU9XCJzdHJpbmdcIj09PWN8fFwidGV4dFwiPT09YztcImJpbmFyeXN0cmluZ1wiIT09YyYmXCJ0ZXh0XCIhPT1jfHwoYz1cInN0cmluZ1wiKSxiPXRoaXMuX2RlY29tcHJlc3NXb3JrZXIoKTt2YXIgZz0hdGhpcy5fZGF0YUJpbmFyeTtnJiYhZSYmKGI9Yi5waXBlKG5ldyBmLlV0ZjhFbmNvZGVXb3JrZXIpKSwhZyYmZSYmKGI9Yi5waXBlKG5ldyBmLlV0ZjhEZWNvZGVXb3JrZXIpKX1jYXRjaChpKXtiPW5ldyBoKFwiZXJyb3JcIiksYi5lcnJvcihpKX1yZXR1cm4gbmV3IGQoYixjLFwiXCIpfSxhc3luYzpmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLmludGVybmFsU3RyZWFtKGEpLmFjY3VtdWxhdGUoYil9LG5vZGVTdHJlYW06ZnVuY3Rpb24oYSxiKXtyZXR1cm4gdGhpcy5pbnRlcm5hbFN0cmVhbShhfHxcIm5vZGVidWZmZXJcIikudG9Ob2RlanNTdHJlYW0oYil9LF9jb21wcmVzc1dvcmtlcjpmdW5jdGlvbihhLGIpe2lmKHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBnJiZ0aGlzLl9kYXRhLmNvbXByZXNzaW9uLm1hZ2ljPT09YS5tYWdpYylyZXR1cm4gdGhpcy5fZGF0YS5nZXRDb21wcmVzc2VkV29ya2VyKCk7dmFyIGM9dGhpcy5fZGVjb21wcmVzc1dvcmtlcigpO3JldHVybiB0aGlzLl9kYXRhQmluYXJ5fHwoYz1jLnBpcGUobmV3IGYuVXRmOEVuY29kZVdvcmtlcikpLGcuY3JlYXRlV29ya2VyRnJvbShjLGEsYil9LF9kZWNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBnP3RoaXMuX2RhdGEuZ2V0Q29udGVudFdvcmtlcigpOnRoaXMuX2RhdGEgaW5zdGFuY2VvZiBoP3RoaXMuX2RhdGE6bmV3IGUodGhpcy5fZGF0YSl9fTtmb3IodmFyIGo9W1wiYXNUZXh0XCIsXCJhc0JpbmFyeVwiLFwiYXNOb2RlQnVmZmVyXCIsXCJhc1VpbnQ4QXJyYXlcIixcImFzQXJyYXlCdWZmZXJcIl0saz1mdW5jdGlvbigpe3Rocm93IG5ldyBFcnJvcihcIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpfSxsPTA7bDxqLmxlbmd0aDtsKyspaS5wcm90b3R5cGVbaltsXV09aztiLmV4cG9ydHM9aX0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyNyxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiOjI5LFwiLi91dGY4XCI6MzF9XSwzNjpbZnVuY3Rpb24oYSxiLGMpe2EoXCIuLi9tb2R1bGVzL3dlYi5pbW1lZGlhdGVcIiksYi5leHBvcnRzPWEoXCIuLi9tb2R1bGVzL19jb3JlXCIpLnNldEltbWVkaWF0ZX0se1wiLi4vbW9kdWxlcy9fY29yZVwiOjQwLFwiLi4vbW9kdWxlcy93ZWIuaW1tZWRpYXRlXCI6NTZ9XSwzNzpbZnVuY3Rpb24oYSxiLGMpe2IuZXhwb3J0cz1mdW5jdGlvbihhKXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBhKXRocm93IFR5cGVFcnJvcihhK1wiIGlzIG5vdCBhIGZ1bmN0aW9uIVwiKTtyZXR1cm4gYX19LHt9XSwzODpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWEoXCIuL19pcy1vYmplY3RcIik7Yi5leHBvcnRzPWZ1bmN0aW9uKGEpe2lmKCFkKGEpKXRocm93IFR5cGVFcnJvcihhK1wiIGlzIG5vdCBhbiBvYmplY3QhXCIpO3JldHVybiBhfX0se1wiLi9faXMtb2JqZWN0XCI6NTF9XSwzOTpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPXt9LnRvU3RyaW5nO2IuZXhwb3J0cz1mdW5jdGlvbihhKXtyZXR1cm4gZC5jYWxsKGEpLnNsaWNlKDgsLTEpfX0se31dLDQwOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9Yi5leHBvcnRzPXt2ZXJzaW9uOlwiMi4zLjBcIn07XCJudW1iZXJcIj09dHlwZW9mIF9fZSYmKF9fZT1kKX0se31dLDQxOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vX2EtZnVuY3Rpb25cIik7Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYixjKXtpZihkKGEpLHZvaWQgMD09PWIpcmV0dXJuIGE7c3dpdGNoKGMpe2Nhc2UgMTpyZXR1cm4gZnVuY3Rpb24oYyl7cmV0dXJuIGEuY2FsbChiLGMpfTtjYXNlIDI6cmV0dXJuIGZ1bmN0aW9uKGMsZCl7cmV0dXJuIGEuY2FsbChiLGMsZCl9O2Nhc2UgMzpyZXR1cm4gZnVuY3Rpb24oYyxkLGUpe3JldHVybiBhLmNhbGwoYixjLGQsZSl9fXJldHVybiBmdW5jdGlvbigpe3JldHVybiBhLmFwcGx5KGIsYXJndW1lbnRzKX19fSx7XCIuL19hLWZ1bmN0aW9uXCI6Mzd9XSw0MjpbZnVuY3Rpb24oYSxiLGMpe2IuZXhwb3J0cz0hYShcIi4vX2ZhaWxzXCIpKGZ1bmN0aW9uKCl7cmV0dXJuIDchPU9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSxcImFcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIDd9fSkuYX0pfSx7XCIuL19mYWlsc1wiOjQ1fV0sNDM6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiLi9faXMtb2JqZWN0XCIpLGU9YShcIi4vX2dsb2JhbFwiKS5kb2N1bWVudCxmPWQoZSkmJmQoZS5jcmVhdGVFbGVtZW50KTtiLmV4cG9ydHM9ZnVuY3Rpb24oYSl7cmV0dXJuIGY/ZS5jcmVhdGVFbGVtZW50KGEpOnt9fX0se1wiLi9fZ2xvYmFsXCI6NDYsXCIuL19pcy1vYmplY3RcIjo1MX1dLDQ0OltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vX2dsb2JhbFwiKSxlPWEoXCIuL19jb3JlXCIpLGY9YShcIi4vX2N0eFwiKSxnPWEoXCIuL19oaWRlXCIpLGg9XCJwcm90b3R5cGVcIixpPWZ1bmN0aW9uKGEsYixjKXt2YXIgaixrLGwsbT1hJmkuRixuPWEmaS5HLG89YSZpLlMscD1hJmkuUCxxPWEmaS5CLHI9YSZpLlcscz1uP2U6ZVtiXXx8KGVbYl09e30pLHQ9c1toXSx1PW4/ZDpvP2RbYl06KGRbYl18fHt9KVtoXTtuJiYoYz1iKTtmb3IoaiBpbiBjKWs9IW0mJnUmJnZvaWQgMCE9PXVbal0sayYmaiBpbiBzfHwobD1rP3Vbal06Y1tqXSxzW2pdPW4mJlwiZnVuY3Rpb25cIiE9dHlwZW9mIHVbal0/Y1tqXTpxJiZrP2YobCxkKTpyJiZ1W2pdPT1sP2Z1bmN0aW9uKGEpe3ZhciBiPWZ1bmN0aW9uKGIsYyxkKXtpZih0aGlzIGluc3RhbmNlb2YgYSl7c3dpdGNoKGFyZ3VtZW50cy5sZW5ndGgpe2Nhc2UgMDpyZXR1cm4gbmV3IGE7Y2FzZSAxOnJldHVybiBuZXcgYShiKTtjYXNlIDI6cmV0dXJuIG5ldyBhKGIsYyl9cmV0dXJuIG5ldyBhKGIsYyxkKX1yZXR1cm4gYS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9O3JldHVybiBiW2hdPWFbaF0sYn0obCk6cCYmXCJmdW5jdGlvblwiPT10eXBlb2YgbD9mKEZ1bmN0aW9uLmNhbGwsbCk6bCxwJiYoKHMudmlydHVhbHx8KHMudmlydHVhbD17fSkpW2pdPWwsYSZpLlImJnQmJiF0W2pdJiZnKHQsaixsKSkpfTtpLkY9MSxpLkc9MixpLlM9NCxpLlA9OCxpLkI9MTYsaS5XPTMyLGkuVT02NCxpLlI9MTI4LGIuZXhwb3J0cz1pfSx7XCIuL19jb3JlXCI6NDAsXCIuL19jdHhcIjo0MSxcIi4vX2dsb2JhbFwiOjQ2LFwiLi9faGlkZVwiOjQ3fV0sNDU6W2Z1bmN0aW9uKGEsYixjKXtiLmV4cG9ydHM9ZnVuY3Rpb24oYSl7dHJ5e3JldHVybiEhYSgpfWNhdGNoKGIpe3JldHVybiEwfX19LHt9XSw0NjpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWIuZXhwb3J0cz1cInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ3aW5kb3cuTWF0aD09TWF0aD93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJnNlbGYuTWF0aD09TWF0aD9zZWxmOkZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKTtcIm51bWJlclwiPT10eXBlb2YgX19nJiYoX19nPWQpfSx7fV0sNDc6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiLi9fb2JqZWN0LWRwXCIpLGU9YShcIi4vX3Byb3BlcnR5LWRlc2NcIik7Yi5leHBvcnRzPWEoXCIuL19kZXNjcmlwdG9yc1wiKT9mdW5jdGlvbihhLGIsYyl7cmV0dXJuIGQuZihhLGIsZSgxLGMpKX06ZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhW2JdPWMsYX19LHtcIi4vX2Rlc2NyaXB0b3JzXCI6NDIsXCIuL19vYmplY3QtZHBcIjo1MixcIi4vX3Byb3BlcnR5LWRlc2NcIjo1M31dLDQ4OltmdW5jdGlvbihhLGIsYyl7Yi5leHBvcnRzPWEoXCIuL19nbG9iYWxcIikuZG9jdW1lbnQmJmRvY3VtZW50LmRvY3VtZW50RWxlbWVudH0se1wiLi9fZ2xvYmFsXCI6NDZ9XSw0OTpbZnVuY3Rpb24oYSxiLGMpe2IuZXhwb3J0cz0hYShcIi4vX2Rlc2NyaXB0b3JzXCIpJiYhYShcIi4vX2ZhaWxzXCIpKGZ1bmN0aW9uKCl7cmV0dXJuIDchPU9iamVjdC5kZWZpbmVQcm9wZXJ0eShhKFwiLi9fZG9tLWNyZWF0ZVwiKShcImRpdlwiKSxcImFcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIDd9fSkuYX0pfSx7XCIuL19kZXNjcmlwdG9yc1wiOjQyLFwiLi9fZG9tLWNyZWF0ZVwiOjQzLFwiLi9fZmFpbHNcIjo0NX1dLDUwOltmdW5jdGlvbihhLGIsYyl7Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD12b2lkIDA9PT1jO3N3aXRjaChiLmxlbmd0aCl7Y2FzZSAwOnJldHVybiBkP2EoKTphLmNhbGwoYyk7Y2FzZSAxOnJldHVybiBkP2EoYlswXSk6YS5jYWxsKGMsYlswXSk7Y2FzZSAyOnJldHVybiBkP2EoYlswXSxiWzFdKTphLmNhbGwoYyxiWzBdLGJbMV0pO2Nhc2UgMzpyZXR1cm4gZD9hKGJbMF0sYlsxXSxiWzJdKTphLmNhbGwoYyxiWzBdLGJbMV0sYlsyXSk7Y2FzZSA0OnJldHVybiBkP2EoYlswXSxiWzFdLGJbMl0sYlszXSk6YS5jYWxsKGMsYlswXSxiWzFdLGJbMl0sYlszXSl9cmV0dXJuIGEuYXBwbHkoYyxiKX19LHt9XSw1MTpbZnVuY3Rpb24oYSxiLGMpe2IuZXhwb3J0cz1mdW5jdGlvbihhKXtyZXR1cm5cIm9iamVjdFwiPT10eXBlb2YgYT9udWxsIT09YTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBhfX0se31dLDUyOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vX2FuLW9iamVjdFwiKSxlPWEoXCIuL19pZTgtZG9tLWRlZmluZVwiKSxmPWEoXCIuL190by1wcmltaXRpdmVcIiksZz1PYmplY3QuZGVmaW5lUHJvcGVydHk7Yy5mPWEoXCIuL19kZXNjcmlwdG9yc1wiKT9PYmplY3QuZGVmaW5lUHJvcGVydHk6ZnVuY3Rpb24oYSxiLGMpe2lmKGQoYSksYj1mKGIsITApLGQoYyksZSl0cnl7cmV0dXJuIGcoYSxiLGMpfWNhdGNoKGgpe31pZihcImdldFwiaW4gY3x8XCJzZXRcImluIGMpdGhyb3cgVHlwZUVycm9yKFwiQWNjZXNzb3JzIG5vdCBzdXBwb3J0ZWQhXCIpO3JldHVyblwidmFsdWVcImluIGMmJihhW2JdPWMudmFsdWUpLGF9fSx7XCIuL19hbi1vYmplY3RcIjozOCxcIi4vX2Rlc2NyaXB0b3JzXCI6NDIsXCIuL19pZTgtZG9tLWRlZmluZVwiOjQ5LFwiLi9fdG8tcHJpbWl0aXZlXCI6NTV9XSw1MzpbZnVuY3Rpb24oYSxiLGMpe2IuZXhwb3J0cz1mdW5jdGlvbihhLGIpe3JldHVybntlbnVtZXJhYmxlOiEoMSZhKSxjb25maWd1cmFibGU6ISgyJmEpLHdyaXRhYmxlOiEoNCZhKSx2YWx1ZTpifX19LHt9XSw1NDpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGUsZixnPWEoXCIuL19jdHhcIiksaD1hKFwiLi9faW52b2tlXCIpLGk9YShcIi4vX2h0bWxcIiksaj1hKFwiLi9fZG9tLWNyZWF0ZVwiKSxrPWEoXCIuL19nbG9iYWxcIiksbD1rLnByb2Nlc3MsbT1rLnNldEltbWVkaWF0ZSxuPWsuY2xlYXJJbW1lZGlhdGUsbz1rLk1lc3NhZ2VDaGFubmVsLHA9MCxxPXt9LHI9XCJvbnJlYWR5c3RhdGVjaGFuZ2VcIixzPWZ1bmN0aW9uKCl7dmFyIGE9K3RoaXM7aWYocS5oYXNPd25Qcm9wZXJ0eShhKSl7dmFyIGI9cVthXTtkZWxldGUgcVthXSxiKCl9fSx0PWZ1bmN0aW9uKGEpe3MuY2FsbChhLmRhdGEpfTttJiZufHwobT1mdW5jdGlvbihhKXtmb3IodmFyIGI9W10sYz0xO2FyZ3VtZW50cy5sZW5ndGg+YzspYi5wdXNoKGFyZ3VtZW50c1tjKytdKTtyZXR1cm4gcVsrK3BdPWZ1bmN0aW9uKCl7aChcImZ1bmN0aW9uXCI9PXR5cGVvZiBhP2E6RnVuY3Rpb24oYSksYil9LGQocCkscH0sbj1mdW5jdGlvbihhKXtkZWxldGUgcVthXX0sXCJwcm9jZXNzXCI9PWEoXCIuL19jb2ZcIikobCk/ZD1mdW5jdGlvbihhKXtsLm5leHRUaWNrKGcocyxhLDEpKX06bz8oZT1uZXcgbyxmPWUucG9ydDIsZS5wb3J0MS5vbm1lc3NhZ2U9dCxkPWcoZi5wb3N0TWVzc2FnZSxmLDEpKTprLmFkZEV2ZW50TGlzdGVuZXImJlwiZnVuY3Rpb25cIj09dHlwZW9mIHBvc3RNZXNzYWdlJiYhay5pbXBvcnRTY3JpcHRzPyhkPWZ1bmN0aW9uKGEpe2sucG9zdE1lc3NhZ2UoYStcIlwiLFwiKlwiKX0say5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLHQsITEpKTpkPXIgaW4gaihcInNjcmlwdFwiKT9mdW5jdGlvbihhKXtpLmFwcGVuZENoaWxkKGooXCJzY3JpcHRcIikpW3JdPWZ1bmN0aW9uKCl7aS5yZW1vdmVDaGlsZCh0aGlzKSxzLmNhbGwoYSl9fTpmdW5jdGlvbihhKXtzZXRUaW1lb3V0KGcocyxhLDEpLDApfSksYi5leHBvcnRzPXtzZXQ6bSxjbGVhcjpufX0se1wiLi9fY29mXCI6MzksXCIuL19jdHhcIjo0MSxcIi4vX2RvbS1jcmVhdGVcIjo0MyxcIi4vX2dsb2JhbFwiOjQ2LFwiLi9faHRtbFwiOjQ4LFwiLi9faW52b2tlXCI6NTB9XSw1NTpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWEoXCIuL19pcy1vYmplY3RcIik7Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYil7aWYoIWQoYSkpcmV0dXJuIGE7dmFyIGMsZTtpZihiJiZcImZ1bmN0aW9uXCI9PXR5cGVvZihjPWEudG9TdHJpbmcpJiYhZChlPWMuY2FsbChhKSkpcmV0dXJuIGU7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YoYz1hLnZhbHVlT2YpJiYhZChlPWMuY2FsbChhKSkpcmV0dXJuIGU7aWYoIWImJlwiZnVuY3Rpb25cIj09dHlwZW9mKGM9YS50b1N0cmluZykmJiFkKGU9Yy5jYWxsKGEpKSlyZXR1cm4gZTt0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjb252ZXJ0IG9iamVjdCB0byBwcmltaXRpdmUgdmFsdWVcIil9fSx7XCIuL19pcy1vYmplY3RcIjo1MX1dLDU2OltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vX2V4cG9ydFwiKSxlPWEoXCIuL190YXNrXCIpO2QoZC5HK2QuQix7c2V0SW1tZWRpYXRlOmUuc2V0LGNsZWFySW1tZWRpYXRlOmUuY2xlYXJ9KX0se1wiLi9fZXhwb3J0XCI6NDQsXCIuL190YXNrXCI6NTR9XSw1NzpbZnVuY3Rpb24oYSxiLGMpeyhmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBjKCl7az0hMDtmb3IodmFyIGEsYixjPWwubGVuZ3RoO2M7KXtmb3IoYj1sLGw9W10sYT0tMTsrK2E8YzspYlthXSgpO2M9bC5sZW5ndGh9az0hMX1mdW5jdGlvbiBkKGEpezEhPT1sLnB1c2goYSl8fGt8fGUoKX12YXIgZSxmPWEuTXV0YXRpb25PYnNlcnZlcnx8YS5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO2lmKGYpe3ZhciBnPTAsaD1uZXcgZihjKSxpPWEuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7aC5vYnNlcnZlKGkse2NoYXJhY3RlckRhdGE6ITB9KSxlPWZ1bmN0aW9uKCl7aS5kYXRhPWc9KytnJTJ9fWVsc2UgaWYoYS5zZXRJbW1lZGlhdGV8fFwidW5kZWZpbmVkXCI9PXR5cGVvZiBhLk1lc3NhZ2VDaGFubmVsKWU9XCJkb2N1bWVudFwiaW4gYSYmXCJvbnJlYWR5c3RhdGVjaGFuZ2VcImluIGEuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKT9mdW5jdGlvbigpe3ZhciBiPWEuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtiLm9ucmVhZHlzdGF0ZWNoYW5nZT1mdW5jdGlvbigpe2MoKSxiLm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLGIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiKSxiPW51bGx9LGEuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKGIpfTpmdW5jdGlvbigpe3NldFRpbWVvdXQoYywwKX07ZWxzZXt2YXIgaj1uZXcgYS5NZXNzYWdlQ2hhbm5lbDtqLnBvcnQxLm9ubWVzc2FnZT1jLGU9ZnVuY3Rpb24oKXtqLnBvcnQyLnBvc3RNZXNzYWdlKDApfX12YXIgayxsPVtdO2IuZXhwb3J0cz1kfSkuY2FsbCh0aGlzLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV0sNTg6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKCl7fWZ1bmN0aW9uIGUoYSl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO3RoaXMuc3RhdGU9cyx0aGlzLnF1ZXVlPVtdLHRoaXMub3V0Y29tZT12b2lkIDAsYSE9PWQmJmkodGhpcyxhKX1mdW5jdGlvbiBmKGEsYixjKXt0aGlzLnByb21pc2U9YSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBiJiYodGhpcy5vbkZ1bGZpbGxlZD1iLHRoaXMuY2FsbEZ1bGZpbGxlZD10aGlzLm90aGVyQ2FsbEZ1bGZpbGxlZCksXCJmdW5jdGlvblwiPT10eXBlb2YgYyYmKHRoaXMub25SZWplY3RlZD1jLHRoaXMuY2FsbFJlamVjdGVkPXRoaXMub3RoZXJDYWxsUmVqZWN0ZWQpfWZ1bmN0aW9uIGcoYSxiLGMpe28oZnVuY3Rpb24oKXt2YXIgZDt0cnl7ZD1iKGMpfWNhdGNoKGUpe3JldHVybiBwLnJlamVjdChhLGUpfWQ9PT1hP3AucmVqZWN0KGEsbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZXNvbHZlIHByb21pc2Ugd2l0aCBpdHNlbGZcIikpOnAucmVzb2x2ZShhLGQpfSl9ZnVuY3Rpb24gaChhKXt2YXIgYj1hJiZhLnRoZW47aWYoYSYmKFwib2JqZWN0XCI9PXR5cGVvZiBhfHxcImZ1bmN0aW9uXCI9PXR5cGVvZiBhKSYmXCJmdW5jdGlvblwiPT10eXBlb2YgYilyZXR1cm4gZnVuY3Rpb24oKXtiLmFwcGx5KGEsYXJndW1lbnRzKX19ZnVuY3Rpb24gaShhLGIpe2Z1bmN0aW9uIGMoYil7Znx8KGY9ITAscC5yZWplY3QoYSxiKSl9ZnVuY3Rpb24gZChiKXtmfHwoZj0hMCxwLnJlc29sdmUoYSxiKSl9ZnVuY3Rpb24gZSgpe2IoZCxjKX12YXIgZj0hMSxnPWooZSk7XCJlcnJvclwiPT09Zy5zdGF0dXMmJmMoZy52YWx1ZSl9ZnVuY3Rpb24gaihhLGIpe3ZhciBjPXt9O3RyeXtjLnZhbHVlPWEoYiksYy5zdGF0dXM9XCJzdWNjZXNzXCJ9Y2F0Y2goZCl7Yy5zdGF0dXM9XCJlcnJvclwiLGMudmFsdWU9ZH1yZXR1cm4gY31mdW5jdGlvbiBrKGEpe3JldHVybiBhIGluc3RhbmNlb2YgdGhpcz9hOnAucmVzb2x2ZShuZXcgdGhpcyhkKSxhKX1mdW5jdGlvbiBsKGEpe3ZhciBiPW5ldyB0aGlzKGQpO3JldHVybiBwLnJlamVjdChiLGEpfWZ1bmN0aW9uIG0oYSl7ZnVuY3Rpb24gYihhLGIpe2Z1bmN0aW9uIGQoYSl7Z1tiXT1hLCsraCE9PWV8fGZ8fChmPSEwLHAucmVzb2x2ZShqLGcpKX1jLnJlc29sdmUoYSkudGhlbihkLGZ1bmN0aW9uKGEpe2Z8fChmPSEwLHAucmVqZWN0KGosYSkpfSl9dmFyIGM9dGhpcztpZihcIltvYmplY3QgQXJyYXldXCIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJtdXN0IGJlIGFuIGFycmF5XCIpKTt2YXIgZT1hLmxlbmd0aCxmPSExO2lmKCFlKXJldHVybiB0aGlzLnJlc29sdmUoW10pO2Zvcih2YXIgZz1uZXcgQXJyYXkoZSksaD0wLGk9LTEsaj1uZXcgdGhpcyhkKTsrK2k8ZTspYihhW2ldLGkpO3JldHVybiBqfWZ1bmN0aW9uIG4oYSl7ZnVuY3Rpb24gYihhKXtjLnJlc29sdmUoYSkudGhlbihmdW5jdGlvbihhKXtmfHwoZj0hMCxwLnJlc29sdmUoaCxhKSl9LGZ1bmN0aW9uKGEpe2Z8fChmPSEwLHAucmVqZWN0KGgsYSkpfSl9dmFyIGM9dGhpcztpZihcIltvYmplY3QgQXJyYXldXCIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJtdXN0IGJlIGFuIGFycmF5XCIpKTt2YXIgZT1hLmxlbmd0aCxmPSExO2lmKCFlKXJldHVybiB0aGlzLnJlc29sdmUoW10pO2Zvcih2YXIgZz0tMSxoPW5ldyB0aGlzKGQpOysrZzxlOyliKGFbZ10pO3JldHVybiBofXZhciBvPWEoXCJpbW1lZGlhdGVcIikscD17fSxxPVtcIlJFSkVDVEVEXCJdLHI9W1wiRlVMRklMTEVEXCJdLHM9W1wiUEVORElOR1wiXTtiLmV4cG9ydHM9ZSxlLnByb3RvdHlwZVtcImNhdGNoXCJdPWZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLnRoZW4obnVsbCxhKX0sZS5wcm90b3R5cGUudGhlbj1mdW5jdGlvbihhLGIpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGEmJnRoaXMuc3RhdGU9PT1yfHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBiJiZ0aGlzLnN0YXRlPT09cSlyZXR1cm4gdGhpczt2YXIgYz1uZXcgdGhpcy5jb25zdHJ1Y3RvcihkKTtpZih0aGlzLnN0YXRlIT09cyl7dmFyIGU9dGhpcy5zdGF0ZT09PXI/YTpiO2coYyxlLHRoaXMub3V0Y29tZSl9ZWxzZSB0aGlzLnF1ZXVlLnB1c2gobmV3IGYoYyxhLGIpKTtyZXR1cm4gY30sZi5wcm90b3R5cGUuY2FsbEZ1bGZpbGxlZD1mdW5jdGlvbihhKXtwLnJlc29sdmUodGhpcy5wcm9taXNlLGEpfSxmLnByb3RvdHlwZS5vdGhlckNhbGxGdWxmaWxsZWQ9ZnVuY3Rpb24oYSl7Zyh0aGlzLnByb21pc2UsdGhpcy5vbkZ1bGZpbGxlZCxhKX0sZi5wcm90b3R5cGUuY2FsbFJlamVjdGVkPWZ1bmN0aW9uKGEpe3AucmVqZWN0KHRoaXMucHJvbWlzZSxhKX0sZi5wcm90b3R5cGUub3RoZXJDYWxsUmVqZWN0ZWQ9ZnVuY3Rpb24oYSl7Zyh0aGlzLnByb21pc2UsdGhpcy5vblJlamVjdGVkLGEpfSxwLnJlc29sdmU9ZnVuY3Rpb24oYSxiKXt2YXIgYz1qKGgsYik7aWYoXCJlcnJvclwiPT09Yy5zdGF0dXMpcmV0dXJuIHAucmVqZWN0KGEsYy52YWx1ZSk7dmFyIGQ9Yy52YWx1ZTtpZihkKWkoYSxkKTtlbHNle2Euc3RhdGU9cixhLm91dGNvbWU9Yjtmb3IodmFyIGU9LTEsZj1hLnF1ZXVlLmxlbmd0aDsrK2U8ZjspYS5xdWV1ZVtlXS5jYWxsRnVsZmlsbGVkKGIpfXJldHVybiBhfSxwLnJlamVjdD1mdW5jdGlvbihhLGIpe2Euc3RhdGU9cSxhLm91dGNvbWU9Yjtmb3IodmFyIGM9LTEsZD1hLnF1ZXVlLmxlbmd0aDsrK2M8ZDspYS5xdWV1ZVtjXS5jYWxsUmVqZWN0ZWQoYik7cmV0dXJuIGF9LGUucmVzb2x2ZT1rLGUucmVqZWN0PWwsZS5hbGw9bSxlLnJhY2U9bn0se2ltbWVkaWF0ZTo1N31dLDU5OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGQ9YShcIi4vbGliL3V0aWxzL2NvbW1vblwiKS5hc3NpZ24sZT1hKFwiLi9saWIvZGVmbGF0ZVwiKSxmPWEoXCIuL2xpYi9pbmZsYXRlXCIpLGc9YShcIi4vbGliL3psaWIvY29uc3RhbnRzXCIpLGg9e307ZChoLGUsZixnKSxiLmV4cG9ydHM9aH0se1wiLi9saWIvZGVmbGF0ZVwiOjYwLFwiLi9saWIvaW5mbGF0ZVwiOjYxLFwiLi9saWIvdXRpbHMvY29tbW9uXCI6NjIsXCIuL2xpYi96bGliL2NvbnN0YW50c1wiOjY1fV0sNjA6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe2lmKCEodGhpcyBpbnN0YW5jZW9mIGQpKXJldHVybiBuZXcgZChhKTt0aGlzLm9wdGlvbnM9aS5hc3NpZ24oe2xldmVsOnMsbWV0aG9kOnUsY2h1bmtTaXplOjE2Mzg0LHdpbmRvd0JpdHM6MTUsbWVtTGV2ZWw6OCxzdHJhdGVneTp0LHRvOlwiXCJ9LGF8fHt9KTt2YXIgYj10aGlzLm9wdGlvbnM7Yi5yYXcmJmIud2luZG93Qml0cz4wP2Iud2luZG93Qml0cz0tYi53aW5kb3dCaXRzOmIuZ3ppcCYmYi53aW5kb3dCaXRzPjAmJmIud2luZG93Qml0czwxNiYmKGIud2luZG93Qml0cys9MTYpLHRoaXMuZXJyPTAsdGhpcy5tc2c9XCJcIix0aGlzLmVuZGVkPSExLHRoaXMuY2h1bmtzPVtdLHRoaXMuc3RybT1uZXcgbCx0aGlzLnN0cm0uYXZhaWxfb3V0PTA7dmFyIGM9aC5kZWZsYXRlSW5pdDIodGhpcy5zdHJtLGIubGV2ZWwsYi5tZXRob2QsYi53aW5kb3dCaXRzLGIubWVtTGV2ZWwsYi5zdHJhdGVneSk7aWYoYyE9PXApdGhyb3cgbmV3IEVycm9yKGtbY10pO2lmKGIuaGVhZGVyJiZoLmRlZmxhdGVTZXRIZWFkZXIodGhpcy5zdHJtLGIuaGVhZGVyKSxiLmRpY3Rpb25hcnkpe3ZhciBlO2lmKGU9XCJzdHJpbmdcIj09dHlwZW9mIGIuZGljdGlvbmFyeT9qLnN0cmluZzJidWYoYi5kaWN0aW9uYXJ5KTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1tLmNhbGwoYi5kaWN0aW9uYXJ5KT9uZXcgVWludDhBcnJheShiLmRpY3Rpb25hcnkpOmIuZGljdGlvbmFyeSxjPWguZGVmbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLGUpLGMhPT1wKXRocm93IG5ldyBFcnJvcihrW2NdKTt0aGlzLl9kaWN0X3NldD0hMH19ZnVuY3Rpb24gZShhLGIpe3ZhciBjPW5ldyBkKGIpO2lmKGMucHVzaChhLCEwKSxjLmVycil0aHJvdyBjLm1zZ3x8a1tjLmVycl07cmV0dXJuIGMucmVzdWx0fWZ1bmN0aW9uIGYoYSxiKXtyZXR1cm4gYj1ifHx7fSxiLnJhdz0hMCxlKGEsYil9ZnVuY3Rpb24gZyhhLGIpe3JldHVybiBiPWJ8fHt9LGIuZ3ppcD0hMCxlKGEsYil9dmFyIGg9YShcIi4vemxpYi9kZWZsYXRlXCIpLGk9YShcIi4vdXRpbHMvY29tbW9uXCIpLGo9YShcIi4vdXRpbHMvc3RyaW5nc1wiKSxrPWEoXCIuL3psaWIvbWVzc2FnZXNcIiksbD1hKFwiLi96bGliL3pzdHJlYW1cIiksbT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLG49MCxvPTQscD0wLHE9MSxyPTIscz0tMSx0PTAsdT04O2QucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oYSxiKXt2YXIgYyxkLGU9dGhpcy5zdHJtLGY9dGhpcy5vcHRpb25zLmNodW5rU2l6ZTtpZih0aGlzLmVuZGVkKXJldHVybiExO2Q9Yj09PX5+Yj9iOmI9PT0hMD9vOm4sXCJzdHJpbmdcIj09dHlwZW9mIGE/ZS5pbnB1dD1qLnN0cmluZzJidWYoYSk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09bS5jYWxsKGEpP2UuaW5wdXQ9bmV3IFVpbnQ4QXJyYXkoYSk6ZS5pbnB1dD1hLGUubmV4dF9pbj0wLGUuYXZhaWxfaW49ZS5pbnB1dC5sZW5ndGg7ZG97aWYoMD09PWUuYXZhaWxfb3V0JiYoZS5vdXRwdXQ9bmV3IGkuQnVmOChmKSxlLm5leHRfb3V0PTAsZS5hdmFpbF9vdXQ9ZiksYz1oLmRlZmxhdGUoZSxkKSxjIT09cSYmYyE9PXApcmV0dXJuIHRoaXMub25FbmQoYyksdGhpcy5lbmRlZD0hMCwhMTswIT09ZS5hdmFpbF9vdXQmJigwIT09ZS5hdmFpbF9pbnx8ZCE9PW8mJmQhPT1yKXx8KFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5vbkRhdGEoai5idWYyYmluc3RyaW5nKGkuc2hyaW5rQnVmKGUub3V0cHV0LGUubmV4dF9vdXQpKSk6dGhpcy5vbkRhdGEoaS5zaHJpbmtCdWYoZS5vdXRwdXQsZS5uZXh0X291dCkpKX13aGlsZSgoZS5hdmFpbF9pbj4wfHwwPT09ZS5hdmFpbF9vdXQpJiZjIT09cSk7cmV0dXJuIGQ9PT1vPyhjPWguZGVmbGF0ZUVuZCh0aGlzLnN0cm0pLHRoaXMub25FbmQoYyksdGhpcy5lbmRlZD0hMCxjPT09cCk6ZCE9PXJ8fCh0aGlzLm9uRW5kKHApLGUuYXZhaWxfb3V0PTAsITApfSxkLnByb3RvdHlwZS5vbkRhdGE9ZnVuY3Rpb24oYSl7dGhpcy5jaHVua3MucHVzaChhKX0sZC5wcm90b3R5cGUub25FbmQ9ZnVuY3Rpb24oYSl7YT09PXAmJihcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvP3RoaXMucmVzdWx0PXRoaXMuY2h1bmtzLmpvaW4oXCJcIik6dGhpcy5yZXN1bHQ9aS5mbGF0dGVuQ2h1bmtzKHRoaXMuY2h1bmtzKSksdGhpcy5jaHVua3M9W10sdGhpcy5lcnI9YSx0aGlzLm1zZz10aGlzLnN0cm0ubXNnfSxjLkRlZmxhdGU9ZCxjLmRlZmxhdGU9ZSxjLmRlZmxhdGVSYXc9ZixjLmd6aXA9Z30se1wiLi91dGlscy9jb21tb25cIjo2MixcIi4vdXRpbHMvc3RyaW5nc1wiOjYzLFwiLi96bGliL2RlZmxhdGVcIjo2NyxcIi4vemxpYi9tZXNzYWdlc1wiOjcyLFwiLi96bGliL3pzdHJlYW1cIjo3NH1dLDYxOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhKXtpZighKHRoaXMgaW5zdGFuY2VvZiBkKSlyZXR1cm4gbmV3IGQoYSk7dGhpcy5vcHRpb25zPWguYXNzaWduKHtjaHVua1NpemU6MTYzODQsd2luZG93Qml0czowLHRvOlwiXCJ9LGF8fHt9KTt2YXIgYj10aGlzLm9wdGlvbnM7Yi5yYXcmJmIud2luZG93Qml0cz49MCYmYi53aW5kb3dCaXRzPDE2JiYoYi53aW5kb3dCaXRzPS1iLndpbmRvd0JpdHMsMD09PWIud2luZG93Qml0cyYmKGIud2luZG93Qml0cz0tMTUpKSwhKGIud2luZG93Qml0cz49MCYmYi53aW5kb3dCaXRzPDE2KXx8YSYmYS53aW5kb3dCaXRzfHwoYi53aW5kb3dCaXRzKz0zMiksYi53aW5kb3dCaXRzPjE1JiZiLndpbmRvd0JpdHM8NDgmJjA9PT0oMTUmYi53aW5kb3dCaXRzKSYmKGIud2luZG93Qml0c3w9MTUpLHRoaXMuZXJyPTAsdGhpcy5tc2c9XCJcIix0aGlzLmVuZGVkPSExLHRoaXMuY2h1bmtzPVtdLHRoaXMuc3RybT1uZXcgbCx0aGlzLnN0cm0uYXZhaWxfb3V0PTA7dmFyIGM9Zy5pbmZsYXRlSW5pdDIodGhpcy5zdHJtLGIud2luZG93Qml0cyk7aWYoYyE9PWouWl9PSyl0aHJvdyBuZXcgRXJyb3Ioa1tjXSk7dGhpcy5oZWFkZXI9bmV3IG0sZy5pbmZsYXRlR2V0SGVhZGVyKHRoaXMuc3RybSx0aGlzLmhlYWRlcil9ZnVuY3Rpb24gZShhLGIpe3ZhciBjPW5ldyBkKGIpO2lmKGMucHVzaChhLCEwKSxjLmVycil0aHJvdyBjLm1zZ3x8a1tjLmVycl07cmV0dXJuIGMucmVzdWx0fWZ1bmN0aW9uIGYoYSxiKXtyZXR1cm4gYj1ifHx7fSxiLnJhdz0hMCxlKGEsYil9dmFyIGc9YShcIi4vemxpYi9pbmZsYXRlXCIpLGg9YShcIi4vdXRpbHMvY29tbW9uXCIpLGk9YShcIi4vdXRpbHMvc3RyaW5nc1wiKSxqPWEoXCIuL3psaWIvY29uc3RhbnRzXCIpLGs9YShcIi4vemxpYi9tZXNzYWdlc1wiKSxsPWEoXCIuL3psaWIvenN0cmVhbVwiKSxtPWEoXCIuL3psaWIvZ3poZWFkZXJcIiksbj1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO2QucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oYSxiKXt2YXIgYyxkLGUsZixrLGwsbT10aGlzLnN0cm0sbz10aGlzLm9wdGlvbnMuY2h1bmtTaXplLHA9dGhpcy5vcHRpb25zLmRpY3Rpb25hcnkscT0hMTtpZih0aGlzLmVuZGVkKXJldHVybiExO2Q9Yj09PX5+Yj9iOmI9PT0hMD9qLlpfRklOSVNIOmouWl9OT19GTFVTSCxcInN0cmluZ1wiPT10eXBlb2YgYT9tLmlucHV0PWkuYmluc3RyaW5nMmJ1ZihhKTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1uLmNhbGwoYSk/bS5pbnB1dD1uZXcgVWludDhBcnJheShhKTptLmlucHV0PWEsbS5uZXh0X2luPTAsbS5hdmFpbF9pbj1tLmlucHV0Lmxlbmd0aDtkb3tpZigwPT09bS5hdmFpbF9vdXQmJihtLm91dHB1dD1uZXcgaC5CdWY4KG8pLG0ubmV4dF9vdXQ9MCxtLmF2YWlsX291dD1vKSxjPWcuaW5mbGF0ZShtLGouWl9OT19GTFVTSCksYz09PWouWl9ORUVEX0RJQ1QmJnAmJihsPVwic3RyaW5nXCI9PXR5cGVvZiBwP2kuc3RyaW5nMmJ1ZihwKTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1uLmNhbGwocCk/bmV3IFVpbnQ4QXJyYXkocCk6cCxjPWcuaW5mbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLGwpKSxjPT09ai5aX0JVRl9FUlJPUiYmcT09PSEwJiYoYz1qLlpfT0sscT0hMSksYyE9PWouWl9TVFJFQU1fRU5EJiZjIT09ai5aX09LKXJldHVybiB0aGlzLm9uRW5kKGMpLHRoaXMuZW5kZWQ9ITAsITE7bS5uZXh0X291dCYmKDAhPT1tLmF2YWlsX291dCYmYyE9PWouWl9TVFJFQU1fRU5EJiYoMCE9PW0uYXZhaWxfaW58fGQhPT1qLlpfRklOSVNIJiZkIT09ai5aX1NZTkNfRkxVU0gpfHwoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz8oZT1pLnV0Zjhib3JkZXIobS5vdXRwdXQsbS5uZXh0X291dCksZj1tLm5leHRfb3V0LWUsaz1pLmJ1ZjJzdHJpbmcobS5vdXRwdXQsZSksbS5uZXh0X291dD1mLG0uYXZhaWxfb3V0PW8tZixmJiZoLmFycmF5U2V0KG0ub3V0cHV0LG0ub3V0cHV0LGUsZiwwKSx0aGlzLm9uRGF0YShrKSk6dGhpcy5vbkRhdGEoaC5zaHJpbmtCdWYobS5vdXRwdXQsbS5uZXh0X291dCkpKSksMD09PW0uYXZhaWxfaW4mJjA9PT1tLmF2YWlsX291dCYmKHE9ITApfXdoaWxlKChtLmF2YWlsX2luPjB8fDA9PT1tLmF2YWlsX291dCkmJmMhPT1qLlpfU1RSRUFNX0VORCk7cmV0dXJuIGM9PT1qLlpfU1RSRUFNX0VORCYmKGQ9ai5aX0ZJTklTSCksZD09PWouWl9GSU5JU0g/KGM9Zy5pbmZsYXRlRW5kKHRoaXMuc3RybSksdGhpcy5vbkVuZChjKSx0aGlzLmVuZGVkPSEwLGM9PT1qLlpfT0spOmQhPT1qLlpfU1lOQ19GTFVTSHx8KHRoaXMub25FbmQoai5aX09LKSxtLmF2YWlsX291dD0wLCEwKX0sZC5wcm90b3R5cGUub25EYXRhPWZ1bmN0aW9uKGEpe3RoaXMuY2h1bmtzLnB1c2goYSl9LGQucHJvdG90eXBlLm9uRW5kPWZ1bmN0aW9uKGEpe2E9PT1qLlpfT0smJihcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvP3RoaXMucmVzdWx0PXRoaXMuY2h1bmtzLmpvaW4oXCJcIik6dGhpcy5yZXN1bHQ9aC5mbGF0dGVuQ2h1bmtzKHRoaXMuY2h1bmtzKSksdGhpcy5jaHVua3M9W10sdGhpcy5lcnI9YSx0aGlzLm1zZz10aGlzLnN0cm0ubXNnfSxjLkluZmxhdGU9ZCxjLmluZmxhdGU9ZSxjLmluZmxhdGVSYXc9ZixjLnVuZ3ppcD1lfSx7XCIuL3V0aWxzL2NvbW1vblwiOjYyLFwiLi91dGlscy9zdHJpbmdzXCI6NjMsXCIuL3psaWIvY29uc3RhbnRzXCI6NjUsXCIuL3psaWIvZ3poZWFkZXJcIjo2OCxcIi4vemxpYi9pbmZsYXRlXCI6NzAsXCIuL3psaWIvbWVzc2FnZXNcIjo3MixcIi4vemxpYi96c3RyZWFtXCI6NzR9XSw2MjpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO3ZhciBkPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBJbnQzMkFycmF5O2MuYXNzaWduPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSk7Yi5sZW5ndGg7KXt2YXIgYz1iLnNoaWZ0KCk7aWYoYyl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGMpdGhyb3cgbmV3IFR5cGVFcnJvcihjK1wibXVzdCBiZSBub24tb2JqZWN0XCIpO2Zvcih2YXIgZCBpbiBjKWMuaGFzT3duUHJvcGVydHkoZCkmJihhW2RdPWNbZF0pfX1yZXR1cm4gYX0sYy5zaHJpbmtCdWY9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYS5sZW5ndGg9PT1iP2E6YS5zdWJhcnJheT9hLnN1YmFycmF5KDAsYik6KGEubGVuZ3RoPWIsYSl9O3ZhciBlPXthcnJheVNldDpmdW5jdGlvbihhLGIsYyxkLGUpe2lmKGIuc3ViYXJyYXkmJmEuc3ViYXJyYXkpcmV0dXJuIHZvaWQgYS5zZXQoYi5zdWJhcnJheShjLGMrZCksZSk7Zm9yKHZhciBmPTA7ZjxkO2YrKylhW2UrZl09YltjK2ZdfSxmbGF0dGVuQ2h1bmtzOmZ1bmN0aW9uKGEpe3ZhciBiLGMsZCxlLGYsZztmb3IoZD0wLGI9MCxjPWEubGVuZ3RoO2I8YztiKyspZCs9YVtiXS5sZW5ndGg7Zm9yKGc9bmV3IFVpbnQ4QXJyYXkoZCksZT0wLGI9MCxjPWEubGVuZ3RoO2I8YztiKyspZj1hW2JdLGcuc2V0KGYsZSksZSs9Zi5sZW5ndGg7cmV0dXJuIGd9fSxmPXthcnJheVNldDpmdW5jdGlvbihhLGIsYyxkLGUpe2Zvcih2YXIgZj0wO2Y8ZDtmKyspYVtlK2ZdPWJbYytmXX0sZmxhdHRlbkNodW5rczpmdW5jdGlvbihhKXtyZXR1cm5bXS5jb25jYXQuYXBwbHkoW10sYSl9fTtjLnNldFR5cGVkPWZ1bmN0aW9uKGEpe2E/KGMuQnVmOD1VaW50OEFycmF5LGMuQnVmMTY9VWludDE2QXJyYXksYy5CdWYzMj1JbnQzMkFycmF5LGMuYXNzaWduKGMsZSkpOihjLkJ1Zjg9QXJyYXksYy5CdWYxNj1BcnJheSxjLkJ1ZjMyPUFycmF5LGMuYXNzaWduKGMsZikpfSxjLnNldFR5cGVkKGQpfSx7fV0sNjM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7aWYoYjw2NTUzNyYmKGEuc3ViYXJyYXkmJmd8fCFhLnN1YmFycmF5JiZmKSlyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGUuc2hyaW5rQnVmKGEsYikpO2Zvcih2YXIgYz1cIlwiLGQ9MDtkPGI7ZCsrKWMrPVN0cmluZy5mcm9tQ2hhckNvZGUoYVtkXSk7cmV0dXJuIGN9dmFyIGU9YShcIi4vY29tbW9uXCIpLGY9ITAsZz0hMDt0cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLFswXSl9Y2F0Y2goaCl7Zj0hMX10cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLG5ldyBVaW50OEFycmF5KDEpKX1jYXRjaChoKXtnPSExfWZvcih2YXIgaT1uZXcgZS5CdWY4KDI1Niksaj0wO2o8MjU2O2orKylpW2pdPWo+PTI1Mj82Omo+PTI0OD81Omo+PTI0MD80Omo+PTIyND8zOmo+PTE5Mj8yOjE7aVsyNTRdPWlbMjU0XT0xLGMuc3RyaW5nMmJ1Zj1mdW5jdGlvbihhKXt2YXIgYixjLGQsZixnLGg9YS5sZW5ndGgsaT0wO2ZvcihmPTA7ZjxoO2YrKyljPWEuY2hhckNvZGVBdChmKSw1NTI5Nj09PSg2NDUxMiZjKSYmZisxPGgmJihkPWEuY2hhckNvZGVBdChmKzEpLDU2MzIwPT09KDY0NTEyJmQpJiYoYz02NTUzNisoYy01NTI5Njw8MTApKyhkLTU2MzIwKSxmKyspKSxpKz1jPDEyOD8xOmM8MjA0OD8yOmM8NjU1MzY/Mzo0O2ZvcihiPW5ldyBlLkJ1ZjgoaSksZz0wLGY9MDtnPGk7ZisrKWM9YS5jaGFyQ29kZUF0KGYpLDU1Mjk2PT09KDY0NTEyJmMpJiZmKzE8aCYmKGQ9YS5jaGFyQ29kZUF0KGYrMSksNTYzMjA9PT0oNjQ1MTImZCkmJihjPTY1NTM2KyhjLTU1Mjk2PDwxMCkrKGQtNTYzMjApLGYrKykpLGM8MTI4P2JbZysrXT1jOmM8MjA0OD8oYltnKytdPTE5MnxjPj4+NixiW2crK109MTI4fDYzJmMpOmM8NjU1MzY/KGJbZysrXT0yMjR8Yz4+PjEyLGJbZysrXT0xMjh8Yz4+PjYmNjMsYltnKytdPTEyOHw2MyZjKTooYltnKytdPTI0MHxjPj4+MTgsYltnKytdPTEyOHxjPj4+MTImNjMsYltnKytdPTEyOHxjPj4+NiY2MyxiW2crK109MTI4fDYzJmMpO3JldHVybiBifSxjLmJ1ZjJiaW5zdHJpbmc9ZnVuY3Rpb24oYSl7cmV0dXJuIGQoYSxhLmxlbmd0aCl9LGMuYmluc3RyaW5nMmJ1Zj1mdW5jdGlvbihhKXtmb3IodmFyIGI9bmV3IGUuQnVmOChhLmxlbmd0aCksYz0wLGQ9Yi5sZW5ndGg7YzxkO2MrKyliW2NdPWEuY2hhckNvZGVBdChjKTtyZXR1cm4gYn0sYy5idWYyc3RyaW5nPWZ1bmN0aW9uKGEsYil7dmFyIGMsZSxmLGcsaD1ifHxhLmxlbmd0aCxqPW5ldyBBcnJheSgyKmgpO2ZvcihlPTAsYz0wO2M8aDspaWYoZj1hW2MrK10sZjwxMjgpaltlKytdPWY7ZWxzZSBpZihnPWlbZl0sZz40KWpbZSsrXT02NTUzMyxjKz1nLTE7ZWxzZXtmb3IoZiY9Mj09PWc/MzE6Mz09PWc/MTU6NztnPjEmJmM8aDspZj1mPDw2fDYzJmFbYysrXSxnLS07Zz4xP2pbZSsrXT02NTUzMzpmPDY1NTM2P2pbZSsrXT1mOihmLT02NTUzNixqW2UrK109NTUyOTZ8Zj4+MTAmMTAyMyxqW2UrK109NTYzMjB8MTAyMyZmKX1yZXR1cm4gZChqLGUpfSxjLnV0Zjhib3JkZXI9ZnVuY3Rpb24oYSxiKXt2YXIgYztmb3IoYj1ifHxhLmxlbmd0aCxiPmEubGVuZ3RoJiYoYj1hLmxlbmd0aCksYz1iLTE7Yz49MCYmMTI4PT09KDE5MiZhW2NdKTspYy0tO3JldHVybiBjPDA/YjowPT09Yz9iOmMraVthW2NdXT5iP2M6Yn19LHtcIi4vY29tbW9uXCI6NjJ9XSw2NDpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSxiLGMsZCl7Zm9yKHZhciBlPTY1NTM1JmF8MCxmPWE+Pj4xNiY2NTUzNXwwLGc9MDswIT09Yzspe2c9Yz4yZTM/MmUzOmMsYy09ZztkbyBlPWUrYltkKytdfDAsZj1mK2V8MDt3aGlsZSgtLWcpO2UlPTY1NTIxLGYlPTY1NTIxfXJldHVybiBlfGY8PDE2fDA7XG59Yi5leHBvcnRzPWR9LHt9XSw2NTpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2IuZXhwb3J0cz17Wl9OT19GTFVTSDowLFpfUEFSVElBTF9GTFVTSDoxLFpfU1lOQ19GTFVTSDoyLFpfRlVMTF9GTFVTSDozLFpfRklOSVNIOjQsWl9CTE9DSzo1LFpfVFJFRVM6NixaX09LOjAsWl9TVFJFQU1fRU5EOjEsWl9ORUVEX0RJQ1Q6MixaX0VSUk5POi0xLFpfU1RSRUFNX0VSUk9SOi0yLFpfREFUQV9FUlJPUjotMyxaX0JVRl9FUlJPUjotNSxaX05PX0NPTVBSRVNTSU9OOjAsWl9CRVNUX1NQRUVEOjEsWl9CRVNUX0NPTVBSRVNTSU9OOjksWl9ERUZBVUxUX0NPTVBSRVNTSU9OOi0xLFpfRklMVEVSRUQ6MSxaX0hVRkZNQU5fT05MWToyLFpfUkxFOjMsWl9GSVhFRDo0LFpfREVGQVVMVF9TVFJBVEVHWTowLFpfQklOQVJZOjAsWl9URVhUOjEsWl9VTktOT1dOOjIsWl9ERUZMQVRFRDo4fX0se31dLDY2OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe2Zvcih2YXIgYSxiPVtdLGM9MDtjPDI1NjtjKyspe2E9Yztmb3IodmFyIGQ9MDtkPDg7ZCsrKWE9MSZhPzM5ODgyOTIzODReYT4+PjE6YT4+PjE7YltjXT1hfXJldHVybiBifWZ1bmN0aW9uIGUoYSxiLGMsZCl7dmFyIGU9ZixnPWQrYzthXj0tMTtmb3IodmFyIGg9ZDtoPGc7aCsrKWE9YT4+PjheZVsyNTUmKGFeYltoXSldO3JldHVybiBhXi0xfXZhciBmPWQoKTtiLmV4cG9ydHM9ZX0se31dLDY3OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhLGIpe3JldHVybiBhLm1zZz1JW2JdLGJ9ZnVuY3Rpb24gZShhKXtyZXR1cm4oYTw8MSktKGE+ND85OjApfWZ1bmN0aW9uIGYoYSl7Zm9yKHZhciBiPWEubGVuZ3RoOy0tYj49MDspYVtiXT0wfWZ1bmN0aW9uIGcoYSl7dmFyIGI9YS5zdGF0ZSxjPWIucGVuZGluZztjPmEuYXZhaWxfb3V0JiYoYz1hLmF2YWlsX291dCksMCE9PWMmJihFLmFycmF5U2V0KGEub3V0cHV0LGIucGVuZGluZ19idWYsYi5wZW5kaW5nX291dCxjLGEubmV4dF9vdXQpLGEubmV4dF9vdXQrPWMsYi5wZW5kaW5nX291dCs9YyxhLnRvdGFsX291dCs9YyxhLmF2YWlsX291dC09YyxiLnBlbmRpbmctPWMsMD09PWIucGVuZGluZyYmKGIucGVuZGluZ19vdXQ9MCkpfWZ1bmN0aW9uIGgoYSxiKXtGLl90cl9mbHVzaF9ibG9jayhhLGEuYmxvY2tfc3RhcnQ+PTA/YS5ibG9ja19zdGFydDotMSxhLnN0cnN0YXJ0LWEuYmxvY2tfc3RhcnQsYiksYS5ibG9ja19zdGFydD1hLnN0cnN0YXJ0LGcoYS5zdHJtKX1mdW5jdGlvbiBpKGEsYil7YS5wZW5kaW5nX2J1ZlthLnBlbmRpbmcrK109Yn1mdW5jdGlvbiBqKGEsYil7YS5wZW5kaW5nX2J1ZlthLnBlbmRpbmcrK109Yj4+PjgmMjU1LGEucGVuZGluZ19idWZbYS5wZW5kaW5nKytdPTI1NSZifWZ1bmN0aW9uIGsoYSxiLGMsZCl7dmFyIGU9YS5hdmFpbF9pbjtyZXR1cm4gZT5kJiYoZT1kKSwwPT09ZT8wOihhLmF2YWlsX2luLT1lLEUuYXJyYXlTZXQoYixhLmlucHV0LGEubmV4dF9pbixlLGMpLDE9PT1hLnN0YXRlLndyYXA/YS5hZGxlcj1HKGEuYWRsZXIsYixlLGMpOjI9PT1hLnN0YXRlLndyYXAmJihhLmFkbGVyPUgoYS5hZGxlcixiLGUsYykpLGEubmV4dF9pbis9ZSxhLnRvdGFsX2luKz1lLGUpfWZ1bmN0aW9uIGwoYSxiKXt2YXIgYyxkLGU9YS5tYXhfY2hhaW5fbGVuZ3RoLGY9YS5zdHJzdGFydCxnPWEucHJldl9sZW5ndGgsaD1hLm5pY2VfbWF0Y2gsaT1hLnN0cnN0YXJ0PmEud19zaXplLWxhP2Euc3Ryc3RhcnQtKGEud19zaXplLWxhKTowLGo9YS53aW5kb3csaz1hLndfbWFzayxsPWEucHJldixtPWEuc3Ryc3RhcnQra2Esbj1qW2YrZy0xXSxvPWpbZitnXTthLnByZXZfbGVuZ3RoPj1hLmdvb2RfbWF0Y2gmJihlPj49MiksaD5hLmxvb2thaGVhZCYmKGg9YS5sb29rYWhlYWQpO2RvIGlmKGM9YixqW2MrZ109PT1vJiZqW2MrZy0xXT09PW4mJmpbY109PT1qW2ZdJiZqWysrY109PT1qW2YrMV0pe2YrPTIsYysrO2RvO3doaWxlKGpbKytmXT09PWpbKytjXSYmalsrK2ZdPT09alsrK2NdJiZqWysrZl09PT1qWysrY10mJmpbKytmXT09PWpbKytjXSYmalsrK2ZdPT09alsrK2NdJiZqWysrZl09PT1qWysrY10mJmpbKytmXT09PWpbKytjXSYmalsrK2ZdPT09alsrK2NdJiZmPG0pO2lmKGQ9a2EtKG0tZiksZj1tLWthLGQ+Zyl7aWYoYS5tYXRjaF9zdGFydD1iLGc9ZCxkPj1oKWJyZWFrO249altmK2ctMV0sbz1qW2YrZ119fXdoaWxlKChiPWxbYiZrXSk+aSYmMCE9PS0tZSk7cmV0dXJuIGc8PWEubG9va2FoZWFkP2c6YS5sb29rYWhlYWR9ZnVuY3Rpb24gbShhKXt2YXIgYixjLGQsZSxmLGc9YS53X3NpemU7ZG97aWYoZT1hLndpbmRvd19zaXplLWEubG9va2FoZWFkLWEuc3Ryc3RhcnQsYS5zdHJzdGFydD49ZysoZy1sYSkpe0UuYXJyYXlTZXQoYS53aW5kb3csYS53aW5kb3csZyxnLDApLGEubWF0Y2hfc3RhcnQtPWcsYS5zdHJzdGFydC09ZyxhLmJsb2NrX3N0YXJ0LT1nLGM9YS5oYXNoX3NpemUsYj1jO2RvIGQ9YS5oZWFkWy0tYl0sYS5oZWFkW2JdPWQ+PWc/ZC1nOjA7d2hpbGUoLS1jKTtjPWcsYj1jO2RvIGQ9YS5wcmV2Wy0tYl0sYS5wcmV2W2JdPWQ+PWc/ZC1nOjA7d2hpbGUoLS1jKTtlKz1nfWlmKDA9PT1hLnN0cm0uYXZhaWxfaW4pYnJlYWs7aWYoYz1rKGEuc3RybSxhLndpbmRvdyxhLnN0cnN0YXJ0K2EubG9va2FoZWFkLGUpLGEubG9va2FoZWFkKz1jLGEubG9va2FoZWFkK2EuaW5zZXJ0Pj1qYSlmb3IoZj1hLnN0cnN0YXJ0LWEuaW5zZXJ0LGEuaW5zX2g9YS53aW5kb3dbZl0sYS5pbnNfaD0oYS5pbnNfaDw8YS5oYXNoX3NoaWZ0XmEud2luZG93W2YrMV0pJmEuaGFzaF9tYXNrO2EuaW5zZXJ0JiYoYS5pbnNfaD0oYS5pbnNfaDw8YS5oYXNoX3NoaWZ0XmEud2luZG93W2YramEtMV0pJmEuaGFzaF9tYXNrLGEucHJldltmJmEud19tYXNrXT1hLmhlYWRbYS5pbnNfaF0sYS5oZWFkW2EuaW5zX2hdPWYsZisrLGEuaW5zZXJ0LS0sIShhLmxvb2thaGVhZCthLmluc2VydDxqYSkpOyk7fXdoaWxlKGEubG9va2FoZWFkPGxhJiYwIT09YS5zdHJtLmF2YWlsX2luKX1mdW5jdGlvbiBuKGEsYil7dmFyIGM9NjU1MzU7Zm9yKGM+YS5wZW5kaW5nX2J1Zl9zaXplLTUmJihjPWEucGVuZGluZ19idWZfc2l6ZS01KTs7KXtpZihhLmxvb2thaGVhZDw9MSl7aWYobShhKSwwPT09YS5sb29rYWhlYWQmJmI9PT1KKXJldHVybiB1YTtpZigwPT09YS5sb29rYWhlYWQpYnJlYWt9YS5zdHJzdGFydCs9YS5sb29rYWhlYWQsYS5sb29rYWhlYWQ9MDt2YXIgZD1hLmJsb2NrX3N0YXJ0K2M7aWYoKDA9PT1hLnN0cnN0YXJ0fHxhLnN0cnN0YXJ0Pj1kKSYmKGEubG9va2FoZWFkPWEuc3Ryc3RhcnQtZCxhLnN0cnN0YXJ0PWQsaChhLCExKSwwPT09YS5zdHJtLmF2YWlsX291dCkpcmV0dXJuIHVhO2lmKGEuc3Ryc3RhcnQtYS5ibG9ja19zdGFydD49YS53X3NpemUtbGEmJihoKGEsITEpLDA9PT1hLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gdWF9cmV0dXJuIGEuaW5zZXJ0PTAsYj09PU0/KGgoYSwhMCksMD09PWEuc3RybS5hdmFpbF9vdXQ/d2E6eGEpOmEuc3Ryc3RhcnQ+YS5ibG9ja19zdGFydCYmKGgoYSwhMSksMD09PWEuc3RybS5hdmFpbF9vdXQpP3VhOnVhfWZ1bmN0aW9uIG8oYSxiKXtmb3IodmFyIGMsZDs7KXtpZihhLmxvb2thaGVhZDxsYSl7aWYobShhKSxhLmxvb2thaGVhZDxsYSYmYj09PUopcmV0dXJuIHVhO2lmKDA9PT1hLmxvb2thaGVhZClicmVha31pZihjPTAsYS5sb29rYWhlYWQ+PWphJiYoYS5pbnNfaD0oYS5pbnNfaDw8YS5oYXNoX3NoaWZ0XmEud2luZG93W2Euc3Ryc3RhcnQramEtMV0pJmEuaGFzaF9tYXNrLGM9YS5wcmV2W2Euc3Ryc3RhcnQmYS53X21hc2tdPWEuaGVhZFthLmluc19oXSxhLmhlYWRbYS5pbnNfaF09YS5zdHJzdGFydCksMCE9PWMmJmEuc3Ryc3RhcnQtYzw9YS53X3NpemUtbGEmJihhLm1hdGNoX2xlbmd0aD1sKGEsYykpLGEubWF0Y2hfbGVuZ3RoPj1qYSlpZihkPUYuX3RyX3RhbGx5KGEsYS5zdHJzdGFydC1hLm1hdGNoX3N0YXJ0LGEubWF0Y2hfbGVuZ3RoLWphKSxhLmxvb2thaGVhZC09YS5tYXRjaF9sZW5ndGgsYS5tYXRjaF9sZW5ndGg8PWEubWF4X2xhenlfbWF0Y2gmJmEubG9va2FoZWFkPj1qYSl7YS5tYXRjaF9sZW5ndGgtLTtkbyBhLnN0cnN0YXJ0KyssYS5pbnNfaD0oYS5pbnNfaDw8YS5oYXNoX3NoaWZ0XmEud2luZG93W2Euc3Ryc3RhcnQramEtMV0pJmEuaGFzaF9tYXNrLGM9YS5wcmV2W2Euc3Ryc3RhcnQmYS53X21hc2tdPWEuaGVhZFthLmluc19oXSxhLmhlYWRbYS5pbnNfaF09YS5zdHJzdGFydDt3aGlsZSgwIT09LS1hLm1hdGNoX2xlbmd0aCk7YS5zdHJzdGFydCsrfWVsc2UgYS5zdHJzdGFydCs9YS5tYXRjaF9sZW5ndGgsYS5tYXRjaF9sZW5ndGg9MCxhLmluc19oPWEud2luZG93W2Euc3Ryc3RhcnRdLGEuaW5zX2g9KGEuaW5zX2g8PGEuaGFzaF9zaGlmdF5hLndpbmRvd1thLnN0cnN0YXJ0KzFdKSZhLmhhc2hfbWFzaztlbHNlIGQ9Ri5fdHJfdGFsbHkoYSwwLGEud2luZG93W2Euc3Ryc3RhcnRdKSxhLmxvb2thaGVhZC0tLGEuc3Ryc3RhcnQrKztpZihkJiYoaChhLCExKSwwPT09YS5zdHJtLmF2YWlsX291dCkpcmV0dXJuIHVhfXJldHVybiBhLmluc2VydD1hLnN0cnN0YXJ0PGphLTE/YS5zdHJzdGFydDpqYS0xLGI9PT1NPyhoKGEsITApLDA9PT1hLnN0cm0uYXZhaWxfb3V0P3dhOnhhKTphLmxhc3RfbGl0JiYoaChhLCExKSwwPT09YS5zdHJtLmF2YWlsX291dCk/dWE6dmF9ZnVuY3Rpb24gcChhLGIpe2Zvcih2YXIgYyxkLGU7Oyl7aWYoYS5sb29rYWhlYWQ8bGEpe2lmKG0oYSksYS5sb29rYWhlYWQ8bGEmJmI9PT1KKXJldHVybiB1YTtpZigwPT09YS5sb29rYWhlYWQpYnJlYWt9aWYoYz0wLGEubG9va2FoZWFkPj1qYSYmKGEuaW5zX2g9KGEuaW5zX2g8PGEuaGFzaF9zaGlmdF5hLndpbmRvd1thLnN0cnN0YXJ0K2phLTFdKSZhLmhhc2hfbWFzayxjPWEucHJldlthLnN0cnN0YXJ0JmEud19tYXNrXT1hLmhlYWRbYS5pbnNfaF0sYS5oZWFkW2EuaW5zX2hdPWEuc3Ryc3RhcnQpLGEucHJldl9sZW5ndGg9YS5tYXRjaF9sZW5ndGgsYS5wcmV2X21hdGNoPWEubWF0Y2hfc3RhcnQsYS5tYXRjaF9sZW5ndGg9amEtMSwwIT09YyYmYS5wcmV2X2xlbmd0aDxhLm1heF9sYXp5X21hdGNoJiZhLnN0cnN0YXJ0LWM8PWEud19zaXplLWxhJiYoYS5tYXRjaF9sZW5ndGg9bChhLGMpLGEubWF0Y2hfbGVuZ3RoPD01JiYoYS5zdHJhdGVneT09PVV8fGEubWF0Y2hfbGVuZ3RoPT09amEmJmEuc3Ryc3RhcnQtYS5tYXRjaF9zdGFydD40MDk2KSYmKGEubWF0Y2hfbGVuZ3RoPWphLTEpKSxhLnByZXZfbGVuZ3RoPj1qYSYmYS5tYXRjaF9sZW5ndGg8PWEucHJldl9sZW5ndGgpe2U9YS5zdHJzdGFydCthLmxvb2thaGVhZC1qYSxkPUYuX3RyX3RhbGx5KGEsYS5zdHJzdGFydC0xLWEucHJldl9tYXRjaCxhLnByZXZfbGVuZ3RoLWphKSxhLmxvb2thaGVhZC09YS5wcmV2X2xlbmd0aC0xLGEucHJldl9sZW5ndGgtPTI7ZG8rK2Euc3Ryc3RhcnQ8PWUmJihhLmluc19oPShhLmluc19oPDxhLmhhc2hfc2hpZnReYS53aW5kb3dbYS5zdHJzdGFydCtqYS0xXSkmYS5oYXNoX21hc2ssYz1hLnByZXZbYS5zdHJzdGFydCZhLndfbWFza109YS5oZWFkW2EuaW5zX2hdLGEuaGVhZFthLmluc19oXT1hLnN0cnN0YXJ0KTt3aGlsZSgwIT09LS1hLnByZXZfbGVuZ3RoKTtpZihhLm1hdGNoX2F2YWlsYWJsZT0wLGEubWF0Y2hfbGVuZ3RoPWphLTEsYS5zdHJzdGFydCsrLGQmJihoKGEsITEpLDA9PT1hLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gdWF9ZWxzZSBpZihhLm1hdGNoX2F2YWlsYWJsZSl7aWYoZD1GLl90cl90YWxseShhLDAsYS53aW5kb3dbYS5zdHJzdGFydC0xXSksZCYmaChhLCExKSxhLnN0cnN0YXJ0KyssYS5sb29rYWhlYWQtLSwwPT09YS5zdHJtLmF2YWlsX291dClyZXR1cm4gdWF9ZWxzZSBhLm1hdGNoX2F2YWlsYWJsZT0xLGEuc3Ryc3RhcnQrKyxhLmxvb2thaGVhZC0tfXJldHVybiBhLm1hdGNoX2F2YWlsYWJsZSYmKGQ9Ri5fdHJfdGFsbHkoYSwwLGEud2luZG93W2Euc3Ryc3RhcnQtMV0pLGEubWF0Y2hfYXZhaWxhYmxlPTApLGEuaW5zZXJ0PWEuc3Ryc3RhcnQ8amEtMT9hLnN0cnN0YXJ0OmphLTEsYj09PU0/KGgoYSwhMCksMD09PWEuc3RybS5hdmFpbF9vdXQ/d2E6eGEpOmEubGFzdF9saXQmJihoKGEsITEpLDA9PT1hLnN0cm0uYXZhaWxfb3V0KT91YTp2YX1mdW5jdGlvbiBxKGEsYil7Zm9yKHZhciBjLGQsZSxmLGc9YS53aW5kb3c7Oyl7aWYoYS5sb29rYWhlYWQ8PWthKXtpZihtKGEpLGEubG9va2FoZWFkPD1rYSYmYj09PUopcmV0dXJuIHVhO2lmKDA9PT1hLmxvb2thaGVhZClicmVha31pZihhLm1hdGNoX2xlbmd0aD0wLGEubG9va2FoZWFkPj1qYSYmYS5zdHJzdGFydD4wJiYoZT1hLnN0cnN0YXJ0LTEsZD1nW2VdLGQ9PT1nWysrZV0mJmQ9PT1nWysrZV0mJmQ9PT1nWysrZV0pKXtmPWEuc3Ryc3RhcnQra2E7ZG87d2hpbGUoZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZD09PWdbKytlXSYmZTxmKTthLm1hdGNoX2xlbmd0aD1rYS0oZi1lKSxhLm1hdGNoX2xlbmd0aD5hLmxvb2thaGVhZCYmKGEubWF0Y2hfbGVuZ3RoPWEubG9va2FoZWFkKX1pZihhLm1hdGNoX2xlbmd0aD49amE/KGM9Ri5fdHJfdGFsbHkoYSwxLGEubWF0Y2hfbGVuZ3RoLWphKSxhLmxvb2thaGVhZC09YS5tYXRjaF9sZW5ndGgsYS5zdHJzdGFydCs9YS5tYXRjaF9sZW5ndGgsYS5tYXRjaF9sZW5ndGg9MCk6KGM9Ri5fdHJfdGFsbHkoYSwwLGEud2luZG93W2Euc3Ryc3RhcnRdKSxhLmxvb2thaGVhZC0tLGEuc3Ryc3RhcnQrKyksYyYmKGgoYSwhMSksMD09PWEuc3RybS5hdmFpbF9vdXQpKXJldHVybiB1YX1yZXR1cm4gYS5pbnNlcnQ9MCxiPT09TT8oaChhLCEwKSwwPT09YS5zdHJtLmF2YWlsX291dD93YTp4YSk6YS5sYXN0X2xpdCYmKGgoYSwhMSksMD09PWEuc3RybS5hdmFpbF9vdXQpP3VhOnZhfWZ1bmN0aW9uIHIoYSxiKXtmb3IodmFyIGM7Oyl7aWYoMD09PWEubG9va2FoZWFkJiYobShhKSwwPT09YS5sb29rYWhlYWQpKXtpZihiPT09SilyZXR1cm4gdWE7YnJlYWt9aWYoYS5tYXRjaF9sZW5ndGg9MCxjPUYuX3RyX3RhbGx5KGEsMCxhLndpbmRvd1thLnN0cnN0YXJ0XSksYS5sb29rYWhlYWQtLSxhLnN0cnN0YXJ0KyssYyYmKGgoYSwhMSksMD09PWEuc3RybS5hdmFpbF9vdXQpKXJldHVybiB1YX1yZXR1cm4gYS5pbnNlcnQ9MCxiPT09TT8oaChhLCEwKSwwPT09YS5zdHJtLmF2YWlsX291dD93YTp4YSk6YS5sYXN0X2xpdCYmKGgoYSwhMSksMD09PWEuc3RybS5hdmFpbF9vdXQpP3VhOnZhfWZ1bmN0aW9uIHMoYSxiLGMsZCxlKXt0aGlzLmdvb2RfbGVuZ3RoPWEsdGhpcy5tYXhfbGF6eT1iLHRoaXMubmljZV9sZW5ndGg9Yyx0aGlzLm1heF9jaGFpbj1kLHRoaXMuZnVuYz1lfWZ1bmN0aW9uIHQoYSl7YS53aW5kb3dfc2l6ZT0yKmEud19zaXplLGYoYS5oZWFkKSxhLm1heF9sYXp5X21hdGNoPURbYS5sZXZlbF0ubWF4X2xhenksYS5nb29kX21hdGNoPURbYS5sZXZlbF0uZ29vZF9sZW5ndGgsYS5uaWNlX21hdGNoPURbYS5sZXZlbF0ubmljZV9sZW5ndGgsYS5tYXhfY2hhaW5fbGVuZ3RoPURbYS5sZXZlbF0ubWF4X2NoYWluLGEuc3Ryc3RhcnQ9MCxhLmJsb2NrX3N0YXJ0PTAsYS5sb29rYWhlYWQ9MCxhLmluc2VydD0wLGEubWF0Y2hfbGVuZ3RoPWEucHJldl9sZW5ndGg9amEtMSxhLm1hdGNoX2F2YWlsYWJsZT0wLGEuaW5zX2g9MH1mdW5jdGlvbiB1KCl7dGhpcy5zdHJtPW51bGwsdGhpcy5zdGF0dXM9MCx0aGlzLnBlbmRpbmdfYnVmPW51bGwsdGhpcy5wZW5kaW5nX2J1Zl9zaXplPTAsdGhpcy5wZW5kaW5nX291dD0wLHRoaXMucGVuZGluZz0wLHRoaXMud3JhcD0wLHRoaXMuZ3poZWFkPW51bGwsdGhpcy5nemluZGV4PTAsdGhpcy5tZXRob2Q9JCx0aGlzLmxhc3RfZmx1c2g9LTEsdGhpcy53X3NpemU9MCx0aGlzLndfYml0cz0wLHRoaXMud19tYXNrPTAsdGhpcy53aW5kb3c9bnVsbCx0aGlzLndpbmRvd19zaXplPTAsdGhpcy5wcmV2PW51bGwsdGhpcy5oZWFkPW51bGwsdGhpcy5pbnNfaD0wLHRoaXMuaGFzaF9zaXplPTAsdGhpcy5oYXNoX2JpdHM9MCx0aGlzLmhhc2hfbWFzaz0wLHRoaXMuaGFzaF9zaGlmdD0wLHRoaXMuYmxvY2tfc3RhcnQ9MCx0aGlzLm1hdGNoX2xlbmd0aD0wLHRoaXMucHJldl9tYXRjaD0wLHRoaXMubWF0Y2hfYXZhaWxhYmxlPTAsdGhpcy5zdHJzdGFydD0wLHRoaXMubWF0Y2hfc3RhcnQ9MCx0aGlzLmxvb2thaGVhZD0wLHRoaXMucHJldl9sZW5ndGg9MCx0aGlzLm1heF9jaGFpbl9sZW5ndGg9MCx0aGlzLm1heF9sYXp5X21hdGNoPTAsdGhpcy5sZXZlbD0wLHRoaXMuc3RyYXRlZ3k9MCx0aGlzLmdvb2RfbWF0Y2g9MCx0aGlzLm5pY2VfbWF0Y2g9MCx0aGlzLmR5bl9sdHJlZT1uZXcgRS5CdWYxNigyKmhhKSx0aGlzLmR5bl9kdHJlZT1uZXcgRS5CdWYxNigyKigyKmZhKzEpKSx0aGlzLmJsX3RyZWU9bmV3IEUuQnVmMTYoMiooMipnYSsxKSksZih0aGlzLmR5bl9sdHJlZSksZih0aGlzLmR5bl9kdHJlZSksZih0aGlzLmJsX3RyZWUpLHRoaXMubF9kZXNjPW51bGwsdGhpcy5kX2Rlc2M9bnVsbCx0aGlzLmJsX2Rlc2M9bnVsbCx0aGlzLmJsX2NvdW50PW5ldyBFLkJ1ZjE2KGlhKzEpLHRoaXMuaGVhcD1uZXcgRS5CdWYxNigyKmVhKzEpLGYodGhpcy5oZWFwKSx0aGlzLmhlYXBfbGVuPTAsdGhpcy5oZWFwX21heD0wLHRoaXMuZGVwdGg9bmV3IEUuQnVmMTYoMiplYSsxKSxmKHRoaXMuZGVwdGgpLHRoaXMubF9idWY9MCx0aGlzLmxpdF9idWZzaXplPTAsdGhpcy5sYXN0X2xpdD0wLHRoaXMuZF9idWY9MCx0aGlzLm9wdF9sZW49MCx0aGlzLnN0YXRpY19sZW49MCx0aGlzLm1hdGNoZXM9MCx0aGlzLmluc2VydD0wLHRoaXMuYmlfYnVmPTAsdGhpcy5iaV92YWxpZD0wfWZ1bmN0aW9uIHYoYSl7dmFyIGI7cmV0dXJuIGEmJmEuc3RhdGU/KGEudG90YWxfaW49YS50b3RhbF9vdXQ9MCxhLmRhdGFfdHlwZT1aLGI9YS5zdGF0ZSxiLnBlbmRpbmc9MCxiLnBlbmRpbmdfb3V0PTAsYi53cmFwPDAmJihiLndyYXA9LWIud3JhcCksYi5zdGF0dXM9Yi53cmFwP25hOnNhLGEuYWRsZXI9Mj09PWIud3JhcD8wOjEsYi5sYXN0X2ZsdXNoPUosRi5fdHJfaW5pdChiKSxPKTpkKGEsUSl9ZnVuY3Rpb24gdyhhKXt2YXIgYj12KGEpO3JldHVybiBiPT09TyYmdChhLnN0YXRlKSxifWZ1bmN0aW9uIHgoYSxiKXtyZXR1cm4gYSYmYS5zdGF0ZT8yIT09YS5zdGF0ZS53cmFwP1E6KGEuc3RhdGUuZ3poZWFkPWIsTyk6UX1mdW5jdGlvbiB5KGEsYixjLGUsZixnKXtpZighYSlyZXR1cm4gUTt2YXIgaD0xO2lmKGI9PT1UJiYoYj02KSxlPDA/KGg9MCxlPS1lKTplPjE1JiYoaD0yLGUtPTE2KSxmPDF8fGY+X3x8YyE9PSR8fGU8OHx8ZT4xNXx8YjwwfHxiPjl8fGc8MHx8Zz5YKXJldHVybiBkKGEsUSk7OD09PWUmJihlPTkpO3ZhciBpPW5ldyB1O3JldHVybiBhLnN0YXRlPWksaS5zdHJtPWEsaS53cmFwPWgsaS5nemhlYWQ9bnVsbCxpLndfYml0cz1lLGkud19zaXplPTE8PGkud19iaXRzLGkud19tYXNrPWkud19zaXplLTEsaS5oYXNoX2JpdHM9Zis3LGkuaGFzaF9zaXplPTE8PGkuaGFzaF9iaXRzLGkuaGFzaF9tYXNrPWkuaGFzaF9zaXplLTEsaS5oYXNoX3NoaWZ0PX5+KChpLmhhc2hfYml0cytqYS0xKS9qYSksaS53aW5kb3c9bmV3IEUuQnVmOCgyKmkud19zaXplKSxpLmhlYWQ9bmV3IEUuQnVmMTYoaS5oYXNoX3NpemUpLGkucHJldj1uZXcgRS5CdWYxNihpLndfc2l6ZSksaS5saXRfYnVmc2l6ZT0xPDxmKzYsaS5wZW5kaW5nX2J1Zl9zaXplPTQqaS5saXRfYnVmc2l6ZSxpLnBlbmRpbmdfYnVmPW5ldyBFLkJ1ZjgoaS5wZW5kaW5nX2J1Zl9zaXplKSxpLmRfYnVmPTEqaS5saXRfYnVmc2l6ZSxpLmxfYnVmPTMqaS5saXRfYnVmc2l6ZSxpLmxldmVsPWIsaS5zdHJhdGVneT1nLGkubWV0aG9kPWMsdyhhKX1mdW5jdGlvbiB6KGEsYil7cmV0dXJuIHkoYSxiLCQsYWEsYmEsWSl9ZnVuY3Rpb24gQShhLGIpe3ZhciBjLGgsayxsO2lmKCFhfHwhYS5zdGF0ZXx8Yj5OfHxiPDApcmV0dXJuIGE/ZChhLFEpOlE7aWYoaD1hLnN0YXRlLCFhLm91dHB1dHx8IWEuaW5wdXQmJjAhPT1hLmF2YWlsX2lufHxoLnN0YXR1cz09PXRhJiZiIT09TSlyZXR1cm4gZChhLDA9PT1hLmF2YWlsX291dD9TOlEpO2lmKGguc3RybT1hLGM9aC5sYXN0X2ZsdXNoLGgubGFzdF9mbHVzaD1iLGguc3RhdHVzPT09bmEpaWYoMj09PWgud3JhcClhLmFkbGVyPTAsaShoLDMxKSxpKGgsMTM5KSxpKGgsOCksaC5nemhlYWQ/KGkoaCwoaC5nemhlYWQudGV4dD8xOjApKyhoLmd6aGVhZC5oY3JjPzI6MCkrKGguZ3poZWFkLmV4dHJhPzQ6MCkrKGguZ3poZWFkLm5hbWU/ODowKSsoaC5nemhlYWQuY29tbWVudD8xNjowKSksaShoLDI1NSZoLmd6aGVhZC50aW1lKSxpKGgsaC5nemhlYWQudGltZT4+OCYyNTUpLGkoaCxoLmd6aGVhZC50aW1lPj4xNiYyNTUpLGkoaCxoLmd6aGVhZC50aW1lPj4yNCYyNTUpLGkoaCw5PT09aC5sZXZlbD8yOmguc3RyYXRlZ3k+PVZ8fGgubGV2ZWw8Mj80OjApLGkoaCwyNTUmaC5nemhlYWQub3MpLGguZ3poZWFkLmV4dHJhJiZoLmd6aGVhZC5leHRyYS5sZW5ndGgmJihpKGgsMjU1JmguZ3poZWFkLmV4dHJhLmxlbmd0aCksaShoLGguZ3poZWFkLmV4dHJhLmxlbmd0aD4+OCYyNTUpKSxoLmd6aGVhZC5oY3JjJiYoYS5hZGxlcj1IKGEuYWRsZXIsaC5wZW5kaW5nX2J1ZixoLnBlbmRpbmcsMCkpLGguZ3ppbmRleD0wLGguc3RhdHVzPW9hKTooaShoLDApLGkoaCwwKSxpKGgsMCksaShoLDApLGkoaCwwKSxpKGgsOT09PWgubGV2ZWw/MjpoLnN0cmF0ZWd5Pj1WfHxoLmxldmVsPDI/NDowKSxpKGgseWEpLGguc3RhdHVzPXNhKTtlbHNle3ZhciBtPSQrKGgud19iaXRzLTg8PDQpPDw4LG49LTE7bj1oLnN0cmF0ZWd5Pj1WfHxoLmxldmVsPDI/MDpoLmxldmVsPDY/MTo2PT09aC5sZXZlbD8yOjMsbXw9bjw8NiwwIT09aC5zdHJzdGFydCYmKG18PW1hKSxtKz0zMS1tJTMxLGguc3RhdHVzPXNhLGooaCxtKSwwIT09aC5zdHJzdGFydCYmKGooaCxhLmFkbGVyPj4+MTYpLGooaCw2NTUzNSZhLmFkbGVyKSksYS5hZGxlcj0xfWlmKGguc3RhdHVzPT09b2EpaWYoaC5nemhlYWQuZXh0cmEpe2ZvcihrPWgucGVuZGluZztoLmd6aW5kZXg8KDY1NTM1JmguZ3poZWFkLmV4dHJhLmxlbmd0aCkmJihoLnBlbmRpbmchPT1oLnBlbmRpbmdfYnVmX3NpemV8fChoLmd6aGVhZC5oY3JjJiZoLnBlbmRpbmc+ayYmKGEuYWRsZXI9SChhLmFkbGVyLGgucGVuZGluZ19idWYsaC5wZW5kaW5nLWssaykpLGcoYSksaz1oLnBlbmRpbmcsaC5wZW5kaW5nIT09aC5wZW5kaW5nX2J1Zl9zaXplKSk7KWkoaCwyNTUmaC5nemhlYWQuZXh0cmFbaC5nemluZGV4XSksaC5nemluZGV4Kys7aC5nemhlYWQuaGNyYyYmaC5wZW5kaW5nPmsmJihhLmFkbGVyPUgoYS5hZGxlcixoLnBlbmRpbmdfYnVmLGgucGVuZGluZy1rLGspKSxoLmd6aW5kZXg9PT1oLmd6aGVhZC5leHRyYS5sZW5ndGgmJihoLmd6aW5kZXg9MCxoLnN0YXR1cz1wYSl9ZWxzZSBoLnN0YXR1cz1wYTtpZihoLnN0YXR1cz09PXBhKWlmKGguZ3poZWFkLm5hbWUpe2s9aC5wZW5kaW5nO2Rve2lmKGgucGVuZGluZz09PWgucGVuZGluZ19idWZfc2l6ZSYmKGguZ3poZWFkLmhjcmMmJmgucGVuZGluZz5rJiYoYS5hZGxlcj1IKGEuYWRsZXIsaC5wZW5kaW5nX2J1ZixoLnBlbmRpbmctayxrKSksZyhhKSxrPWgucGVuZGluZyxoLnBlbmRpbmc9PT1oLnBlbmRpbmdfYnVmX3NpemUpKXtsPTE7YnJlYWt9bD1oLmd6aW5kZXg8aC5nemhlYWQubmFtZS5sZW5ndGg/MjU1JmguZ3poZWFkLm5hbWUuY2hhckNvZGVBdChoLmd6aW5kZXgrKyk6MCxpKGgsbCl9d2hpbGUoMCE9PWwpO2guZ3poZWFkLmhjcmMmJmgucGVuZGluZz5rJiYoYS5hZGxlcj1IKGEuYWRsZXIsaC5wZW5kaW5nX2J1ZixoLnBlbmRpbmctayxrKSksMD09PWwmJihoLmd6aW5kZXg9MCxoLnN0YXR1cz1xYSl9ZWxzZSBoLnN0YXR1cz1xYTtpZihoLnN0YXR1cz09PXFhKWlmKGguZ3poZWFkLmNvbW1lbnQpe2s9aC5wZW5kaW5nO2Rve2lmKGgucGVuZGluZz09PWgucGVuZGluZ19idWZfc2l6ZSYmKGguZ3poZWFkLmhjcmMmJmgucGVuZGluZz5rJiYoYS5hZGxlcj1IKGEuYWRsZXIsaC5wZW5kaW5nX2J1ZixoLnBlbmRpbmctayxrKSksZyhhKSxrPWgucGVuZGluZyxoLnBlbmRpbmc9PT1oLnBlbmRpbmdfYnVmX3NpemUpKXtsPTE7YnJlYWt9bD1oLmd6aW5kZXg8aC5nemhlYWQuY29tbWVudC5sZW5ndGg/MjU1JmguZ3poZWFkLmNvbW1lbnQuY2hhckNvZGVBdChoLmd6aW5kZXgrKyk6MCxpKGgsbCl9d2hpbGUoMCE9PWwpO2guZ3poZWFkLmhjcmMmJmgucGVuZGluZz5rJiYoYS5hZGxlcj1IKGEuYWRsZXIsaC5wZW5kaW5nX2J1ZixoLnBlbmRpbmctayxrKSksMD09PWwmJihoLnN0YXR1cz1yYSl9ZWxzZSBoLnN0YXR1cz1yYTtpZihoLnN0YXR1cz09PXJhJiYoaC5nemhlYWQuaGNyYz8oaC5wZW5kaW5nKzI+aC5wZW5kaW5nX2J1Zl9zaXplJiZnKGEpLGgucGVuZGluZysyPD1oLnBlbmRpbmdfYnVmX3NpemUmJihpKGgsMjU1JmEuYWRsZXIpLGkoaCxhLmFkbGVyPj44JjI1NSksYS5hZGxlcj0wLGguc3RhdHVzPXNhKSk6aC5zdGF0dXM9c2EpLDAhPT1oLnBlbmRpbmcpe2lmKGcoYSksMD09PWEuYXZhaWxfb3V0KXJldHVybiBoLmxhc3RfZmx1c2g9LTEsT31lbHNlIGlmKDA9PT1hLmF2YWlsX2luJiZlKGIpPD1lKGMpJiZiIT09TSlyZXR1cm4gZChhLFMpO2lmKGguc3RhdHVzPT09dGEmJjAhPT1hLmF2YWlsX2luKXJldHVybiBkKGEsUyk7aWYoMCE9PWEuYXZhaWxfaW58fDAhPT1oLmxvb2thaGVhZHx8YiE9PUomJmguc3RhdHVzIT09dGEpe3ZhciBvPWguc3RyYXRlZ3k9PT1WP3IoaCxiKTpoLnN0cmF0ZWd5PT09Vz9xKGgsYik6RFtoLmxldmVsXS5mdW5jKGgsYik7aWYobyE9PXdhJiZvIT09eGF8fChoLnN0YXR1cz10YSksbz09PXVhfHxvPT09d2EpcmV0dXJuIDA9PT1hLmF2YWlsX291dCYmKGgubGFzdF9mbHVzaD0tMSksTztpZihvPT09dmEmJihiPT09Sz9GLl90cl9hbGlnbihoKTpiIT09TiYmKEYuX3RyX3N0b3JlZF9ibG9jayhoLDAsMCwhMSksYj09PUwmJihmKGguaGVhZCksMD09PWgubG9va2FoZWFkJiYoaC5zdHJzdGFydD0wLGguYmxvY2tfc3RhcnQ9MCxoLmluc2VydD0wKSkpLGcoYSksMD09PWEuYXZhaWxfb3V0KSlyZXR1cm4gaC5sYXN0X2ZsdXNoPS0xLE99cmV0dXJuIGIhPT1NP086aC53cmFwPD0wP1A6KDI9PT1oLndyYXA/KGkoaCwyNTUmYS5hZGxlciksaShoLGEuYWRsZXI+PjgmMjU1KSxpKGgsYS5hZGxlcj4+MTYmMjU1KSxpKGgsYS5hZGxlcj4+MjQmMjU1KSxpKGgsMjU1JmEudG90YWxfaW4pLGkoaCxhLnRvdGFsX2luPj44JjI1NSksaShoLGEudG90YWxfaW4+PjE2JjI1NSksaShoLGEudG90YWxfaW4+PjI0JjI1NSkpOihqKGgsYS5hZGxlcj4+PjE2KSxqKGgsNjU1MzUmYS5hZGxlcikpLGcoYSksaC53cmFwPjAmJihoLndyYXA9LWgud3JhcCksMCE9PWgucGVuZGluZz9POlApfWZ1bmN0aW9uIEIoYSl7dmFyIGI7cmV0dXJuIGEmJmEuc3RhdGU/KGI9YS5zdGF0ZS5zdGF0dXMsYiE9PW5hJiZiIT09b2EmJmIhPT1wYSYmYiE9PXFhJiZiIT09cmEmJmIhPT1zYSYmYiE9PXRhP2QoYSxRKTooYS5zdGF0ZT1udWxsLGI9PT1zYT9kKGEsUik6TykpOlF9ZnVuY3Rpb24gQyhhLGIpe3ZhciBjLGQsZSxnLGgsaSxqLGssbD1iLmxlbmd0aDtpZighYXx8IWEuc3RhdGUpcmV0dXJuIFE7aWYoYz1hLnN0YXRlLGc9Yy53cmFwLDI9PT1nfHwxPT09ZyYmYy5zdGF0dXMhPT1uYXx8Yy5sb29rYWhlYWQpcmV0dXJuIFE7Zm9yKDE9PT1nJiYoYS5hZGxlcj1HKGEuYWRsZXIsYixsLDApKSxjLndyYXA9MCxsPj1jLndfc2l6ZSYmKDA9PT1nJiYoZihjLmhlYWQpLGMuc3Ryc3RhcnQ9MCxjLmJsb2NrX3N0YXJ0PTAsYy5pbnNlcnQ9MCksaz1uZXcgRS5CdWY4KGMud19zaXplKSxFLmFycmF5U2V0KGssYixsLWMud19zaXplLGMud19zaXplLDApLGI9ayxsPWMud19zaXplKSxoPWEuYXZhaWxfaW4saT1hLm5leHRfaW4saj1hLmlucHV0LGEuYXZhaWxfaW49bCxhLm5leHRfaW49MCxhLmlucHV0PWIsbShjKTtjLmxvb2thaGVhZD49amE7KXtkPWMuc3Ryc3RhcnQsZT1jLmxvb2thaGVhZC0oamEtMSk7ZG8gYy5pbnNfaD0oYy5pbnNfaDw8Yy5oYXNoX3NoaWZ0XmMud2luZG93W2QramEtMV0pJmMuaGFzaF9tYXNrLGMucHJldltkJmMud19tYXNrXT1jLmhlYWRbYy5pbnNfaF0sYy5oZWFkW2MuaW5zX2hdPWQsZCsrO3doaWxlKC0tZSk7Yy5zdHJzdGFydD1kLGMubG9va2FoZWFkPWphLTEsbShjKX1yZXR1cm4gYy5zdHJzdGFydCs9Yy5sb29rYWhlYWQsYy5ibG9ja19zdGFydD1jLnN0cnN0YXJ0LGMuaW5zZXJ0PWMubG9va2FoZWFkLGMubG9va2FoZWFkPTAsYy5tYXRjaF9sZW5ndGg9Yy5wcmV2X2xlbmd0aD1qYS0xLGMubWF0Y2hfYXZhaWxhYmxlPTAsYS5uZXh0X2luPWksYS5pbnB1dD1qLGEuYXZhaWxfaW49aCxjLndyYXA9ZyxPfXZhciBELEU9YShcIi4uL3V0aWxzL2NvbW1vblwiKSxGPWEoXCIuL3RyZWVzXCIpLEc9YShcIi4vYWRsZXIzMlwiKSxIPWEoXCIuL2NyYzMyXCIpLEk9YShcIi4vbWVzc2FnZXNcIiksSj0wLEs9MSxMPTMsTT00LE49NSxPPTAsUD0xLFE9LTIsUj0tMyxTPS01LFQ9LTEsVT0xLFY9MixXPTMsWD00LFk9MCxaPTIsJD04LF89OSxhYT0xNSxiYT04LGNhPTI5LGRhPTI1NixlYT1kYSsxK2NhLGZhPTMwLGdhPTE5LGhhPTIqZWErMSxpYT0xNSxqYT0zLGthPTI1OCxsYT1rYStqYSsxLG1hPTMyLG5hPTQyLG9hPTY5LHBhPTczLHFhPTkxLHJhPTEwMyxzYT0xMTMsdGE9NjY2LHVhPTEsdmE9Mix3YT0zLHhhPTQseWE9MztEPVtuZXcgcygwLDAsMCwwLG4pLG5ldyBzKDQsNCw4LDQsbyksbmV3IHMoNCw1LDE2LDgsbyksbmV3IHMoNCw2LDMyLDMyLG8pLG5ldyBzKDQsNCwxNiwxNixwKSxuZXcgcyg4LDE2LDMyLDMyLHApLG5ldyBzKDgsMTYsMTI4LDEyOCxwKSxuZXcgcyg4LDMyLDEyOCwyNTYscCksbmV3IHMoMzIsMTI4LDI1OCwxMDI0LHApLG5ldyBzKDMyLDI1OCwyNTgsNDA5NixwKV0sYy5kZWZsYXRlSW5pdD16LGMuZGVmbGF0ZUluaXQyPXksYy5kZWZsYXRlUmVzZXQ9dyxjLmRlZmxhdGVSZXNldEtlZXA9dixjLmRlZmxhdGVTZXRIZWFkZXI9eCxjLmRlZmxhdGU9QSxjLmRlZmxhdGVFbmQ9QixjLmRlZmxhdGVTZXREaWN0aW9uYXJ5PUMsYy5kZWZsYXRlSW5mbz1cInBha28gZGVmbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NjIsXCIuL2FkbGVyMzJcIjo2NCxcIi4vY3JjMzJcIjo2NixcIi4vbWVzc2FnZXNcIjo3MixcIi4vdHJlZXNcIjo3M31dLDY4OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe3RoaXMudGV4dD0wLHRoaXMudGltZT0wLHRoaXMueGZsYWdzPTAsdGhpcy5vcz0wLHRoaXMuZXh0cmE9bnVsbCx0aGlzLmV4dHJhX2xlbj0wLHRoaXMubmFtZT1cIlwiLHRoaXMuY29tbWVudD1cIlwiLHRoaXMuaGNyYz0wLHRoaXMuZG9uZT0hMX1iLmV4cG9ydHM9ZH0se31dLDY5OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGQ9MzAsZT0xMjtiLmV4cG9ydHM9ZnVuY3Rpb24oYSxiKXt2YXIgYyxmLGcsaCxpLGosayxsLG0sbixvLHAscSxyLHMsdCx1LHYsdyx4LHkseixBLEIsQztjPWEuc3RhdGUsZj1hLm5leHRfaW4sQj1hLmlucHV0LGc9ZisoYS5hdmFpbF9pbi01KSxoPWEubmV4dF9vdXQsQz1hLm91dHB1dCxpPWgtKGItYS5hdmFpbF9vdXQpLGo9aCsoYS5hdmFpbF9vdXQtMjU3KSxrPWMuZG1heCxsPWMud3NpemUsbT1jLndoYXZlLG49Yy53bmV4dCxvPWMud2luZG93LHA9Yy5ob2xkLHE9Yy5iaXRzLHI9Yy5sZW5jb2RlLHM9Yy5kaXN0Y29kZSx0PSgxPDxjLmxlbmJpdHMpLTEsdT0oMTw8Yy5kaXN0Yml0cyktMTthOmRve3E8MTUmJihwKz1CW2YrK108PHEscSs9OCxwKz1CW2YrK108PHEscSs9OCksdj1yW3AmdF07Yjpmb3IoOzspe2lmKHc9dj4+PjI0LHA+Pj49dyxxLT13LHc9dj4+PjE2JjI1NSwwPT09dylDW2grK109NjU1MzUmdjtlbHNle2lmKCEoMTYmdykpe2lmKDA9PT0oNjQmdykpe3Y9clsoNjU1MzUmdikrKHAmKDE8PHcpLTEpXTtjb250aW51ZSBifWlmKDMyJncpe2MubW9kZT1lO2JyZWFrIGF9YS5tc2c9XCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGVcIixjLm1vZGU9ZDticmVhayBhfXg9NjU1MzUmdix3Jj0xNSx3JiYocTx3JiYocCs9QltmKytdPDxxLHErPTgpLHgrPXAmKDE8PHcpLTEscD4+Pj13LHEtPXcpLHE8MTUmJihwKz1CW2YrK108PHEscSs9OCxwKz1CW2YrK108PHEscSs9OCksdj1zW3AmdV07Yzpmb3IoOzspe2lmKHc9dj4+PjI0LHA+Pj49dyxxLT13LHc9dj4+PjE2JjI1NSwhKDE2JncpKXtpZigwPT09KDY0JncpKXt2PXNbKDY1NTM1JnYpKyhwJigxPDx3KS0xKV07Y29udGludWUgY31hLm1zZz1cImludmFsaWQgZGlzdGFuY2UgY29kZVwiLGMubW9kZT1kO2JyZWFrIGF9aWYoeT02NTUzNSZ2LHcmPTE1LHE8dyYmKHArPUJbZisrXTw8cSxxKz04LHE8dyYmKHArPUJbZisrXTw8cSxxKz04KSkseSs9cCYoMTw8dyktMSx5Pmspe2EubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixjLm1vZGU9ZDticmVhayBhfWlmKHA+Pj49dyxxLT13LHc9aC1pLHk+dyl7aWYodz15LXcsdz5tJiZjLnNhbmUpe2EubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixjLm1vZGU9ZDticmVhayBhfWlmKHo9MCxBPW8sMD09PW4pe2lmKHorPWwtdyx3PHgpe3gtPXc7ZG8gQ1toKytdPW9beisrXTt3aGlsZSgtLXcpO3o9aC15LEE9Q319ZWxzZSBpZihuPHcpe2lmKHorPWwrbi13LHctPW4sdzx4KXt4LT13O2RvIENbaCsrXT1vW3orK107d2hpbGUoLS13KTtpZih6PTAsbjx4KXt3PW4seC09dztkbyBDW2grK109b1t6KytdO3doaWxlKC0tdyk7ej1oLXksQT1DfX19ZWxzZSBpZih6Kz1uLXcsdzx4KXt4LT13O2RvIENbaCsrXT1vW3orK107d2hpbGUoLS13KTt6PWgteSxBPUN9Zm9yKDt4PjI7KUNbaCsrXT1BW3orK10sQ1toKytdPUFbeisrXSxDW2grK109QVt6KytdLHgtPTM7eCYmKENbaCsrXT1BW3orK10seD4xJiYoQ1toKytdPUFbeisrXSkpfWVsc2V7ej1oLXk7ZG8gQ1toKytdPUNbeisrXSxDW2grK109Q1t6KytdLENbaCsrXT1DW3orK10seC09Mzt3aGlsZSh4PjIpO3gmJihDW2grK109Q1t6KytdLHg+MSYmKENbaCsrXT1DW3orK10pKX1icmVha319YnJlYWt9fXdoaWxlKGY8ZyYmaDxqKTt4PXE+PjMsZi09eCxxLT14PDwzLHAmPSgxPDxxKS0xLGEubmV4dF9pbj1mLGEubmV4dF9vdXQ9aCxhLmF2YWlsX2luPWY8Zz81KyhnLWYpOjUtKGYtZyksYS5hdmFpbF9vdXQ9aDxqPzI1Nysoai1oKToyNTctKGgtaiksYy5ob2xkPXAsYy5iaXRzPXF9fSx7fV0sNzA6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe3JldHVybihhPj4+MjQmMjU1KSsoYT4+PjgmNjUyODApKygoNjUyODAmYSk8PDgpKygoMjU1JmEpPDwyNCl9ZnVuY3Rpb24gZSgpe3RoaXMubW9kZT0wLHRoaXMubGFzdD0hMSx0aGlzLndyYXA9MCx0aGlzLmhhdmVkaWN0PSExLHRoaXMuZmxhZ3M9MCx0aGlzLmRtYXg9MCx0aGlzLmNoZWNrPTAsdGhpcy50b3RhbD0wLHRoaXMuaGVhZD1udWxsLHRoaXMud2JpdHM9MCx0aGlzLndzaXplPTAsdGhpcy53aGF2ZT0wLHRoaXMud25leHQ9MCx0aGlzLndpbmRvdz1udWxsLHRoaXMuaG9sZD0wLHRoaXMuYml0cz0wLHRoaXMubGVuZ3RoPTAsdGhpcy5vZmZzZXQ9MCx0aGlzLmV4dHJhPTAsdGhpcy5sZW5jb2RlPW51bGwsdGhpcy5kaXN0Y29kZT1udWxsLHRoaXMubGVuYml0cz0wLHRoaXMuZGlzdGJpdHM9MCx0aGlzLm5jb2RlPTAsdGhpcy5ubGVuPTAsdGhpcy5uZGlzdD0wLHRoaXMuaGF2ZT0wLHRoaXMubmV4dD1udWxsLHRoaXMubGVucz1uZXcgcy5CdWYxNigzMjApLHRoaXMud29yaz1uZXcgcy5CdWYxNigyODgpLHRoaXMubGVuZHluPW51bGwsdGhpcy5kaXN0ZHluPW51bGwsdGhpcy5zYW5lPTAsdGhpcy5iYWNrPTAsdGhpcy53YXM9MH1mdW5jdGlvbiBmKGEpe3ZhciBiO3JldHVybiBhJiZhLnN0YXRlPyhiPWEuc3RhdGUsYS50b3RhbF9pbj1hLnRvdGFsX291dD1iLnRvdGFsPTAsYS5tc2c9XCJcIixiLndyYXAmJihhLmFkbGVyPTEmYi53cmFwKSxiLm1vZGU9TCxiLmxhc3Q9MCxiLmhhdmVkaWN0PTAsYi5kbWF4PTMyNzY4LGIuaGVhZD1udWxsLGIuaG9sZD0wLGIuYml0cz0wLGIubGVuY29kZT1iLmxlbmR5bj1uZXcgcy5CdWYzMihwYSksYi5kaXN0Y29kZT1iLmRpc3RkeW49bmV3IHMuQnVmMzIocWEpLGIuc2FuZT0xLGIuYmFjaz0tMSxEKTpHfWZ1bmN0aW9uIGcoYSl7dmFyIGI7cmV0dXJuIGEmJmEuc3RhdGU/KGI9YS5zdGF0ZSxiLndzaXplPTAsYi53aGF2ZT0wLGIud25leHQ9MCxmKGEpKTpHfWZ1bmN0aW9uIGgoYSxiKXt2YXIgYyxkO3JldHVybiBhJiZhLnN0YXRlPyhkPWEuc3RhdGUsYjwwPyhjPTAsYj0tYik6KGM9KGI+PjQpKzEsYjw0OCYmKGImPTE1KSksYiYmKGI8OHx8Yj4xNSk/RzoobnVsbCE9PWQud2luZG93JiZkLndiaXRzIT09YiYmKGQud2luZG93PW51bGwpLGQud3JhcD1jLGQud2JpdHM9YixnKGEpKSk6R31mdW5jdGlvbiBpKGEsYil7dmFyIGMsZDtyZXR1cm4gYT8oZD1uZXcgZSxhLnN0YXRlPWQsZC53aW5kb3c9bnVsbCxjPWgoYSxiKSxjIT09RCYmKGEuc3RhdGU9bnVsbCksYyk6R31mdW5jdGlvbiBqKGEpe3JldHVybiBpKGEsc2EpfWZ1bmN0aW9uIGsoYSl7aWYodGEpe3ZhciBiO2ZvcihxPW5ldyBzLkJ1ZjMyKDUxMikscj1uZXcgcy5CdWYzMigzMiksYj0wO2I8MTQ0OylhLmxlbnNbYisrXT04O2Zvcig7YjwyNTY7KWEubGVuc1tiKytdPTk7Zm9yKDtiPDI4MDspYS5sZW5zW2IrK109Nztmb3IoO2I8Mjg4OylhLmxlbnNbYisrXT04O2Zvcih3KHksYS5sZW5zLDAsMjg4LHEsMCxhLndvcmsse2JpdHM6OX0pLGI9MDtiPDMyOylhLmxlbnNbYisrXT01O3coeixhLmxlbnMsMCwzMixyLDAsYS53b3JrLHtiaXRzOjV9KSx0YT0hMX1hLmxlbmNvZGU9cSxhLmxlbmJpdHM9OSxhLmRpc3Rjb2RlPXIsYS5kaXN0Yml0cz01fWZ1bmN0aW9uIGwoYSxiLGMsZCl7dmFyIGUsZj1hLnN0YXRlO3JldHVybiBudWxsPT09Zi53aW5kb3cmJihmLndzaXplPTE8PGYud2JpdHMsZi53bmV4dD0wLGYud2hhdmU9MCxmLndpbmRvdz1uZXcgcy5CdWY4KGYud3NpemUpKSxkPj1mLndzaXplPyhzLmFycmF5U2V0KGYud2luZG93LGIsYy1mLndzaXplLGYud3NpemUsMCksZi53bmV4dD0wLGYud2hhdmU9Zi53c2l6ZSk6KGU9Zi53c2l6ZS1mLnduZXh0LGU+ZCYmKGU9ZCkscy5hcnJheVNldChmLndpbmRvdyxiLGMtZCxlLGYud25leHQpLGQtPWUsZD8ocy5hcnJheVNldChmLndpbmRvdyxiLGMtZCxkLDApLGYud25leHQ9ZCxmLndoYXZlPWYud3NpemUpOihmLnduZXh0Kz1lLGYud25leHQ9PT1mLndzaXplJiYoZi53bmV4dD0wKSxmLndoYXZlPGYud3NpemUmJihmLndoYXZlKz1lKSkpLDB9ZnVuY3Rpb24gbShhLGIpe3ZhciBjLGUsZixnLGgsaSxqLG0sbixvLHAscSxyLHBhLHFhLHJhLHNhLHRhLHVhLHZhLHdhLHhhLHlhLHphLEFhPTAsQmE9bmV3IHMuQnVmOCg0KSxDYT1bMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV07aWYoIWF8fCFhLnN0YXRlfHwhYS5vdXRwdXR8fCFhLmlucHV0JiYwIT09YS5hdmFpbF9pbilyZXR1cm4gRztjPWEuc3RhdGUsYy5tb2RlPT09VyYmKGMubW9kZT1YKSxoPWEubmV4dF9vdXQsZj1hLm91dHB1dCxqPWEuYXZhaWxfb3V0LGc9YS5uZXh0X2luLGU9YS5pbnB1dCxpPWEuYXZhaWxfaW4sbT1jLmhvbGQsbj1jLmJpdHMsbz1pLHA9aix4YT1EO2E6Zm9yKDs7KXN3aXRjaChjLm1vZGUpe2Nhc2UgTDppZigwPT09Yy53cmFwKXtjLm1vZGU9WDticmVha31mb3IoO248MTY7KXtpZigwPT09aSlicmVhayBhO2ktLSxtKz1lW2crK108PG4sbis9OH1pZigyJmMud3JhcCYmMzU2MTU9PT1tKXtjLmNoZWNrPTAsQmFbMF09MjU1Jm0sQmFbMV09bT4+PjgmMjU1LGMuY2hlY2s9dShjLmNoZWNrLEJhLDIsMCksbT0wLG49MCxjLm1vZGU9TTticmVha31pZihjLmZsYWdzPTAsYy5oZWFkJiYoYy5oZWFkLmRvbmU9ITEpLCEoMSZjLndyYXApfHwoKCgyNTUmbSk8PDgpKyhtPj44KSklMzEpe2EubXNnPVwiaW5jb3JyZWN0IGhlYWRlciBjaGVja1wiLGMubW9kZT1tYTticmVha31pZigoMTUmbSkhPT1LKXthLm1zZz1cInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kXCIsYy5tb2RlPW1hO2JyZWFrfWlmKG0+Pj49NCxuLT00LHdhPSgxNSZtKSs4LDA9PT1jLndiaXRzKWMud2JpdHM9d2E7ZWxzZSBpZih3YT5jLndiaXRzKXthLm1zZz1cImludmFsaWQgd2luZG93IHNpemVcIixjLm1vZGU9bWE7YnJlYWt9Yy5kbWF4PTE8PHdhLGEuYWRsZXI9Yy5jaGVjaz0xLGMubW9kZT01MTImbT9VOlcsbT0wLG49MDticmVhaztjYXNlIE06Zm9yKDtuPDE2Oyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9aWYoYy5mbGFncz1tLCgyNTUmYy5mbGFncykhPT1LKXthLm1zZz1cInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kXCIsYy5tb2RlPW1hO2JyZWFrfWlmKDU3MzQ0JmMuZmxhZ3Mpe2EubXNnPVwidW5rbm93biBoZWFkZXIgZmxhZ3Mgc2V0XCIsYy5tb2RlPW1hO2JyZWFrfWMuaGVhZCYmKGMuaGVhZC50ZXh0PW0+PjgmMSksNTEyJmMuZmxhZ3MmJihCYVswXT0yNTUmbSxCYVsxXT1tPj4+OCYyNTUsYy5jaGVjaz11KGMuY2hlY2ssQmEsMiwwKSksbT0wLG49MCxjLm1vZGU9TjtjYXNlIE46Zm9yKDtuPDMyOyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9Yy5oZWFkJiYoYy5oZWFkLnRpbWU9bSksNTEyJmMuZmxhZ3MmJihCYVswXT0yNTUmbSxCYVsxXT1tPj4+OCYyNTUsQmFbMl09bT4+PjE2JjI1NSxCYVszXT1tPj4+MjQmMjU1LGMuY2hlY2s9dShjLmNoZWNrLEJhLDQsMCkpLG09MCxuPTAsYy5tb2RlPU87Y2FzZSBPOmZvcig7bjwxNjspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWMuaGVhZCYmKGMuaGVhZC54ZmxhZ3M9MjU1Jm0sYy5oZWFkLm9zPW0+PjgpLDUxMiZjLmZsYWdzJiYoQmFbMF09MjU1Jm0sQmFbMV09bT4+PjgmMjU1LGMuY2hlY2s9dShjLmNoZWNrLEJhLDIsMCkpLG09MCxuPTAsYy5tb2RlPVA7Y2FzZSBQOmlmKDEwMjQmYy5mbGFncyl7Zm9yKDtuPDE2Oyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9Yy5sZW5ndGg9bSxjLmhlYWQmJihjLmhlYWQuZXh0cmFfbGVuPW0pLDUxMiZjLmZsYWdzJiYoQmFbMF09MjU1Jm0sQmFbMV09bT4+PjgmMjU1LGMuY2hlY2s9dShjLmNoZWNrLEJhLDIsMCkpLG09MCxuPTB9ZWxzZSBjLmhlYWQmJihjLmhlYWQuZXh0cmE9bnVsbCk7Yy5tb2RlPVE7Y2FzZSBROmlmKDEwMjQmYy5mbGFncyYmKHE9Yy5sZW5ndGgscT5pJiYocT1pKSxxJiYoYy5oZWFkJiYod2E9Yy5oZWFkLmV4dHJhX2xlbi1jLmxlbmd0aCxjLmhlYWQuZXh0cmF8fChjLmhlYWQuZXh0cmE9bmV3IEFycmF5KGMuaGVhZC5leHRyYV9sZW4pKSxzLmFycmF5U2V0KGMuaGVhZC5leHRyYSxlLGcscSx3YSkpLDUxMiZjLmZsYWdzJiYoYy5jaGVjaz11KGMuY2hlY2ssZSxxLGcpKSxpLT1xLGcrPXEsYy5sZW5ndGgtPXEpLGMubGVuZ3RoKSlicmVhayBhO2MubGVuZ3RoPTAsYy5tb2RlPVI7Y2FzZSBSOmlmKDIwNDgmYy5mbGFncyl7aWYoMD09PWkpYnJlYWsgYTtxPTA7ZG8gd2E9ZVtnK3ErK10sYy5oZWFkJiZ3YSYmYy5sZW5ndGg8NjU1MzYmJihjLmhlYWQubmFtZSs9U3RyaW5nLmZyb21DaGFyQ29kZSh3YSkpO3doaWxlKHdhJiZxPGkpO2lmKDUxMiZjLmZsYWdzJiYoYy5jaGVjaz11KGMuY2hlY2ssZSxxLGcpKSxpLT1xLGcrPXEsd2EpYnJlYWsgYX1lbHNlIGMuaGVhZCYmKGMuaGVhZC5uYW1lPW51bGwpO2MubGVuZ3RoPTAsYy5tb2RlPVM7Y2FzZSBTOmlmKDQwOTYmYy5mbGFncyl7aWYoMD09PWkpYnJlYWsgYTtxPTA7ZG8gd2E9ZVtnK3ErK10sYy5oZWFkJiZ3YSYmYy5sZW5ndGg8NjU1MzYmJihjLmhlYWQuY29tbWVudCs9U3RyaW5nLmZyb21DaGFyQ29kZSh3YSkpO3doaWxlKHdhJiZxPGkpO2lmKDUxMiZjLmZsYWdzJiYoYy5jaGVjaz11KGMuY2hlY2ssZSxxLGcpKSxpLT1xLGcrPXEsd2EpYnJlYWsgYX1lbHNlIGMuaGVhZCYmKGMuaGVhZC5jb21tZW50PW51bGwpO2MubW9kZT1UO2Nhc2UgVDppZig1MTImYy5mbGFncyl7Zm9yKDtuPDE2Oyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9aWYobSE9PSg2NTUzNSZjLmNoZWNrKSl7YS5tc2c9XCJoZWFkZXIgY3JjIG1pc21hdGNoXCIsYy5tb2RlPW1hO2JyZWFrfW09MCxuPTB9Yy5oZWFkJiYoYy5oZWFkLmhjcmM9Yy5mbGFncz4+OSYxLGMuaGVhZC5kb25lPSEwKSxhLmFkbGVyPWMuY2hlY2s9MCxjLm1vZGU9VzticmVhaztjYXNlIFU6Zm9yKDtuPDMyOyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9YS5hZGxlcj1jLmNoZWNrPWQobSksbT0wLG49MCxjLm1vZGU9VjtjYXNlIFY6aWYoMD09PWMuaGF2ZWRpY3QpcmV0dXJuIGEubmV4dF9vdXQ9aCxhLmF2YWlsX291dD1qLGEubmV4dF9pbj1nLGEuYXZhaWxfaW49aSxjLmhvbGQ9bSxjLmJpdHM9bixGO2EuYWRsZXI9Yy5jaGVjaz0xLGMubW9kZT1XO2Nhc2UgVzppZihiPT09Qnx8Yj09PUMpYnJlYWsgYTtjYXNlIFg6aWYoYy5sYXN0KXttPj4+PTcmbixuLT03Jm4sYy5tb2RlPWphO2JyZWFrfWZvcig7bjwzOyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9c3dpdGNoKGMubGFzdD0xJm0sbT4+Pj0xLG4tPTEsMyZtKXtjYXNlIDA6Yy5tb2RlPVk7YnJlYWs7Y2FzZSAxOmlmKGsoYyksYy5tb2RlPWNhLGI9PT1DKXttPj4+PTIsbi09MjticmVhayBhfWJyZWFrO2Nhc2UgMjpjLm1vZGU9XzticmVhaztjYXNlIDM6YS5tc2c9XCJpbnZhbGlkIGJsb2NrIHR5cGVcIixjLm1vZGU9bWF9bT4+Pj0yLG4tPTI7YnJlYWs7Y2FzZSBZOmZvcihtPj4+PTcmbixuLT03Jm47bjwzMjspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWlmKCg2NTUzNSZtKSE9PShtPj4+MTZeNjU1MzUpKXthLm1zZz1cImludmFsaWQgc3RvcmVkIGJsb2NrIGxlbmd0aHNcIixjLm1vZGU9bWE7YnJlYWt9aWYoYy5sZW5ndGg9NjU1MzUmbSxtPTAsbj0wLGMubW9kZT1aLGI9PT1DKWJyZWFrIGE7Y2FzZSBaOmMubW9kZT0kO2Nhc2UgJDppZihxPWMubGVuZ3RoKXtpZihxPmkmJihxPWkpLHE+aiYmKHE9aiksMD09PXEpYnJlYWsgYTtzLmFycmF5U2V0KGYsZSxnLHEsaCksaS09cSxnKz1xLGotPXEsaCs9cSxjLmxlbmd0aC09cTticmVha31jLm1vZGU9VzticmVhaztjYXNlIF86Zm9yKDtuPDE0Oyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9aWYoYy5ubGVuPSgzMSZtKSsyNTcsbT4+Pj01LG4tPTUsYy5uZGlzdD0oMzEmbSkrMSxtPj4+PTUsbi09NSxjLm5jb2RlPSgxNSZtKSs0LG0+Pj49NCxuLT00LGMubmxlbj4yODZ8fGMubmRpc3Q+MzApe2EubXNnPVwidG9vIG1hbnkgbGVuZ3RoIG9yIGRpc3RhbmNlIHN5bWJvbHNcIixjLm1vZGU9bWE7YnJlYWt9Yy5oYXZlPTAsYy5tb2RlPWFhO2Nhc2UgYWE6Zm9yKDtjLmhhdmU8Yy5uY29kZTspe2Zvcig7bjwzOyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9Yy5sZW5zW0NhW2MuaGF2ZSsrXV09NyZtLG0+Pj49MyxuLT0zfWZvcig7Yy5oYXZlPDE5OyljLmxlbnNbQ2FbYy5oYXZlKytdXT0wO2lmKGMubGVuY29kZT1jLmxlbmR5bixjLmxlbmJpdHM9Nyx5YT17Yml0czpjLmxlbmJpdHN9LHhhPXcoeCxjLmxlbnMsMCwxOSxjLmxlbmNvZGUsMCxjLndvcmsseWEpLGMubGVuYml0cz15YS5iaXRzLHhhKXthLm1zZz1cImludmFsaWQgY29kZSBsZW5ndGhzIHNldFwiLGMubW9kZT1tYTticmVha31jLmhhdmU9MCxjLm1vZGU9YmE7Y2FzZSBiYTpmb3IoO2MuaGF2ZTxjLm5sZW4rYy5uZGlzdDspe2Zvcig7QWE9Yy5sZW5jb2RlW20mKDE8PGMubGVuYml0cyktMV0scWE9QWE+Pj4yNCxyYT1BYT4+PjE2JjI1NSxzYT02NTUzNSZBYSwhKHFhPD1uKTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWlmKHNhPDE2KW0+Pj49cWEsbi09cWEsYy5sZW5zW2MuaGF2ZSsrXT1zYTtlbHNle2lmKDE2PT09c2Epe2Zvcih6YT1xYSsyO248emE7KXtpZigwPT09aSlicmVhayBhO2ktLSxtKz1lW2crK108PG4sbis9OH1pZihtPj4+PXFhLG4tPXFhLDA9PT1jLmhhdmUpe2EubXNnPVwiaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdFwiLGMubW9kZT1tYTticmVha313YT1jLmxlbnNbYy5oYXZlLTFdLHE9MysoMyZtKSxtPj4+PTIsbi09Mn1lbHNlIGlmKDE3PT09c2Epe2Zvcih6YT1xYSszO248emE7KXtpZigwPT09aSlicmVhayBhO2ktLSxtKz1lW2crK108PG4sbis9OH1tPj4+PXFhLG4tPXFhLHdhPTAscT0zKyg3Jm0pLG0+Pj49MyxuLT0zfWVsc2V7Zm9yKHphPXFhKzc7bjx6YTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fW0+Pj49cWEsbi09cWEsd2E9MCxxPTExKygxMjcmbSksbT4+Pj03LG4tPTd9aWYoYy5oYXZlK3E+Yy5ubGVuK2MubmRpc3Qpe2EubXNnPVwiaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdFwiLGMubW9kZT1tYTticmVha31mb3IoO3EtLTspYy5sZW5zW2MuaGF2ZSsrXT13YX19aWYoYy5tb2RlPT09bWEpYnJlYWs7aWYoMD09PWMubGVuc1syNTZdKXthLm1zZz1cImludmFsaWQgY29kZSAtLSBtaXNzaW5nIGVuZC1vZi1ibG9ja1wiLGMubW9kZT1tYTticmVha31pZihjLmxlbmJpdHM9OSx5YT17Yml0czpjLmxlbmJpdHN9LHhhPXcoeSxjLmxlbnMsMCxjLm5sZW4sYy5sZW5jb2RlLDAsYy53b3JrLHlhKSxjLmxlbmJpdHM9eWEuYml0cyx4YSl7YS5tc2c9XCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RocyBzZXRcIixjLm1vZGU9bWE7YnJlYWt9aWYoYy5kaXN0Yml0cz02LGMuZGlzdGNvZGU9Yy5kaXN0ZHluLHlhPXtiaXRzOmMuZGlzdGJpdHN9LHhhPXcoeixjLmxlbnMsYy5ubGVuLGMubmRpc3QsYy5kaXN0Y29kZSwwLGMud29yayx5YSksYy5kaXN0Yml0cz15YS5iaXRzLHhhKXthLm1zZz1cImludmFsaWQgZGlzdGFuY2VzIHNldFwiLGMubW9kZT1tYTticmVha31pZihjLm1vZGU9Y2EsYj09PUMpYnJlYWsgYTtjYXNlIGNhOmMubW9kZT1kYTtjYXNlIGRhOmlmKGk+PTYmJmo+PTI1OCl7YS5uZXh0X291dD1oLGEuYXZhaWxfb3V0PWosYS5uZXh0X2luPWcsYS5hdmFpbF9pbj1pLGMuaG9sZD1tLGMuYml0cz1uLHYoYSxwKSxoPWEubmV4dF9vdXQsZj1hLm91dHB1dCxqPWEuYXZhaWxfb3V0LGc9YS5uZXh0X2luLGU9YS5pbnB1dCxpPWEuYXZhaWxfaW4sbT1jLmhvbGQsbj1jLmJpdHMsYy5tb2RlPT09VyYmKGMuYmFjaz0tMSk7YnJlYWt9Zm9yKGMuYmFjaz0wO0FhPWMubGVuY29kZVttJigxPDxjLmxlbmJpdHMpLTFdLHFhPUFhPj4+MjQscmE9QWE+Pj4xNiYyNTUsc2E9NjU1MzUmQWEsIShxYTw9bik7KXtpZigwPT09aSlicmVhayBhO2ktLSxtKz1lW2crK108PG4sbis9OH1pZihyYSYmMD09PSgyNDAmcmEpKXtmb3IodGE9cWEsdWE9cmEsdmE9c2E7QWE9Yy5sZW5jb2RlW3ZhKygobSYoMTw8dGErdWEpLTEpPj50YSldLHFhPUFhPj4+MjQscmE9QWE+Pj4xNiYyNTUsc2E9NjU1MzUmQWEsISh0YStxYTw9bik7KXtpZigwPT09aSlicmVhayBhO2ktLSxtKz1lW2crK108PG4sbis9OH1tPj4+PXRhLG4tPXRhLGMuYmFjays9dGF9aWYobT4+Pj1xYSxuLT1xYSxjLmJhY2srPXFhLGMubGVuZ3RoPXNhLDA9PT1yYSl7Yy5tb2RlPWlhO2JyZWFrfWlmKDMyJnJhKXtjLmJhY2s9LTEsYy5tb2RlPVc7YnJlYWt9aWYoNjQmcmEpe2EubXNnPVwiaW52YWxpZCBsaXRlcmFsL2xlbmd0aCBjb2RlXCIsYy5tb2RlPW1hO2JyZWFrfWMuZXh0cmE9MTUmcmEsYy5tb2RlPWVhO2Nhc2UgZWE6aWYoYy5leHRyYSl7Zm9yKHphPWMuZXh0cmE7bjx6YTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWMubGVuZ3RoKz1tJigxPDxjLmV4dHJhKS0xLG0+Pj49Yy5leHRyYSxuLT1jLmV4dHJhLGMuYmFjays9Yy5leHRyYX1jLndhcz1jLmxlbmd0aCxjLm1vZGU9ZmE7Y2FzZSBmYTpmb3IoO0FhPWMuZGlzdGNvZGVbbSYoMTw8Yy5kaXN0Yml0cyktMV0scWE9QWE+Pj4yNCxyYT1BYT4+PjE2JjI1NSxzYT02NTUzNSZBYSwhKHFhPD1uKTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWlmKDA9PT0oMjQwJnJhKSl7Zm9yKHRhPXFhLHVhPXJhLHZhPXNhO0FhPWMuZGlzdGNvZGVbdmErKChtJigxPDx0YSt1YSktMSk+PnRhKV0scWE9QWE+Pj4yNCxyYT1BYT4+PjE2JjI1NSxzYT02NTUzNSZBYSwhKHRhK3FhPD1uKTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fW0+Pj49dGEsbi09dGEsYy5iYWNrKz10YX1pZihtPj4+PXFhLG4tPXFhLGMuYmFjays9cWEsNjQmcmEpe2EubXNnPVwiaW52YWxpZCBkaXN0YW5jZSBjb2RlXCIsYy5tb2RlPW1hO2JyZWFrfWMub2Zmc2V0PXNhLGMuZXh0cmE9MTUmcmEsYy5tb2RlPWdhO2Nhc2UgZ2E6aWYoYy5leHRyYSl7Zm9yKHphPWMuZXh0cmE7bjx6YTspe2lmKDA9PT1pKWJyZWFrIGE7aS0tLG0rPWVbZysrXTw8bixuKz04fWMub2Zmc2V0Kz1tJigxPDxjLmV4dHJhKS0xLG0+Pj49Yy5leHRyYSxuLT1jLmV4dHJhLGMuYmFjays9Yy5leHRyYX1pZihjLm9mZnNldD5jLmRtYXgpe2EubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixjLm1vZGU9bWE7YnJlYWt9Yy5tb2RlPWhhO2Nhc2UgaGE6aWYoMD09PWopYnJlYWsgYTtpZihxPXAtaixjLm9mZnNldD5xKXtpZihxPWMub2Zmc2V0LXEscT5jLndoYXZlJiZjLnNhbmUpe2EubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixjLm1vZGU9bWE7YnJlYWt9cT5jLnduZXh0PyhxLT1jLnduZXh0LHI9Yy53c2l6ZS1xKTpyPWMud25leHQtcSxxPmMubGVuZ3RoJiYocT1jLmxlbmd0aCkscGE9Yy53aW5kb3d9ZWxzZSBwYT1mLHI9aC1jLm9mZnNldCxxPWMubGVuZ3RoO3E+aiYmKHE9aiksai09cSxjLmxlbmd0aC09cTtkbyBmW2grK109cGFbcisrXTt3aGlsZSgtLXEpOzA9PT1jLmxlbmd0aCYmKGMubW9kZT1kYSk7YnJlYWs7Y2FzZSBpYTppZigwPT09ailicmVhayBhO2ZbaCsrXT1jLmxlbmd0aCxqLS0sYy5tb2RlPWRhO2JyZWFrO2Nhc2UgamE6aWYoYy53cmFwKXtmb3IoO248MzI7KXtpZigwPT09aSlicmVhayBhO2ktLSxtfD1lW2crK108PG4sbis9OH1pZihwLT1qLGEudG90YWxfb3V0Kz1wLGMudG90YWwrPXAscCYmKGEuYWRsZXI9Yy5jaGVjaz1jLmZsYWdzP3UoYy5jaGVjayxmLHAsaC1wKTp0KGMuY2hlY2ssZixwLGgtcCkpLHA9aiwoYy5mbGFncz9tOmQobSkpIT09Yy5jaGVjayl7YS5tc2c9XCJpbmNvcnJlY3QgZGF0YSBjaGVja1wiLGMubW9kZT1tYTticmVha31tPTAsbj0wfWMubW9kZT1rYTtjYXNlIGthOmlmKGMud3JhcCYmYy5mbGFncyl7Zm9yKDtuPDMyOyl7aWYoMD09PWkpYnJlYWsgYTtpLS0sbSs9ZVtnKytdPDxuLG4rPTh9aWYobSE9PSg0Mjk0OTY3Mjk1JmMudG90YWwpKXthLm1zZz1cImluY29ycmVjdCBsZW5ndGggY2hlY2tcIixjLm1vZGU9bWE7YnJlYWt9bT0wLG49MH1jLm1vZGU9bGE7Y2FzZSBsYTp4YT1FO2JyZWFrIGE7Y2FzZSBtYTp4YT1IO2JyZWFrIGE7Y2FzZSBuYTpyZXR1cm4gSTtjYXNlIG9hOmRlZmF1bHQ6cmV0dXJuIEd9cmV0dXJuIGEubmV4dF9vdXQ9aCxhLmF2YWlsX291dD1qLGEubmV4dF9pbj1nLGEuYXZhaWxfaW49aSxjLmhvbGQ9bSxjLmJpdHM9biwoYy53c2l6ZXx8cCE9PWEuYXZhaWxfb3V0JiZjLm1vZGU8bWEmJihjLm1vZGU8amF8fGIhPT1BKSkmJmwoYSxhLm91dHB1dCxhLm5leHRfb3V0LHAtYS5hdmFpbF9vdXQpPyhjLm1vZGU9bmEsSSk6KG8tPWEuYXZhaWxfaW4scC09YS5hdmFpbF9vdXQsYS50b3RhbF9pbis9byxhLnRvdGFsX291dCs9cCxjLnRvdGFsKz1wLGMud3JhcCYmcCYmKGEuYWRsZXI9Yy5jaGVjaz1jLmZsYWdzP3UoYy5jaGVjayxmLHAsYS5uZXh0X291dC1wKTp0KGMuY2hlY2ssZixwLGEubmV4dF9vdXQtcCkpLGEuZGF0YV90eXBlPWMuYml0cysoYy5sYXN0PzY0OjApKyhjLm1vZGU9PT1XPzEyODowKSsoYy5tb2RlPT09Y2F8fGMubW9kZT09PVo/MjU2OjApLCgwPT09byYmMD09PXB8fGI9PT1BKSYmeGE9PT1EJiYoeGE9SikseGEpfWZ1bmN0aW9uIG4oYSl7aWYoIWF8fCFhLnN0YXRlKXJldHVybiBHO3ZhciBiPWEuc3RhdGU7cmV0dXJuIGIud2luZG93JiYoYi53aW5kb3c9bnVsbCksYS5zdGF0ZT1udWxsLER9ZnVuY3Rpb24gbyhhLGIpe3ZhciBjO3JldHVybiBhJiZhLnN0YXRlPyhjPWEuc3RhdGUsMD09PSgyJmMud3JhcCk/RzooYy5oZWFkPWIsYi5kb25lPSExLEQpKTpHfWZ1bmN0aW9uIHAoYSxiKXt2YXIgYyxkLGUsZj1iLmxlbmd0aDtyZXR1cm4gYSYmYS5zdGF0ZT8oYz1hLnN0YXRlLDAhPT1jLndyYXAmJmMubW9kZSE9PVY/RzpjLm1vZGU9PT1WJiYoZD0xLGQ9dChkLGIsZiwwKSxkIT09Yy5jaGVjayk/SDooZT1sKGEsYixmLGYpKT8oYy5tb2RlPW5hLEkpOihjLmhhdmVkaWN0PTEsRCkpOkd9dmFyIHEscixzPWEoXCIuLi91dGlscy9jb21tb25cIiksdD1hKFwiLi9hZGxlcjMyXCIpLHU9YShcIi4vY3JjMzJcIiksdj1hKFwiLi9pbmZmYXN0XCIpLHc9YShcIi4vaW5mdHJlZXNcIikseD0wLHk9MSx6PTIsQT00LEI9NSxDPTYsRD0wLEU9MSxGPTIsRz0tMixIPS0zLEk9LTQsSj0tNSxLPTgsTD0xLE09MixOPTMsTz00LFA9NSxRPTYsUj03LFM9OCxUPTksVT0xMCxWPTExLFc9MTIsWD0xMyxZPTE0LFo9MTUsJD0xNixfPTE3LGFhPTE4LGJhPTE5LGNhPTIwLGRhPTIxLGVhPTIyLGZhPTIzLGdhPTI0LGhhPTI1LGlhPTI2LGphPTI3LGthPTI4LGxhPTI5LG1hPTMwLG5hPTMxLG9hPTMyLHBhPTg1MixxYT01OTIscmE9MTUsc2E9cmEsdGE9ITA7Yy5pbmZsYXRlUmVzZXQ9ZyxjLmluZmxhdGVSZXNldDI9aCxjLmluZmxhdGVSZXNldEtlZXA9ZixjLmluZmxhdGVJbml0PWosYy5pbmZsYXRlSW5pdDI9aSxjLmluZmxhdGU9bSxjLmluZmxhdGVFbmQ9bixjLmluZmxhdGVHZXRIZWFkZXI9byxjLmluZmxhdGVTZXREaWN0aW9uYXJ5PXAsYy5pbmZsYXRlSW5mbz1cInBha28gaW5mbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NjIsXCIuL2FkbGVyMzJcIjo2NCxcIi4vY3JjMzJcIjo2NixcIi4vaW5mZmFzdFwiOjY5LFwiLi9pbmZ0cmVlc1wiOjcxfV0sNzE6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjt2YXIgZD1hKFwiLi4vdXRpbHMvY29tbW9uXCIpLGU9MTUsZj04NTIsZz01OTIsaD0wLGk9MSxqPTIsaz1bMyw0LDUsNiw3LDgsOSwxMCwxMSwxMywxNSwxNywxOSwyMywyNywzMSwzNSw0Myw1MSw1OSw2Nyw4Myw5OSwxMTUsMTMxLDE2MywxOTUsMjI3LDI1OCwwLDBdLGw9WzE2LDE2LDE2LDE2LDE2LDE2LDE2LDE2LDE3LDE3LDE3LDE3LDE4LDE4LDE4LDE4LDE5LDE5LDE5LDE5LDIwLDIwLDIwLDIwLDIxLDIxLDIxLDIxLDE2LDcyLDc4XSxtPVsxLDIsMyw0LDUsNyw5LDEzLDE3LDI1LDMzLDQ5LDY1LDk3LDEyOSwxOTMsMjU3LDM4NSw1MTMsNzY5LDEwMjUsMTUzNywyMDQ5LDMwNzMsNDA5Nyw2MTQ1LDgxOTMsMTIyODksMTYzODUsMjQ1NzcsMCwwXSxuPVsxNiwxNiwxNiwxNiwxNywxNywxOCwxOCwxOSwxOSwyMCwyMCwyMSwyMSwyMiwyMiwyMywyMywyNCwyNCwyNSwyNSwyNiwyNiwyNywyNywyOCwyOCwyOSwyOSw2NCw2NF07Yi5leHBvcnRzPWZ1bmN0aW9uKGEsYixjLG8scCxxLHIscyl7dmFyIHQsdSx2LHcseCx5LHosQSxCLEM9cy5iaXRzLEQ9MCxFPTAsRj0wLEc9MCxIPTAsST0wLEo9MCxLPTAsTD0wLE09MCxOPW51bGwsTz0wLFA9bmV3IGQuQnVmMTYoZSsxKSxRPW5ldyBkLkJ1ZjE2KGUrMSksUj1udWxsLFM9MDtmb3IoRD0wO0Q8PWU7RCsrKVBbRF09MDtmb3IoRT0wO0U8bztFKyspUFtiW2MrRV1dKys7Zm9yKEg9QyxHPWU7Rz49MSYmMD09PVBbR107Ry0tKTtpZihIPkcmJihIPUcpLDA9PT1HKXJldHVybiBwW3ErK109MjA5NzE1MjAscFtxKytdPTIwOTcxNTIwLHMuYml0cz0xLDA7Zm9yKEY9MTtGPEcmJjA9PT1QW0ZdO0YrKyk7Zm9yKEg8RiYmKEg9RiksSz0xLEQ9MTtEPD1lO0QrKylpZihLPDw9MSxLLT1QW0RdLEs8MClyZXR1cm4tMTtpZihLPjAmJihhPT09aHx8MSE9PUcpKXJldHVybi0xO2ZvcihRWzFdPTAsRD0xO0Q8ZTtEKyspUVtEKzFdPVFbRF0rUFtEXTtmb3IoRT0wO0U8bztFKyspMCE9PWJbYytFXSYmKHJbUVtiW2MrRV1dKytdPUUpO2lmKGE9PT1oPyhOPVI9cix5PTE5KTphPT09aT8oTj1rLE8tPTI1NyxSPWwsUy09MjU3LHk9MjU2KTooTj1tLFI9bix5PS0xKSxNPTAsRT0wLEQ9Rix4PXEsST1ILEo9MCx2PS0xLEw9MTw8SCx3PUwtMSxhPT09aSYmTD5mfHxhPT09aiYmTD5nKXJldHVybiAxO2Zvcig7Oyl7ej1ELUoscltFXTx5PyhBPTAsQj1yW0VdKTpyW0VdPnk/KEE9UltTK3JbRV1dLEI9TltPK3JbRV1dKTooQT05NixCPTApLHQ9MTw8RC1KLHU9MTw8SSxGPXU7ZG8gdS09dCxwW3grKE0+PkopK3VdPXo8PDI0fEE8PDE2fEJ8MDt3aGlsZSgwIT09dSk7Zm9yKHQ9MTw8RC0xO00mdDspdD4+PTE7aWYoMCE9PXQ/KE0mPXQtMSxNKz10KTpNPTAsRSsrLDA9PT0tLVBbRF0pe2lmKEQ9PT1HKWJyZWFrO0Q9YltjK3JbRV1dfWlmKEQ+SCYmKE0mdykhPT12KXtmb3IoMD09PUomJihKPUgpLHgrPUYsST1ELUosSz0xPDxJO0krSjxHJiYoSy09UFtJK0pdLCEoSzw9MCkpOylJKyssSzw8PTE7aWYoTCs9MTw8SSxhPT09aSYmTD5mfHxhPT09aiYmTD5nKXJldHVybiAxO3Y9TSZ3LHBbdl09SDw8MjR8STw8MTZ8eC1xfDB9fXJldHVybiAwIT09TSYmKHBbeCtNXT1ELUo8PDI0fDY0PDwxNnwwKSxzLmJpdHM9SCwwfX0se1wiLi4vdXRpbHMvY29tbW9uXCI6NjJ9XSw3MjpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2IuZXhwb3J0cz17MjpcIm5lZWQgZGljdGlvbmFyeVwiLDE6XCJzdHJlYW0gZW5kXCIsMDpcIlwiLFwiLTFcIjpcImZpbGUgZXJyb3JcIixcIi0yXCI6XCJzdHJlYW0gZXJyb3JcIixcIi0zXCI6XCJkYXRhIGVycm9yXCIsXCItNFwiOlwiaW5zdWZmaWNpZW50IG1lbW9yeVwiLFwiLTVcIjpcImJ1ZmZlciBlcnJvclwiLFwiLTZcIjpcImluY29tcGF0aWJsZSB2ZXJzaW9uXCJ9fSx7fV0sNzM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEpe2Zvcih2YXIgYj1hLmxlbmd0aDstLWI+PTA7KWFbYl09MH1mdW5jdGlvbiBlKGEsYixjLGQsZSl7dGhpcy5zdGF0aWNfdHJlZT1hLHRoaXMuZXh0cmFfYml0cz1iLHRoaXMuZXh0cmFfYmFzZT1jLHRoaXMuZWxlbXM9ZCx0aGlzLm1heF9sZW5ndGg9ZSx0aGlzLmhhc19zdHJlZT1hJiZhLmxlbmd0aH1mdW5jdGlvbiBmKGEsYil7dGhpcy5keW5fdHJlZT1hLHRoaXMubWF4X2NvZGU9MCx0aGlzLnN0YXRfZGVzYz1ifWZ1bmN0aW9uIGcoYSl7cmV0dXJuIGE8MjU2P2lhW2FdOmlhWzI1NisoYT4+PjcpXX1mdW5jdGlvbiBoKGEsYil7YS5wZW5kaW5nX2J1ZlthLnBlbmRpbmcrK109MjU1JmIsYS5wZW5kaW5nX2J1ZlthLnBlbmRpbmcrK109Yj4+PjgmMjU1fWZ1bmN0aW9uIGkoYSxiLGMpe2EuYmlfdmFsaWQ+WC1jPyhhLmJpX2J1Znw9Yjw8YS5iaV92YWxpZCY2NTUzNSxoKGEsYS5iaV9idWYpLGEuYmlfYnVmPWI+PlgtYS5iaV92YWxpZCxhLmJpX3ZhbGlkKz1jLVgpOihhLmJpX2J1Znw9Yjw8YS5iaV92YWxpZCY2NTUzNSxhLmJpX3ZhbGlkKz1jKX1mdW5jdGlvbiBqKGEsYixjKXtpKGEsY1syKmJdLGNbMipiKzFdKX1mdW5jdGlvbiBrKGEsYil7dmFyIGM9MDtkbyBjfD0xJmEsYT4+Pj0xLGM8PD0xO3doaWxlKC0tYj4wKTtyZXR1cm4gYz4+PjF9ZnVuY3Rpb24gbChhKXsxNj09PWEuYmlfdmFsaWQ/KGgoYSxhLmJpX2J1ZiksYS5iaV9idWY9MCxhLmJpX3ZhbGlkPTApOmEuYmlfdmFsaWQ+PTgmJihhLnBlbmRpbmdfYnVmW2EucGVuZGluZysrXT0yNTUmYS5iaV9idWYsYS5iaV9idWY+Pj04LGEuYmlfdmFsaWQtPTgpfWZ1bmN0aW9uIG0oYSxiKXt2YXIgYyxkLGUsZixnLGgsaT1iLmR5bl90cmVlLGo9Yi5tYXhfY29kZSxrPWIuc3RhdF9kZXNjLnN0YXRpY190cmVlLGw9Yi5zdGF0X2Rlc2MuaGFzX3N0cmVlLG09Yi5zdGF0X2Rlc2MuZXh0cmFfYml0cyxuPWIuc3RhdF9kZXNjLmV4dHJhX2Jhc2Usbz1iLnN0YXRfZGVzYy5tYXhfbGVuZ3RoLHA9MDtmb3IoZj0wO2Y8PVc7ZisrKWEuYmxfY291bnRbZl09MDtmb3IoaVsyKmEuaGVhcFthLmhlYXBfbWF4XSsxXT0wLFxuYz1hLmhlYXBfbWF4KzE7YzxWO2MrKylkPWEuaGVhcFtjXSxmPWlbMippWzIqZCsxXSsxXSsxLGY+byYmKGY9byxwKyspLGlbMipkKzFdPWYsZD5qfHwoYS5ibF9jb3VudFtmXSsrLGc9MCxkPj1uJiYoZz1tW2Qtbl0pLGg9aVsyKmRdLGEub3B0X2xlbis9aCooZitnKSxsJiYoYS5zdGF0aWNfbGVuKz1oKihrWzIqZCsxXStnKSkpO2lmKDAhPT1wKXtkb3tmb3IoZj1vLTE7MD09PWEuYmxfY291bnRbZl07KWYtLTthLmJsX2NvdW50W2ZdLS0sYS5ibF9jb3VudFtmKzFdKz0yLGEuYmxfY291bnRbb10tLSxwLT0yfXdoaWxlKHA+MCk7Zm9yKGY9bzswIT09ZjtmLS0pZm9yKGQ9YS5ibF9jb3VudFtmXTswIT09ZDspZT1hLmhlYXBbLS1jXSxlPmp8fChpWzIqZSsxXSE9PWYmJihhLm9wdF9sZW4rPShmLWlbMiplKzFdKSppWzIqZV0saVsyKmUrMV09ZiksZC0tKX19ZnVuY3Rpb24gbihhLGIsYyl7dmFyIGQsZSxmPW5ldyBBcnJheShXKzEpLGc9MDtmb3IoZD0xO2Q8PVc7ZCsrKWZbZF09Zz1nK2NbZC0xXTw8MTtmb3IoZT0wO2U8PWI7ZSsrKXt2YXIgaD1hWzIqZSsxXTswIT09aCYmKGFbMiplXT1rKGZbaF0rKyxoKSl9fWZ1bmN0aW9uIG8oKXt2YXIgYSxiLGMsZCxmLGc9bmV3IEFycmF5KFcrMSk7Zm9yKGM9MCxkPTA7ZDxRLTE7ZCsrKWZvcihrYVtkXT1jLGE9MDthPDE8PGJhW2RdO2ErKylqYVtjKytdPWQ7Zm9yKGphW2MtMV09ZCxmPTAsZD0wO2Q8MTY7ZCsrKWZvcihsYVtkXT1mLGE9MDthPDE8PGNhW2RdO2ErKylpYVtmKytdPWQ7Zm9yKGY+Pj03O2Q8VDtkKyspZm9yKGxhW2RdPWY8PDcsYT0wO2E8MTw8Y2FbZF0tNzthKyspaWFbMjU2K2YrK109ZDtmb3IoYj0wO2I8PVc7YisrKWdbYl09MDtmb3IoYT0wO2E8PTE0MzspZ2FbMiphKzFdPTgsYSsrLGdbOF0rKztmb3IoO2E8PTI1NTspZ2FbMiphKzFdPTksYSsrLGdbOV0rKztmb3IoO2E8PTI3OTspZ2FbMiphKzFdPTcsYSsrLGdbN10rKztmb3IoO2E8PTI4NzspZ2FbMiphKzFdPTgsYSsrLGdbOF0rKztmb3IobihnYSxTKzEsZyksYT0wO2E8VDthKyspaGFbMiphKzFdPTUsaGFbMiphXT1rKGEsNSk7bWE9bmV3IGUoZ2EsYmEsUisxLFMsVyksbmE9bmV3IGUoaGEsY2EsMCxULFcpLG9hPW5ldyBlKG5ldyBBcnJheSgwKSxkYSwwLFUsWSl9ZnVuY3Rpb24gcChhKXt2YXIgYjtmb3IoYj0wO2I8UztiKyspYS5keW5fbHRyZWVbMipiXT0wO2ZvcihiPTA7YjxUO2IrKylhLmR5bl9kdHJlZVsyKmJdPTA7Zm9yKGI9MDtiPFU7YisrKWEuYmxfdHJlZVsyKmJdPTA7YS5keW5fbHRyZWVbMipaXT0xLGEub3B0X2xlbj1hLnN0YXRpY19sZW49MCxhLmxhc3RfbGl0PWEubWF0Y2hlcz0wfWZ1bmN0aW9uIHEoYSl7YS5iaV92YWxpZD44P2goYSxhLmJpX2J1Zik6YS5iaV92YWxpZD4wJiYoYS5wZW5kaW5nX2J1ZlthLnBlbmRpbmcrK109YS5iaV9idWYpLGEuYmlfYnVmPTAsYS5iaV92YWxpZD0wfWZ1bmN0aW9uIHIoYSxiLGMsZCl7cShhKSxkJiYoaChhLGMpLGgoYSx+YykpLEcuYXJyYXlTZXQoYS5wZW5kaW5nX2J1ZixhLndpbmRvdyxiLGMsYS5wZW5kaW5nKSxhLnBlbmRpbmcrPWN9ZnVuY3Rpb24gcyhhLGIsYyxkKXt2YXIgZT0yKmIsZj0yKmM7cmV0dXJuIGFbZV08YVtmXXx8YVtlXT09PWFbZl0mJmRbYl08PWRbY119ZnVuY3Rpb24gdChhLGIsYyl7Zm9yKHZhciBkPWEuaGVhcFtjXSxlPWM8PDE7ZTw9YS5oZWFwX2xlbiYmKGU8YS5oZWFwX2xlbiYmcyhiLGEuaGVhcFtlKzFdLGEuaGVhcFtlXSxhLmRlcHRoKSYmZSsrLCFzKGIsZCxhLmhlYXBbZV0sYS5kZXB0aCkpOylhLmhlYXBbY109YS5oZWFwW2VdLGM9ZSxlPDw9MTthLmhlYXBbY109ZH1mdW5jdGlvbiB1KGEsYixjKXt2YXIgZCxlLGYsaCxrPTA7aWYoMCE9PWEubGFzdF9saXQpZG8gZD1hLnBlbmRpbmdfYnVmW2EuZF9idWYrMiprXTw8OHxhLnBlbmRpbmdfYnVmW2EuZF9idWYrMiprKzFdLGU9YS5wZW5kaW5nX2J1ZlthLmxfYnVmK2tdLGsrKywwPT09ZD9qKGEsZSxiKTooZj1qYVtlXSxqKGEsZitSKzEsYiksaD1iYVtmXSwwIT09aCYmKGUtPWthW2ZdLGkoYSxlLGgpKSxkLS0sZj1nKGQpLGooYSxmLGMpLGg9Y2FbZl0sMCE9PWgmJihkLT1sYVtmXSxpKGEsZCxoKSkpO3doaWxlKGs8YS5sYXN0X2xpdCk7aihhLFosYil9ZnVuY3Rpb24gdihhLGIpe3ZhciBjLGQsZSxmPWIuZHluX3RyZWUsZz1iLnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxoPWIuc3RhdF9kZXNjLmhhc19zdHJlZSxpPWIuc3RhdF9kZXNjLmVsZW1zLGo9LTE7Zm9yKGEuaGVhcF9sZW49MCxhLmhlYXBfbWF4PVYsYz0wO2M8aTtjKyspMCE9PWZbMipjXT8oYS5oZWFwWysrYS5oZWFwX2xlbl09aj1jLGEuZGVwdGhbY109MCk6ZlsyKmMrMV09MDtmb3IoO2EuaGVhcF9sZW48MjspZT1hLmhlYXBbKythLmhlYXBfbGVuXT1qPDI/KytqOjAsZlsyKmVdPTEsYS5kZXB0aFtlXT0wLGEub3B0X2xlbi0tLGgmJihhLnN0YXRpY19sZW4tPWdbMiplKzFdKTtmb3IoYi5tYXhfY29kZT1qLGM9YS5oZWFwX2xlbj4+MTtjPj0xO2MtLSl0KGEsZixjKTtlPWk7ZG8gYz1hLmhlYXBbMV0sYS5oZWFwWzFdPWEuaGVhcFthLmhlYXBfbGVuLS1dLHQoYSxmLDEpLGQ9YS5oZWFwWzFdLGEuaGVhcFstLWEuaGVhcF9tYXhdPWMsYS5oZWFwWy0tYS5oZWFwX21heF09ZCxmWzIqZV09ZlsyKmNdK2ZbMipkXSxhLmRlcHRoW2VdPShhLmRlcHRoW2NdPj1hLmRlcHRoW2RdP2EuZGVwdGhbY106YS5kZXB0aFtkXSkrMSxmWzIqYysxXT1mWzIqZCsxXT1lLGEuaGVhcFsxXT1lKyssdChhLGYsMSk7d2hpbGUoYS5oZWFwX2xlbj49Mik7YS5oZWFwWy0tYS5oZWFwX21heF09YS5oZWFwWzFdLG0oYSxiKSxuKGYsaixhLmJsX2NvdW50KX1mdW5jdGlvbiB3KGEsYixjKXt2YXIgZCxlLGY9LTEsZz1iWzFdLGg9MCxpPTcsaj00O2ZvcigwPT09ZyYmKGk9MTM4LGo9MyksYlsyKihjKzEpKzFdPTY1NTM1LGQ9MDtkPD1jO2QrKyllPWcsZz1iWzIqKGQrMSkrMV0sKytoPGkmJmU9PT1nfHwoaDxqP2EuYmxfdHJlZVsyKmVdKz1oOjAhPT1lPyhlIT09ZiYmYS5ibF90cmVlWzIqZV0rKyxhLmJsX3RyZWVbMiokXSsrKTpoPD0xMD9hLmJsX3RyZWVbMipfXSsrOmEuYmxfdHJlZVsyKmFhXSsrLGg9MCxmPWUsMD09PWc/KGk9MTM4LGo9Myk6ZT09PWc/KGk9NixqPTMpOihpPTcsaj00KSl9ZnVuY3Rpb24geChhLGIsYyl7dmFyIGQsZSxmPS0xLGc9YlsxXSxoPTAsaz03LGw9NDtmb3IoMD09PWcmJihrPTEzOCxsPTMpLGQ9MDtkPD1jO2QrKylpZihlPWcsZz1iWzIqKGQrMSkrMV0sISgrK2g8ayYmZT09PWcpKXtpZihoPGwpe2RvIGooYSxlLGEuYmxfdHJlZSk7d2hpbGUoMCE9PS0taCl9ZWxzZSAwIT09ZT8oZSE9PWYmJihqKGEsZSxhLmJsX3RyZWUpLGgtLSksaihhLCQsYS5ibF90cmVlKSxpKGEsaC0zLDIpKTpoPD0xMD8oaihhLF8sYS5ibF90cmVlKSxpKGEsaC0zLDMpKTooaihhLGFhLGEuYmxfdHJlZSksaShhLGgtMTEsNykpO2g9MCxmPWUsMD09PWc/KGs9MTM4LGw9Myk6ZT09PWc/KGs9NixsPTMpOihrPTcsbD00KX19ZnVuY3Rpb24geShhKXt2YXIgYjtmb3IodyhhLGEuZHluX2x0cmVlLGEubF9kZXNjLm1heF9jb2RlKSx3KGEsYS5keW5fZHRyZWUsYS5kX2Rlc2MubWF4X2NvZGUpLHYoYSxhLmJsX2Rlc2MpLGI9VS0xO2I+PTMmJjA9PT1hLmJsX3RyZWVbMiplYVtiXSsxXTtiLS0pO3JldHVybiBhLm9wdF9sZW4rPTMqKGIrMSkrNSs1KzQsYn1mdW5jdGlvbiB6KGEsYixjLGQpe3ZhciBlO2ZvcihpKGEsYi0yNTcsNSksaShhLGMtMSw1KSxpKGEsZC00LDQpLGU9MDtlPGQ7ZSsrKWkoYSxhLmJsX3RyZWVbMiplYVtlXSsxXSwzKTt4KGEsYS5keW5fbHRyZWUsYi0xKSx4KGEsYS5keW5fZHRyZWUsYy0xKX1mdW5jdGlvbiBBKGEpe3ZhciBiLGM9NDA5MzYyNDQ0Nztmb3IoYj0wO2I8PTMxO2IrKyxjPj4+PTEpaWYoMSZjJiYwIT09YS5keW5fbHRyZWVbMipiXSlyZXR1cm4gSTtpZigwIT09YS5keW5fbHRyZWVbMThdfHwwIT09YS5keW5fbHRyZWVbMjBdfHwwIT09YS5keW5fbHRyZWVbMjZdKXJldHVybiBKO2ZvcihiPTMyO2I8UjtiKyspaWYoMCE9PWEuZHluX2x0cmVlWzIqYl0pcmV0dXJuIEo7cmV0dXJuIEl9ZnVuY3Rpb24gQihhKXtwYXx8KG8oKSxwYT0hMCksYS5sX2Rlc2M9bmV3IGYoYS5keW5fbHRyZWUsbWEpLGEuZF9kZXNjPW5ldyBmKGEuZHluX2R0cmVlLG5hKSxhLmJsX2Rlc2M9bmV3IGYoYS5ibF90cmVlLG9hKSxhLmJpX2J1Zj0wLGEuYmlfdmFsaWQ9MCxwKGEpfWZ1bmN0aW9uIEMoYSxiLGMsZCl7aShhLChMPDwxKSsoZD8xOjApLDMpLHIoYSxiLGMsITApfWZ1bmN0aW9uIEQoYSl7aShhLE08PDEsMyksaihhLFosZ2EpLGwoYSl9ZnVuY3Rpb24gRShhLGIsYyxkKXt2YXIgZSxmLGc9MDthLmxldmVsPjA/KGEuc3RybS5kYXRhX3R5cGU9PT1LJiYoYS5zdHJtLmRhdGFfdHlwZT1BKGEpKSx2KGEsYS5sX2Rlc2MpLHYoYSxhLmRfZGVzYyksZz15KGEpLGU9YS5vcHRfbGVuKzMrNz4+PjMsZj1hLnN0YXRpY19sZW4rMys3Pj4+MyxmPD1lJiYoZT1mKSk6ZT1mPWMrNSxjKzQ8PWUmJmIhPT0tMT9DKGEsYixjLGQpOmEuc3RyYXRlZ3k9PT1IfHxmPT09ZT8oaShhLChNPDwxKSsoZD8xOjApLDMpLHUoYSxnYSxoYSkpOihpKGEsKE48PDEpKyhkPzE6MCksMykseihhLGEubF9kZXNjLm1heF9jb2RlKzEsYS5kX2Rlc2MubWF4X2NvZGUrMSxnKzEpLHUoYSxhLmR5bl9sdHJlZSxhLmR5bl9kdHJlZSkpLHAoYSksZCYmcShhKX1mdW5jdGlvbiBGKGEsYixjKXtyZXR1cm4gYS5wZW5kaW5nX2J1ZlthLmRfYnVmKzIqYS5sYXN0X2xpdF09Yj4+PjgmMjU1LGEucGVuZGluZ19idWZbYS5kX2J1ZisyKmEubGFzdF9saXQrMV09MjU1JmIsYS5wZW5kaW5nX2J1ZlthLmxfYnVmK2EubGFzdF9saXRdPTI1NSZjLGEubGFzdF9saXQrKywwPT09Yj9hLmR5bl9sdHJlZVsyKmNdKys6KGEubWF0Y2hlcysrLGItLSxhLmR5bl9sdHJlZVsyKihqYVtjXStSKzEpXSsrLGEuZHluX2R0cmVlWzIqZyhiKV0rKyksYS5sYXN0X2xpdD09PWEubGl0X2J1ZnNpemUtMX12YXIgRz1hKFwiLi4vdXRpbHMvY29tbW9uXCIpLEg9NCxJPTAsSj0xLEs9MixMPTAsTT0xLE49MixPPTMsUD0yNTgsUT0yOSxSPTI1NixTPVIrMStRLFQ9MzAsVT0xOSxWPTIqUysxLFc9MTUsWD0xNixZPTcsWj0yNTYsJD0xNixfPTE3LGFhPTE4LGJhPVswLDAsMCwwLDAsMCwwLDAsMSwxLDEsMSwyLDIsMiwyLDMsMywzLDMsNCw0LDQsNCw1LDUsNSw1LDBdLGNhPVswLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw2LDcsNyw4LDgsOSw5LDEwLDEwLDExLDExLDEyLDEyLDEzLDEzXSxkYT1bMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDMsN10sZWE9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdLGZhPTUxMixnYT1uZXcgQXJyYXkoMiooUysyKSk7ZChnYSk7dmFyIGhhPW5ldyBBcnJheSgyKlQpO2QoaGEpO3ZhciBpYT1uZXcgQXJyYXkoZmEpO2QoaWEpO3ZhciBqYT1uZXcgQXJyYXkoUC1PKzEpO2QoamEpO3ZhciBrYT1uZXcgQXJyYXkoUSk7ZChrYSk7dmFyIGxhPW5ldyBBcnJheShUKTtkKGxhKTt2YXIgbWEsbmEsb2EscGE9ITE7Yy5fdHJfaW5pdD1CLGMuX3RyX3N0b3JlZF9ibG9jaz1DLGMuX3RyX2ZsdXNoX2Jsb2NrPUUsYy5fdHJfdGFsbHk9RixjLl90cl9hbGlnbj1EfSx7XCIuLi91dGlscy9jb21tb25cIjo2Mn1dLDc0OltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZCgpe3RoaXMuaW5wdXQ9bnVsbCx0aGlzLm5leHRfaW49MCx0aGlzLmF2YWlsX2luPTAsdGhpcy50b3RhbF9pbj0wLHRoaXMub3V0cHV0PW51bGwsdGhpcy5uZXh0X291dD0wLHRoaXMuYXZhaWxfb3V0PTAsdGhpcy50b3RhbF9vdXQ9MCx0aGlzLm1zZz1cIlwiLHRoaXMuc3RhdGU9bnVsbCx0aGlzLmRhdGFfdHlwZT0yLHRoaXMuYWRsZXI9MH1iLmV4cG9ydHM9ZH0se31dfSx7fSxbMTBdKSgxMCl9KTsiLCJpbXBvcnQgeyBNb2RlbCwgSUNvbnRyb2xsZXIgfSBmcm9tICcuL2xpYi9tdmMuanMnO1xyXG5pbXBvcnQgSVN0b3JlICBmcm9tICcuL3N0b3JlL0lTdG9yZS5qcyc7XHJcbmltcG9ydCBET00gZnJvbSAnLi9saWIvZHJ5LWRvbS5qcyc7XHJcblxyXG53aW5kb3cuc3RybGRyID0gcmVxdWlyZShcIi4vbGliL3N0cmxkci5qc1wiKTtcclxuXHJcbmNsYXNzIEFwcCB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIERPTTpET00sXHJcbiAgICAgICAgc3RvcmU6SVN0b3JlLFxyXG4gICAgICAgIHBvb2w6XCJwb29sXCIsXHJcbiAgICAgICAgY29udHJvbGxlcnM6W0lDb250cm9sbGVyLFtdXSxcclxuICAgICAgICByb290OiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcblxyXG4gICAgICAgIHdpbmRvdy5zdG9yZSA9IHRoaXMuc3RvcmU7XHJcblxyXG4gICAgICAgIHRoaXMucG9vbC5hZGQodGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmUub25sb2FkID0gdGhpcy5pbml0LmJpbmQodGhpcyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKXtcclxuXHJcblx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBldnQgPT4ge1xyXG5cdCAgICB0aGlzLnBvb2wuY2FsbChcIm9uUHJlc3NcIiArIGV2dC5jb2RlKTtcclxuXHQgICAgLy8gY29uc29sZS5sb2coZXZ0KTtcclxuXHR9KTtcclxuXHJcblx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZXZ0ID0+IHtcclxuXHQgICAgdGhpcy5wb29sLmNhbGwoXCJvblJlbGVhc2VcIiArIGV2dC5jb2RlKTtcclxuXHQgICAgLy8gY29uc29sZS5sb2coZXZ0KTtcclxuXHR9KTtcclxuXHJcbiAgICAgICAgdGhpcy5jb250cm9sbGVycy5mb3JFYWNoKChjb250cm9sbGVyKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucG9vbC5hZGQoIGNvbnRyb2xsZXIgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5wb29sLmNhbGwoXCJlbnRlclNwbGFzaFwiKTtcclxuXHJcblxyXG4gICAgICAgIHNldEludGVydmFsKCB0aGlzLmNvbW1pdC5iaW5kKHRoaXMpLCAzMDAwICk7XHJcblxyXG4gICAgICAgIHZhciBwZW5kaW5nID0gMjtcclxuICAgICAgICB0aGlzLm9wZW5Nb2RlbCggXCJhcHBcIiwgZG9uZS5iaW5kKHRoaXMpICk7XHJcbiAgICAgICAgc2V0VGltZW91dCggZG9uZS5iaW5kKHRoaXMpLCAxMDAwICk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGRvbmUoKXtcclxuICAgICAgICAgICAgcGVuZGluZy0tO1xyXG4gICAgICAgICAgICBpZiggIXBlbmRpbmcgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb29sLmNhbGwoIFwiZXhpdFNwbGFzaFwiICk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb3Blbk1vZGVsKCBuYW1lLCBjYiwgbW9kZWwgKXtcclxuXHJcbiAgICAgICAgdmFyIG9sZE1vZGVsID0gdGhpcy5tb2RlbHMuZmluZCgob2JqKSA9PiBvYmoubmFtZSA9PSBuYW1lICk7XHJcblxyXG4gICAgICAgIGlmKCBvbGRNb2RlbCApe1xyXG5cclxuICAgICAgICAgICAgaWYoIG9sZE1vZGVsID09IG1vZGVsICkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlTW9kZWwoIG5hbWUgKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGF0aCA9IG5hbWU7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlb2YgbW9kZWwgPT0gXCJzdHJpbmdcIiApe1xyXG4gICAgICAgICAgICBwYXRoID0gbW9kZWw7XHJcbiAgICAgICAgICAgIG1vZGVsID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCAhbW9kZWwgKSBtb2RlbCA9IG5ldyBNb2RlbCgpO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3Quc2V0SXRlbSggbmFtZSwgbW9kZWwuZGF0YSApO1xyXG5cclxuICAgICAgICB0aGlzLm1vZGVsc1sgdGhpcy5tb2RlbHMubGVuZ3RoIF0gPSB7XHJcbiAgICAgICAgICAgIG1vZGVsLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBwYXRoLFxyXG4gICAgICAgICAgICBkaXJ0eTogZmFsc2VcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnN0b3JlLmdldFRleHRJdGVtKCBwYXRoLCAoZGF0YSk9PntcclxuXHJcbiAgICAgICAgICAgIGlmKCBkYXRhICl7XHJcblx0XHRtb2RlbC5sb2FkKCBKU09OLnBhcnNlKGRhdGEpICk7XHJcblx0XHRpZiggbW9kZWwuZ2V0SXRlbShcImV4cGlyZXNcIikgPiAobmV3IERhdGUoKSkuZ2V0VGltZSgpICl7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuZGlydHkgPSBmYWxzZTtcclxuXHRcdCAgICBjYi5jYWxsKCk7XHJcblx0XHQgICAgcmV0dXJuO1xyXG5cdFx0fVxyXG4gICAgICAgICAgICB9XHJcblx0ICAgIFxyXG4gICAgICAgICAgICB0aGlzLnBvb2wuY2FsbCggbmFtZSArIFwiTW9kZWxJbml0XCIsIG1vZGVsLCBjYiApO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2VNb2RlbCggbmFtZSApe1xyXG4gICAgICAgIC8vIHRvLWRvOiBmaW5kLCBjb21taXQsIHJlbW92ZSBmcm9tIHRoaXMubW9kZWxzXHJcbiAgICB9XHJcblxyXG4gICAgYXBwTW9kZWxJbml0KCBtb2RlbCwgY2IgKXtcclxuXHJcblx0bGV0IHJlcG9VUkwgPSBbXHJcblx0ICAgIFwiaHR0cDovL3d3dy5jcmFpdC5uZXQvYXJkdWJveS9yZXBvMi5qc29uXCIsXHJcblx0ICAgIFwiaHR0cDovL2FyZHVib3kucmllZC5jbC9yZXBvLmpzb25cIixcclxuXHQgICAgXCJyZXBvLmpzb25cIlxyXG5cdF07XHJcblxyXG5cdGlmKCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJFbGVjdHJvblwiKSA9PSAtMSAmJiB0eXBlb2YgY29yZG92YSA9PSBcInVuZGVmaW5lZFwiICl7XHJcblx0ICAgIC8vIG1vZGVsLnNldEl0ZW0oXCJwcm94eVwiLCBcImh0dHBzOi8vY3Jvc3NvcmlnaW4ubWUvXCIpO1xyXG5cdCAgICBtb2RlbC5zZXRJdGVtKFwicHJveHlcIiwgXCJodHRwczovL2NvcnMtYW55d2hlcmUuaGVyb2t1YXBwLmNvbS9cIik7XHJcblx0ICAgIHJlcG9VUkwgPSByZXBvVVJMLm1hcCggdXJsID0+ICgvXmh0dHBzPy4qLy50ZXN0KHVybCkgPyBtb2RlbC5nZXRJdGVtKFwicHJveHlcIikgOiBcIlwiKSArIHVybCApO1xyXG5cdH1lbHNle1xyXG5cdCAgICBtb2RlbC5zZXRJdGVtKFwicHJveHlcIiwgXCJcIik7XHJcblx0fVxyXG5cclxuXHRsZXQgaXRlbXMgPSBbXTtcclxuXHRsZXQgcGVuZGluZyA9IDM7XHJcblxyXG5cdHJlcG9VUkwuZm9yRWFjaCggdXJsID0+XHJcblx0XHRcdCBmZXRjaCggdXJsIClcclxuXHRcdFx0IC50aGVuKCByc3AgPT4gcnNwLmpzb24oKSApXHJcblx0XHRcdCAudGhlbiggYWRkIClcclxuXHRcdFx0IC5jYXRjaCggZXJyID0+IHtcclxuXHRcdFx0ICAgICBjb25zb2xlLmxvZyggZXJyICk7XHJcblx0XHRcdCAgICAgZG9uZSgpO1xyXG5cdFx0XHQgfSlcdFxyXG5cdFx0ICAgICAgICk7XHJcblxyXG5cdGZ1bmN0aW9uIGFkZCgganNvbiApe1xyXG5cdFxyXG5cdCAgICBpZigganNvbiAmJiBqc29uLml0ZW1zICl7XHJcblx0ICAgIFxyXG5cdFx0anNvbi5pdGVtcy5mb3JFYWNoKCBpdGVtID0+IHtcclxuXHRcdCAgICBcclxuXHRcdCAgICBpdGVtLmF1dGhvciA9IGl0ZW0uYXV0aG9yIHx8IFwiPDx1bmtub3duPj5cIjtcclxuXHRcdCAgICBcclxuXHRcdCAgICBpZihcclxuXHRcdFx0aXRlbS5iYW5uZXIgJiYgKFxyXG5cdFx0XHQgICAgIWl0ZW0uc2NyZWVuc2hvdHMgfHxcclxuXHRcdFx0XHQhaXRlbS5zY3JlZW5zaG90c1swXSB8fFxyXG5cdFx0XHRcdCFpdGVtLnNjcmVlbnNob3RzWzBdLmZpbGVuYW1lXHJcblx0XHRcdCkpXHJcblx0XHRcdGl0ZW0uc2NyZWVuc2hvdHMgPSBbe2ZpbGVuYW1lOml0ZW0uYmFubmVyfV07XHJcblx0XHQgICAgXHJcblx0XHQgICAgaWYoIGl0ZW0uYXJkdWJveSAmJiAoXHJcblx0XHRcdCFpdGVtLmJpbmFyaWVzIHx8XHJcblx0XHRcdCAgICAhaXRlbS5iaW5hcmllc1swXSB8fFxyXG5cdFx0XHQgICAgIWl0ZW0uYmluYXJpZXNbMF0uZmlsZW5hbWVcclxuXHRcdCAgICApKVxyXG5cdFx0XHRpdGVtLmJpbmFyaWVzID0gW3tmaWxlbmFtZTppdGVtLmFyZHVib3l9XVxyXG5cdFx0ICAgIFxyXG5cdFx0ICAgIGl0ZW1zLnB1c2goaXRlbSk7XHJcblx0XHR9KTtcclxuXHQgICAgfVxyXG5cdCAgICBcclxuXHQgICAgZG9uZSgpO1xyXG5cdCAgICBcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRvbmUoKXtcclxuXHQgICAgcGVuZGluZy0tO1xyXG5cclxuXHQgICAgaWYoICFwZW5kaW5nICl7XHJcblx0XHRpdGVtcyA9IGl0ZW1zLnNvcnQoKGEsIGIpID0+IHtcclxuXHRcdCAgICBpZiggYS50aXRsZSA+IGIudGl0bGUgKSByZXR1cm4gMTtcclxuXHRcdCAgICBpZiggYS50aXRsZSA8IGIudGl0bGUgKSByZXR1cm4gLTE7XHJcblx0XHQgICAgcmV0dXJuIDA7XHJcblx0XHR9KTtcclxuXHRcdG1vZGVsLnJlbW92ZUl0ZW0oXCJyZXBvXCIpO1xyXG5cdFx0bW9kZWwuc2V0SXRlbShcInJlcG9cIiwgaXRlbXMpO1xyXG5cdFx0bW9kZWwuc2V0SXRlbShcImV4cGlyZXNcIiwgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSArIDYwICogNjAgKiAxMDAwICk7XHJcblx0XHRjYigpO1xyXG5cdCAgICB9XHJcblx0fVxyXG4gICAgfVxyXG5cclxuICAgIGNvbW1pdCgpe1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubW9kZWxzLmxlbmd0aDsgKytpICl7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2JqID0gdGhpcy5tb2RlbHNbaV07XHJcbiAgICAgICAgICAgIGlmKCAhb2JqLmRpcnR5ICYmIG9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBvYmoubW9kZWwuZGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBvYmouZGlydHkgJiYgIW9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yZS5zZXRJdGVtKCBvYmoucGF0aCwgSlNPTi5zdHJpbmdpZnkob2JqLm1vZGVsLmRhdGEpICk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggb2JqLmRpcnR5ICYmIG9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5tb2RlbC5kaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEFjdGl2ZVZpZXcoIHZpZXcgKXtcclxuICAgICAgICBbLi4udGhpcy5ET00uZWxlbWVudC5jaGlsZHJlbl0uZm9yRWFjaCggbm9kZSA9PiBub2RlLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQobm9kZSkgKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHA7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICB3cml0ZTp7XHJcblxyXG4gICAgICAgIFsweDE1ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlRPVjAgPSB2YWx1ZSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuT0NGMEEgPSAodmFsdWU+PjEpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5PQ0YwQiA9ICh2YWx1ZT4+MikgJiAxO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5XR00wMCAgPSAodmFsdWU+PjApICYgMTtcclxuICAgICAgICAgICAgdGhpcy5XR00wMSAgPSAodmFsdWU+PjEpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQjAgPSAodmFsdWU+PjQpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQjEgPSAodmFsdWU+PjUpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQTAgPSAodmFsdWU+PjYpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQTEgPSAodmFsdWU+PjcpICYgMTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBUQ0NSMEE6XFxuICBXR00wMDoke3RoaXMuV0dNMDB9XFxuICBXR00wMToke3RoaXMuV0dNMDF9XFxuICBDT00wQjA6JHt0aGlzLkNPTTBCMH1cXG4gIENPTTBCMToke3RoaXMuQ09NMEIxfVxcbiAgQ09NMEEwOiR7dGhpcy5DT00wQTB9XFxuICBDT00wQTE6JHt0aGlzLkNPTTBBMX1gKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4MjUgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuRk9DMEEgPSAodmFsdWU+PjcpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5GT0MwQiA9ICh2YWx1ZT4+NikgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLldHTTAyID0gKHZhbHVlPj4zKSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ1MgPSB2YWx1ZSAmIDc7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgVENDUjBCOlxcbiAgRk9DMEE6JHt0aGlzLkZPQzBBfVxcbiAgRk9DMEI6JHt0aGlzLkZPQzBCfVxcbiAgV0dNMDI6JHt0aGlzLldHTTAyfWApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIFwiUEM9XCIgKyAodGhpcy5jb3JlLnBjPDwxKS50b1N0cmluZygxNikgKyBcIiBXUklURSBUQ0NSMEI6ICNcIiArIHZhbHVlLnRvU3RyaW5nKDE2KSArIFwiIDogXCIgKyB2YWx1ZSApO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNyArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG4gICAgICAgICAgICB0aGlzLk9DUjBBID0gdmFsdWU7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIk9DUjBBID0gXCIgKyB2YWx1ZSApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFsweDI4ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XHJcbiAgICAgICAgICAgIHRoaXMuT0NSMEIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIFwiT0NSMEIgPSBcIiArIHZhbHVlICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4NkVdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG4gICAgICAgICAgICB0aGlzLlRPSUUwID0gdmFsdWUgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLk9DSUUwQSA9ICh2YWx1ZT4+MSkgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLk9DSUUwQiA9ICh2YWx1ZT4+MikgJiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH0sXHJcblxyXG4gICAgaW5pdDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMudGljayA9IDA7XHJcbiAgICAgICAgdGhpcy5XR00wMCAgPSAwO1xyXG4gICAgICAgIHRoaXMuV0dNMDEgID0gMDtcclxuICAgICAgICB0aGlzLkNPTTBCMCA9IDA7XHJcbiAgICAgICAgdGhpcy5DT00wQjEgPSAwO1xyXG4gICAgICAgIHRoaXMuQ09NMEEwID0gMDtcclxuICAgICAgICB0aGlzLkNPTTBBMSA9IDA7XHJcbiAgICAgICAgdGhpcy5GT0MwQSA9IDA7XHJcbiAgICAgICAgdGhpcy5GT0MwQiA9IDA7XHJcbiAgICAgICAgdGhpcy5XR00wMiA9IDA7XHJcbiAgICAgICAgdGhpcy5DUyA9IDA7XHJcbiAgICAgICAgdGhpcy5UT1YwID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5UT0lFMCA9IDA7XHJcbiAgICAgICAgdGhpcy5PQ0lFMEEgPSAwO1xyXG4gICAgICAgIHRoaXMuT0NJRTBCID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy50aW1lID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgTUFYID0gMHhGRiwgQk9UVE9NID0gMCwgV0dNMDAgPSB0aGlzLldHTTAwLCBXR00wMSA9IHRoaXMuV0dNMDEsIFdHTTAyID0gdGhpcy5XR00wMjtcclxuXHJcbiAgICAgICAgICAgIGlmKCAgICAgICBXR00wMiA9PSAwICYmIFdHTTAxID09IDAgJiYgV0dNMDAgPT0gMCApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogTm9ybWFsIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDAgJiYgV0dNMDEgPT0gMCAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBQV00sIHBoYXNlIGNvcnJlY3QgKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMCAmJiBXR00wMSA9PSAxICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IENUQyAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBXR00wMiA9PSAwICYmIFdHTTAxID09IDEgJiYgV0dNMDAgPT0gMSApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gMztcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogRmFzdCBQV00gKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMSAmJiBXR00wMSA9PSAwICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDQ7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IFJlc2VydmVkIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMCAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA1O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBQV00sIHBoYXNlIGNvcnJlY3QgKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMSAmJiBXR00wMSA9PSAxICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDY7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IFJlc2VydmVkIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMSAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA3O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBGYXN0IFBXTSAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCggdGhpcy5DUyApe1xyXG4gICAgICAgICAgICBjYXNlIDA6IHRoaXMucHJlc2NhbGUgPSAwOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOiB0aGlzLnByZXNjYWxlID0gMTsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjogdGhpcy5wcmVzY2FsZSA9IDg7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDM6IHRoaXMucHJlc2NhbGUgPSA2NDsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNDogdGhpcy5wcmVzY2FsZSA9IDI1NjsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNTogdGhpcy5wcmVzY2FsZSA9IDEwMjQ7IGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiB0aGlzLnByZXNjYWxlID0gMTsgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlYWQ6e1xyXG5cclxuICAgICAgICBbMHgxNSArIDB4MjBdOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHJldHVybiAoKCEhdGhpcy5UT1YwKSYxKSB8ICh0aGlzLk9DRjBBPDwxKSB8ICh0aGlzLk9DRjBCPDwyKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNiArIDB4MjBdOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGljayA9IHRoaXMuY29yZS50aWNrO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRpY2tzU2luY2VPVkYgPSB0aWNrIC0gdGhpcy50aWNrO1xyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWwgPSAodGlja3NTaW5jZU9WRiAvIHRoaXMucHJlc2NhbGUpIHwgMDtcclxuICAgICAgICAgICAgaWYoICFpbnRlcnZhbCApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgVENOVDAgPSAweDI2ICsgMHgyMDtcclxuICAgICAgICAgICAgdmFyIGNudCA9IHRoaXMuY29yZS5tZW1vcnlbIFRDTlQwIF0gKyBpbnRlcnZhbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5tZW1vcnlbIFRDTlQwIF0gKz0gaW50ZXJ2YWw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnRpY2sgKz0gaW50ZXJ2YWwqdGhpcy5wcmVzY2FsZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuVE9WMCArPSAoY250IC8gMHhGRikgfCAwO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XHJcblxyXG4gICAgICAgIHZhciB0aWNrc1NpbmNlT1ZGID0gdGljayAtIHRoaXMudGljaztcclxuICAgICAgICB2YXIgaW50ZXJ2YWwgPSAodGlja3NTaW5jZU9WRiAvIHRoaXMucHJlc2NhbGUpIHwgMDtcclxuICAgICAgICBcclxuICAgICAgICBpZiggaW50ZXJ2YWwgKXtcclxuICAgICAgICAgICAgdmFyIFRDTlQwID0gMHgyNiArIDB4MjA7XHJcbiAgICAgICAgICAgIHZhciBjbnQgPSB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICsgaW50ZXJ2YWw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICs9IGludGVydmFsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy50aWNrICs9IGludGVydmFsKnRoaXMucHJlc2NhbGU7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlRPVjAgKz0gKGNudCAvIDB4RkYpIHwgMDtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggdGhpcy5UT1YwID4gMCAmJiBpZSApe1xyXG4gICAgICAgICAgICB0aGlzLlRPVjAtLTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiVElNRVIwT1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICB3cml0ZTp7XHJcbiAgICAgICAgMHhDMCggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUNTUjBBID0gKHRoaXMuVUNTUjBBICYgMGIxMDExMTEwMCkgfCAodmFsdWUgJiAwYjAxMDAwMDExKTsgfSxcclxuICAgICAgICAweEMxKCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQ1NSMEIgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEMyKCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQ1NSMEMgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM0KCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQlJSMEwgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM1KCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQlJSMEggPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM2KCB2YWx1ZSApeyB0aGlzLmNvcmUucGlucy5zZXJpYWwwID0gKHRoaXMuY29yZS5waW5zLnNlcmlhbDB8fFwiXCIpICsgU3RyaW5nLmZyb21DaGFyQ29kZSh2YWx1ZSk7IHJldHVybiB0aGlzLlVEUjAgPSB2YWx1ZTsgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZWFkOntcclxuICAgICAgICAweEMwKCl7IHJldHVybiB0aGlzLlVDU1IwQTsgfSxcclxuICAgICAgICAweEMxKCl7IHJldHVybiB0aGlzLlVDU1IwQjsgfSxcclxuICAgICAgICAweEMyKCl7IHJldHVybiB0aGlzLlVDU1IwQzsgfSxcclxuICAgICAgICAweEM0KCl7IHJldHVybiB0aGlzLlVCUlIwTDsgfSxcclxuICAgICAgICAweEM1KCl7IHJldHVybiB0aGlzLlVCUlIwSCAmIDB4MEY7IH0sXHJcbiAgICAgICAgMHhDNigpeyByZXR1cm4gdGhpcy5VRFIwOyB9XHJcbiAgICB9LFxyXG5cclxuICAgIGluaXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLlVDU1IwQSA9IDB4MjA7XHJcbiAgICAgICAgdGhpcy5VQ1NSMEIgPSAwO1xyXG4gICAgICAgIHRoaXMuVUNTUjBDID0gMHgwNjtcclxuICAgICAgICB0aGlzLlVCUlIwTCA9IDA7IC8vIFVTQVJUIEJhdWQgUmF0ZSAwIFJlZ2lzdGVyIExvd1xyXG4gICAgICAgIHRoaXMuVUJSUjBIID0gMDsgLy8gVVNBUlQgQmF1ZCBSYXRlIDAgUmVnaXN0ZXIgSGlnaCAgICAgICAgICAgIFxyXG4gICAgICAgIHRoaXMuVURSMCA9IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZTpmdW5jdGlvbiggdGljaywgaWUgKXtcclxuXHJcbiAgICB9XHJcblxyXG59O1xyXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgUE9SVEI6e1xuICAgICAgICB3cml0ZTp7XG4gICAgICAgICAgICBbMHgwNCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLkREUkIgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbMHgwNSArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSwgb2xkVmFsdWUgKXtcblxuICAgICAgICAgICAgICAgIGlmKCBvbGRWYWx1ZSA9PSB2YWx1ZSApIHJldHVybjtcblxuXHRcdC8qXG4gICAgICAgICAgICAgICAgaWYoIHR5cGVvZiBkb2N1bWVudCAhPSBcInVuZGVmaW5lZFwiICl7XG4gICAgICAgICAgICAgICAgICAgIGlmKCB2YWx1ZSAmIDB4MjAgKSBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZiggdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlID09IFwidW5kZWZpbmVkXCIgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIHZhbHVlICYgMHgyMCApIGNvbnNvbGUubG9nKCBcIkxFRCBPTiAjXCIsICh0aGlzLmNvcmUucGM8PDEpLnRvU3RyaW5nKDE2KSApO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKCBcIkxFRCBPRkYgI1wiLCAodGhpcy5jb3JlLnBjPDwxKS50b1N0cmluZygxNikgKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0Ki9cblxuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLlBPUlRCID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIndvcmtlckBcIiArIHRoaXMuY29yZS5wYy50b1N0cmluZygxNikgKyBcIlt0aWNrIFwiICsgKHRoaXMuY29yZS50aWNrIC8gdGhpcy5jb3JlLmNsb2NrICogMTAwMCkudG9GaXhlZCgzKSArIFwiXVwiLCBcIiBQT1JUQiA9IFwiLCB2YWx1ZS50b1N0cmluZygyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWQ6e1xuICAgICAgICAgICAgWzB4MDMgKyAweDIwXTpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5QSU5CICYgMHhGRikgfCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbml0OmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLlBJTkIgPSAwO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuY29yZS5waW5zLCBcIlBJTkJcIiwge1xuICAgICAgICAgICAgICAgIHNldDooIHYgKT0+dGhpcy5QSU5CID0gKHY+Pj4wKSYweEZGLFxuICAgICAgICAgICAgICAgIGdldDooKT0+dGhpcy5QSU5CXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBQT1JUQzp7XG4gICAgICAgIHdyaXRlOntcbiAgICAgICAgICAgIFsweDA3ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3JlLnBpbnMuRERSQyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFsweDA4ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3JlLnBpbnMuUE9SVEMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVhZDp7XG4gICAgICAgICAgICBbMHgwNiArIDB4MjBdOmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29yZS5waW5zLlBJTkMgPSAodGhpcy5jb3JlLnBpbnMuUElOQyAmIDB4RkYpIHx8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgUE9SVEQ6e1xuICAgICAgICB3cml0ZTp7XG4gICAgICAgICAgICBbMHgwQSArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLkREUkQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbMHgwQiArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLlBPUlREID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWQ6e1xuICAgICAgICAgICAgWzB4MDkgKyAweDIwXTpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvcmUucGlucy5QSU5EID0gKHRoaXMuY29yZS5waW5zLlBJTkQgJiAweEZGKSB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIFRDOnJlcXVpcmUoJy4vQXQzMjhQLVRDLmpzJyksXG5cbiAgICBVU0FSVDpyZXF1aXJlKCcuL0F0MzI4UC1VU0FSVC5qcycpXG5cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OmZ1bmN0aW9uKCl7XG5cdHRoaXMuU1BEUiA9IDA7XG5cdHRoaXMuU1BJRiA9IDA7XG5cdHRoaXMuV0NPTCA9IDA7XG5cdHRoaXMuU1BJMlggPSAwO1xuXHR0aGlzLlNQSUUgPSAwO1xuXHR0aGlzLlNQRSA9IDA7XG5cdHRoaXMuRE9SRCA9IDA7XG5cdHRoaXMuTVNUUiA9IDA7XG5cdHRoaXMuQ1BPTCA9IDA7XG5cdHRoaXMuQ1BIQSA9IDA7XG5cdHRoaXMuU1BSMSA9IDA7XG5cdHRoaXMuU1BSMCA9IDA7XG5cdHRoaXMuY29yZS5waW5zLnNwaU91dCA9IHRoaXMuY29yZS5waW5zLnNwaU91dCB8fCBbXTtcbiAgICB9LFxuICAgIFxuICAgIHdyaXRlOntcblx0MHg0QzpmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdCAgICB0aGlzLlNQSUUgPSB2YWx1ZSA+PiA3O1xuXHQgICAgdGhpcy5TUEUgID0gdmFsdWUgPj4gNjtcblx0ICAgIHRoaXMuRE9SRCA9IHZhbHVlID4+IDU7XG5cdCAgICB0aGlzLk1TVFIgPSB2YWx1ZSA+PiA0O1xuXHQgICAgdGhpcy5DUE9MID0gdmFsdWUgPj4gMztcblx0ICAgIHRoaXMuQ1BIQSA9IHZhbHVlID4+IDI7XG5cdCAgICB0aGlzLlNQUjEgPSB2YWx1ZSA+PiAxO1xuXHQgICAgdGhpcy5TUFIwID0gdmFsdWUgPj4gMDtcblx0fSxcblx0XG5cdDB4NEQ6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHQgICAgdGhpcy5TUEkyWCA9IHZhbHVlICYgMTtcblx0ICAgIHJldHVybiAodGhpcy5TUElGIDw8IDcpIHwgKHRoaXMuV0NPTCA8PCA2KSB8IHRoaXMuU1BJMlg7XG5cdH0sXG5cdDB4NEU6ZnVuY3Rpb24oIHZhbHVlICl7XG5cdCAgICB0aGlzLlNQRFIgPSB2YWx1ZTtcblx0ICAgIHRoaXMuY29yZS5waW5zLnNwaU91dC5wdXNoKCB2YWx1ZSApO1xuXHQgICAgdGhpcy5TUElGID0gMTtcblx0fVxuICAgIH0sXG4gICAgXG4gICAgcmVhZDp7XG5cdDB4NEQ6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMuU1BJRiA9ICghIXRoaXMuY29yZS5waW5zLnNwaUluLmxlbmd0aCkgfCAwO1xuXHQgICAgcmV0dXJuICh0aGlzLlNQSUYgPDwgNykgfCAodGhpcy5XQ09MIDw8IDYpIHwgdGhpcy5TUEkyWDtcblx0fSxcblx0MHg0RTpmdW5jdGlvbigpe1xuXHQgICAgbGV0IHNwaUluID0gdGhpcy5jb3JlLnBpbnMuc3BpSW47XG5cdCAgICBpZiggc3BpSW4ubGVuZ3RoIClcblx0XHRyZXR1cm4gdGhpcy5TUERSID0gc3BpSW4uc2hpZnQoKTtcdCBcblx0ICAgIHJldHVybiB0aGlzLlNQRFI7XG5cdH1cbiAgICB9LFxuICAgIFxuICAgIHVwZGF0ZTpmdW5jdGlvbiggdGljaywgaWUgKXtcblx0XG5cdGlmKCB0aGlzLlNQSUYgJiYgdGhpcy5TUElFICYmIGllICl7XG5cdCAgICB0aGlzLlNQSUYgPSAwO1xuXHQgICAgcmV0dXJuIFwiU1BJXCI7XG5cdH1cblx0ICAgIFxuICAgIH1cbn07XG4iLCJcbmZ1bmN0aW9uIHBvcnQoIG9iaiApe1xuICAgIFxuICAgIGxldCBvdXQgPSB7IHdyaXRlOnt9LCByZWFkOnt9LCBpbml0Om51bGwgfTtcblxuICAgIGZvciggbGV0IGsgaW4gb2JqICl7XG5cdFxuXHRsZXQgYWRkciA9IG9ialtrXTtcblx0aWYoIC9ERFIufFBPUlQuLy50ZXN0KGspICl7XG5cdCAgICBcblx0ICAgIG91dC53cml0ZVsgYWRkciBdID0gc2V0dGVyKGspO1xuXHQgICAgXG5cdH1lbHNle1xuXG5cdCAgICBvdXQucmVhZFsgYWRkciBdID0gZ2V0dGVyKGspO1xuXHQgICAgb3V0LmluaXQgPSBpbml0KGspO1xuXHQgICAgXG5cdH1cblx0XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dGVyKCBrICl7XG5cdHJldHVybiBmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdCAgICBpZiggdmFsdWUgIT0gb2xkVmFsdWUgKVxuXHRcdHRoaXMuY29yZS5waW5zW2tdID0gdmFsdWU7XHQgICAgXG5cdH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0dGVyKCBrICl7XG5cdHJldHVybiBmdW5jdGlvbigpe1xuXHQgICAgcmV0dXJuICh0aGlzW2tdICYgMHhGRikgfCAwO1xuXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQoIGsgKXtcblx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzW2tdID0gMDtcblx0ICAgIGxldCBfdGhpcyA9IHRoaXM7XG5cdCAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXMuY29yZS5waW5zLCBrLCB7XG5cdFx0c2V0OmZ1bmN0aW9uKHYpeyByZXR1cm4gX3RoaXNba10gPSAodj4+PjApICYgMHhGRiB9LFxuXHRcdGdldDpmdW5jdGlvbiggKXsgcmV0dXJuIF90aGlzW2tdIH1cblx0ICAgIH0pO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgUE9SVEI6cG9ydCh7IFBJTkI6MHgyMywgRERSQjoweDI0LCBQT1JUQjoweDI1IH0pLFxuICAgIFBPUlRDOnBvcnQoeyBQSU5DOjB4MjYsIEREUkM6MHgyNywgUE9SVEM6MHgyOCB9KSxcbiAgICBQT1JURDpwb3J0KHsgUElORDoweDI5LCBERFJEOjB4MkEsIFBPUlREOjB4MkIgfSksXG4gICAgUE9SVEU6cG9ydCh7IFBJTkU6MHgyQywgRERSRToweDJELCBQT1JURToweDJFIH0pLFxuICAgIFBPUlRGOnBvcnQoeyBQSU5GOjB4MkYsIEREUkY6MHgzMCwgUE9SVEY6MHgzMSB9KSxcblxuICAgIFRDOnJlcXVpcmUoJy4vQXQzMjhQLVRDLmpzJyksXG5cbiAgICBVU0FSVDpyZXF1aXJlKCcuL0F0MzI4UC1VU0FSVC5qcycpLFxuXG4gICAgUExMOntcblx0cmVhZDp7XG5cdCAgICAweDQ5OmZ1bmN0aW9uKCB2YWx1ZSApe1xuXHRcdHJldHVybiAodGhpcy5QSU5ESVYgPDwgNCkgfCAodGhpcy5QTExFIDw8IDEpIHwgdGhpcy5QTE9DSztcblx0ICAgIH1cblx0fSxcblx0d3JpdGU6e1xuXHQgICAgMHg0OTpmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdFx0aWYoIHZhbHVlID09PSBvbGRWYWx1ZSApIHJldHVybjtcblx0XHR0aGlzLlBJTkRJViA9ICh2YWx1ZSA+PiA0KSAmIDE7XG5cdFx0dGhpcy5QTExFICAgPSAodmFsdWUgPj4gMSkgJiAxO1xuXHRcdHRoaXMuUExPQ0sgID0gMTtcblx0ICAgIH1cblx0fSxcblx0aW5pdDpmdW5jdGlvbigpe1xuXHQgICAgdGhpcy5QSU5ESVYgPSAwO1xuXHQgICAgdGhpcy5QTExFID0gMDtcblx0ICAgIHRoaXMuUExPQ0sgPSAwO1xuXHR9XG4gICAgfSxcblxuICAgIFNQSTpyZXF1aXJlKCcuL0F0MzJ1NC1TUEkuanMnKSxcblxuICAgIEVFUFJPTTp7XG5cdHdyaXRlOntcblx0ICAgIDB4M0Y6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHRcdHZhbHVlICY9IH4yO1xuXHRcdHJldHVybiB2YWx1ZTtcblx0ICAgIH1cblx0fSxcblx0cmVhZDp7fSxcblx0aW5pdDpmdW5jdGlvbigpe1xuXHQgICAgXG5cdH1cbiAgICB9LFxuXG4gICAgQURDU1JBOntcblx0XG5cdHdyaXRlOntcblx0ICAgIDB4N0E6ZnVuY3Rpb24odmFsdWUsIG9sZFZhbHVlKXtcblx0XHR0aGlzLkFERU4gPSB2YWx1ZT4+NyAmIDE7XG5cdFx0dGhpcy5BRFNDID0gdmFsdWU+PjYgJiAxO1xuXHRcdHRoaXMuQURBVEUgPSB2YWx1ZT4+NSAmIDE7XG5cdFx0dGhpcy5BRElGID0gdmFsdWU+PjQgJiAxO1xuXHRcdHRoaXMuQURJRSA9IHZhbHVlPj4zICYgMTtcblx0XHR0aGlzLkFEUFMyID0gdmFsdWU+PjIgJiAxO1xuXHRcdHRoaXMuQURQUzEgPSB2YWx1ZT4+MSAmIDE7XG5cdFx0dGhpcy5BRFBTMCA9IHZhbHVlICYgMTtcblx0XHRpZiggdGhpcy5BREVOICl7XG5cdFx0ICAgIGlmKCB0aGlzLkFEU0MgKXtcblx0XHRcdHRoaXMuQURDSCA9IChNYXRoLnJhbmRvbSgpICogMHhGRikgPj4+IDA7XG5cdFx0XHR0aGlzLkFEQ0wgPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHRcdFx0dGhpcy5BRFNDID0gMDtcblx0XHRcdHZhbHVlICY9IH4oMTw8Nik7XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHQgICAgfVxuXHR9LFxuXG5cdHJlYWQ6e1xuXHQgICAgMHg3OTpmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLkFEQ0g7XG5cdCAgICB9LFxuXHQgICAgMHg3ODpmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLkFEQ0w7XG5cdCAgICB9XG5cdH0sXG5cdFx0XG5cdGluaXQ6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMuQURFTiA9IDA7XG5cdCAgICB0aGlzLkFEU0MgPSAwO1xuXHQgICAgdGhpcy5BREFURSA9IDA7XG5cdCAgICB0aGlzLkFESUYgPSAwO1xuXHQgICAgdGhpcy5BRElFID0gMDtcblx0ICAgIHRoaXMuQURQUzIgPSAwO1xuXHQgICAgdGhpcy5BRFBTMSA9IDA7XG5cdCAgICB0aGlzLkFEUFMwID0gMDtcblx0fSxcblxuXHR1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XG5cdCAgICBpZiggdGhpcy5BREVOICYmIHRoaXMuQURJRSApe1xuXHRcdHRoaXMuQURJRiA9IDE7XG5cdFx0dGhpcy5BRFNDID0gMDtcblx0XHR0aGlzLkFEQ0ggPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHRcdHRoaXMuQURDTCA9IChNYXRoLnJhbmRvbSgpICogMHhGRikgPj4+IDA7XG5cdCAgICB9XG5cblx0ICAgIGlmKCB0aGlzLkFESUYgJiYgdGhpcy5BRElFICYmIGllICl7XG5cdFx0dGhpcy5BRElGID0gMDtcblx0XHRyZXR1cm4gXCJBRENcIjtcblx0ICAgIH1cblx0fVxuXHRcbiAgICB9XG5cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gaHR0cDovL3d3dy5hdG1lbC5jb20vd2ViZG9jL2F2cmFzc2VtYmxlci9hdnJhc3NlbWJsZXIud2JfaW5zdHJ1Y3Rpb25fbGlzdC5odG1sXG5cbmZ1bmN0aW9uIGJpbiggYnl0ZXMsIHNpemUgKXtcblxuICAgIHZhciBzID0gKGJ5dGVzPj4+MCkudG9TdHJpbmcoMik7XG4gICAgd2hpbGUoIHMubGVuZ3RoIDwgc2l6ZSApIHMgPSBcIjBcIitzO1xuICAgIHJldHVybiBzLnJlcGxhY2UoLyhbMDFdezQsNH0pL2csIFwiJDEgXCIpICsgXCIgICNcIiArIChieXRlcz4+PjApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICAgIFxufVxuXG5pZiggdHlwZW9mIHBlcmZvcm1hbmNlID09PSBcInVuZGVmaW5lZFwiICl7XG4gICAgaWYoIERhdGUubm93ICkgZ2xvYmFsLnBlcmZvcm1hbmNlID0geyBub3c6KCk9PkRhdGUubm93KCkgfTtcbiAgICBlbHNlIGdsb2JhbC5wZXJmb3JtYW5jZSA9IHsgbm93OigpPT4obmV3IERhdGUoKSkuZ2V0VGltZSgpIH07XG59XG5cbmNsYXNzIEF0Y29yZSB7XG5cbiAgICBjb25zdHJ1Y3RvciggZGVzYyApe1xuXG4gICAgICAgIGlmKCAhZGVzYyApXG4gICAgICAgICAgICByZXR1cm47XG5cblx0dGhpcy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNyZWcgPSAwO1xuICAgICAgICB0aGlzLnBjID0gMDtcbiAgICAgICAgdGhpcy5zcCA9IDA7XG4gICAgICAgIHRoaXMuY2xvY2sgPSBkZXNjLmNsb2NrO1xuICAgICAgICB0aGlzLmNvZGVjID0gZGVzYy5jb2RlYztcbiAgICAgICAgdGhpcy5pbnRlcnJ1cHRNYXAgPSBkZXNjLmludGVycnVwdDtcbiAgICAgICAgdGhpcy5lcnJvciA9IDA7XG4gICAgICAgIHRoaXMuZmxhZ3MgPSBkZXNjLmZsYWdzO1xuICAgICAgICB0aGlzLnRpY2sgPSAwO1xuICAgICAgICB0aGlzLnN0YXJ0VGljayA9IDA7XG4gICAgICAgIHRoaXMuZW5kVGljayA9IDA7XG4gICAgICAgIHRoaXMuZXhlY1RpbWUgPSAwO1xuICAgICAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHR0aGlzLmk4YSA9IG5ldyBJbnQ4QXJyYXkoNCk7XG5cbiAgICAgICAgc2VsZi5CUkVBS1BPSU5UUyA9IHsgMDowIH07XG4gICAgICAgIHNlbGYuRFVNUCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICdQQzogIycrKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KStcbiAgICAgICAgICAgICAgICAnXFxuU1I6ICcgKyB0aGlzLm1lbW9yeVsweDVGXS50b1N0cmluZygyKStcbiAgICAgICAgICAgICAgICAnXFxuU1A6ICMnICsgdGhpcy5zcC50b1N0cmluZygxNikgK1xuICAgICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKCB0aGlzLnJlZywgXG4gICAgICAgICAgICAgICAgICAgICh2LGkpID0+ICdSJysoaSsnJykrJyAnKyhpPDEwPycgJzonJykrJz1cXHQjJyt2LnRvU3RyaW5nKDE2KSArICdcXHQnICsgdiBcbiAgICAgICAgICAgICAgICApLmpvaW4oJ1xcbicpIFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICBUaGUgSS9PIG1lbW9yeSBzcGFjZSBjb250YWlucyA2NCBhZGRyZXNzZXMgZm9yIENQVSBwZXJpcGhlcmFsIGZ1bmN0aW9ucyBhcyBjb250cm9sIHJlZ2lzdGVycywgU1BJLCBhbmQgb3RoZXIgSS9PIGZ1bmN0aW9ucy5cbiAgICAgICAgVGhlIEkvTyBtZW1vcnkgY2FuIGJlIGFjY2Vzc2VkIGRpcmVjdGx5LCBvciBhcyB0aGUgZGF0YSBzcGFjZSBsb2NhdGlvbnMgZm9sbG93aW5nIHRob3NlIG9mIHRoZSByZWdpc3RlciBmaWxlLCAweDIwIC0gMHg1Ri4gSW5cbiAgICAgICAgYWRkaXRpb24sIHRoZSBBVG1lZ2EzMjhQIGhhcyBleHRlbmRlZCBJL08gc3BhY2UgZnJvbSAweDYwIC0gMHhGRiBpbiBTUkFNIHdoZXJlIG9ubHkgdGhlIFNUL1NUUy9TVEQgYW5kXG4gICAgICAgIExEL0xEUy9MREQgaW5zdHJ1Y3Rpb25zIGNhbiBiZSB1c2VkLiAgICAgICAgXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWVtb3J5ID0gbmV3IFVpbnQ4QXJyYXkoIFxuICAgICAgICAgICAgMzIgLy8gcmVnaXN0ZXIgZmlsZVxuICAgICAgICAgICAgKyAoMHhGRiAtIDB4MUYpIC8vIGlvXG4gICAgICAgICAgICArIGRlc2Muc3JhbVxuICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZmxhc2ggPSBuZXcgVWludDhBcnJheSggZGVzYy5mbGFzaCApO1xuICAgICAgICB0aGlzLmVlcHJvbSA9IG5ldyBVaW50OEFycmF5KCBkZXNjLmVlcHJvbSApO1xuXG4gICAgICAgIHRoaXMuaW5pdE1hcHBpbmcoKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucGVyaWZlcmFscyA9IHt9O1xuICAgICAgICB0aGlzLnBpbnMgPSB7fTtcblxuICAgICAgICBmb3IoIHZhciBwZXJpZmVyYWxOYW1lIGluIGRlc2MucGVyaWZlcmFscyApe1xuXG4gICAgICAgICAgICBsZXQgYWRkciwgcGVyaWZlcmFsID0gZGVzYy5wZXJpZmVyYWxzWyBwZXJpZmVyYWxOYW1lIF07XG4gICAgICAgICAgICBsZXQgb2JqID0gdGhpcy5wZXJpZmVyYWxzWyBwZXJpZmVyYWxOYW1lIF0gPSB7IGNvcmU6dGhpcyB9O1xuXG4gICAgICAgICAgICBmb3IoIGFkZHIgaW4gcGVyaWZlcmFsLndyaXRlIClcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlTWFwWyBhZGRyIF0gPSBwZXJpZmVyYWwud3JpdGVbIGFkZHIgXS5iaW5kKCBvYmogKTtcblxuICAgICAgICAgICAgZm9yKCBhZGRyIGluIHBlcmlmZXJhbC5yZWFkIClcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWRNYXBbIGFkZHIgXSA9IHBlcmlmZXJhbC5yZWFkWyBhZGRyIF0uYmluZCggb2JqICk7XG5cbiAgICAgICAgICAgIGlmKCBwZXJpZmVyYWwudXBkYXRlIClcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QucHVzaCggcGVyaWZlcmFsLnVwZGF0ZS5iaW5kKCBvYmogKSApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggcGVyaWZlcmFsLmluaXQgKVxuICAgICAgICAgICAgICAgIHBlcmlmZXJhbC5pbml0LmNhbGwoIG9iaiApO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGluaXRNYXBwaW5nKCl7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCB0aGlzLCB7XG4gICAgICAgICAgICB3cml0ZU1hcDp7IHZhbHVlOnt9LCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgcmVhZE1hcDp7IHZhbHVlOnt9LCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgdXBkYXRlTGlzdDp7IHZhbHVlOltdLCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgcmVnOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDAsIDB4MjAgKSwgZW51bWVyYWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgd3JlZzp7IHZhbHVlOiBuZXcgVWludDE2QXJyYXkoIHRoaXMubWVtb3J5LmJ1ZmZlciwgMHgyMC04LCA0ICksIGVudW1lcmFibGU6IGZhbHNlIH0sXG4gICAgICAgICAgICBzcmFtOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDB4MTAwICksIGVudW1lcmFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIGlvOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDB4MjAsIDB4RkYgLSAweDIwICksIGVudW1lcmFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHByb2c6eyB2YWx1ZTogbmV3IFVpbnQxNkFycmF5KCB0aGlzLmZsYXNoLmJ1ZmZlciApLCBlbnVtZXJhYmxlOmZhbHNlIH0sXG4gICAgICAgICAgICBuYXRpdmU6eyB2YWx1ZTp7fSwgZW51bWVyYWJsZTpmYWxzZSB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29kZWMuZm9yRWFjaCggb3AgPT57XG4gICAgICAgICAgICBpZiggb3Auc3RyICkgcGFyc2UoIG9wICk7XG4gICAgICAgICAgICBvcC5hcmd2ID0gT2JqZWN0LmFzc2lnbih7fSwgb3AuYXJncykgXG4gICAgICAgICAgICBvcC5ieXRlcyA9IG9wLmJ5dGVzIHx8IDI7XG4gICAgICAgICAgICBvcC5jeWNsZXMgPSBvcC5jeWNsZXMgfHwgMTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVhZCggYWRkciwgcGMgKXtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5tZW1vcnlbIGFkZHIgXTtcblxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy5yZWFkTWFwWyBhZGRyIF07XG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlICk7XG4gICAgICAgICAgICBpZiggcmV0ICE9PSB1bmRlZmluZWQgKSB2YWx1ZSA9IHJldDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmKCAhKHtcbiAgICAgICAgLy8gICAgIDB4NWQ6MSwgLy8gU3RhY2sgUG9pbnRlciBMb3dcbiAgICAgICAgLy8gICAgIDB4NWU6MSwgLy8gU3RhY2sgUG9pbnRlciBIaWdoXG4gICAgICAgIC8vICAgICAweDVmOjEsIC8vIHN0YXR1cyByZWdpc3RlclxuICAgICAgICAvLyAgICAgMHgyNToxLCAvLyBQT1JUQlxuICAgICAgICAvLyAgICAgMHgzNToxLCAvLyBUT1YwXG4gICAgICAgIC8vICAgICAweDIzOjEsICAvLyBQSU5CXG4gICAgICAgIC8vICAgICAweDE0QjoxIC8vIHZlcmJvc2UgVVNBUlQgc3R1ZmZcbiAgICAgICAgLy8gfSlbYWRkcl0gKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyggXCJSRUFEOiAjXCIsIGFkZHIudG9TdHJpbmcoMTYpICk7XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHJlYWRCaXQoIGFkZHIsIGJpdCwgcGMgKXtcblxuICAgICAgICAvLyBpZiggISh7XG4gICAgICAgIC8vICAgICAweDVkOjEsIC8vIFN0YWNrIFBvaW50ZXIgTG93XG4gICAgICAgIC8vICAgICAweDVlOjEsIC8vIFN0YWNrIFBvaW50ZXIgSGlnaFxuICAgICAgICAvLyAgICAgMHg1ZjoxLCAvLyBzdGF0dXMgcmVnaXN0ZXJcbiAgICAgICAgLy8gICAgIDB4MjU6MSwgLy8gUE9SVEJcbiAgICAgICAgLy8gICAgIDB4MzU6MSwgLy8gVE9WMFxuICAgICAgICAvLyAgICAgMHgyMzoxICAvLyBQSU5CXG4gICAgICAgIC8vIH0pW2FkZHJdIClcbiAgICAgICAgLy8gY29uc29sZS5sb2coIFwiUEM9XCIgKyAocGM8PDEpLnRvU3RyaW5nKDE2KSArIFwiIFJFQUQgI1wiICsgKGFkZHIgIT09IHVuZGVmaW5lZCA/IGFkZHIudG9TdHJpbmcoMTYpIDogJ3VuZGVmaW5lZCcpICsgXCIgQCBcIiArIGJpdCApO1xuXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVtb3J5WyBhZGRyIF07XG5cbiAgICAgICAgdmFyIHBlcmlmZXJhbCA9IHRoaXMucmVhZE1hcFsgYWRkciBdO1xuICAgICAgICBpZiggcGVyaWZlcmFsICl7XG4gICAgICAgICAgICB2YXIgcmV0ID0gcGVyaWZlcmFsKCB2YWx1ZSApO1xuICAgICAgICAgICAgaWYoIHJldCAhPT0gdW5kZWZpbmVkICkgdmFsdWUgPSByZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHZhbHVlID4+PiBiaXQpICYgMTtcbiAgICB9XG5cbiAgICB3cml0ZSggYWRkciwgdmFsdWUgKXtcblxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy53cml0ZU1hcFsgYWRkciBdO1xuXG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlLCB0aGlzLm1lbW9yeVsgYWRkciBdICk7XG4gICAgICAgICAgICBpZiggcmV0ID09PSBmYWxzZSApIHJldHVybjtcbiAgICAgICAgICAgIGlmKCByZXQgIT09IHVuZGVmaW5lZCApIHZhbHVlID0gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubWVtb3J5WyBhZGRyIF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICB3cml0ZUJpdCggYWRkciwgYml0LCBidmFsdWUgKXtcblx0YnZhbHVlID0gKCEhYnZhbHVlKSB8IDA7XG5cdHZhciB2YWx1ZSA9IHRoaXMubWVtb3J5WyBhZGRyIF07XG5cdHZhbHVlID0gKHZhbHVlICYgfigxPDxiaXQpKSB8IChidmFsdWU8PGJpdCk7XG5cdFxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy53cml0ZU1hcFsgYWRkciBdO1xuXG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlLCB0aGlzLm1lbW9yeVsgYWRkciBdICk7XG4gICAgICAgICAgICBpZiggcmV0ID09PSBmYWxzZSApIHJldHVybjtcbiAgICAgICAgICAgIGlmKCByZXQgIT09IHVuZGVmaW5lZCApIHZhbHVlID0gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubWVtb3J5WyBhZGRyIF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBleGVjKCB0aW1lICl7XG4gICAgICAgIHZhciBjeWNsZXMgPSAodGltZSAqIHRoaXMuY2xvY2spfDA7XG4gICAgICAgIFxuICAgICAgICB2YXIgc3RhcnQgPSB0aGlzLnRpY2s7XG4gICAgICAgIHRoaXMuZW5kVGljayA9IHRoaXMuc3RhcnRUaWNrICsgY3ljbGVzO1xuICAgICAgICB0aGlzLmV4ZWNUaW1lID0gdGltZTtcblx0dmFyIGxhc3RVcGRhdGUgPSBzdGFydDtcblxuICAgICAgICB0cnl7XG5cblx0ICAgIHdoaWxlKCB0aGlzLnRpY2sgPCB0aGlzLmVuZFRpY2sgKXtcblx0XHRpZiggIXRoaXMuc2xlZXBpbmcgKXtcblxuXHRcdCAgICBpZiggdGhpcy5wYyA+IDB4RkZGRiApIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmdW5jID0gdGhpcy5uYXRpdmVbIHRoaXMucGMgXTtcblx0XHQgICAgLy8gaWYoICFmdW5jICkgXHRcdCAgICBjb25zb2xlLmxvZyggdGhpcy5wYyApO1xuICAgICAgICAgICAgICAgICAgICBpZiggZnVuYyApIGZ1bmMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiggIXRoaXMuZ2V0QmxvY2soKSApXG5cdFx0XHRicmVhaztcblx0XHR9ZWxzZXtcblx0XHQgICAgdGhpcy50aWNrICs9IDEwMDtcblx0XHR9XG5cdFx0XG5cdFx0aWYoIHRoaXMudGljayA+PSB0aGlzLmVuZFRpY2sgfHwgdGhpcy50aWNrIC0gbGFzdFVwZGF0ZSA+IDEwMDAgKXtcblx0XHQgICAgbGFzdFVwZGF0ZSA9IHRoaXMudGljaztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQZXJpZmVyYWxzKCk7XG5cdFx0fVxuXG5cdCAgICB9XG5cblx0XHRcbiAgICAgICAgfWZpbmFsbHl7XG5cblx0ICAgIHRoaXMuc3RhcnRUaWNrID0gdGhpcy5lbmRUaWNrO1xuXG5cdH1cblxuICAgIH1cblxuICAgIHVwZGF0ZVBlcmlmZXJhbHMoKXtcblxuICAgICAgICB2YXIgaW50ZXJydXB0c0VuYWJsZWQgPSB0aGlzLm1lbW9yeVsweDVGXSAmICgxPDw3KTtcblxuICAgICAgICB2YXIgdXBkYXRlTGlzdCA9IHRoaXMudXBkYXRlTGlzdDtcblxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9dXBkYXRlTGlzdC5sZW5ndGg7IGk8bDsgKytpICl7XG5cbiAgICAgICAgICAgIHZhciByZXQgPSB1cGRhdGVMaXN0W2ldKCB0aGlzLnRpY2ssIGludGVycnVwdHNFbmFibGVkICk7XG5cbiAgICAgICAgICAgIGlmKCByZXQgJiYgaW50ZXJydXB0c0VuYWJsZWQgKXtcbiAgICAgICAgICAgICAgICBpbnRlcnJ1cHRzRW5hYmxlZCA9IDA7XG5cdFx0dGhpcy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJydXB0KCByZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB1cGRhdGUoKXtcbiAgICAgICAgdmFyIG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB2YXIgZGVsdGEgPSBub3cgLSB0aGlzLnRpbWU7XG5cbiAgICAgICAgZGVsdGEgPSBNYXRoLm1heCggMCwgTWF0aC5taW4oIDMzLCBkZWx0YSApICk7XG5cbiAgICAgICAgdGhpcy5leGVjKCBkZWx0YS8xMDAwICk7XG5cbiAgICAgICAgdGhpcy50aW1lID0gbm93O1xuICAgIH1cblxuICAgIGdldEJsb2NrKCl7XG5cblxuICAgICAgICB2YXIgc3RhcnRQQyA9IHRoaXMucGM7XG5cbiAgICAgICAgdmFyIHNraXAgPSBmYWxzZSwgcHJldiA9IGZhbHNlO1xuICAgICAgICB2YXIgbm9wID0ge25hbWU6J05PUCcsIGN5Y2xlczoxLCBlbmQ6dHJ1ZSwgYXJndjp7fX07XG4gICAgICAgIHZhciBjYWNoZUxpc3QgPSBbJ3JlZycsICd3cmVnJywgJ2lvJywgJ21lbW9yeScsICdzcmFtJywgJ2ZsYXNoJ11cbiAgICAgICAgdmFyIGNvZGUgPSAnXCJ1c2Ugc3RyaWN0XCI7XFxudmFyIHNwPXRoaXMuc3AsIHIsIHQxLCBpOGE9dGhpcy5pOGEsIFNLSVA9ZmFsc2UsICc7XG4gICAgICAgIGNvZGUgKz0gY2FjaGVMaXN0Lm1hcChjPT4gYCR7Y30gPSB0aGlzLiR7Y31gKS5qb2luKCcsICcpO1xuICAgICAgICBjb2RlICs9ICc7XFxuJztcbiAgICAgICAgY29kZSArPSAndmFyIHNyID0gbWVtb3J5WzB4NUZdJztcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPDg7ICsraSApXG4gICAgICAgICAgICBjb2RlICs9IGAsIHNyJHtpfSA9IChzcj4+JHtpfSkmMWA7XG4gICAgICAgIGNvZGUgKz0gJztcXG4nO1xuXG4gICAgICAgIC8vIGNvZGUgKz0gXCJjb25zb2xlLmxvZygnXFxcXG5FTlRFUiBCTE9DSzogXCIgKyAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgKyBcIiBAICcsICh0aGlzLnBjPDwxKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSApO1xcblwiO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ1JFQVRFIEJMT0NLOiAnLCAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgY29kZSArPSAnc3dpdGNoKCB0aGlzLnBjICl7XFxuJztcblxuXHRsZXQgYWRkcnMgPSBbXTtcblxuICAgICAgICBkb3tcblx0ICAgIFxuICAgICAgICAgICAgdmFyIGluc3QgPSB0aGlzLmlkZW50aWZ5KCk7XG4gICAgICAgICAgICBpZiggIWluc3QgKXtcbiAgICAgICAgICAgICAgICAvLyBpbnN0ID0gbm9wO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggdGhpcy5lcnJvciApO1xuICAgICAgICAgICAgICAgIChmdW5jdGlvbigpe2RlYnVnZ2VyO30pKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG5cdCAgICBhZGRycy5wdXNoKCB0aGlzLnBjICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvZGUgKz0gYFxcbmNhc2UgJHt0aGlzLnBjfTogLy8gI2AgKyAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpICsgXCI6IFwiICsgaW5zdC5uYW1lICsgJyBbJyArIGluc3QuZGVjYnl0ZXMudG9TdHJpbmcoMikucGFkU3RhcnQoMTYsIFwiMFwiKSArICddJyArICdcXG4nO1xuXG5cbiAgICAgICAgICAgIHZhciBjaHVuayA9IGBcbiAgICAgICAgICAgICAgICB0aGlzLnBjID0gJHt0aGlzLnBjfTtcbiAgICAgICAgICAgICAgICBpZiggKHRoaXMudGljayArPSAke2luc3QuY3ljbGVzfSkgPj0gdGhpcy5lbmRUaWNrICkgYnJlYWs7XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQlJFQUtQT0lOVFNcbiAgICAgICAgICAgIGlmKCAoc2VsZi5CUkVBS1BPSU5UUyAmJiBzZWxmLkJSRUFLUE9JTlRTWyB0aGlzLnBjPDwxIF0pIHx8IGluc3QuZGVidWcgKXtcbiAgICAgICAgICAgICAgICBjaHVuayArPSBcImNvbnNvbGUubG9nKCdQQzogIycrKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KSsnXFxcXG5TUjogJyArIG1lbW9yeVsweDVGXS50b1N0cmluZygyKSArICdcXFxcblNQOiAjJyArIHNwLnRvU3RyaW5nKDE2KSArICdcXFxcbicgKyBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoIHJlZywgKHYsaSkgPT4gJ1InKyhpKycnKSsnICcrKGk8MTA/JyAnOicnKSsnPVxcXFx0Iycrdi50b1N0cmluZygxNikgKyAnXFxcXHQnICsgdiApLmpvaW4oJ1xcXFxuJykgKTtcXG5cIjtcbiAgICAgICAgICAgICAgICBjaHVuayArPSAnICBkZWJ1Z2dlcjtcXG4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb3AgPSB0aGlzLmdldE9wY29kZUltcGwoIGluc3QsIGluc3QuaW1wbCApO1xuICAgICAgICAgICAgdmFyIHNyRGlydHkgPSBvcC5zckRpcnR5O1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBvcC5iZWdpbiwgZW5kbGluZSA9IG9wLmVuZDtcbiAgICAgICAgICAgIGlmKCBpbnN0LmZsYWdzICl7XG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgaT0wLCBsPWluc3QuZmxhZ3MubGVuZ3RoOyBpPGw7ICsraSApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmxhZ09wID0gdGhpcy5nZXRPcGNvZGVJbXBsKCBpbnN0LCB0aGlzLmZsYWdzW2luc3QuZmxhZ3NbaV1dICk7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gZmxhZ09wLmJlZ2luO1xuICAgICAgICAgICAgICAgICAgICBlbmRsaW5lICs9IGZsYWdPcC5lbmQ7XG4gICAgICAgICAgICAgICAgICAgIHNyRGlydHkgfD0gZmxhZ09wLnNyRGlydHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiggc3JEaXJ0eSApe1xuICAgICAgICAgICAgICAgIHZhciBwcmVzID0gKCh+c3JEaXJ0eSk+Pj4wJjB4RkYpLnRvU3RyaW5nKDIpO1xuICAgICAgICAgICAgICAgIGVuZGxpbmUgKz0gYHNyID0gKHNyJjBiJHtwcmVzfSkgYDtcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpPTA7IGk8ODsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAgaWYoIHNyRGlydHkmKDE8PGkpIClcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZGxpbmUgKz0gYCB8IChzciR7aX08PCR7aX0pYDtcbiAgICAgICAgICAgICAgICBlbmRsaW5lICs9ICc7XFxubWVtb3J5WzB4NUZdID0gc3I7XFxuJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2h1bmsgKz0gbGluZSArIGVuZGxpbmU7XG5cbiAgICAgICAgICAgIGlmKCBza2lwIClcbiAgICAgICAgICAgICAgICBjb2RlICs9IFwiICBpZiggIVNLSVAgKXtcXG4gICAgXCIgKyBjaHVuayArIFwiXFxuICB9XFxuU0tJUCA9IGZhbHNlO1xcblwiO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvZGUgKz0gY2h1bms7XG5cbiAgICAgICAgICAgIHByZXYgPSBza2lwO1xuICAgICAgICAgICAgc2tpcCA9IGluc3Quc2tpcDtcblxuICAgICAgICAgICAgdGhpcy5wYyArPSBpbnN0LmJ5dGVzID4+IDE7XG5cbiAgICAgICAgfXdoaWxlKCB0aGlzLnBjIDwgdGhpcy5wcm9nLmxlbmd0aCAmJiAoIWluc3QuZW5kIHx8IHNraXAgfHwgcHJldikgKVxuXG4gICAgICAgIGNvZGUgKz0gYFxcbnRoaXMucGMgPSAke3RoaXMucGN9O1xcbmA7XG5cdGNvZGUgKz0gYGJyZWFrO1xcbmRlZmF1bHQ6IHRoaXMudGljayArPSAyOyBjb25zb2xlLndhcm4oJ2ZlbGwgdGhyb3VnaCAjJyArICh0aGlzLnBjKys8PDEpLnRvU3RyaW5nKDE2KSk7XFxuYDtcbiAgICAgICAgY29kZSArPSBgXFxuXFxufWA7XG4gICAgICAgIC8vIGNvZGUgKz0gY2FjaGVMaXN0Lm1hcChjPT5gdGhpcy4ke2N9ID0gJHtjfTtgKS5qb2luKCdcXG4nKTtcbiAgICAgICAgY29kZSArPSAndGhpcy5zcCA9IHNwO1xcbic7XG5cbiAgICAgICAgdmFyIGVuZFBDID0gdGhpcy5wYztcbiAgICAgICAgdGhpcy5wYyA9IHN0YXJ0UEM7XG5cbiAgICAgICAgY29kZSA9IFwicmV0dXJuIChmdW5jdGlvbiBfXCIgKyAoc3RhcnRQQzw8MSkudG9TdHJpbmcoMTYpICsgXCIoKXtcXG5cIlxuICAgICAgICAgICAgICsgY29kZVxuICAgICAgICAgICAgICsgXCJ9KTtcIjtcblxuICAgICAgICB0cnl7XG4gICAgICAgICAgICB2YXIgZnVuYyA9IChuZXcgRnVuY3Rpb24oIGNvZGUgKSkoKTtcblxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGFkZHJzLmxlbmd0aDsgKytpIClcbiAgICAgICAgICAgICAgICB0aGlzLm5hdGl2ZVsgYWRkcnNbaV0gXSA9IGZ1bmM7XG5cbiAgICAgICAgICAgIGZ1bmMuY2FsbCggdGhpcyApO1xuICAgICAgICB9Y2F0Y2goZXgpe1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmMgPSBuZXcgRnVuY3Rpb24oIGNvZGUgKTtcbiAgICAgICAgICAgICAgICBmdW5jLmNhbGwoIHRoaXMgKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH1cblxuICAgIGlkZW50aWZ5KCl7XG5cbiAgICAgICAgLy8gaWYoIHRoaXMucGM8PDEgPT0gMHg5NjYgKSBkZWJ1Z2dlcjtcblxuICAgICAgICBsZXQgcHJvZyA9IHRoaXMucHJvZywgXG4gICAgICAgICAgICBjb2RlYyA9IHRoaXMuY29kZWMsIFxuICAgICAgICAgICAgYnl0ZXMsXG4gICAgICAgICAgICBoLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGk9MCwgXG4gICAgICAgICAgICBsID0gY29kZWMubGVuZ3RoLFxuICAgICAgICAgICAgcGMgPSB0aGlzLnBjO1xuXG4gICAgICAgIGxldCBieXRlczIsIGJ5dGVzNDtcbiAgICAgICAgYnl0ZXMyID0gcHJvZ1twY10gPj4+IDA7XG4gICAgICAgIGJ5dGVzNCA9ICgoYnl0ZXMyIDw8IDE2KSB8IChwcm9nW3BjKzFdKSkgPj4+IDA7XG5cbiAgICAgICAgbGV0IHZlcmJvc2UgPSAxO1xuXG4gICAgICAgIGZvciggOyBpPGw7ICsraSApe1xuXG4gICAgICAgICAgICB2YXIgZGVzYyA9IGNvZGVjW2ldO1xuICAgICAgICAgICAgdmFyIG9wY29kZSA9IGRlc2Mub3Bjb2RlPj4+MDtcbiAgICAgICAgICAgIHZhciBtYXNrID0gZGVzYy5tYXNrPj4+MDtcbiAgICAgICAgICAgIHZhciBzaXplID0gZGVzYy5ieXRlcztcblxuICAgICAgICAgICAgaWYoIHNpemUgPT09IDQgKXtcblxuICAgICAgICAgICAgICAgIGlmKCB2ZXJib3NlPT0yIHx8IHZlcmJvc2UgPT0gZGVzYy5uYW1lIClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGRlc2MubmFtZSArIFwiXFxuXCIgKyBiaW4oYnl0ZXM0ICYgbWFzaywgOCo0KSArIFwiXFxuXCIgKyBiaW4ob3Bjb2RlLCA4KjQpICk7XG5cbiAgICAgICAgICAgICAgICBpZiggKGJ5dGVzNCAmIG1hc2spPj4+MCAhPT0gb3Bjb2RlIClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgYnl0ZXMgPSBieXRlczQ7XG5cbiAgICAgICAgICAgIH1lbHNle1xuXG5cbiAgICAgICAgICAgICAgICBpZiggdmVyYm9zZT09MiB8fCB2ZXJib3NlID09IGRlc2MubmFtZSApXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBkZXNjLm5hbWUgKyBcIlxcblwiICsgYmluKGJ5dGVzMiAmIG1hc2ssIDgqMikgKyBcIlxcblwiICsgYmluKG9wY29kZSwgOCoyKSApO1xuXG4gICAgICAgICAgICAgICAgaWYoIChieXRlczIgJiBtYXNrKT4+PjAgIT09IG9wY29kZSApXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMyO1xuXG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgdGhpcy5pbnN0cnVjdGlvbiA9IGRlc2M7XG5cbiAgICAgICAgICAgIC8vIHZhciBsb2cgPSBkZXNjLm5hbWUgKyBcIiBcIjtcblxuICAgICAgICAgICAgZm9yKCB2YXIgayBpbiBkZXNjLmFyZ3MgKXtcbiAgICAgICAgICAgICAgICBtYXNrID0gZGVzYy5hcmdzW2tdO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgaCA9IDA7XG4gICAgICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUoIG1hc2sgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIG1hc2smMSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgfD0gKChieXRlcz4+aCkmMSkgPDwgajtcbiAgICAgICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtYXNrID0gbWFzayA+Pj4gMTtcbiAgICAgICAgICAgICAgICAgICAgaCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXNjLmFyZ3Zba10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAvLyBsb2cgKz0gayArIFwiOlwiICsgdmFsdWUgKyBcIiAgXCJcbiAgICAgICAgICAgIH1cblx0ICAgIGRlc2MuZGVjYnl0ZXMgPSBieXRlcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGxvZyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RydWN0aW9uO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuZXJyb3IgPSBcIiNcIiArICh0aGlzLnBjPDwxKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSArIGAgb3Bjb2RlOiBgICsgYmluKGJ5dGVzMiwgMTYpO1xuXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgfVxuXG4gICAgZ2V0IHN0YXR1c0koKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDw3KTsgfVxuICAgIGdldCBzdGF0dXNUKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8Nik7IH1cbiAgICBnZXQgc3RhdHVzSCgpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDUpOyB9XG4gICAgZ2V0IHN0YXR1c1MoKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDw0KTsgfVxuICAgIGdldCBzdGF0dXNWKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8Myk7IH1cbiAgICBnZXQgc3RhdHVzTigpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDIpOyB9XG4gICAgZ2V0IHN0YXR1c1ooKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDwxKTsgfVxuICAgIGdldCBzdGF0dXNDKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8MCk7IH1cblxuXG4gICAgaW50ZXJydXB0KCBzb3VyY2UgKXtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIklOVEVSUlVQVCBcIiArIHNvdXJjZSk7XG5cbiAgICAgICAgbGV0IGFkZHIgPSB0aGlzLmludGVycnVwdE1hcFtzb3VyY2VdO1xuICAgICAgICB2YXIgcGMgPSB0aGlzLnBjO1xuICAgICAgICB0aGlzLm1lbW9yeVt0aGlzLnNwLS1dID0gcGM+Pjg7XG4gICAgICAgIHRoaXMubWVtb3J5W3RoaXMuc3AtLV0gPSBwYztcbiAgICAgICAgdGhpcy5tZW1vcnlbMHg1Rl0gJj0gfigxPDw3KTsgLy8gZGlzYWJsZSBpbnRlcnJ1cHRzXG4gICAgICAgIHRoaXMucGMgPSBhZGRyO1xuXG4gICAgfVxuXG4gICAgZ2V0T3Bjb2RlSW1wbCggaW5zdCwgc3RyICl7XG4gICAgICAgIHZhciBpLCBsLCBvcCA9IHtiZWdpbjpcIlwiLCBlbmQ6XCJcIiwgc3JEaXJ0eTowfTtcblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheShzdHIpICl7XG4gICAgICAgICAgICBmb3IoIGkgPSAwLCBsPXN0ci5sZW5ndGg7IGk8bDsgKytpICl7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMuZ2V0T3Bjb2RlSW1wbCggaW5zdCwgc3RyW2ldICk7XG4gICAgICAgICAgICAgICAgb3AuYmVnaW4gKz0gdG1wLmJlZ2luICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICBvcC5lbmQgKz0gdG1wLmVuZCArIFwiXFxuXCI7XG4gICAgICAgICAgICAgICAgb3Auc3JEaXJ0eSB8PSB0bXAuc3JEaXJ0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcmMgPSBzdHIsIGFyZ3YgPSBpbnN0LmFyZ3Y7XG5cbiAgICAgICAgZm9yKCB2YXIgayBpbiBhcmd2IClcbiAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdChrLnRvTG93ZXJDYXNlKCkpLmpvaW4oYXJndltrXSk7XG5cbiAgICAgICAgdmFyIFNSU3luYyA9IFwiXCIsIFNSRGlydHkgPSAwO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrihpBcXHMqMTs/XFxzKiQvZywgKG0sIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgU1JEaXJ0eSB8PSAxIDw8IGJpdDtcbiAgICAgICAgICAgIHJldHVybiBgc3Ike2JpdH0gPSAxO1xcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1JAKFswLTldKylcXHMq4oaQXFxzKjA7P1xccyokL2csIChtLCBiaXQsIGFzc2lnbik9PntcbiAgICAgICAgICAgIFNSRGlydHkgfD0gMSA8PCBiaXQ7XG4gICAgICAgICAgICByZXR1cm4gYHNyJHtiaXR9ID0gMDtcXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSKFswLTldKylcXHMqPSguKikvZywgKG0sIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgU1JEaXJ0eSB8PSAxIDw8IGJpdDtcbiAgICAgICAgICAgIHJldHVybiBgc3Ike2JpdH0gPSAke2Fzc2lnbn07XFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUlxccyrihpAvZywgKCkgPT4ge1xuICAgICAgICAgICAgU1JTeW5jID0gJ21lbW9yeVsweDVGXSA9IHNyOyBzcjA9c3ImMTsgc3IxPShzcj4+MSkmMTsgc3IyPShzcj4+MikmMTsgc3IzPShzcj4+MykmMTsgc3I0PShzcj4+NCkmMTsgc3I1PShzcj4+NSkmMTsgc3I2PShzcj4+NikmMTsgc3I3PShzcj4+NykmMTsnO1xuICAgICAgICAgICAgcmV0dXJuICdzciA9JztcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBTUkRpcnR5IHw9IDEgPDwgYml0O1xuICAgICAgICAgICAgcmV0dXJuIGBzciR7Yml0fSA9ICghISgke2Fzc2lnbn0pKXwwO2A7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1JcXHMqwq8vZywgJyh+c3IpJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrCry9nLCAnKH5zciQxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSQChbMC05XSspXFxzKi9nLCAnKHNyJDEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1IvZywgJ3NyJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKylcXHMq4oaQL2csICdyID0gd3JlZ1skMV0gPScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKUAoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgbnVtLCBiaXQsIGFzc2lnbik9PmByID0gd3JlZ1ske251bX1dID0gKHdyZWdbJHtudW19XSAmIH4oMTw8JHtiaXR9KSkgfCAoKCghISgke2Fzc2lnbn0pKXwwKTw8JHtiaXR9KTtgKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKylcXHMqwq8vZywgJyh+d3JlZ1skMV0pICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKUAoWzAtOV0rKVxccyrCry9nLCAnKH4od3JlZ1skMV0+Pj4kMikmMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9XUihbMC05XSspQChbMC05XSspXFxzKi9nLCAnKCh3cmVnWyQxXT4+PiQyKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKykvZywgJ3dyZWdbJDFdJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9cXHMq4oaQL2csIChtLCBudW0sIG51bWFkZCkgPT57IFxuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICBvcC5lbmQgKz0gYHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSByO1xcbmA7IFxuICAgICAgICAgICAgcmV0dXJuICdyID0gJzsgXG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP0AoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgbnVtLCBudW1hZGQsIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICBvcC5lbmQgKz0gYHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSByO1xcbmBcbiAgICAgICAgICAgIHJldHVybiBgciA9IChyZWdbKCR7bnVtfSkke251bWFkZH1dICYgfigxPDwke2JpdH0pKSB8ICgoKCEhKCR7YXNzaWdufSkpfDApPDwke2JpdH0pO2A7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/XFxzKj1cXHMrL2csIChtLCBudW0sIG51bWFkZCkgPT57IFxuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICByZXR1cm4gYHIgPSByZWdbKCR7bnVtfSkke251bWFkZH1dID0gYDsgXG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP0AoWzAtOV0rKVxccyo9XFxzKyguKikkL2csIChtLCBudW0sIG51bWFkZCwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBudW1hZGQgPSBudW1hZGQgfHwgXCJcIjtcbiAgICAgICAgICAgIHJldHVybiBgciA9IHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSAocmVnWygke251bX0pJHtudW1hZGR9XSAmIH4oMTw8JHtiaXR9KSkgfCAoKCghISgke2Fzc2lnbn0pKXwwKTw8JHtiaXR9KTtgO1xuICAgICAgICB9KTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP1xccyrCry9nLCAnKH5yZWdbKCQxKSQyXSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/QChbMC05XSspXFxzKsKvL2csICcofihyZWdbKCQxKSQyXT4+PiQzKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9AKFswLTldKylcXHMqL2csICcoKHJlZ1soJDEpJDJdPj4+JDMpJjEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspPy9nLCAnKHJlZ1soJDEpJDJdPj4+MCknKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUkAoWzAtOV0rKVxccyrCry9nLCAnKH4ocj4+PiQxKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1JAKFswLTldKylcXHMqL2csICcoKHI+Pj4kMSkmMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9JXFwvTy9nLCAnaW8nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IvZywgJ3InKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvRkxBU0hcXCgoW1hZWl0pXFwpXFxzKuKGkCguKik7PyQvZywgKG0sIG4sIHYpID0+ICdmbGFzaFsgd3JlZ1snICsgKG4uY2hhckNvZGVBdCgwKS04NykgKyAnXSBdID0gJyArIHYgKyAnOycpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvRkxBU0hcXCgoW1hZWl0pXFwpL2csIChtLCBuKSA9PiAnZmxhc2hbIHdyZWdbJyArIChuLmNoYXJDb2RlQXQoMCktODcpICsgJ10gXScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFwoKFtYWVpdKShcXCtbMC05XSspP1xcKVxccyrihpAoLiopOz8kL2csIChtLCBuLCBvZmYsIHYpID0+ICd0aGlzLndyaXRlKCB3cmVnWycgKyAobi5jaGFyQ29kZUF0KDApLTg3KSArICddJyArIChvZmZ8fCcnKSArICcsICcgKyB2ICsgJyk7Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXCgoW1hZWl0pKFxcK1swLTldKyk/XFwpL2csIChtLCBuLCBvZmYpID0+ICd0aGlzLnJlYWQoIHdyZWdbJyArIChuLmNoYXJDb2RlQXQoMCktODcpICsgJ10nICsgKG9mZnx8JycpICsgJywgdGhpcy5wYyApJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKFNUQUNLXFwpXFxzKuKGkC9nLCAobSwgbikgPT4gJ21lbW9yeVtzcC0tXSA9Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXCgoU1RBQ0spXFwpL2csIChtLCBuKSA9PiAnbWVtb3J5Wysrc3BdJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXChTVEFDSzJcXClcXHMq4oaQKC4qKS9nLCAndDEgPSAkMTtcXG5tZW1vcnlbc3AtLV0gPSB0MT4+ODtcXG5tZW1vcnlbc3AtLV0gPSB0MTtcXG4nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKChTVEFDSzIpXFwpL2csICcobWVtb3J5Wysrc3BdICsgKG1lbW9yeVsrK3NwXTw8OCkpJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL+KKlS9nLCAnXicpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgv4oCiL2csICcmJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL2lvXFxbKFswLTldKylcXF1cXHMq4oaQKC4qPyk7PyQvZywgJ3RoaXMud3JpdGUoIDMyKyQxLCAkMiApJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9pb1xcWyhbMC05XSspQChbMC05XSspXFxdXFxzKuKGkCguKj8pOz8kL2csICd0aGlzLndyaXRlQml0KCAzMiskMSwgJDIsICQzICknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL2lvXFxbKFswLTkrPF0rKUAoWzAtOV0rKVxcXS9nLCAndGhpcy5yZWFkQml0KCAzMiskMSwgJDIsIHRoaXMucGMgKScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvaW9cXFsoWzAtOSs8XSspXFxdL2csICd0aGlzLnJlYWQoIDMyKyQxLCB0aGlzLnBjICknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NQL2csICdzcCcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUENcXHMq4oaQKC4qKSQvZywgJ3QxID0gJDE7XFxuaWYoICF0MSApIChmdW5jdGlvbigpe2RlYnVnZ2VyO30pKCk7IHRoaXMucGMgPSB0MTsgYnJlYWs7XFxuJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9QQy9nLCAndGhpcy5wYycpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgv4oaQL2csICc9Jyk7XG5cblxuICAgICAgICBzdHIgPSAnLy8gJyArIHNyYy5yZXBsYWNlKC9bXFxuXFxyXStcXHMqL2csICdcXG5cXHQvLyAnKSArIFwiXFxuXCIgKyBzdHIgKyBcIlxcblwiO1xuICAgICAgICBcbiAgICAgICAgb3Auc3JEaXJ0eSA9IFNSRGlydHk7XG5cbiAgICAgICAgb3AuYmVnaW4gPSBzdHI7XG4gICAgICAgIG9wLmVuZCArPSBTUlN5bmM7XG5cbiAgICAgICAgcmV0dXJuIG9wO1xuICAgIH1cblxuICAgIHN0YXRpYyBBVG1lZ2EzMjhQKCl7XG5cbiAgICAgICAgbGV0IGNvcmUgPSBuZXcgQXRjb3JlKHtcbiAgICAgICAgICAgIGZsYXNoOiAzMiAqIDEwMjQsXG4gICAgICAgICAgICBlZXByb206IDEgKiAxMDI0LFxuICAgICAgICAgICAgc3JhbTogMiAqIDEwMjQsXG4gICAgICAgICAgICBjb2RlYzogQXRDT0RFQyxcbiAgICAgICAgICAgIGZsYWdzOiBBdEZsYWdzLFxuICAgICAgICAgICAgY2xvY2s6IDE2ICogMTAwMCAqIDEwMDAsIC8vIHNwZWVkIGluIGtIelxuICAgICAgICAgICAgcGVyaWZlcmFsczpyZXF1aXJlKCcuL0F0MzI4UC1wZXJpZmVyYWxzLmpzJyksXG4gICAgICAgICAgICBpbnRlcnJ1cHQ6e1xuICAgICAgICAgICAgICAgIFJFU0VUOiAweDAwMDAsICAvLyAgRXh0ZXJuYWwgcGluLCBwb3dlci1vbiByZXNldCwgYnJvd24tb3V0IHJlc2V0IGFuZCB3YXRjaGRvZyBzeXN0ZW0gcmVzZXRcbiAgICAgICAgICAgICAgICBJTlQwOiAweDAwMiAsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgMFxuICAgICAgICAgICAgICAgIElOVDE6IDB4MDAwNCwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAxXG4gICAgICAgICAgICAgICAgUENJTlQwOiAweDAwMDYsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAwXG4gICAgICAgICAgICAgICAgUENJTlQxOiAweDAwMDgsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAxXG4gICAgICAgICAgICAgICAgUENJTlQyOiAweDAwMEEsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAyXG4gICAgICAgICAgICAgICAgV0RUOiAweDAwMEMsICAvLyAgV2F0Y2hkb2cgdGltZS1vdXQgaW50ZXJydXB0XG4gICAgICAgICAgICAgICAgVElNRVIyQTogMHgwMDBFLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIyIGNvbXBhcmUgbWF0Y2ggQVxuICAgICAgICAgICAgICAgIFRJTUVSMkI6IDB4MDAxMCwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMiBjb21wYXJlIG1hdGNoIEJcbiAgICAgICAgICAgICAgICBUSU1FUjJPOiAweDAwMTIsICAvLyAgT1ZGIFRpbWVyL0NvdW50ZXIyIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgVElNRVIxQzogMHgwMDE0LCAgLy8gIENBUFQgVGltZXIvQ291bnRlcjEgY2FwdHVyZSBldmVudFxuICAgICAgICAgICAgICAgIFRJTUVSMUE6IDB4MDAxNiwgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEFcbiAgICAgICAgICAgICAgICBUSU1FUjFCOiAweDAwMTgsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBCXG4gICAgICAgICAgICAgICAgVElNRVIxTzogMHgwMDFBLCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMSBvdmVyZmxvd1xuICAgICAgICAgICAgICAgIFRJTUVSMEE6IDB4MDAxQywgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMCBjb21wYXJlIG1hdGNoIEFcbiAgICAgICAgICAgICAgICBUSU1FUjBCOiAweDAwMUUsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjAgY29tcGFyZSBtYXRjaCBCXG4gICAgICAgICAgICAgICAgVElNRVIwTzogMHgwMDIwLCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMCBvdmVyZmxvd1xuICAgICAgICAgICAgICAgIFNQSTogMHgwMDIyLCAgLy8gLCBTVEMgU1BJIHNlcmlhbCB0cmFuc2ZlciBjb21wbGV0ZVxuICAgICAgICAgICAgICAgIFVTQVJUUlg6IDB4MDAyNCwgIC8vICwgUlggVVNBUlQgUnggY29tcGxldGVcbiAgICAgICAgICAgICAgICBVU0FSVEU6IDB4MDAyNiwgIC8vICwgVURSRSBVU0FSVCwgZGF0YSByZWdpc3RlciBlbXB0eVxuICAgICAgICAgICAgICAgIFVTQVJUVFg6IDB4MDAyOCwgIC8vICwgVFggVVNBUlQsIFR4IGNvbXBsZXRlXG4gICAgICAgICAgICAgICAgQURDOiAweDAwMkEsICAvLyAgQURDIGNvbnZlcnNpb24gY29tcGxldGVcbiAgICAgICAgICAgICAgICBFRVJFQURZOiAweDAwMkMsICAvLyAgUkVBRFkgRUVQUk9NIHJlYWR5XG4gICAgICAgICAgICAgICAgQU5BTE9HOiAweDAwMkUsICAvLyAgQ09NUCBBbmFsb2cgY29tcGFyYXRvclxuICAgICAgICAgICAgICAgIFRXSTogMHgwMDMwLCAgLy8gIDItd2lyZSBzZXJpYWwgaW50ZXJmYWNlXG4gICAgICAgICAgICAgICAgU1BNOiAweDAwMzIgIC8vICBSRUFEWSBTdG9yZSBwcm9ncmFtIG1lbW9yeSByZWFkeSAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNvcmU7XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgQVRtZWdhMzJ1NCgpe1xuXG5cdGxldCBjb3JlID0gbmV3IEF0Y29yZSh7XG4gICAgICAgICAgICBmbGFzaDogMzIgKiAxMDI0LFxuICAgICAgICAgICAgZWVwcm9tOiAxICogMTAyNCxcbiAgICAgICAgICAgIHNyYW06IDIgKiAxMDI0ICsgNTEyLFxuICAgICAgICAgICAgY29kZWM6IEF0Q09ERUMsXG4gICAgICAgICAgICBmbGFnczogQXRGbGFncyxcbiAgICAgICAgICAgIGNsb2NrOiAxNiAqIDEwMDAgKiAxMDAwLCAvLyBzcGVlZCBpbiBrSHpcbiAgICAgICAgICAgIHBlcmlmZXJhbHM6cmVxdWlyZSgnLi9BdDMydTQtcGVyaWZlcmFscy5qcycpLFxuICAgICAgICAgICAgaW50ZXJydXB0Ontcblx0XHRSRVNFVDogMHgwMDAwLCAgLy8gIEV4dGVybmFsIHBpbiwgcG93ZXItb24gcmVzZXQsIGJyb3duLW91dCByZXNldCBhbmQgd2F0Y2hkb2cgc3lzdGVtIHJlc2V0XG5cdFx0SU5UMDogMHgwMDIgLCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDBcblx0XHRJTlQxOiAweDAwMDQsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgMVxuXHRcdElOVDI6IDB4MDAwNiwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAyXG5cdFx0SU5UMzogMHgwMDA4LCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDNcblx0XHRSRVNFUlZFRDA6IDB4MDAwQSxcblx0XHRSRVNFUlZFRDE6IDB4MDAwQyxcblx0XHRJTlQ2OiAweDAwMEUsICAgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCA2XG5cdFx0UENJTlQwOiAweDAwMTIsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAwXG5cdFx0VVNCR0VOOiAweDAwMTQsICAvLyBVU0IgR2VuZXJhbCBJbnRlcnJ1cHQgcmVxdWVzdFxuXHRcdFVTQkVORDogMHgwMDE2LCAgLy8gVVNCIEVuZHBvaW50IEludGVycnVwdCByZXF1ZXN0XG5cdFx0V0RUOiAweDAwMTgsICAgICAvLyAgV2F0Y2hkb2cgdGltZS1vdXQgaW50ZXJydXB0XG5cdFx0XG5cdFx0VElNRVIxQzogMHgwMDIwLCAgLy8gIENBUFQgVGltZXIvQ291bnRlcjEgY2FwdHVyZSBldmVudFxuXHRcdFRJTUVSMUE6IDB4MDAyMiwgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEFcblx0XHRUSU1FUjFCOiAweDAwMjQsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBCXG5cdFx0VElNRVIxQzogMHgwMDI2LCAgLy8gIENPTVBDIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQ1xuXHRcdFRJTUVSMU86IDB4MDAyOCwgIC8vICBPVkYgVGltZXIvQ291bnRlcjEgb3ZlcmZsb3dcblx0XHRUSU1FUjBBOiAweDAwMkEsICAvLyAgQ09NUEEgVGltZXIvQ291bnRlcjAgY29tcGFyZSBtYXRjaCBBXG5cdFx0VElNRVIwQjogMHgwMDJDLCAgLy8gIENPTVBCIFRpbWVyL0NvdW50ZXIwIGNvbXBhcmUgbWF0Y2ggQlxuXHRcdFRJTUVSME86IDB4MDAyRSwgIC8vICBPVkYgVGltZXIvQ291bnRlcjAgb3ZlcmZsb3dcblx0XHRcblx0XHRTUEk6IDB4MDAzMCwgIC8vICwgU1RDIFNQSSBzZXJpYWwgdHJhbnNmZXIgY29tcGxldGVcblx0XHRcblx0XHRVU0FSVFJYOiAweDAwMzIsICAvLyAsIFJYIFVTQVJUIFJ4IGNvbXBsZXRlXG5cdFx0VVNBUlRFOiAweDAwMzQsICAvLyAsIFVEUkUgVVNBUlQsIGRhdGEgcmVnaXN0ZXIgZW1wdHlcblx0XHRVU0FSVFRYOiAweDAwMzYsICAvLyAsIFRYIFVTQVJULCBUeCBjb21wbGV0ZVxuXG5cdFx0QU5BTE9HOiAweDAwMzgsIC8vIEFuYWxvZyBDb21wYXJhdG9yXG5cdFx0QURDOiAweDAwM0EsICAvLyAgQURDIGNvbnZlcnNpb24gY29tcGxldGVcblx0XHRcblx0XHRFRVJFQURZOiAweDAwM0MsICAvLyAgRUVQUk9NIHJlYWR5XG5cblx0XHRUSU1FUjNDOiAweDAwM0UsICAvLyAgQ0FQVCBUaW1lci9Db3VudGVyMSBjYXB0dXJlIGV2ZW50XG5cdFx0VElNRVIzQTogMHgwMDQwLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQVxuXHRcdFRJTUVSM0I6IDB4MDA0MiwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEJcblx0XHRUSU1FUjNDOiAweDAwNDQsICAvLyAgQ09NUEMgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBDXG5cdFx0VElNRVIzTzogMHgwMDQ2LCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMSBvdmVyZmxvd1xuXHRcdFxuXHRcdFxuXHRcdFRXSTogMHgwMDQ4LCAgLy8gIDItd2lyZSBzZXJpYWwgaW50ZXJmYWNlXG5cdFx0XG5cdFx0U1BNOiAweDAwNEEsICAvLyAgUkVBRFkgU3RvcmUgcHJvZ3JhbSBtZW1vcnkgcmVhZHlcblx0XHRcblx0XHRUSU1FUjRBOiAweDAwNEMsXG5cdFx0VElNRVI0QjogMHgwMDRFLFxuXHRcdFRJTUVSNEQ6IDB4MDA1MCxcblx0XHRUSU1FUjRPOiAweDAwNTIsXG5cdFx0VElNRVI0RlBGOiAweDAwNTRcbiAgICAgICAgICAgIH1cblx0fSk7XG5cblx0cmV0dXJuIGNvcmU7XG5cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gcGFyc2UoIG91dCApe1xuICAgIHZhciBvcGNvZGUgPSAwO1xuICAgIHZhciBtYXNrID0gMDtcbiAgICB2YXIgYXJncyA9IHt9O1xuXG4gICAgdmFyIHN0ciA9IG91dC5zdHIsIGw9c3RyLmxlbmd0aDtcbiAgICBmb3IoIHZhciBpPTA7IGk8bDsgKytpICl7XG4gICAgICAgIHZhciBjaHIgPSBzdHJbaV07XG4gICAgICAgIHZhciBiaXQgPSAobC1pLTEpPj4+MDtcbiAgICAgICAgaWYoIGNociA9PSAnMCcgKXtcbiAgICAgICAgICAgIG1hc2sgfD0gMTw8Yml0O1xuICAgICAgICB9ZWxzZSBpZiggY2hyID09ICcxJyApe1xuICAgICAgICAgICAgbWFzayB8PSAxPDxiaXQ7XG4gICAgICAgICAgICBvcGNvZGUgfD0gMTw8Yml0OyAgICAgICAgICAgIFxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKCAhKGNociBpbiBhcmdzKSApXG4gICAgICAgICAgICAgICAgYXJnc1tjaHJdID0gMDtcbiAgICAgICAgICAgIGFyZ3NbY2hyXSB8PSAxPDxiaXQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdXQub3Bjb2RlID0gb3Bjb2RlO1xuICAgIG91dC5tYXNrID0gbWFzaztcbiAgICBvdXQuYXJncyA9IGFyZ3M7XG4gICAgb3V0LmJ5dGVzID0gKGwvOCl8MDtcbn1cblxuY29uc3QgQXRDT0RFQyA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBREMnLFxuICAgICAgICBzdHI6ICcwMDAxMTFyZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogJ1JkIOKGkCBSZCArIFJyICsgU1JAMDsnLFxuICAgICAgICBmbGFnczonaHp2bnNjJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQUREJyxcbiAgICAgICAgc3RyOiAnMDAwMDExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6ICdSZCDihpAgUmQgKyBScjsnLFxuICAgICAgICBmbGFnczonaHp2bnNjJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTVVMJyxcbiAgICAgICAgc3RyOiAnMTAwMTExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICd0MSA9IFJkICogUnInLFxuICAgICAgICAgICAgJ1IwID0gdDEnLFxuICAgICAgICAgICAgJ1IxID0gdDEgPj4gOCcsXG4gICAgICAgICAgICAnU1IxID0gIXQxfDAnLFxuICAgICAgICAgICAgJ1NSMCA9ICh0MT4+MTUpJjEnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOidodm5zYydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0FESVcnLFxuICAgICAgICBzdHI6ICcxMDAxMDExMEtLZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1dSZCDihpAgV1JkICsgazsnLFxuICAgICAgICBdLFxuICAgICAgICBmbGFnczonWlZOU0MnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBTkQnLFxuICAgICAgICBzdHI6ICcwMDEwMDByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCBSZCDigKIgUnI7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQU5ESScsXG4gICAgICAgIHN0cjogJzAxMTFLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQrMTYg4oaQIFJkKzE2IOKAoiBrOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0FTUicsXG4gICAgICAgIHN0cjogJzEwMDEwMTBkZGRkZDAxMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnU1JAMCDihpAgUmQg4oCiIDEnLFxuICAgICAgICAgICAgJ1JkIOKGkCBSZCA+PiAxOydcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJpJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMTExMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkA3IOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnQnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDExMTAxMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDYg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSaCcsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTEwMTEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JANSDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJzJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMTAwMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkA0IOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnYnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDEwMTExMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDMg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSbicsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTAxMDEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JAMiDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJ6JyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMDAxMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkAxIOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUmMnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDEwMDAxMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDAg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkNDJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMDAwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JAMCApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSQlMnLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2tzc3MnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQHMgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkJDJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trc3NzJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JAcyApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSQ1MnLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2swMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQDAgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkVRJyxcbiAgICAgICAgc3RyOicxMTExMDBra2tra2trMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCBTUkAxICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogM1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJMVCcsXG4gICAgICAgIHN0cjonMTExMTAwa2tra2trazEwMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggU1JANCApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSR0UnLFxuICAgICAgICBzdHI6JzExMTEwMWtra2tra2sxMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoICFTUkA0ICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogM1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJORScsXG4gICAgICAgIHN0cjonMTExMTAxa2tra2trazAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggIVNSQDEgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAzXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUlBMJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JAMiApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSTUknLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2swMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQDIgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUlRDJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMTEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JANiApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JTVCcsXG4gICAgICAgIHN0cjonMTExMTEwMWRkZGRkMGJiYicsXG4gICAgICAgIGltcGw6ICdTUjYgPSBSZEBiJ1xuICAgICAgICAvLyxkZWJ1ZzogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkxEJyxcbiAgICAgICAgc3RyOicxMTExMTAwZGRkZGQwYmJiJyxcbiAgICAgICAgaW1wbDogJ1JkQGIg4oaQIFNSQDYnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDQUxMJyxcbiAgICAgICAgc3RyOicxMDAxMDEwa2tra2sxMTFra2tra2tra2tra2tra2traycsXG4gICAgICAgIGN5Y2xlczo0LFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnKFNUQUNLMikg4oaQIFBDICsgMicsXG4gICAgICAgICAgICAnUEMg4oaQIGsnXG4gICAgICAgICAgICBdXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdDQkknLFxuXHRzdHI6ICcxMDAxMTAwMEFBQUFBYmJiJyxcblx0aW1wbDogJ0kvT1thQGJdIOKGkCAwOydcbiAgICB9LCAgICBcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDT00nLFxuICAgICAgICBzdHI6JzEwMDEwMTBkZGRkZDAwMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIH4gUmQ7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ3pucydcbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ0ZNVUwnLFxuXHRzdHI6JzAwMDAwMDExMGRkZDFycnInLFxuXHRpbXBsOltcblx0ICAgICd0MSA9IFJkKzE2ICogUnIrMTYgPDwgMScsXG4gICAgICAgICAgICAnUjAgPSB0MScsXG4gICAgICAgICAgICAnUjEgPSB0MSA+PiA4JyxcbiAgICAgICAgICAgICdTUjEgPSAhdDF8MCcsXG4gICAgICAgICAgICAnU1IwID0gKHQxPj4xNSkmMSdcblx0XVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTk9QJyxcbiAgICAgICAgc3RyOicwMDAwMDAwMDAwMDAwMDAwJyxcbiAgICAgICAgaW1wbDonJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTkVHJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQwMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAtIFJkOycsXG4gICAgICAgICAgICAnU1IzID0gUkA3IOKAoiBSQDYgwq8g4oCiIFJANSDCryDigKIgUkA0IMKvIOKAoiBSQDMgwq8g4oCiIFJAMiDCryDigKIgUkAxIMKvIOKAoiBSQDAgwq8nLFxuICAgICAgICAgICAgJ1NSMCA9ICghIVIpfDAnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIFJAMyB8IFJkMyDCrydcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDUCcsXG4gICAgICAgIHN0cjonMDAwMTAxcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSID0gKChSZCAtIFJyKSA+Pj4gMCkgJiAweEZGOycsXG4gICAgICAgICAgICAnU1JANSDihpAgKFJkQDMgwq8g4oCiIFJyQDMpIHwgKFJyQDMg4oCiIFJAMykgfCAoUkAzIOKAoiBSZEAzIMKvKScsXG4gICAgICAgICAgICAnU1JAMCDihpAgKFJkQDcgwq8g4oCiIFJyQDcpIHwgKFJyQDcg4oCiIFJANykgfCAoUkA3IOKAoiBSZEA3IMKvKScsXG4gICAgICAgICAgICAnU1JAMyDihpAgKFJkQDcg4oCiIFJyQDcgwq8g4oCiIFJANyDCrykgKyAoUmRANyDCryDigKIgUnJANyDigKIgUkA3KSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDUEknLFxuICAgICAgICBzdHI6JzAwMTFLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUiA9ICgoUmQrMTYgLSBrKSA+Pj4gMCkgJiAweEZGOycsXG4gICAgICAgICAgICAnU1JANSDihpAgKFJkKzE2QDMgwq8g4oCiICgoaz4+MykmMSkpIHwgKCgoaz4+MykmMSkg4oCiIFJAMykgfCAoUkAzIOKAoiBSZCsxNkAzIMKvKScsXG4gICAgICAgICAgICAnU1JAMCDihpAgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkpIHwgKCgoaz4+NykmMSkg4oCiIFJANykgfCAoUkA3IOKAoiBSZCsxNkA3IMKvKScsXG4gICAgICAgICAgICAnU1JAMyDihpAgKFJkKzE2QDcg4oCiICgoaz4+NykmMV4xKSDigKIgUkA3IMKvKSArIChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpIOKAoiBSQDcpJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0NQQycsXG4gICAgICAgIHN0cjonMDAwMDAxcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSID0gKFJkIC0gUnIgLSBTUkAwKSAmIDB4RkYnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknLFxuICAgICAgICAgICAgJ1NSQDEg4oaQICghUikgJiBTUkAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ25zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ1BTRScsXG4gICAgICAgIHN0cjogJzAwMDEwMHJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiAnU0tJUCDihpAgUnIgPT0gUmQnLFxuICAgICAgICBza2lwOiB0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdERUMnLFxuICAgICAgICBzdHI6JzEwMDEwMTBkZGRkZDEwMTAnLFxuICAgICAgICBpbXBsOltcbiAgICAgICAgICAgICdSZCDihpAgUmQgLSAxJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCBSQDcgwq8g4oCiIFJANiDigKIgUkA1IOKAoiBSQDQg4oCiIFJAMyDigKIgUkAyIOKAoiBSQDEg4oCiIFJAMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdFT1InLFxuICAgICAgICBzdHI6JzAwMTAwMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIOKKlSBScjsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIDAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiAnem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSUNBTEwnLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMDAwMDEwMDEnLFxuICAgICAgICBjeWNsZXM6MyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJyhTVEFDSzIpIOKGkCBQQyArIDInLFxuICAgICAgICAgICAgJ1BDIOKGkCBXUjMnXG4gICAgICAgICAgICBdXG4gICAgICAgIC8vIGVuZDp0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdJTlNSJyxcbiAgICAgICAgc3RyOicxMDExMDExZGRkZGQxMTExJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBTUmAsXG4gICAgICAgIGN5Y2xlczogMVxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSU4nLFxuICAgICAgICBzdHI6JzEwMTEwQUFkZGRkZDExMTAnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIHNwPj4+OGAsXG4gICAgICAgIGN5Y2xlczogMVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSU4nLFxuICAgICAgICBzdHI6JzEwMTEwQUFkZGRkZDExMDEnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIHNwJjB4RkZgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOJyxcbiAgICAgICAgc3RyOicxMDExMEFBZGRkZGRBQUFBJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBJL09bYV1gLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOQycsXG4gICAgICAgIHN0cjogJzEwMDEwMTBkZGRkZDAwMTEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkICsgMTsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIFJANyDigKIgUkA2IMKvIOKAoiBSQDUgwq8g4oCiIFJANCDCryDigKIgUkAzIMKvIOKAoiBSQDIgwq8g4oCiIFJAMSDCryDigKIgUkAwIMKvJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSUpNUCcsXG4gICAgICAgIHN0cjonMTAwMTAxMDAwMDAwMTAwMScsXG4gICAgICAgIGltcGw6IGBQQyDihpAgV1IzYCxcbiAgICAgICAgY3ljbGVzOiAyLFxuICAgICAgICBlbmQ6dHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSk1QJyxcbiAgICAgICAgc3RyOicxMDAxMDEwa2tra2sxMTBra2tra2tra2tra2tra2traycsXG4gICAgICAgIGltcGw6IGBQQyDihpAga2AsXG4gICAgICAgIGN5Y2xlczogMyxcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xESScsXG4gICAgICAgIHN0cjonMTExMEtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6J1JkKzE2IOKGkCBrJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERTJyxcbiAgICAgICAgc3RyOicxMDAxMDAweHh4eHgwMDAwa2tra2tra2tra2tra2traycsXG4gICAgICAgIGltcGw6J1J4IOKGkCB0aGlzLnJlYWQoayknLFxuICAgICAgICBieXRlczogNFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERYJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTAwJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCAoWCk7YCxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFgrJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFJkIOKGkCAoWCk7YCxcbiAgICAgICAgICAgIGBXUjEgKys7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWC0nLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDExMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IxIC0tO2AsXG4gICAgICAgICAgICBgUmQg4oaQIChYKTtgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFknLFxuICAgICAgICBzdHI6JzEwMDAwMDBkZGRkZDEwMDAnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIChZKWAsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERZKycsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBSZCDihpAgKFkpO2AsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFktJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMyAtLTtgLFxuICAgICAgICAgICAgYFJkIOKGkCAoWSk7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWVEnLFxuICAgICAgICBzdHI6JzEwcTBxcTBkZGRkZDFxcXEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChZK3EpO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcblxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWicsXG4gICAgICAgIHN0cjonMTAwMDAwMGRkZGRkMDAwMCcsXG4gICAgICAgIGltcGw6IGBSZCDihpAgKFopO2AsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERaKycsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBSZCDihpAgKFopO2AsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFotJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQwMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMyAtLTtgLFxuICAgICAgICAgICAgYFJkIOKGkCAoWik7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWlEnLFxuICAgICAgICBzdHI6JzEwcTBxcTBkZGRkZDBxcXEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChaK3EpO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcblxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xQTWknLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMTEwMDEwMDAnLFxuICAgICAgICBpbXBsOidSMCDihpAgRkxBU0goWiknXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMUE1paScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDEwMCcsXG4gICAgICAgIGltcGw6J1JkIOKGkCBGTEFTSChaKSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xQTWlpaScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDEwMScsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1JkIOKGkCBGTEFTSChaKTsnLFxuICAgICAgICAgICAgJ1dSMyArKzsnXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xTUicsXG4gICAgICAgIHN0cjonMTAwMTAxMGRkZGRkMDExMCcsXG4gICAgICAgIC8vIGRlYnVnOnRydWUsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1NSMCA9IFJkQDAnLFxuICAgICAgICAgICAgJ1JkIOKGkCBSZCA+Pj4gMScsXG4gICAgICAgICAgICAnU1IyID0gMCcsXG4gICAgICAgICAgICAnU1IzID0gU1JAMiBeIFNSMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pzJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTU9WJyxcbiAgICAgICAgc3RyOiAnMDAxMDExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCDihpAgUnI7J1xuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdNT1ZXJyxcbiAgICAgICAgc3RyOicwMDAwMDAwMWRkZGRycnJyJyxcbiAgICAgICAgaW1wbDpbXG4gICAgICAgICAgICAnUmQ8PDEgPSBScjw8MScsXG4gICAgICAgICAgICAnUmQ8PDErMSA9IFJyPDwxKzEnXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ01VTFNVJyxcblx0c3RyOicwMDAwMDAxMTBkZGQwcnJyJyxcblx0aW1wbDpbXG5cdCAgICAnaThhWzBdID0gUmQrMTYnLFxuXHQgICAgJ3QxID0gaThhWzBdICogUnIrMTYnLFxuICAgICAgICAgICAgJ1IwID0gdDEnLFxuICAgICAgICAgICAgJ1IxID0gdDEgPj4gOCcsXG4gICAgICAgICAgICAnU1IxID0gIXQxfDAnLFxuICAgICAgICAgICAgJ1NSMCA9ICh0MT4+MTUpJjEnXG5cdF1cbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ01VTFMnLFxuXHRzdHI6JzAwMDAwMDEwZGRkZHJycnInLFxuXHRpbXBsOltcblx0ICAgICdpOGFbMF0gPSBSZCsxNicsXG5cdCAgICAnaThhWzFdID0gUnIrMTYnLFxuXHQgICAgJ3QxID0gaThhWzBdICogaThhWzFdJyxcbiAgICAgICAgICAgICdSMCA9IHQxJyxcbiAgICAgICAgICAgICdSMSA9IHQxID4+IDgnLFxuICAgICAgICAgICAgJ1NSMSA9ICF0MXwwJyxcbiAgICAgICAgICAgICdTUjAgPSAodDE+PjE1KSYxJ1xuXHRdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPUicsXG4gICAgICAgIHN0cjogJzAwMTAxMHJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIHwgUnI7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnT1JJJyxcbiAgICAgICAgc3RyOiAnMDExMEtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCsxNiDihpAgUmQrMTYgfCBrOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09VVHNyJyxcbiAgICAgICAgc3RyOicxMDExMTExcnJycnIxMTExJyxcbiAgICAgICAgaW1wbDogJ0kvT1s2M10g4oaQIFNSIOKGkCBScicsXG4gICAgICAgIGN5Y2xlczogMVxuICAgIH0sICAgIFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09VVHNwaCcsXG4gICAgICAgIHN0cjonMTAxMTExMXJycnJyMTExMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdJL09bNjJdIOKGkCBScjsnLFxuICAgICAgICAgICAgJ3NwID0gKGlvWzYyXTw8OCkgfCAoc3AmMHhGRik7J1xuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LCAgICBcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPVVRzcGwnLFxuICAgICAgICBzdHI6JzEwMTExMTFycnJycjExMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnSS9PWzYxXSDihpAgUnI7JyxcbiAgICAgICAgICAgICdzcCA9IChzcCYweEZGMDApIHwgaW9bNjFdOydcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSwgICAgXG4gICAge1xuICAgICAgICBuYW1lOiAnT1VUJyxcbiAgICAgICAgc3RyOicxMDExMUFBcnJycnJBQUFBJyxcbiAgICAgICAgaW1wbDogYEkvT1thXSDihpAgUnJgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1BVU0gnLFxuICAgICAgICBzdHI6JzEwMDEwMDFkZGRkZDExMTEnLFxuICAgICAgICBpbXBsOicoU1RBQ0spIOKGkCBSZCcsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUE9QJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTExJyxcbiAgICAgICAgaW1wbDonUmQg4oaQIChTVEFDSyknLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JFVCcsXG4gICAgICAgIHN0cjonMTAwMTAxMDEwMDAwMTAwMCcsXG4gICAgICAgIGN5Y2xlczo0LFxuICAgICAgICBlbmQ6dHJ1ZSxcbiAgICAgICAgaW1wbDogJ1BDIOKGkCAoU1RBQ0syKSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JFVEknLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMDAwMTEwMDAnLFxuICAgICAgICBjeWNsZXM6NCxcbiAgICAgICAgZW5kOnRydWUsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ21lbW9yeVsweDVGXSA9IChTUiB8PSAxPDw3KTsnLFxuICAgICAgICAgICAgJ1BDIOKGkCAoU1RBQ0syKSdcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUk9SJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQwMTExJyxcbiAgICAgICAgaW1wbDpbXG4gICAgICAgICAgICAnU1IwID0gUmRAMCcsXG4gICAgICAgICAgICAnUmQg4oaQIFJkID4+PiAxIHwgKFNSPDw3JjB4ODApJyxcbiAgICAgICAgICAgICdTUjIgPSBSPj43JyxcbiAgICAgICAgICAgICdTUjMgPSBTUkAyIF4gU1IwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonenMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdIQUxUJyxcbiAgICAgICAgc3RyOicxMTAwMTExMTExMTExMTExJyxcbiAgICAgICAgaW1wbDogYFBDIOKGkCBQQyAtIDFgLFxuICAgICAgICBlbmQ6dHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUkNBTEwnLFxuICAgICAgICBzdHI6JzExMDFra2tra2tra2tra2snLFxuICAgICAgICBjeWNsZXM6MyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJyhTVEFDSzIpIOKGkCBQQyArIDEnLFxuICAgICAgICAgICAgYFBDIOKGkCBQQyArIChrIDw8IDIwID4+IDIwKSArIDFgXG4gICAgICAgIF0sXG4gICAgICAgIGVuZDpmYWxzZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUkpNUCcsXG4gICAgICAgIHN0cjonMTEwMGtra2tra2tra2traycsXG4gICAgICAgIGltcGw6IGBQQyDihpAgUEMgKyAoayA8PCAyMCA+PiAyMCkgKyAxYCxcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NFQycsXG4gICAgICAgIHN0cjonMTAwMTAxMDAwMDAwMTAwMCcsXG4gICAgICAgIGltcGw6IGBTUkAwIOKGkCAxYFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0VUJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMDAxMTAxMDAwJyxcbiAgICAgICAgaW1wbDogYFNSQDYg4oaQIDFgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTRUknLFxuICAgICAgICBzdHI6JzEwMDEwMTAwMDExMTEwMDAnLFxuICAgICAgICBpbXBsOiBgU1JANyDihpAgMWBcbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ1NGTVVMJyxcblx0c3RyOicwMDAwMDAxMTFkZGQwcnJyJyxcblx0aW1wbDpbXG5cdCAgICAnaThhWzBdID0gUmQrMTYnLFxuXHQgICAgJ2k4YVsxXSA9IFJyKzE2Jyxcblx0ICAgICd0MSA9IGk4YVswXSAqIGk4YVsxXSA8PCAxJyxcbiAgICAgICAgICAgICdSMCA9IHQxJyxcbiAgICAgICAgICAgICdSMSA9IHQxID4+IDgnLFxuICAgICAgICAgICAgJ1NSMSA9ICF0MXwwJyxcbiAgICAgICAgICAgICdTUjAgPSAodDE+PjE1KSYxJ1xuXHRdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFMnLFxuICAgICAgICBzdHI6JzEwMDEwMDFkZGRkZDAwMDBra2tra2tra2tra2tra2trJyxcbiAgICAgICAgaW1wbDogYHRoaXMud3JpdGUoIGssIFJkIClgLFxuICAgICAgICBieXRlczogNFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RYJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMTAwJyxcbiAgICAgICAgaW1wbDogYChYKSDihpAgUnJgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFgrJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMTAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChYKSDihpAgUnJgLFxuICAgICAgICAgICAgYFdSMSArKztgXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWC0nLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjExMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IxIC0tO2AsXG4gICAgICAgICAgICBgKFgpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFknLFxuICAgICAgICBzdHI6JzEwMDAwMDFycnJycjEwMDAnLFxuICAgICAgICBpbXBsOiBgKFkpIOKGkCBScmBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWSsnLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjEwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgKFkpIOKGkCBScmAsXG4gICAgICAgICAgICBgV1IxICsrO2BcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RZLScsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMTAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjEgLS07YCxcbiAgICAgICAgICAgIGAoWSkg4oaQIFJyYFxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFlRJyxcbiAgICAgICAgc3RyOicxMHEwcXExcnJycnIxcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChZK3EpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFonLFxuICAgICAgICBzdHI6JzEwMDAwMDFycnJycjAwMDAnLFxuICAgICAgICBpbXBsOiBgKFopIOKGkCBScmBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWisnLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjAwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgKFopIOKGkCBScmAsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RaLScsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMDAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjMgLS07YCxcbiAgICAgICAgICAgIGAoWikg4oaQIFJyYFxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFpRJyxcbiAgICAgICAgc3RyOicxMHEwcXExcnJycnIwcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChaK3EpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQkMnLFxuICAgICAgICBzdHI6ICcwMDAwMTByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAoUmQgLSBSciAtIFNSQDApICYgMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknLFxuICAgICAgICAgICAgJ1NSQDEg4oaQICghUikgJiBTUkAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonbnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVUInLFxuICAgICAgICBzdHI6ICcwMDAxMTByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAoUmQgLSBScikmMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknXG5cbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCQ0knLFxuICAgICAgICBzdHI6ICcwMTAwS0tLS2RkZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkKzE2IOKGkCAoUmQrMTYgLSBrIC0gU1JAMCkmMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZCsxNkAzIMKvIOKAoiAoKGs+PjMpJjEpKSB8ICgoKGs+PjMpJjEpIOKAoiBSQDMpIHwgKFJAMyDigKIgUmQrMTZAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpKSB8ICgoKGs+PjcpJjEpIOKAoiBSQDcpIHwgKFJANyDigKIgUmQrMTZANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZCsxNkA3IOKAoiAoKGs+PjcpJjFeMSkg4oCiIFJANyDCrykgfCAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSDigKIgUkA3KScsXG4gICAgICAgICAgICAnU1JAMSDihpAgKCFSKSAmIFNSQDEnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiducydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NVQkknLFxuICAgICAgICBzdHI6ICcwMTAxS0tLS2RkZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkKzE2IOKGkCBSZCsxNiAtIGs7JyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmQrMTZAMyDCryDigKIgKChrPj4zKSYxKSkgfCAoKChrPj4zKSYxKSDigKIgUkAzKSB8IChSQDMg4oCiIFJkKzE2QDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSkgfCAoKChrPj43KSYxKSDigKIgUkA3KSB8IChSQDcg4oCiIFJkKzE2QDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmQrMTZANyDigKIgKChrPj43KSYxXjEpIOKAoiBSQDcgwq8pIHwgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkg4oCiIFJANyknXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6bnMnXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdTQkknLFxuXHRzdHI6ICcxMDAxMTAxMEFBQUFBYmJiJyxcblx0aW1wbDogJ0kvT1thQGJdIOKGkCAxOydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSVcnLFxuICAgICAgICBzdHI6ICcxMDAxMDExMUtLZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1dSZCDihpAgV1JkIC0gazsnLFxuICAgICAgICBdLFxuICAgICAgICBmbGFnczonWlZOUydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSUMnLFxuICAgICAgICBzdHI6ICcxMDAxMTAwMUFBQUFBYmJiJyxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQICFJL09bYUBiXScsXG4gICAgICAgIHNraXA6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSVMnLFxuICAgICAgICBzdHI6ICcxMDAxMTAxMUFBQUFBYmJiJyxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQIEkvT1thQGJdJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0JSQycsXG4gICAgICAgIHN0cjogJzExMTExMTBycnJycjBiYmInLFxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQICEoUnIgJiAoMTw8YikpJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0JSUycsXG4gICAgICAgIHN0cjogJzExMTExMTFycnJycjBiYmInLFxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQIFJyICYgKDE8PGIpJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuXHRuYW1lOiAnU0xFRVAnLFxuXHRzdHI6ICcxMDAxMDEwMTEwMDAxMDAwJyxcblx0aW1wbDogW1xuXHQgICAgJ3RoaXMuc2xlZXBpbmcgPSB0cnVlJyxcblx0ICAgICdQQyDihpAgUEMgKyAxJ1xuXHRdLFxuXHQvLyBkZWJ1ZzogdHJ1ZSxcblx0Y3ljbGVzOiAwXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdTV0FQJyxcblx0c3RyOiAnMTAwMTAxMGRkZGRkMDAxMCcsXG5cdGltcGw6W1xuXHQgICAgJ1JkIOKGkCAoUmQgPj4+IDQpIHwgKFJkIDw8IDQpJ1xuXHQgICAgXVxuICAgIH1cbl07XG5cbmNvbnN0IEF0RmxhZ3MgPSB7XG5cbiAgICBoOiAnU1JANSDihpAgKFJkQDMg4oCiIFJyQDMpICsgKFJyQDMg4oCiIFJAMyDCrykgfCAoUkAzIMKvIOKAoiBSZEAzKScsXG4gICAgSDogJycsXG4gICAgejogJ1NSMSA9ICEoUiYweEZGKXwwJyxcbiAgICBaOiAnU1IxID0gIShSJjB4RkYpfDAnLFxuICAgIHY6ICdTUjMgPSAoUmRANyDigKIgUnJANyDigKIgUkA3IMKvKSB8IChSZEA3IMKvIOKAoiBSckA3IMKvIOKAoiBSQDcpJyxcbiAgICBWOiAnU1IzID0gV1JkQDE1IMKvIOKAoiBSQDE1JyxcbiAgICBuOiAnU1IyID0gUkA3JyxcbiAgICBOOiAnU1IyID0gUkAxNScsXG4gICAgczogJ1NSNCA9IFNSQDIg4oqVIFNSQDMnLFxuICAgIFM6ICdTUjQgPSBTUkAyIOKKlSBTUkAzJyxcbiAgICBjOiAnU1IwID0gKFJkQDcg4oCiIFJyQDcpIHwgKFJyQDcg4oCiIFJANyDCrykgfCAoUkA3IMKvIOKAoiBSZEA3KScsXG4gICAgQzogJ1NSMCA9IChSQDE1IMKvIOKAoiBXUmRAMTUpJyxcblxuICAgIC8qXG4gICAgQml0IDcg4oCTIEk6IEdsb2JhbCBJbnRlcnJ1cHQgRW5hYmxlXG4gICAgVGhlIGdsb2JhbCBpbnRlcnJ1cHQgZW5hYmxlIGJpdCBtdXN0IGJlIHNldCBmb3IgdGhlIGludGVycnVwdHMgdG8gYmUgZW5hYmxlZC4gVGhlIGluZGl2aWR1YWwgaW50ZXJydXB0IGVuYWJsZSBjb250cm9sIGlzIHRoZW5cbiAgICBwZXJmb3JtZWQgaW4gc2VwYXJhdGUgY29udHJvbCByZWdpc3RlcnMuIElmIHRoZSBnbG9iYWwgaW50ZXJydXB0IGVuYWJsZSByZWdpc3RlciBpcyBjbGVhcmVkLCBub25lIG9mIHRoZSBpbnRlcnJ1cHRzIGFyZSBlbmFibGVkXG4gICAgaW5kZXBlbmRlbnQgb2YgdGhlIGluZGl2aWR1YWwgaW50ZXJydXB0IGVuYWJsZSBzZXR0aW5ncy4gVGhlIEktYml0IGlzIGNsZWFyZWQgYnkgaGFyZHdhcmUgYWZ0ZXIgYW4gaW50ZXJydXB0IGhhcyBvY2N1cnJlZCwgYW5kIGlzXG4gICAgc2V0IGJ5IHRoZSBSRVRJIGluc3RydWN0aW9uIHRvIGVuYWJsZSBzdWJzZXF1ZW50IGludGVycnVwdHMuIFRoZSBJLWJpdCBjYW4gYWxzbyBiZSBzZXQgYW5kIGNsZWFyZWQgYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggdGhlXG4gICAgU0VJIGFuZCBDTEkgaW5zdHJ1Y3Rpb25zLCBhcyBkZXNjcmliZWQgaW4gdGhlIGluc3RydWN0aW9uIHNldCByZWZlcmVuY2UgICAgXG4gICAgKi9cbiAgICBTRUkoKXtcbiAgICAgICAgdGhpcy5zcmVnIHw9IDEgPDwgNztcbiAgICB9LFxuXG4gICAgQ0xJKCl7XG4gICAgICAgIHRoaXMuc3JlZyAmPSB+KDE8PDcpO1xuICAgIH0sXG5cblxuXG4gICAgLypcbiAgICBCaXQgNiDigJMgVDogQml0IENvcHkgU3RvcmFnZVxuICAgIFRoZSBiaXQgY29weSBpbnN0cnVjdGlvbnMgQkxEIChiaXQgTG9hRCkgYW5kIEJTVCAoQml0IFNUb3JlKSB1c2UgdGhlIFQtYml0IGFzIHNvdXJjZSBvciBkZXN0aW5hdGlvbiBmb3IgdGhlIG9wZXJhdGVkIGJpdC4gQSBiaXRcbiAgICBmcm9tIGEgcmVnaXN0ZXIgaW4gdGhlIHJlZ2lzdGVyIGZpbGUgY2FuIGJlIGNvcGllZCBpbnRvIFQgYnkgdGhlIEJTVCBpbnN0cnVjdGlvbiwgYW5kIGEgYml0IGluIFQgY2FuIGJlIGNvcGllZCBpbnRvIGEgYml0IGluIGFcbiAgICByZWdpc3RlciBpbiB0aGUgcmVnaXN0ZXIgZmlsZSBieSB0aGUgQkxEIGluc3RydWN0aW9uLlxuICAgICovXG4gICAgQkxEKCBSRUcsIEJJVCApe1xuICAgICAgICBpZiggdGhpcy5yZWcgJiAoMTw8NikgKSB0aGlzLnJlZ1tSRUddIHw9IDE8PEJJVDtcbiAgICAgICAgZWxzZSB0aGlzLnJlZ1tSRUddICY9IH4oMTw8QklUKTtcbiAgICB9LFxuXG4gICAgQlNUKCBSRUcsIEJJVCApe1xuICAgICAgICBsZXQgdiA9ICh0aGlzLnJlZ1tSRUddID4+IEJJVCkgJiAxO1xuICAgICAgICBpZiggdiApIHRoaXMuc3JlZyB8PSAxIDw8IDY7XG4gICAgICAgIGVsc2UgdGhpcy5zcmVnICY9IH4oMTw8Nik7XG4gICAgfVxuXG5cbiAgICBcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEF0Y29yZTtcbiIsImNvbnN0IEhleCA9IHtcblxuICAgIHBhcnNlVVJMKCB1cmwsIGJ1ZmZlciwgY2IgKXtcblxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiggIHhoci5yZWFkeVN0YXRlID09PSA0ICl7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICBIZXgucGFyc2UoIHhoci5yZXNwb25zZVRleHQsIGJ1ZmZlciApO1xuICAgICAgICAgICAgICAgIH1jYXRjaChleCl7XG4gICAgICAgICAgICAgICAgICAgIGNiKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYiggdHJ1ZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgICAgICB4aHIuc2VuZCgpO1xuICAgICAgICBcbiAgICB9LFxuXG4gICAgcGFyc2UoIHNyYywgYnVmZmVyICl7XG5cbiAgICAgICAgbGV0IHN0YXRlID0gMCwgc2l6ZSA9IDAsIG51bSwgYnl0ZSwgb2Zmc2V0LCBzdW0gPSAwO1xuXG4gICAgICAgIGZvciggbGV0IGk9MCwgbD1zcmMubGVuZ3RoOyBpPGw7ICl7XG5cbiAgICAgICAgICAgIGJ5dGUgPSBzcmMuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICAgICAgICBpZiggYnl0ZSA9PT0gNTggKXtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCBieXRlID49IDY1ICYmIGJ5dGUgPD0gNzAgKXtcbiAgICAgICAgICAgICAgICBudW0gPSAoYnl0ZSAtIDU1KSA8PCA0O1xuICAgICAgICAgICAgfWVsc2UgaWYoIGJ5dGUgPj0gNDggJiYgYnl0ZSA8PSA1NyApe1xuICAgICAgICAgICAgICAgIG51bSA9IChieXRlIC0gNDgpIDw8IDQ7XG4gICAgICAgICAgICB9ZWxzZSBjb250aW51ZTtcblxuICAgICAgICAgICAgd2hpbGUoIGk8bCApe1xuICAgICAgICAgICAgICAgIGJ5dGUgPSBzcmMuY2hhckNvZGVBdChpKyspO1xuICAgICAgICAgICAgICAgIGlmKCBieXRlID49IDY1ICYmIGJ5dGUgPD0gNzAgKXtcbiAgICAgICAgICAgICAgICAgICAgbnVtICs9IGJ5dGUgLSA1NTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoIGJ5dGUgPj0gNDggJiYgYnl0ZSA8PSA1NyApe1xuICAgICAgICAgICAgICAgICAgICBudW0gKz0gYnl0ZSAtIDQ4O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9ZWxzZSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoKCBzdGF0ZSApe1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHNpemUgPSBudW07XG4gICAgICAgICAgICAgICAgc3RhdGUrKztcbiAgICAgICAgICAgICAgICBzdW0gPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBudW0gPDwgODtcbiAgICAgICAgICAgICAgICBzdGF0ZSsrO1xuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gbnVtO1xuICAgICAgICAgICAgICAgIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIGlmKCBudW0gPT09IDEgKSByZXR1cm47XG5cdFx0aWYoIG51bSA9PT0gMyB8fCBudW0gPT09IDUgKXtcblx0XHQgICAgc3RhdGUrKztcblx0XHR9ZWxzZSBpZiggbnVtICE9PSAwICkgdGhyb3cgJ1Vuc3VwcG9ydGVkIHJlY29yZCB0eXBlOiAnICsgbnVtO1xuICAgICAgICAgICAgICAgIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBudW07XG5cdCAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBpZiggIS0tc2l6ZSApIHN0YXRlID0gNjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgc3VtID0gKC1zdW0pICYgMHhGRjtcbiAgICAgICAgICAgICAgICBpZiggIXN1bSApIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgZWxzZSB0aHJvdyAoICdDaGVja3N1bSBtaXNtYXRjaDogJyArIHN1bSApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93ICdJbGxlZ2FsIHN0YXRlICcgKyBzdGF0ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEhleDtcbiIsImNsYXNzIEJUTiB7XG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xuICAgICAgICBwb29sOlwicG9vbFwiXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuXG5cdERPTS5lbGVtZW50LmNvbnRyb2xsZXIgPSB0aGlzO1xuXHRET00uZWxlbWVudC5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJhZGRwZXJpZmVyYWxcIiwge2J1YmJsZXM6dHJ1ZX0pICk7XG5cdHRoaXMub24uY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1vblwiKTtcblx0dGhpcy5hY3RpdmUgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJhY3RpdmVcIikgIT0gXCJsb3dcIjtcblx0XG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2Vkb3duXCIsICBfID0+IHRoaXMub24udmFsdWUgPSAgdGhpcy5hY3RpdmUgKTtcblx0RE9NLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJtb3VzZXVwXCIsICAgIF8gPT4gdGhpcy5vbi52YWx1ZSA9ICF0aGlzLmFjdGl2ZSApO1xuXHRET00uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNoc3RhcnRcIiwgXyA9PiB0aGlzLm9uLnZhbHVlID0gIHRoaXMuYWN0aXZlICk7XG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwidG91Y2hlbmRcIiwgICBfID0+IHRoaXMub24udmFsdWUgPSAhdGhpcy5hY3RpdmUgKTtcblxuXHQoRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYmluZC1rZXlcIikgfHwgXCJcIikuc3BsaXQoL1xccyosXFxzKi8pLmZvckVhY2goIGsgPT4ge1xuXHQgICAgdGhpc1tcIm9uUHJlc3NcIiArIGtdID0gXyA9PiB0aGlzLm9uLnZhbHVlID0gdGhpcy5hY3RpdmU7XG5cdCAgICB0aGlzW1wib25SZWxlYXNlXCIgKyBrXSA9IF8gPT4gdGhpcy5vbi52YWx1ZSA9ICF0aGlzLmFjdGl2ZTtcblx0fSk7XG5cblx0dGhpcy5wb29sLmFkZCh0aGlzKTtcblx0XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlVmlldygpe1xuXHR0aGlzLnBvb2wucmVtb3ZlKHRoaXMpO1xuICAgIH1cblxuICAgIG9uID0ge1xuXHRjb25uZWN0OiBudWxsLFxuXHRpbml0OmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLm9uLnZhbHVlID0gIXRoaXMuYWN0aXZlO1xuXHR9XG4gICAgfVxuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJUTjtcbiIsImNsYXNzIExFRCB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuXHRcblx0dGhpcy5lbCA9IERPTS5lbGVtZW50O1xuXHRET00uZWxlbWVudC5jb250cm9sbGVyID0gdGhpcztcblx0RE9NLmVsZW1lbnQuZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KFwiYWRkcGVyaWZlcmFsXCIsIHtidWJibGVzOnRydWV9KSApO1xuXHR0aGlzLm9uLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tb25cIik7XG5cdHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IDA7XG5cdFxuICAgIH1cblxuICAgIG9uID0ge1xuXHRcblx0Y29ubmVjdDpudWxsLFxuXHRcblx0b25Mb3dUb0hpZ2goKXtcblx0ICAgIHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuXHR9LFxuXHRcblx0b25IaWdoVG9Mb3coKXtcblx0ICAgIHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXHR9XG5cdFxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMRUQ7XG4iLCJjbGFzcyBTQ1JFRU4ge1xuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcblx0cG9vbDpcInBvb2xcIlxuICAgIH1cbiAgICBcbiAgICBjb25zdHJ1Y3RvciggRE9NICl7XG5cdFxuXHRsZXQgY2FudmFzID0gdGhpcy5jYW52YXMgPSBET00uc2NyZWVuO1xuXHRpZiggIWNhbnZhcyApIHRocm93IFwiTm8gY2FudmFzIGluIEFyZHVib3kgZWxlbWVudFwiO1xuXG5cdHRoaXMucG9vbC5hZGQodGhpcyk7XG5cdFxuXHRjYW52YXMud2lkdGggPSAxMjg7XG5cdGNhbnZhcy5oZWlnaHQgPSA2NDtcblxuXHR0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIHRoaXMuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXHR0aGlzLmN0eC5tc0ltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5cdHRoaXMuZmIgPSB0aGlzLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmZiT04gPSB0aGlzLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmZiT0ZGID0gdGhpcy5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB0aGlzLmZiT047XG5cdHRoaXMuZGlydHkgPSB0cnVlO1xuXG5cdHRoaXMuZmJPTi5kYXRhLmZpbGwoMHhGRik7XG5cblx0RE9NLmVsZW1lbnQuY29udHJvbGxlciA9IHRoaXM7XG5cdERPTS5lbGVtZW50LmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcImFkZHBlcmlmZXJhbFwiLCB7YnViYmxlczp0cnVlfSkgKTtcblx0XG5cdHRoaXMuc2NrLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tc2NrXCIpO1xuXHR0aGlzLnNkYS5jb25uZWN0ID0gRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwicGluLXNkYVwiKTtcblx0dGhpcy5yZXMuY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1yZXNcIik7XG5cdHRoaXMuZGMuY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1kY1wiKTtcblxuXG5cdHRoaXMucmVzZXQoKTtcblx0XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlVmlldygpe1xuXHR0aGlzLnBvb2wucmVtb3ZlKHRoaXMpO1xuICAgIH1cblxuICAgIG9uUHJlc3NLZXlGKCl7XG5cdHZhciBkb2NFbCA9IHRoaXMuY2FudmFzOyAvLyBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXHRcblx0dG9nZ2xlRnVsbFNjcmVlbigpO1xuXG5cdHJldHVybjtcblxuXHRmdW5jdGlvbiBpc0Z1bGxTY3JlZW4oKXtcblx0XHR2YXIgZG9jID0gd2luZG93LmRvY3VtZW50O1xuXHRcdHJldHVybiBkb2MuZnVsbHNjcmVlbkVsZW1lbnQgfHwgZG9jLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvYy53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fCBkb2MubXNGdWxsc2NyZWVuRWxlbWVudCB8fCBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUZ1bGxTY3JlZW4odG9nZ2xlKSB7XG5cdFx0dmFyIGRvYyA9IHdpbmRvdy5kb2N1bWVudDtcblx0ICAgICAgICBcblxuXHRcdHZhciByZXF1ZXN0RnVsbFNjcmVlbiA9IGRvY0VsLnJlcXVlc3RGdWxsc2NyZWVuIHx8IGRvY0VsLm1velJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY0VsLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY0VsLm1zUmVxdWVzdEZ1bGxzY3JlZW47XG5cdFx0dmFyIGNhbmNlbEZ1bGxTY3JlZW4gPSBkb2MuZXhpdEZ1bGxzY3JlZW4gfHwgZG9jLm1vekNhbmNlbEZ1bGxTY3JlZW4gfHwgZG9jLndlYmtpdEV4aXRGdWxsc2NyZWVuIHx8IGRvYy5tc0V4aXRGdWxsc2NyZWVuO1xuXHRcdHZhciBzdGF0ZSA9IGlzRnVsbFNjcmVlbigpO1xuXG5cdFx0aWYoIHRvZ2dsZSA9PSB1bmRlZmluZWQgKSB0b2dnbGUgPSAhc3RhdGU7XG5cdFx0ZWxzZSBpZiggdG9nZ2xlID09IHN0YXRlICkgcmV0dXJuO1xuXG5cdFx0aWYoIHRvZ2dsZSApIHJlcXVlc3RGdWxsU2NyZWVuLmNhbGwoZG9jRWwpO1xuXHRcdGVsc2UgY2FuY2VsRnVsbFNjcmVlbi5jYWxsKGRvYyk7XG5cdH1cbiAgICB9XG4gICAgXG4gICAgXG4gICAgdGljaygpe1xuXHRpZiggdGhpcy5kaXJ0eSApe1xuXHQgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKCB0aGlzLmFjdGl2ZUJ1ZmZlciwgMCwgMCApO1xuXHQgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuXHR9XG4gICAgfVxuXG4gICAgY3JlYXRlQnVmZmVyKCl7XG5cdGxldCBjYW52YXMgPSB0aGlzLmNhbnZhcztcblx0dHJ5e1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJbWFnZURhdGEoXG5cdFx0bmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGNhbnZhcy53aWR0aCpjYW52YXMuaGVpZ2h0KjQpLFxuXHRcdGNhbnZhcy53aWR0aCxcblx0XHRjYW52YXMuaGVpZ2h0XG5cdCAgICApO1xuXHR9Y2F0Y2goZSl7XG5cdCAgICByZXR1cm4gdGhpcy5jdHguY3JlYXRlSW1hZ2VEYXRhKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdH1cblx0XG4gICAgfVxuXG4gICAgcmVzZXQoKXtcblx0dGhpcy5tb2RlID0gMDtcblx0dGhpcy5jbG9ja0Rpdmlzb3IgPSAweDgwO1xuXHR0aGlzLmNtZCA9IFtdO1xuXHR0aGlzLnBvcyA9IDA7XG5cdHRoaXMuZmIuZGF0YS5maWxsKDApO1xuXHR0aGlzLmNvbFN0YXJ0ID0gMDtcblx0dGhpcy5jb2xFbmQgPSAxMjc7XG5cdHRoaXMucGFnZVN0YXJ0ID0gMDtcblx0dGhpcy5wYWdlRW5kID0gNztcblx0dGhpcy5jb2wgPSAwO1xuXHR0aGlzLnBhZ2UgPSAwO1xuICAgIH1cblxuICAgIHN0YXRlID0gZnVuY3Rpb24oIGRhdGEgKXtcblx0Ly8gY29uc29sZS5sb2coIFwiREFUQTogXCIgKyBkYXRhLnRvU3RyaW5nKDE2KSApO1xuXHRsZXQgY3MgPSB0aGlzLmNvbFN0YXJ0O1xuXHRsZXQgY2UgPSB0aGlzLmNvbEVuZDtcblx0bGV0IGNkID0gY2UgLSBjcztcblx0bGV0IHBzID0gdGhpcy5wYWdlU3RhcnQ7XG5cdGxldCBwZSA9IHRoaXMucGFnZUVuZDtcblx0bGV0IHBkID0gcGUgLSBwcztcblx0XG5cdGxldCB4ID0gY3MgKyB0aGlzLmNvbDtcblx0bGV0IHkgPSAocHMgKyB0aGlzLnBhZ2UpICogODtcblx0XG5cdGZvciggbGV0IGk9MDsgaTw4OyArK2kgKXtcblx0ICAgIGxldCBvZmZzZXQgPSAoKHkraSkqMTI4ICsgeCkgKiA0O1xuXHQgICAgbGV0IGJpdCA9ICgoZGF0YSA+Pj4gaSkgJiAxKSAqIDB4RTA7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdH1cblxuXHR0aGlzLmNvbCsrO1xuXHRpZiggdGhpcy5jb2wgPiBjZCApe1xuXHQgICAgdGhpcy5jb2wgPSAwO1xuXHQgICAgdGhpcy5wYWdlKys7XG5cdCAgICBpZiggdGhpcy5wYWdlID4gcGQgKVxuXHRcdHRoaXMucGFnZSA9IDA7XG5cdH1cblxuXHR0aGlzLmRpcnR5ID0gdHJ1ZTtcblx0XHQgXG4gICAgfVxuXG4gICAgc2NrID0ge1xuXHRjb25uZWN0Om51bGxcbiAgICB9XG5cbiAgICBzZGEgPSB7XG5cdGNvbm5lY3Q6bnVsbCxcblx0TU9TSTpmdW5jdGlvbiggZGF0YSApe1xuXG5cdCAgICBpZiggdGhpcy5tb2RlID09IDAgKXsgLy8gZGF0YSBpcyBhIGNvbW1hbmRcblx0XHRsZXQgY21kID0gXCJjbWRcIiArIGRhdGEudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG5cdFx0aWYoIHRoaXMuY21kLmxlbmd0aCApe1xuXHRcdCAgICB0aGlzLmNtZC5wdXNoKCBkYXRhICk7XG5cdFx0ICAgIGNtZCA9IHRoaXMuY21kWzBdO1xuXHRcdH1lbHNlIHRoaXMuY21kLnB1c2goIGNtZCApO1xuXG5cdFx0bGV0IGZuYyA9IHRoaXNbY21kXTtcblx0XHRcblx0XHRpZiggIWZuYyApXG5cdFx0ICAgIHJldHVybiBjb25zb2xlLndhcm4oXCJVbmtub3duIFNTRDEzMDYgY29tbWFuZDogXCIgKyBjbWQudG9TdHJpbmcoMTYpKTtcblx0XHRcblx0XHRpZiggZm5jLmxlbmd0aCA9PSB0aGlzLmNtZC5sZW5ndGgtMSApe1xuXHRcdCAgICB0aGlzLmNtZC5zaGlmdCgpO1xuXHRcdCAgICB0aGlzW2NtZF0uYXBwbHkoIHRoaXMsIHRoaXMuY21kICk7XG5cdFx0ICAgIHRoaXMuY21kLmxlbmd0aCA9IDA7XG5cdFx0fVxuXG5cdCAgICB9ZWxzZXtcblx0XHR0aGlzLnN0YXRlKCBkYXRhICk7XG5cdCAgICB9XG5cdH1cbiAgICB9XG5cbiAgICByZXMgPSB7XG5cdGNvbm5lY3Q6bnVsbCxcblx0b25Mb3dUb0hpZ2g6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMucmVzZXQoKTtcblx0fVxuICAgIH1cblxuICAgIGRjID0ge1xuXHRjb25uZWN0Om51bGwsXG5cdG9uTG93VG9IaWdoOmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLm1vZGUgPSAxOyAvLyBkYXRhXG5cdH0sXG5cdG9uSGlnaFRvTG93OmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLm1vZGUgPSAwOyAvLyBjb21tYW5kXG5cdH0gXG4gICAgfVxuXG5cblxuICAgIC8vIERpc3BsYXkgT2ZmXG4gICAgY21kQUUoKXtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB0aGlzLmZiT0ZGO1xuICAgIH1cblxuICAgIC8vIFNldCBEaXNwbGF5IENsb2NrIERpdmlzb3IgdiA9IDB4RjBcbiAgICBjbWRENSggdiApe1xuXHR0aGlzLmNsb2NrRGl2aXNvciA9IHY7XG4gICAgfVxuXG4gICAgLy8gQ2hhcmdlIFB1bXAgU2V0dGluZyB2ID0gZW5hYmxlICgweDE0KVxuICAgIGNtZDhEKCB2ICl7XG5cdHRoaXMuY2hhcmdlUHVtcEVuYWJsZWQgPSB2O1xuICAgIH1cblxuICAgIC8vIFNldCBTZWdtZW50IFJlLW1hcCAoQTApIHwgKGIwMDAxKVxuICAgIGNtZEEwKCl7IHRoaXMuc2VnbWVudFJlbWFwID0gMDsgfVxuICAgIGNtZEExKCl7IHRoaXMuc2VnbWVudFJlbWFwID0gMTsgfVxuXG4gICAgY21kQTUoKXsgIH07IC8vIG11bHRpcGxleCBzb21ldGhpbmcgb3Igb3RoZXJcblxuICAgIGNtZDAoKXsgdGhpcy5jb2xTdGFydCA9IHRoaXMuY29sU3RhcnQmMHhGMCB8IDA7IH1cbiAgICBjbWQxKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDE7IH1cbiAgICBjbWQyKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDI7IH1cbiAgICBjbWQzKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDM7IH1cbiAgICBjbWQ0KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDQ7IH1cbiAgICBjbWQ1KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDU7IH1cbiAgICBjbWQ2KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDY7IH1cbiAgICBjbWQ3KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDc7IH1cbiAgICBjbWQ4KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDg7IH1cbiAgICBjbWQ5KCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweDk7IH1cbiAgICBjbWRBKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEE7IH1cbiAgICBjbWRCKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEI7IH1cbiAgICBjbWRDKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEM7IH1cbiAgICBjbWREKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEQ7IH1cbiAgICBjbWRFKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEU7IH1cbiAgICBjbWRGKCl7IHRoaXMuY29sU3RhcnQgPSB0aGlzLmNvbFN0YXJ0JjB4RjAgfCAweEY7IH1cblxuICAgIGNtZDEwKCl7IHRoaXMuY29sU3RhcnQgPSAgICAgICAgICAgIHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDExKCl7IHRoaXMuY29sU3RhcnQgPSAoMHgxPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDEyKCl7IHRoaXMuY29sU3RhcnQgPSAoMHgyPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDEzKCl7IHRoaXMuY29sU3RhcnQgPSAoMHgzPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE0KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg0PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE1KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg1PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE2KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg2PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE3KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg3PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE4KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg4PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDE5KCl7IHRoaXMuY29sU3RhcnQgPSAoMHg5PDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFBKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhBPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFCKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhCPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFDKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhDPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFEKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhEPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFFKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhFPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuICAgIGNtZDFGKCl7IHRoaXMuY29sU3RhcnQgPSAoMHhGPDw0KSB8IHRoaXMuY29sU3RhcnQmMHgwRjsgfVxuXG4gICAgY21kQjAoKXsgdGhpcy5wYWdlID0gMDsgfVxuICAgIGNtZEIxKCl7IHRoaXMucGFnZSA9IDE7IH1cbiAgICBjbWRCMigpeyB0aGlzLnBhZ2UgPSAyOyB9XG4gICAgY21kQjMoKXsgdGhpcy5wYWdlID0gMzsgfVxuICAgIGNtZEI0KCl7IHRoaXMucGFnZSA9IDQ7IH1cbiAgICBjbWRCNSgpeyB0aGlzLnBhZ2UgPSA1OyB9XG4gICAgY21kQjYoKXsgdGhpcy5wYWdlID0gNjsgfVxuICAgIGNtZEI3KCl7IHRoaXMucGFnZSA9IDc7IH1cblxuICAgIC8vIFNldCBDT00gT3V0cHV0IFNjYW4gRGlyZWN0aW9uXG4gICAgY21kQzgoKXtcbiAgICB9XG5cbiAgLy8gU2V0IENPTSBQaW5zIHZcbiAgICBjbWREQSggdiApe1xuICAgIH1cblxuICAvLyBTZXQgQ29udHJhc3QgdiA9IDB4Q0ZcbiAgICBjbWQ4MSggdiApe1xuICAgIH1cblxuICAvLyBTZXQgUHJlY2hhcmdlID0gMHhGMVxuICAgIGNtZEQ5KCB2ICl7XG4gICAgfVxuXG4gIC8vIFNldCBWQ29tIERldGVjdFxuICAgIGNtZERCKCB2ICl7XG4gICAgfVxuXG4gIC8vIEVudGlyZSBEaXNwbGF5IE9OXG4gICAgY21kQTQoIHYgKXtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB2ID8gdGhpcy5mYk9OIDogdGhpcy5mYjtcbiAgICB9XG4gICAgXG4gIC8vIFNldCBub3JtYWwvaW52ZXJzZSBkaXNwbGF5XG4gICAgY21kQTYoIHYgKXtcbiAgICB9XG4gICAgXG4gIC8vIERpc3BsYXkgT25cbiAgICBjbWRBRiggdiApe1xuXHR0aGlzLmFjdGl2ZUJ1ZmZlciA9IHRoaXMuZmI7XG4gICAgfVxuXG4gIC8vIHNldCBkaXNwbGF5IG1vZGUgPSBob3Jpem9udGFsIGFkZHJlc3NpbmcgbW9kZSAoMHgwMClcbiAgICBjbWQyMCggdiApe1xuICAgIH1cblxuICAvLyBzZXQgY29sIGFkZHJlc3MgcmFuZ2VcbiAgICBjbWQyMSggdiwgZSApe1xuXHR0aGlzLmNvbFN0YXJ0ID0gdjtcblx0dGhpcy5jb2xFbmQgICA9IGU7XG5cdHRoaXMuY29sID0gMDtcbiAgICB9XG5cbiAgLy8gc2V0IHBhZ2UgYWRkcmVzcyByYW5nZVxuICAgIGNtZDIyKCB2LCBlICl7XG5cdHRoaXMucGFnZVN0YXJ0ID0gdjtcblx0dGhpcy5wYWdlRW5kICAgPSBlO1xuXHR0aGlzLnBhZ2UgPSAwO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTQ1JFRU47XG4iLCJpbXBvcnQgeyBJQ29udHJvbGxlciwgTW9kZWwsIElWaWV3IH0gZnJvbSAnLi4vbGliL212Yy5qcyc7XG5pbXBvcnQgeyBnZXRQb2xpY3kgfSBmcm9tICdkcnktZGknO1xuaW1wb3J0IEF0Y29yZSBmcm9tICcuLi9hdGNvcmUvQXRjb3JlLmpzJztcbmltcG9ydCBIZXggZnJvbSAnLi4vYXRjb3JlL0hleC5qcyc7XG5cbmNsYXNzIEFyZHVib3kge1xuXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xuICAgICAgICByb290OiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dLFxuXHRwb29sOlwicG9vbFwiXG4gICAgfVxuXG4gICAgdGljayA9IFtdXG5cbiAgICBjb25zdHJ1Y3RvciggRE9NICl7XG5cblx0dGhpcy5wb29sLmFkZCh0aGlzKTtcblxuXHR0aGlzLkRPTSA9IERPTTtcblx0dGhpcy5wYXJlbnQgPSBET00uZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHR0aGlzLndpZHRoID0gMDtcblx0dGhpcy5oZWlnaHQgPSAwO1xuXHR0aGlzLmRlYWQgPSBmYWxzZTtcblxuXHRET00uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcImFkZHBlcmlmZXJhbFwiLCBldnQgPT4gdGhpcy5hZGRQZXJpZmVyYWwoIGV2dC50YXJnZXQuY29udHJvbGxlciApICk7XG5cblxuXHR0aGlzLnBlcmlmZXJhbHMgPSBbXTtcblxuXHR0aGlzLnVwZGF0ZSA9IHRoaXMuX3VwZGF0ZS5iaW5kKCB0aGlzICk7XG5cdHRoaXMucmVzaXplKCk7XG5cdFxuXHRsZXQgdXJsID0gdGhpcy5yb290LmdldEl0ZW0oXCJhcHAuQVQzMjhQLnVybFwiLCBudWxsKTtcblx0aWYoIHVybCApe1xuXHQgICAgXG5cdCAgICB0aGlzLmNvcmUgPSBBdGNvcmUuQVRtZWdhMzI4UCgpO1xuXHQgICAgXG5cdCAgICBIZXgucGFyc2VVUkwoIHVybCwgdGhpcy5jb3JlLmZsYXNoLCAoc3VjY2VzcykgPT4ge1xuXHRcdGlmKCBzdWNjZXNzIClcblx0XHQgICAgdGhpcy5pbml0Q29yZSgpO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXG5cdGxldCBoZXggPSB0aGlzLnJvb3QuZ2V0SXRlbShcImFwcC5BVDMyOFAuaGV4XCIsIG51bGwpO1xuXHRpZiggaGV4ICl7XG5cdFx0XG5cdCAgICB0aGlzLmNvcmUgPSBBdGNvcmUuQVRtZWdhMzI4UCgpO1xuXHQgICAgSGV4LnBhcnNlKCBoZXgsIHRoaXMuY29yZS5mbGFzaCApO1xuXHQgICAgdGhpcy5pbml0Q29yZSgpO1xuXHQgICAgcmV0dXJuO1xuXHQgICAgXG5cdH1cblx0ICAgIFxuXHR1cmwgPSB0aGlzLnJvb3QuZ2V0SXRlbShcImFwcC5BVDMydTQudXJsXCIsIG51bGwpO1xuXHRpZiggdXJsICl7XG5cblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMnU0KCk7XG5cdCAgICBIZXgucGFyc2VVUkwoIHVybCwgdGhpcy5jb3JlLmZsYXNoLCBzdWNjZXNzID0+IHtcblx0XHRpZiggc3VjY2VzcyApIHRoaXMuaW5pdENvcmUoKTtcblx0ICAgIH0pO1xuXHQgICAgcmV0dXJuO1xuXHQgICAgXG5cdH1cblxuXHRoZXggPSB0aGlzLnJvb3QuZ2V0SXRlbShcImFwcC5BVDMydTQuaGV4XCIsIG51bGwpO1xuXHRpZiggaGV4ICl7XG5cdCAgICBcblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMnU0KCk7XG5cdCAgICBIZXgucGFyc2UoIGhleCwgdGhpcy5jb3JlLmZsYXNoICk7XG5cdCAgICB0aGlzLmluaXRDb3JlKCk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXG5cdGNvbnNvbGUuZXJyb3IoXCJOb3RoaW5nIHRvIGxvYWRcIik7XG4gICAgfVxuXG4gICAgb25QcmVzc0VzY2FwZSgpe1xuXHR0aGlzLnBvd2VyT2ZmKCk7XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlVmlldygpe1xuXHR0aGlzLnBvb2wucmVtb3ZlKHRoaXMpO1xuICAgIH1cblxuICAgIHBvd2VyT2ZmKCl7XG5cdHRoaXMucG9vbC5yZW1vdmUodGhpcyk7XG5cdHRoaXMuZGVhZCA9IHRydWU7XG5cdHRoaXMuRE9NLmVsZW1lbnQuZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KFwicG93ZXJvZmZcIiwge2J1YmJsZXM6dHJ1ZX0pICk7XG4gICAgfVxuXG4gICAgaW5pdENvcmUoKXtcblx0bGV0IGNvcmUgPSB0aGlzLmNvcmUsIG9sZFZhbHVlcyA9IHt9LCBERFJCLCBzZXJpYWwwQnVmZmVyID0gXCJcIiwgY2FsbGJhY2tzID0ge1xuICAgICAgICAgICAgRERSQjp7fSxcbiAgICAgICAgICAgIEREUkM6e30sXG4gICAgICAgICAgICBERFJEOnt9LFxuICAgICAgICAgICAgUE9SVEI6e30sXG4gICAgICAgICAgICBQT1JUQzp7fSxcbiAgICAgICAgICAgIFBPUlREOnt9LFxuICAgICAgICAgICAgUE9SVEU6e30sXG4gICAgICAgICAgICBQT1JURjp7fVxuXHR9O1xuXG5cdE9iamVjdC5rZXlzKGNhbGxiYWNrcykuZm9yRWFjaCggayA9PlxuXHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oY2FsbGJhY2tzW2tdLHtcblx0XHRcdFx0XHQgICAgb25IaWdoVG9Mb3c6W10sIFxuXHRcdFx0XHRcdCAgICBvbkxvd1RvSGlnaDpbXVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdCAgICAgICk7XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIGNvcmUucGlucywge1xuXG4gICAgICAgICAgICBvbkhpZ2hUb0xvdzp7dmFsdWU6ZnVuY3Rpb24oIHBvcnQsIGJpdCwgY2IgKXtcblx0XHQoY2FsbGJhY2tzWyBwb3J0IF0ub25IaWdoVG9Mb3dbIGJpdCBdID0gY2FsbGJhY2tzWyBwb3J0IF1bIGJpdCBdIHx8IFtdKS5wdXNoKCBjYiApO1xuICAgICAgICAgICAgfX0sXG5cbiAgICAgICAgICAgIG9uTG93VG9IaWdoOnt2YWx1ZTpmdW5jdGlvbiggcG9ydCwgYml0LCBjYiApe1xuXHRcdChjYWxsYmFja3NbIHBvcnQgXS5vbkxvd1RvSGlnaFsgYml0IF0gPSBjYWxsYmFja3NbIHBvcnQgXVsgYml0IF0gfHwgW10pLnB1c2goIGNiICk7XG4gICAgICAgICAgICB9fSxcblxuICAgICAgICAgICAgMDp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6MiB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjJ9IH0gfSxcbiAgICAgICAgICAgIDE6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVERcIiwgYml0OjMgfSwgaW46e3BvcnQ6XCJQSU5EXCIsIGJpdDozfSB9IH0sXG4gICAgICAgICAgICAyOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDoxIH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6MX0gfSB9LFxuICAgICAgICAgICAgMzp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6MCB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjB9IH0gfSxcbiAgICAgICAgICAgIDQ6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVERcIiwgYml0OjQgfSwgaW46e3BvcnQ6XCJQSU5EXCIsIGJpdDo0fSB9IH0sXG4gICAgICAgICAgICA1Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRDXCIsIGJpdDo2IH0sIGluOntwb3J0OlwiUElOQ1wiLCBiaXQ6Nn0gfSB9LFxuICAgICAgICAgICAgNjp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6NyB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0Ojd9IH0gfSxcbiAgICAgICAgICAgIDc6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEVcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5FXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICA4Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDo0IH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6NH0gfSB9LFxuICAgICAgICAgICAgOTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6NSB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0OjV9IH0gfSxcbiAgICAgICAgICAgIDEwOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDo2IH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6Nn0gfSB9LFxuICAgICAgICAgICAgMTE6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjcgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDo3fSB9IH0sXG5cblx0ICAgIDE2Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDoyIH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6Mn0gfSB9LFxuICAgICAgICAgICAgMTQ6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjMgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDozfSB9IH0sXG4gICAgICAgICAgICAxNTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6MSB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0OjF9IH0gfSxcbiAgICAgICAgICAgIDE3Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDowIH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6MH0gfSB9LFxuXG4gICAgICAgICAgICAxODp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NyB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0Ojd9IH0gfSxcbiAgICAgICAgICAgIEEwOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo3IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6N30gfSB9LFxuICAgICAgICAgICAgMTk6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICBBMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NiB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjZ9IH0gfSxcbiAgICAgICAgICAgIDIwOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo1IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6NX0gfSB9LFxuICAgICAgICAgICAgQTI6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjUgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo1fSB9IH0sXG4gICAgICAgICAgICAyMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NCB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjR9IH0gfSxcbiAgICAgICAgICAgIEEzOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo0IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6NH0gfSB9LFxuXHQgICAgXG5cdCAgICBNT1NJOnt2YWx1ZTp7fX0sXG5cdCAgICBNSVNPOnt2YWx1ZTp7fX0sXG5cblx0ICAgIHNwaUluOntcblx0XHR2YWx1ZTpbXVxuXHQgICAgfSxcblx0ICAgIFxuXHQgICAgc3BpT3V0Ontcblx0XHR2YWx1ZTp7XG5cdFx0ICAgIGxpc3RlbmVyczpbXSxcblx0XHQgICAgcHVzaCggZGF0YSApe1xuXHRcdFx0bGV0IGk9MCwgbGlzdGVuZXJzPXRoaXMubGlzdGVuZXJzLCBsPWxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHRmb3IoO2k8bDsrK2kpXG5cdFx0XHQgICAgbGlzdGVuZXJzW2ldKCBkYXRhICk7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9LFxuXHQgICAgXG4gICAgICAgICAgICBzZXJpYWwwOntcblx0XHRzZXQ6ZnVuY3Rpb24oIHN0ciApe1xuICAgICAgICAgICAgICAgICAgICBzdHIgPSAoc3RyIHx8IFwiXCIpLnJlcGxhY2UoL1xcclxcbj8vLCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgc2VyaWFsMEJ1ZmZlciArPSBzdHI7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGJyID0gc2VyaWFsMEJ1ZmZlci5pbmRleE9mKFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiggYnIgIT0gLTEgKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gc2VyaWFsMEJ1ZmZlci5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKCBwYXJ0cy5sZW5ndGg+MSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coICdTRVJJQUw6ICcsIHBhcnRzLnNoaWZ0KCkgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWFsMEJ1ZmZlciA9IHBhcnRzWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG5cdFx0fVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgRERSQjoge1xuXHRcdHNldDogc2V0RERSLmJpbmQobnVsbCwgXCJERFJCXCIpLFxuXHRcdGdldDpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2xkVmFsdWVzLkREUkJ8MDtcblx0XHR9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRERSQzoge1xuXHRcdHNldDogc2V0RERSLmJpbmQobnVsbCwgXCJERFJDXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEREUkQ6IHtcblx0XHRzZXQ6IHNldEREUi5iaW5kKG51bGwsIFwiRERSRFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBERFJFOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkRcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRERSRjoge1xuXHRcdHNldDogc2V0RERSLmJpbmQobnVsbCwgXCJERFJEXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBPUlRCOiB7XG5cdFx0c2V0OiBzZXRQb3J0LmJpbmQobnVsbCwgXCJQT1JUQlwiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBPUlRDOiB7XG5cdFx0c2V0OiBzZXRQb3J0LmJpbmQobnVsbCwgXCJQT1JUQ1wiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBPUlREOiB7XG5cdFx0c2V0OiBzZXRQb3J0LmJpbmQobnVsbCwgXCJQT1JURFwiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBPUlRFOiB7XG5cdFx0c2V0OiBzZXRQb3J0LmJpbmQobnVsbCwgXCJQT1JURVwiKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBPUlRGOiB7XG5cdFx0c2V0OiBzZXRQb3J0LmJpbmQobnVsbCwgXCJQT1JURlwiKVxuICAgICAgICAgICAgfVxuXG5cdH0pO1xuXG5cdHNldFRpbWVvdXQoIF8gPT4ge1xuXHQgICAgdGhpcy5zZXR1cFBlcmlmZXJhbHMoKTtcblx0ICAgIHRoaXMuX3VwZGF0ZSgpO1xuXHR9LCA1KTtcblxuXHRmdW5jdGlvbiBzZXRERFIoIG5hbWUsIGN1ciApeyAgIFxuICAgICAgICAgICAgdmFyIG9sZCA9IG9sZFZhbHVlc1tuYW1lXTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoIG9sZCA9PT0gY3VyICkgcmV0dXJuO1xuICAgICAgICAgICAgb2xkVmFsdWVzW25hbWVdID0gY3VyO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0UG9ydCggbmFtZSwgY3VyICl7XG4gICAgICAgICAgICB2YXIgb2xkID0gb2xkVmFsdWVzW25hbWVdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggb2xkID09PSBjdXIgKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgcywgaiwgbCwgbHRoID0gY2FsbGJhY2tzW25hbWVdLm9uTG93VG9IaWdoLCBodGwgPSBjYWxsYmFja3NbbmFtZV0ub25IaWdoVG9Mb3csIHRpY2sgPSBjb3JlLnRpY2s7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGk9MDsgaTw4OyArK2kgKXtcblxuXHRcdHZhciBvYiA9IG9sZD4+PmkmMSwgbmIgPSBjdXI+Pj5pJjE7XG5cdFx0aWYoIGx0aFtpXSAmJiAhb2IgJiYgbmIgKXtcbiAgICAgICAgICAgICAgICAgICAgZm9yKCBqPTAsIHM9bHRoW2ldLCBsPXMubGVuZ3RoOyBqPGw7ICsraiApXG5cdFx0XHRzW2pdKCB0aWNrICk7XG5cdFx0fVxuXHRcdGlmKCBodGxbaV0gJiYgb2IgJiYgIW5iICl7XG4gICAgICAgICAgICAgICAgICAgIGZvciggaj0wLCBzPWh0bFtpXSwgbD1zLmxlbmd0aDsgajxsOyArK2ogKVxuXHRcdFx0c1tqXSggdGljayApO1xuXHRcdH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvbGRWYWx1ZXNbbmFtZV0gPSBjdXI7XG5cblx0fVxuICAgIH1cblxuICAgIFxuXG4gICAgYWRkUGVyaWZlcmFsKCBjdHJsICl7XG5cdFxuXHR0aGlzLnBlcmlmZXJhbHMucHVzaCggY3RybCApO1xuXHRcbiAgICB9XG5cbiAgICBzZXR1cFBlcmlmZXJhbHMoKXtcblx0bGV0IHBpbnMgPSB0aGlzLmNvcmUucGlucztcblx0bGV0IG1hcCA9IHsgY3B1OnRoaXMuY29yZS5waW5zIH07XG5cdFxuXHR0aGlzLnBlcmlmZXJhbHMuZm9yRWFjaCggY3RybCA9PiB7XG5cblx0ICAgIGlmKCBjdHJsLnRpY2sgKVxuXHRcdHRoaXMudGljay5wdXNoKCBjdHJsICk7XG5cdCAgICBcblx0ICAgIGZvciggbGV0IGsgaW4gY3RybCApe1xuXG5cdFx0bGV0IHYgPSBjdHJsW2tdO1xuXHRcdGlmKCAhdiB8fCAhdi5jb25uZWN0ICkgY29udGludWU7XG5cblx0XHRsZXQgdGFyZ2V0ID0gdi5jb25uZWN0O1xuXHRcdGlmKHR5cGVvZiB0YXJnZXQgPT0gXCJudW1iZXJcIiApXG5cdFx0ICAgIHRhcmdldCA9IFwiY3B1LlwiICsgdGFyZ2V0O1xuXG5cdFx0bGV0IHRvYmogPSBtYXA7XG5cdFx0bGV0IHRwYXJ0cyA9IHRhcmdldC5zcGxpdChcIi5cIik7XG5cdFx0d2hpbGUoIHRwYXJ0cy5sZW5ndGggJiYgdG9iaiApXG5cdFx0ICAgIHRvYmogPSB0b2JqWyB0cGFydHMuc2hpZnQoKSBdO1xuXG5cdFx0aWYoIHYuTU9TSSApXG5cdFx0ICAgIHBpbnMuc3BpT3V0Lmxpc3RlbmVycy5wdXNoKCB2Lk1PU0kuYmluZCggY3RybCApICk7XG5cblx0XHRpZiggIXRvYmogKXtcblx0XHQgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IGF0dGFjaCB3aXJlIGZyb20gXCIsIGssIFwiIHRvIFwiLCB0YXJnZXQpO1xuXHRcdCAgICBjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiggdi5vbkxvd1RvSGlnaCApXG5cdFx0ICAgIHBpbnMub25Mb3dUb0hpZ2goIHRvYmoub3V0LnBvcnQsIHRvYmoub3V0LmJpdCwgdi5vbkxvd1RvSGlnaC5iaW5kKCBjdHJsICkgKTtcblx0XHRcblx0XHRpZiggdi5vbkhpZ2hUb0xvdyApXG5cdFx0ICAgIHBpbnMub25IaWdoVG9Mb3coIHRvYmoub3V0LnBvcnQsIHRvYmoub3V0LmJpdCwgdi5vbkhpZ2hUb0xvdy5iaW5kKCBjdHJsICkgKTtcblxuXG5cdFx0bGV0IHNldHRlciA9IChmdW5jdGlvbiggdG9iaiwgbnYgKXtcblx0XHQgICAgXG5cdFx0ICAgIGlmKCBudiApIHBpbnNbIHRvYmouaW4ucG9ydCBdIHw9IDEgPDwgdG9iai5pbi5iaXQ7XG5cdFx0ICAgIGVsc2UgcGluc1sgdG9iai5pbi5wb3J0IF0gJj0gfigxIDw8IHRvYmouaW4uYml0KTtcblx0XHQgICAgXG5cdFx0fSkuYmluZCh0aGlzLCB0b2JqKTtcblxuXHRcdGxldCBnZXR0ZXIgPSAoZnVuY3Rpb24oIHRvYmogKXtcblx0XHQgICAgcmV0dXJuIChwaW5zWyB0b2JqLm91dC5wb3J0IF0gPj4+IHRvYmoub3V0LmJpdCkgJiAxO1xuXHRcdH0pLmJpbmQodGhpcywgdG9iaik7XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodiwgXCJ2YWx1ZVwiLCB7XG5cdFx0ICAgIHNldDpzZXR0ZXIsXG5cdFx0ICAgIGdldDpnZXR0ZXJcblx0XHR9KTtcblxuXHRcdGlmKCB2LmluaXQgKVxuXHRcdCAgICB2LmluaXQuY2FsbCggY3RybCApO1xuXG5cdCAgICB9XG5cdCAgICBcblx0fSk7XG5cdFxuICAgIH1cblxuICAgIF91cGRhdGUoKXtcblx0aWYoIHRoaXMuZGVhZCApIHJldHVybjtcblx0XG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZSggdGhpcy51cGRhdGUgKTtcblx0dGhpcy5jb3JlLnVwZGF0ZSgpO1xuXHR0aGlzLnJlc2l6ZSgpO1xuXHRmb3IoIGxldCBpPTAsIGw9dGhpcy50aWNrLmxlbmd0aDsgaTxsOyArK2kgKVxuXHQgICAgdGhpcy50aWNrW2ldLnRpY2soKTtcbiAgICB9XG5cbiAgICByZXNpemUoKXtcblx0XG5cdGxldCBtYXhIZWlnaHQgPSB0aGlzLnBhcmVudC5jbGllbnRIZWlnaHQ7XG5cdGxldCBtYXhXaWR0aCAgPSB0aGlzLnBhcmVudC5jbGllbnRXaWR0aDtcblxuXHRpZiggdGhpcy53aWR0aCA9PSBtYXhXaWR0aCAmJiB0aGlzLmhlaWdodCA9PSBtYXhIZWlnaHQgKVxuXHQgICAgcmV0dXJuO1xuXHRcblx0dGhpcy53aWR0aCA9IG1heFdpZHRoO1xuXHR0aGlzLmhlaWdodCA9IG1heEhlaWdodDtcblxuXHRsZXQgcmF0aW8gPSAzOTMgLyA2MjQ7XG5cblx0aWYoIHRoaXMuaGVpZ2h0ICogcmF0aW8gPiB0aGlzLndpZHRoICl7XG5cdCAgICB0aGlzLkRPTS5lbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy53aWR0aCArIFwicHhcIjtcblx0ICAgIHRoaXMuRE9NLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKHRoaXMud2lkdGggLyByYXRpbykgKyBcInB4XCI7XG5cdH1lbHNle1xuXHQgICAgdGhpcy5ET00uZWxlbWVudC5zdHlsZS53aWR0aCA9ICh0aGlzLmhlaWdodCAqIHJhdGlvKSArIFwicHhcIjtcblx0ICAgIHRoaXMuRE9NLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5oZWlnaHQgKyBcInB4XCI7XG5cdH1cblx0XG4gICAgfVxuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFyZHVib3k7XG4iLCJjbGFzcyBDb25maWd7XHJcblxyXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xyXG4gICAgICAgIERPTS5lbGVtZW50LmlubmVySFRNTCA9IFwiQyBPIE4gRiBJIEdcIjtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29uZmlnOyIsImNsYXNzIEZpbGVze1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcclxuICAgICAgICBET00uZWxlbWVudC5pbm5lckhUTUwgPSBcIkMgTyBOIEYgSSBHXCI7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVzOyIsImltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbGliL212Yy5qcyc7XG5cbmNsYXNzIE1hcmtldHtcblxuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcbiAgICAgICAgcm9vdDogW01vZGVsLCB7c2NvcGU6XCJyb290XCJ9XVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcbiAgICB9XG5cbiAgICBydW4oKXtcbiAgICAgICAgdGhpcy5wb29sLmNhbGwoXCJydW5TaW1cIik7XG4gICAgfVxuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtldDtcbiIsImltcG9ydCBJU3RvcmUgZnJvbSAnLi4vc3RvcmUvSVN0b3JlLmpzJztcclxuaW1wb3J0IHsgSUNvbnRyb2xsZXIsIE1vZGVsLCBJVmlldyB9IGZyb20gJy4uL2xpYi9tdmMuanMnO1xyXG5pbXBvcnQgSlNaaXAgZnJvbSAnanN6aXAvZGlzdC9qc3ppcC5taW4uanMnO1xyXG5cclxuY2xhc3MgRW52IGV4dGVuZHMgSUNvbnRyb2xsZXIge1xyXG5cclxuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcclxuICAgICAgICBzdG9yZTpJU3RvcmUsXHJcbiAgICAgICAgcG9vbDpcInBvb2xcIixcclxuICAgICAgICB2aWV3RmFjdG9yeTpbSVZpZXcsIHtjb250cm9sbGVyOkVudn1dLFxyXG4gICAgICAgIG1vZGVsOiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXHJcbiAgICB9XHJcblxyXG4gICAgZXhpdFNwbGFzaCgpe1xyXG5cdC8qICovXHJcbiAgICAgICAgdGhpcy5fc2hvdygpO1xyXG5cdC8qL1xyXG5cdHRoaXMubW9kZWwuc2V0SXRlbShcImFwcC5BVDMydTQudXJsXCIsIFwiSGVsbG9Xb3JsZDMydTQuaGV4XCIpO1xyXG5cdHRoaXMucG9vbC5jYWxsKFwicnVuU2ltXCIpO1xyXG5cdC8qICovXHRcclxuICAgIH1cclxuXHJcbiAgICBleGl0U2ltKCl7XHJcblx0dGhpcy5fc2hvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uRHJvcEZpbGUoIGRvbSwgZXZlbnQgKXtcclxuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHJcblx0dmFyIGR0ID0gZXZlbnQuZGF0YVRyYW5zZmVyO1xyXG5cdHZhciBmaWxlcyA9IGR0LmZpbGVzO1xyXG5cclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcblx0ICAgIGxldCBmaWxlID0gZmlsZXNbaV07XHJcblx0ICAgIGlmKCAvLipcXC5hcmR1Ym95JHwuKlxcLmhleCQvaS50ZXN0KGZpbGUubmFtZSkgKVxyXG5cdFx0cmV0dXJuIGxvYWRGaWxlLmNhbGwoIHRoaXMsIGZpbGUgKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGxvYWRGaWxlKCBmaWxlICl7XHJcblx0ICAgIGxldCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0ICAgIGZyLm9ubG9hZCA9IGV2dCA9PiB7XHJcblx0XHR0aGlzLm1vZGVsLnNldEl0ZW0oXCJhcHAuQVQzMnU0LmhleFwiLCBmci5yZXN1bHQpO1xyXG5cdFx0dGhpcy5wb29sLmNhbGwoXCJydW5TaW1cIik7XHJcblx0ICAgIH07XHJcblx0ICAgIGZyLnJlYWRBc1RleHQoZmlsZSk7XHJcblx0fVxyXG5cdFxyXG4gICAgfVxyXG5cclxuICAgIHBsYXkoIG9wdCApe1xyXG5cdFxyXG5cdGxldCB1cmwgPSBvcHQuZWxlbWVudC5kYXRhc2V0LnVybDtcclxuXHRcclxuXHR0aGlzLm1vZGVsLnJlbW92ZUl0ZW0oXCJhcHAuQVQzMnU0XCIpO1xyXG5cdFxyXG5cdGlmKCAvXFwuYXJkdWJveSQvaS50ZXN0KHVybCkgKXtcclxuXHQgICAgXHJcblx0ICAgIGxldCB6aXAgPSBudWxsO1xyXG5cdCAgICBmZXRjaCggdGhpcy5tb2RlbC5nZXRJdGVtKFwiYXBwLnByb3h5XCIpICsgdXJsIClcclxuXHRcdC50aGVuKCByc3AgPT4gcnNwLmFycmF5QnVmZmVyKCkgKVxyXG5cdFx0LnRoZW4oIGJ1ZmYgPT4gSlNaaXAubG9hZEFzeW5jKCBidWZmICkgKVxyXG5cdFx0LnRoZW4oIHogPT4gKHppcD16KS5maWxlKFwiaW5mby5qc29uXCIpLmFzeW5jKFwidGV4dFwiKSApXHJcblx0XHQudGhlbiggaW5mbyA9PiB6aXAuZmlsZSggSlNPTi5wYXJzZSggZml4SlNPTihpbmZvKSApLmJpbmFyaWVzWzBdLmZpbGVuYW1lKS5hc3luYyhcInRleHRcIikgKVxyXG5cdFx0LnRoZW4oIGhleCA9PiB7XHJcblx0XHQgICAgdGhpcy5tb2RlbC5zZXRJdGVtKFwiYXBwLkFUMzJ1NC5oZXhcIiwgaGV4KTtcclxuXHRcdCAgICB0aGlzLnBvb2wuY2FsbChcInJ1blNpbVwiKTtcclxuXHRcdH0pXHJcblx0XHQuY2F0Y2goIGVyciA9PiB7XHJcblx0XHQgICAgY29uc29sZS5lcnJvciggZXJyICk7XHJcblx0XHR9KTtcclxuXHJcblx0fWVsc2V7XHJcblx0ICAgIHRoaXMubW9kZWwuc2V0SXRlbShcImFwcC5BVDMydTQudXJsXCIsIHRoaXMubW9kZWwuZ2V0SXRlbShcImFwcC5wcm94eVwiKSArIHVybCApO1xyXG5cdCAgICB0aGlzLnBvb2wuY2FsbChcInJ1blNpbVwiKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGZpeEpTT04oIHN0ciApe1xyXG5cdCAgICBcclxuXHQgICAgaWYoIHN0ci5jaGFyQ29kZUF0KDApID09IDB4RkVGRiApXHJcblx0XHRzdHIgPSBzdHIuc3Vic3RyKDEpO1xyXG5cdCAgICBcclxuXHQgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXCwoPyFcXHMqP1tcXHtcXFtcXFwiXFwnXFx3XSkvZywgJycpO1xyXG5cdCAgICBcclxuXHR9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRW52O1xyXG4iLCJpbXBvcnQgeyBJQ29udHJvbGxlciwgTW9kZWwsIElWaWV3IH0gZnJvbSAnLi4vbGliL212Yy5qcyc7XG5cbmNsYXNzIFNpbSBleHRlbmRzIElDb250cm9sbGVyIHtcblxuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcbiAgICAgICAgcG9vbDpcInBvb2xcIixcbiAgICAgICAgdmlld0ZhY3Rvcnk6W0lWaWV3LCB7Y29udHJvbGxlcjpTaW19XSxcbiAgICAgICAgbW9kZWw6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV1cbiAgICB9XG5cbiAgICBydW5TaW0oKXtcbiAgICAgICAgdGhpcy5fc2hvdygpO1xuICAgIH1cblxuICAgIG9uRW5kU2ltKCl7XG5cdHRoaXMucG9vbC5jYWxsKFwiZXhpdFNpbVwiKTtcbiAgICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBTaW07XG4iLCIvLyBpbXBvcnQgSVN0b3JlIGZyb20gJy4uL3N0b3JlL0lTdG9yZS5qcyc7XHJcbmltcG9ydCB7IElDb250cm9sbGVyLCBJVmlldyB9IGZyb20gJy4uL2xpYi9tdmMuanMnO1xyXG5cclxuXHJcbmNsYXNzIFNwbGFzaCBleHRlbmRzIElDb250cm9sbGVyIHtcclxuXHJcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XHJcbiAgICAgICAgcG9vbDpcInBvb2xcIixcclxuICAgICAgICB2aWV3RmFjdG9yeTpbSVZpZXcsIHtjb250cm9sbGVyOlNwbGFzaH1dXHJcbiAgICB9O1xyXG5cclxuICAgIGVudGVyU3BsYXNoKCl7XHJcbiAgICAgICAgdGhpcy5fc2hvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIEJPRFkgPSB7XHJcbiAgICAgICAgYm91bmQ6ZnVuY3Rpb24oIGV2dCApe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZ0LnRhcmdldDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU3BsYXNoO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IERPTTtcclxuXHJcbmZ1bmN0aW9uIERPTSggZWxlbWVudCApe1xyXG5cclxuICAgIGlmKCAhZWxlbWVudCAmJiBkb2N1bWVudCAmJiBkb2N1bWVudC5ib2R5IClcclxuICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cclxufVxyXG5cclxudmFyIHNwYXJlID0gbnVsbDtcclxuZnVuY3Rpb24gZ2V0VGhpcyggdGhhdCApe1xyXG5cclxuICAgIGlmKCAhdGhhdCB8fCB0eXBlb2YgdGhhdCA9PSBcImZ1bmN0aW9uXCIgKVxyXG4gICAgICAgIHJldHVybiBzcGFyZSA9IHNwYXJlIHx8IG5ldyBET00oKTtcclxuXHJcbiAgICByZXR1cm4gdGhhdDtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb3RvdHlwZSggb2JqICl7XHJcbiAgICBcclxuICAgIHZhciBkZXNjID0ge307XHJcbiAgICBmb3IoIHZhciBrIGluIG9iaiApe1xyXG4gICAgICAgIGRlc2Nba10gPSB7XHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6ZmFsc2UsXHJcbiAgICAgICAgICAgIHZhbHVlOiBvYmpba11cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJldCA9IHt9O1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocmV0LCBkZXNjKTtcclxuXHJcbiAgICByZXR1cm4gcmV0O1xyXG5cclxufVxyXG5cclxudmFyIGltcGwgPSB7XHJcblxyXG4gICAgY3JlYXRlOmZ1bmN0aW9uKCBzdHJUYWdOYW1lLCBvYmpQcm9wZXJ0aWVzLCBhcnJDaGlsZHJlbiwgZWxQYXJlbnQgKXtcclxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKTtcclxuICAgICAgICBzdHJUYWdOYW1lID0gb2JqUHJvcGVydGllcyA9IGFyckNoaWxkcmVuID0gZWxQYXJlbnQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGZvciggdmFyIGk9MCwgbD1hcmdzLmxlbmd0aDsgaTxsOyArK2kgKXtcclxuICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgYXJnID09IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICAgICAgICAgc3RyVGFnTmFtZSA9IGFyZztcclxuICAgICAgICAgICAgZWxzZSBpZiggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiICl7XHJcbiAgICAgICAgICAgICAgICBpZiggQXJyYXkuaXNBcnJheShhcmcpIClcclxuICAgICAgICAgICAgICAgICAgICBhcnJDaGlsZHJlbiA9IGFyZztcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIGFyZyBpbnN0YW5jZW9mIEVsZW1lbnQgKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsUGFyZW50ID0gYXJnO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialByb3BlcnRpZXMgPSBhcmc7XHJcbiAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggIWVsUGFyZW50ICYmIHRoaXMuZWxlbWVudCApXHJcbiAgICAgICAgICAgIGVsUGFyZW50ID0gdGhpcy5lbGVtZW50O1xyXG5cclxuICAgICAgICBpZiggIXN0clRhZ05hbWUgKXtcclxuICAgICAgICAgICAgaWYoICFlbFBhcmVudCApXHJcbiAgICAgICAgICAgICAgICBzdHJUYWdOYW1lID0gXCJzcGFuXCI7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHN0clRhZ05hbWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFibGU6XCJ0clwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyOlwidGRcIixcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Q6XCJvcHRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICB1bDpcImxpXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgb2w6XCJsaVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRsOlwiZHRcIixcclxuICAgICAgICAgICAgICAgICAgICBvcHRncm91cDpcIm9wdGlvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFsaXN0Olwib3B0aW9uXCJcclxuICAgICAgICAgICAgICAgIH1bZWxQYXJlbnQudGFnTmFtZV0gfHwgZWxQYXJlbnQudGFnTmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggc3RyVGFnTmFtZSApO1xyXG4gICAgICAgIGlmKCBlbFBhcmVudCApXHJcbiAgICAgICAgICAgIGVsUGFyZW50LmFwcGVuZENoaWxkKCBlbGVtZW50ICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3RlbmVyO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBrZXkgaW4gb2JqUHJvcGVydGllcyApe1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBvYmpQcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgICAgIGlmKCBrZXkgPT0gXCJ0ZXh0XCIgKVxyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpICk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIGtleSA9PSBcImxpc3RlbmVyXCIgKVxyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgZWxzZSBpZigga2V5ID09IFwiYXR0clwiICl7XHJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBhdHRyIGluIHZhbHVlIClcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSggYXR0ciwgdmFsdWVbYXR0cl0gKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIGVsZW1lbnRba2V5XSAmJiB0eXBlb2YgZWxlbWVudFtrZXldID09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgKVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiggZWxlbWVudFtrZXldLCB2YWx1ZSApO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50W2tleV0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCB0aGlzLmVsZW1lbnQgJiYgZWxlbWVudC5pZCApXHJcbiAgICAgICAgICAgIHRoaXNbZWxlbWVudC5pZF0gPSBlbGVtZW50O1xyXG5cclxuICAgICAgICBmb3IoIGk9MCwgbD1hcnJDaGlsZHJlbiAmJiBhcnJDaGlsZHJlbi5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlLmFwcGx5KCB0aGlzLCBhcnJDaGlsZHJlbltpXS5jb25jYXQoZWxlbWVudCkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBsaXN0ZW5lciApXHJcbiAgICAgICAgICAgIChuZXcgRE9NKGVsZW1lbnQpKS5saXN0ZW4oIGxpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBsaXN0ZW46ZnVuY3Rpb24oIGxpc3RlbmVycywgdGhhdCwgcHJlZml4ICl7XHJcbiAgICAgICAgcHJlZml4ID0gcHJlZml4IHx8IFwiXCI7XHJcbiAgICAgICAgaWYoIHRoYXQgPT09IHVuZGVmaW5lZCApIHRoYXQgPSBsaXN0ZW5lcnM7XHJcblxyXG4gICAgICAgIHZhciBUSElTID0gZ2V0VGhpcyggdGhpcyApO1xyXG5cclxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKCBsaXN0ZW5lcnMgKTtcclxuXHJcbiAgICAgICAgVEhJUy5mb3JFYWNoKCBlbGVtZW50ID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC50YWdOYW1lXSApIFxyXG4gICAgICAgICAgICAgICAgYmluZCggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQudGFnTmFtZV0sIGVsZW1lbnQgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5pZF0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50LmlkXSwgZWxlbWVudCApO1xyXG5cclxuICAgICAgICAgICAgaWYoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50LmNsYXNzTmFtZV0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50LmNsYXNzTmFtZV0sIGVsZW1lbnQgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5uYW1lXSApIFxyXG4gICAgICAgICAgICAgICAgYmluZCggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQubmFtZV0sIGVsZW1lbnQgKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBUSElTO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBiaW5kKCBvYmosIGVsZW1lbnQgKXtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGV2ZW50IGluIG9iaiApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGZ1bmMgPSBvYmpbZXZlbnRdO1xyXG4gICAgICAgICAgICAgICAgaWYoICFmdW5jLmNhbGwgKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnQsIHRoYXQgPyBmdW5jLmJpbmQodGhhdCkgOiBmdW5jICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6ZnVuY3Rpb24oIGtleXMsIG11bHRpcGxlLCBwcm9wZXJ0eSApe1xyXG4gICAgICAgIHZhciBUSElTID0gZ2V0VGhpcyh0aGlzKTtcclxuXHJcbiAgICAgICAgdmFyIGluZGV4ID0gT2JqZWN0LmNyZWF0ZShET00ucHJvdG90eXBlKTtcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBrZXlzID09IFwic3RyaW5nXCIgKSBrZXlzID0gW2tleXNdO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9a2V5cy5sZW5ndGg7IGk8bDsgKytpICl7XHJcblxyXG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBrZXkgIT0gXCJzdHJpbmdcIiApXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGlmKCAhcHJvcGVydHkgJiYgIW11bHRpcGxlICl7XHJcblxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PiBjaGlsZFtrZXldICE9PSB1bmRlZmluZWQgJiYgKGluZGV4WyBjaGlsZFtrZXldIF0gPSBjaGlsZCkgKTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBwcm9wZXJ0eSAmJiAhbXVsdGlwbGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+e1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBjaGlsZFtwcm9wZXJ0eV0gJiYgdHlwZW9mIGNoaWxkW3Byb3BlcnR5XSA9PSBcIm9iamVjdFwiICYmIGNoaWxkW3Byb3BlcnR5XVtrZXldICE9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhbIGNoaWxkW3Byb3BlcnR5XVtrZXldIF0gPSBjaGlsZDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfWVsc2UgaWYoICFwcm9wZXJ0eSAmJiB0eXBlb2YgbXVsdGlwbGUgPT0gXCJmdW5jdGlvblwiICl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBjaGlsZFtrZXldICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZSggY2hpbGRba2V5XSwgY2hpbGQgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfWVsc2UgaWYoIHByb3BlcnR5ICYmIHR5cGVvZiBtdWx0aXBsZSA9PSBcImZ1bmN0aW9uXCIgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+e1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiggIWNoaWxkW3Byb3BlcnR5XSB8fCB0eXBlb2YgY2hpbGRbcHJvcGVydHldICE9IFwib2JqZWN0XCIgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGNoaWxkW3Byb3BlcnR5XVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB2ICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZSggdiwgY2hpbGQgKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCAhcHJvcGVydHkgJiYgbXVsdGlwbGUgKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGNoaWxkW2tleV0gIT09IHVuZGVmaW5lZCApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggIWluZGV4WyBjaGlsZFtrZXldIF0gKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhbIGNoaWxkW2tleV0gXSA9IFtjaGlsZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyBjaGlsZFtrZXldIF0ucHVzaCggY2hpbGQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBwcm9wZXJ0eSAmJiBtdWx0aXBsZSApe1xyXG5cclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT57XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCAhY2hpbGRbcHJvcGVydHldIHx8IHR5cGVvZiBjaGlsZFtwcm9wZXJ0eV0gIT0gXCJvYmplY3RcIiApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gY2hpbGRbcHJvcGVydHldW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIHYgIT09IHVuZGVmaW5lZCApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggIWluZGV4WyB2IF0gKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhbIHYgXSA9IFtjaGlsZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyB2IF0ucHVzaCggY2hpbGQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGluZGV4O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDpmdW5jdGlvbiggY2IsIGVsZW1lbnQgKXtcclxuICAgICAgICB2YXIgVEhJUyA9IGdldFRoaXModGhpcyk7XHJcblxyXG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IFRISVMuZWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYoICFlbGVtZW50IClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiggY2IoZWxlbWVudCkgPT09IGZhbHNlIClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiggIWVsZW1lbnQuY2hpbGRyZW4gKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciggdmFyIGk9MCwgbD1lbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaTxsOyArK2kgKXtcclxuICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjYiwgZWxlbWVudC5jaGlsZHJlbltpXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuT2JqZWN0LmFzc2lnbihET00sIGltcGwpO1xyXG5ET00ucHJvdG90eXBlID0gcHJvdG90eXBlKGltcGwpO1xyXG4iLCIvKlxyXG4gIEkndmUgd3JhcHBlZCBNYWtvdG8gTWF0c3Vtb3RvIGFuZCBUYWt1amkgTmlzaGltdXJhJ3MgY29kZSBpbiBhIG5hbWVzcGFjZVxyXG4gIHNvIGl0J3MgYmV0dGVyIGVuY2Fwc3VsYXRlZC4gTm93IHlvdSBjYW4gaGF2ZSBtdWx0aXBsZSByYW5kb20gbnVtYmVyIGdlbmVyYXRvcnNcclxuICBhbmQgdGhleSB3b24ndCBzdG9tcCBhbGwgb3ZlciBlYWNob3RoZXIncyBzdGF0ZS5cclxuICBcclxuICBJZiB5b3Ugd2FudCB0byB1c2UgdGhpcyBhcyBhIHN1YnN0aXR1dGUgZm9yIE1hdGgucmFuZG9tKCksIHVzZSB0aGUgcmFuZG9tKClcclxuICBtZXRob2QgbGlrZSBzbzpcclxuICBcclxuICB2YXIgbSA9IG5ldyBNZXJzZW5uZVR3aXN0ZXIoKTtcclxuICB2YXIgcmFuZG9tTnVtYmVyID0gbS5yYW5kb20oKTtcclxuICBcclxuICBZb3UgY2FuIGFsc28gY2FsbCB0aGUgb3RoZXIgZ2VucmFuZF97Zm9vfSgpIG1ldGhvZHMgb24gdGhlIGluc3RhbmNlLlxyXG4gIElmIHlvdSB3YW50IHRvIHVzZSBhIHNwZWNpZmljIHNlZWQgaW4gb3JkZXIgdG8gZ2V0IGEgcmVwZWF0YWJsZSByYW5kb21cclxuICBzZXF1ZW5jZSwgcGFzcyBhbiBpbnRlZ2VyIGludG8gdGhlIGNvbnN0cnVjdG9yOlxyXG4gIHZhciBtID0gbmV3IE1lcnNlbm5lVHdpc3RlcigxMjMpO1xyXG4gIGFuZCB0aGF0IHdpbGwgYWx3YXlzIHByb2R1Y2UgdGhlIHNhbWUgcmFuZG9tIHNlcXVlbmNlLlxyXG4gIFNlYW4gTWNDdWxsb3VnaCAoYmFua3NlYW5AZ21haWwuY29tKVxyXG4qL1xyXG5cclxuLyogXHJcbiAgIEEgQy1wcm9ncmFtIGZvciBNVDE5OTM3LCB3aXRoIGluaXRpYWxpemF0aW9uIGltcHJvdmVkIDIwMDIvMS8yNi5cclxuICAgQ29kZWQgYnkgVGFrdWppIE5pc2hpbXVyYSBhbmQgTWFrb3RvIE1hdHN1bW90by5cclxuIFxyXG4gICBCZWZvcmUgdXNpbmcsIGluaXRpYWxpemUgdGhlIHN0YXRlIGJ5IHVzaW5nIGluaXRfZ2VucmFuZChzZWVkKSAgXHJcbiAgIG9yIGluaXRfYnlfYXJyYXkoaW5pdF9rZXksIGtleV9sZW5ndGgpLlxyXG4gXHJcbiAgIENvcHlyaWdodCAoQykgMTk5NyAtIDIwMDIsIE1ha290byBNYXRzdW1vdG8gYW5kIFRha3VqaSBOaXNoaW11cmEsXHJcbiAgIEFsbCByaWdodHMgcmVzZXJ2ZWQuICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuIFxyXG4gICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcclxuICAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zXHJcbiAgIGFyZSBtZXQ6XHJcbiBcclxuICAgICAxLiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxyXG4gICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cclxuIFxyXG4gICAgIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XHJcbiAgICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxyXG4gICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXHJcbiBcclxuICAgICAzLiBUaGUgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXkgbm90IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIFxyXG4gICAgICAgIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBcclxuICAgICAgICBwZXJtaXNzaW9uLlxyXG4gXHJcbiAgIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlNcclxuICAgXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVFxyXG4gICBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1JcclxuICAgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIE9XTkVSIE9SXHJcbiAgIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLFxyXG4gICBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sXHJcbiAgIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxyXG4gICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GXHJcbiAgIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HXHJcbiAgIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xyXG4gICBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cclxuIFxyXG4gXHJcbiAgIEFueSBmZWVkYmFjayBpcyB2ZXJ5IHdlbGNvbWUuXHJcbiAgIGh0dHA6Ly93d3cubWF0aC5zY2kuaGlyb3NoaW1hLXUuYWMuanAvfm0tbWF0L01UL2VtdC5odG1sXHJcbiAgIGVtYWlsOiBtLW1hdCBAIG1hdGguc2NpLmhpcm9zaGltYS11LmFjLmpwIChyZW1vdmUgc3BhY2UpXHJcbiovXHJcblxyXG52YXIgTWVyc2VubmVUd2lzdGVyID0gZnVuY3Rpb24oc2VlZCkge1xyXG4gIGlmIChzZWVkID09IHVuZGVmaW5lZCkge1xyXG4gICAgc2VlZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gIH0gXHJcbiAgLyogUGVyaW9kIHBhcmFtZXRlcnMgKi8gIFxyXG4gIHRoaXMuTiA9IDYyNDtcclxuICB0aGlzLk0gPSAzOTc7XHJcbiAgdGhpcy5NQVRSSVhfQSA9IDB4OTkwOGIwZGY7ICAgLyogY29uc3RhbnQgdmVjdG9yIGEgKi9cclxuICB0aGlzLlVQUEVSX01BU0sgPSAweDgwMDAwMDAwOyAvKiBtb3N0IHNpZ25pZmljYW50IHctciBiaXRzICovXHJcbiAgdGhpcy5MT1dFUl9NQVNLID0gMHg3ZmZmZmZmZjsgLyogbGVhc3Qgc2lnbmlmaWNhbnQgciBiaXRzICovXHJcbiBcclxuICB0aGlzLm10ID0gbmV3IEFycmF5KHRoaXMuTik7IC8qIHRoZSBhcnJheSBmb3IgdGhlIHN0YXRlIHZlY3RvciAqL1xyXG4gIHRoaXMubXRpPXRoaXMuTisxOyAvKiBtdGk9PU4rMSBtZWFucyBtdFtOXSBpcyBub3QgaW5pdGlhbGl6ZWQgKi9cclxuXHJcbiAgdGhpcy5pbml0X2dlbnJhbmQoc2VlZCk7XHJcbn0gIFxyXG4gXHJcbi8qIGluaXRpYWxpemVzIG10W05dIHdpdGggYSBzZWVkICovXHJcbk1lcnNlbm5lVHdpc3Rlci5wcm90b3R5cGUuaW5pdF9nZW5yYW5kID0gZnVuY3Rpb24ocykge1xyXG4gIHRoaXMubXRbMF0gPSBzID4+PiAwO1xyXG4gIGZvciAodGhpcy5tdGk9MTsgdGhpcy5tdGk8dGhpcy5OOyB0aGlzLm10aSsrKSB7XHJcbiAgICAgIHZhciBzID0gdGhpcy5tdFt0aGlzLm10aS0xXSBeICh0aGlzLm10W3RoaXMubXRpLTFdID4+PiAzMCk7XHJcbiAgIHRoaXMubXRbdGhpcy5tdGldID0gKCgoKChzICYgMHhmZmZmMDAwMCkgPj4+IDE2KSAqIDE4MTI0MzMyNTMpIDw8IDE2KSArIChzICYgMHgwMDAwZmZmZikgKiAxODEyNDMzMjUzKVxyXG4gICsgdGhpcy5tdGk7XHJcbiAgICAgIC8qIFNlZSBLbnV0aCBUQU9DUCBWb2wyLiAzcmQgRWQuIFAuMTA2IGZvciBtdWx0aXBsaWVyLiAqL1xyXG4gICAgICAvKiBJbiB0aGUgcHJldmlvdXMgdmVyc2lvbnMsIE1TQnMgb2YgdGhlIHNlZWQgYWZmZWN0ICAgKi9cclxuICAgICAgLyogb25seSBNU0JzIG9mIHRoZSBhcnJheSBtdFtdLiAgICAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgIC8qIDIwMDIvMDEvMDkgbW9kaWZpZWQgYnkgTWFrb3RvIE1hdHN1bW90byAgICAgICAgICAgICAqL1xyXG4gICAgICB0aGlzLm10W3RoaXMubXRpXSA+Pj49IDA7XHJcbiAgICAgIC8qIGZvciA+MzIgYml0IG1hY2hpbmVzICovXHJcbiAgfVxyXG59XHJcbiBcclxuLyogaW5pdGlhbGl6ZSBieSBhbiBhcnJheSB3aXRoIGFycmF5LWxlbmd0aCAqL1xyXG4vKiBpbml0X2tleSBpcyB0aGUgYXJyYXkgZm9yIGluaXRpYWxpemluZyBrZXlzICovXHJcbi8qIGtleV9sZW5ndGggaXMgaXRzIGxlbmd0aCAqL1xyXG4vKiBzbGlnaHQgY2hhbmdlIGZvciBDKyssIDIwMDQvMi8yNiAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmluaXRfYnlfYXJyYXkgPSBmdW5jdGlvbihpbml0X2tleSwga2V5X2xlbmd0aCkge1xyXG4gIHZhciBpLCBqLCBrO1xyXG4gIHRoaXMuaW5pdF9nZW5yYW5kKDE5NjUwMjE4KTtcclxuICBpPTE7IGo9MDtcclxuICBrID0gKHRoaXMuTj5rZXlfbGVuZ3RoID8gdGhpcy5OIDoga2V5X2xlbmd0aCk7XHJcbiAgZm9yICg7IGs7IGstLSkge1xyXG4gICAgdmFyIHMgPSB0aGlzLm10W2ktMV0gXiAodGhpcy5tdFtpLTFdID4+PiAzMClcclxuICAgIHRoaXMubXRbaV0gPSAodGhpcy5tdFtpXSBeICgoKCgocyAmIDB4ZmZmZjAwMDApID4+PiAxNikgKiAxNjY0NTI1KSA8PCAxNikgKyAoKHMgJiAweDAwMDBmZmZmKSAqIDE2NjQ1MjUpKSlcclxuICAgICAgKyBpbml0X2tleVtqXSArIGo7IC8qIG5vbiBsaW5lYXIgKi9cclxuICAgIHRoaXMubXRbaV0gPj4+PSAwOyAvKiBmb3IgV09SRFNJWkUgPiAzMiBtYWNoaW5lcyAqL1xyXG4gICAgaSsrOyBqKys7XHJcbiAgICBpZiAoaT49dGhpcy5OKSB7IHRoaXMubXRbMF0gPSB0aGlzLm10W3RoaXMuTi0xXTsgaT0xOyB9XHJcbiAgICBpZiAoaj49a2V5X2xlbmd0aCkgaj0wO1xyXG4gIH1cclxuICBmb3IgKGs9dGhpcy5OLTE7IGs7IGstLSkge1xyXG4gICAgdmFyIHMgPSB0aGlzLm10W2ktMV0gXiAodGhpcy5tdFtpLTFdID4+PiAzMCk7XHJcbiAgICB0aGlzLm10W2ldID0gKHRoaXMubXRbaV0gXiAoKCgoKHMgJiAweGZmZmYwMDAwKSA+Pj4gMTYpICogMTU2NjA4Mzk0MSkgPDwgMTYpICsgKHMgJiAweDAwMDBmZmZmKSAqIDE1NjYwODM5NDEpKVxyXG4gICAgICAtIGk7IC8qIG5vbiBsaW5lYXIgKi9cclxuICAgIHRoaXMubXRbaV0gPj4+PSAwOyAvKiBmb3IgV09SRFNJWkUgPiAzMiBtYWNoaW5lcyAqL1xyXG4gICAgaSsrO1xyXG4gICAgaWYgKGk+PXRoaXMuTikgeyB0aGlzLm10WzBdID0gdGhpcy5tdFt0aGlzLk4tMV07IGk9MTsgfVxyXG4gIH1cclxuXHJcbiAgdGhpcy5tdFswXSA9IDB4ODAwMDAwMDA7IC8qIE1TQiBpcyAxOyBhc3N1cmluZyBub24temVybyBpbml0aWFsIGFycmF5ICovIFxyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwweGZmZmZmZmZmXS1pbnRlcnZhbCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmdlbnJhbmRfaW50MzIgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgeTtcclxuICB2YXIgbWFnMDEgPSBuZXcgQXJyYXkoMHgwLCB0aGlzLk1BVFJJWF9BKTtcclxuICAvKiBtYWcwMVt4XSA9IHggKiBNQVRSSVhfQSAgZm9yIHg9MCwxICovXHJcblxyXG4gIGlmICh0aGlzLm10aSA+PSB0aGlzLk4pIHsgLyogZ2VuZXJhdGUgTiB3b3JkcyBhdCBvbmUgdGltZSAqL1xyXG4gICAgdmFyIGtrO1xyXG5cclxuICAgIGlmICh0aGlzLm10aSA9PSB0aGlzLk4rMSkgICAvKiBpZiBpbml0X2dlbnJhbmQoKSBoYXMgbm90IGJlZW4gY2FsbGVkLCAqL1xyXG4gICAgICB0aGlzLmluaXRfZ2VucmFuZCg1NDg5KTsgLyogYSBkZWZhdWx0IGluaXRpYWwgc2VlZCBpcyB1c2VkICovXHJcblxyXG4gICAgZm9yIChraz0wO2trPHRoaXMuTi10aGlzLk07a2srKykge1xyXG4gICAgICB5ID0gKHRoaXMubXRba2tdJnRoaXMuVVBQRVJfTUFTSyl8KHRoaXMubXRba2srMV0mdGhpcy5MT1dFUl9NQVNLKTtcclxuICAgICAgdGhpcy5tdFtra10gPSB0aGlzLm10W2trK3RoaXMuTV0gXiAoeSA+Pj4gMSkgXiBtYWcwMVt5ICYgMHgxXTtcclxuICAgIH1cclxuICAgIGZvciAoO2trPHRoaXMuTi0xO2trKyspIHtcclxuICAgICAgeSA9ICh0aGlzLm10W2trXSZ0aGlzLlVQUEVSX01BU0spfCh0aGlzLm10W2trKzFdJnRoaXMuTE9XRVJfTUFTSyk7XHJcbiAgICAgIHRoaXMubXRba2tdID0gdGhpcy5tdFtraysodGhpcy5NLXRoaXMuTildIF4gKHkgPj4+IDEpIF4gbWFnMDFbeSAmIDB4MV07XHJcbiAgICB9XHJcbiAgICB5ID0gKHRoaXMubXRbdGhpcy5OLTFdJnRoaXMuVVBQRVJfTUFTSyl8KHRoaXMubXRbMF0mdGhpcy5MT1dFUl9NQVNLKTtcclxuICAgIHRoaXMubXRbdGhpcy5OLTFdID0gdGhpcy5tdFt0aGlzLk0tMV0gXiAoeSA+Pj4gMSkgXiBtYWcwMVt5ICYgMHgxXTtcclxuXHJcbiAgICB0aGlzLm10aSA9IDA7XHJcbiAgfVxyXG5cclxuICB5ID0gdGhpcy5tdFt0aGlzLm10aSsrXTtcclxuXHJcbiAgLyogVGVtcGVyaW5nICovXHJcbiAgeSBePSAoeSA+Pj4gMTEpO1xyXG4gIHkgXj0gKHkgPDwgNykgJiAweDlkMmM1NjgwO1xyXG4gIHkgXj0gKHkgPDwgMTUpICYgMHhlZmM2MDAwMDtcclxuICB5IF49ICh5ID4+PiAxOCk7XHJcblxyXG4gIHJldHVybiB5ID4+PiAwO1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwweDdmZmZmZmZmXS1pbnRlcnZhbCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmdlbnJhbmRfaW50MzEgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gKHRoaXMuZ2VucmFuZF9pbnQzMigpPj4+MSk7XHJcbn1cclxuIFxyXG4vKiBnZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIG9uIFswLDFdLXJlYWwtaW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX3JlYWwxID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZ2VucmFuZF9pbnQzMigpKigxLjAvNDI5NDk2NzI5NS4wKTsgXHJcbiAgLyogZGl2aWRlZCBieSAyXjMyLTEgKi8gXHJcbn1cclxuXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gWzAsMSktcmVhbC1pbnRlcnZhbCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLnJhbmRvbSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmdlbnJhbmRfaW50MzIoKSooMS4wLzQyOTQ5NjcyOTYuMCk7IFxyXG4gIC8qIGRpdmlkZWQgYnkgMl4zMiAqL1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiAoMCwxKS1yZWFsLWludGVydmFsICovXHJcbk1lcnNlbm5lVHdpc3Rlci5wcm90b3R5cGUuZ2VucmFuZF9yZWFsMyA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiAodGhpcy5nZW5yYW5kX2ludDMyKCkgKyAwLjUpKigxLjAvNDI5NDk2NzI5Ni4wKTsgXHJcbiAgLyogZGl2aWRlZCBieSAyXjMyICovXHJcbn1cclxuIFxyXG4vKiBnZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIG9uIFswLDEpIHdpdGggNTMtYml0IHJlc29sdXRpb24qL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmdlbnJhbmRfcmVzNTMgPSBmdW5jdGlvbigpIHsgXHJcbiAgdmFyIGE9dGhpcy5nZW5yYW5kX2ludDMyKCk+Pj41LCBiPXRoaXMuZ2VucmFuZF9pbnQzMigpPj4+NjsgXHJcbiAgcmV0dXJuKGEqNjcxMDg4NjQuMCtiKSooMS4wLzkwMDcxOTkyNTQ3NDA5OTIuMCk7IFxyXG59IFxyXG5cclxuLyogVGhlc2UgcmVhbCB2ZXJzaW9ucyBhcmUgZHVlIHRvIElzYWt1IFdhZGEsIDIwMDIvMDEvMDkgYWRkZWQgKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVyc2VubmVUd2lzdGVyOyIsImltcG9ydCB7IGluamVjdCwgYmluZCwgZ2V0SW5zdGFuY2VPZiB9IGZyb20gJ2RyeS1kaSc7XHJcbmltcG9ydCBTdHJMZHIgZnJvbSAnLi9zdHJsZHIuanMnO1xyXG5pbXBvcnQgSVN0b3JlIGZyb20gJy4uL3N0b3JlL0lTdG9yZS5qcyc7XHJcbmltcG9ydCBET00gZnJvbSBcIi4vZHJ5LWRvbS5qc1wiO1xyXG5pbXBvcnQgUG9vbCBmcm9tICcuL3Bvb2wuanMnO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHJlYWQoIHN0ciwgY3R4ICl7XHJcblxyXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiLlwiKSwgaT0wO1xyXG5cclxuICAgIHdoaWxlKCBpPHBhcnRzLmxlbmd0aCAmJiBjdHggKVxyXG4gICAgICAgIGN0eCA9IGN0eFsgcGFydHNbaSsrXSBdO1xyXG4gICAgXHJcbiAgICByZXR1cm4gY3R4O1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZE1ldGhvZCggc3RyLCBjdHgsIC4uLmFyZ3MgKXtcclxuXHJcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoXCIuXCIpLCBpPTA7XHJcblxyXG4gICAgdmFyIHBjdHggPSBjdHg7XHJcblxyXG4gICAgd2hpbGUoIGk8cGFydHMubGVuZ3RoICYmIGN0eCApe1xyXG4gICAgICAgIHBjdHggPSBjdHg7XHJcbiAgICAgICAgY3R4ID0gY3R4WyBwYXJ0c1tpKytdIF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYoIGN0eCAmJiB0eXBlb2YgY3R4ID09PSBcImZ1bmN0aW9uXCIgKVxyXG4gICAgICAgIHJldHVybiBjdHguYmluZCggcGN0eCwgLi4uYXJncyApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbnVsbDtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlKCBzdHIsIHZhbHVlLCBjdHggKXtcclxuXHJcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoXCIuXCIpLCBpPTA7XHJcblxyXG4gICAgd2hpbGUocGFydHMubGVuZ3RoLTEgJiYgY3R4KXtcclxuICAgICAgICBpZiggIShwYXJ0c1tpXSBpbiBjdHgpIClcclxuICAgICAgICAgICAgY3R4W3BhcnRzW2ldXSA9IHt9O1xyXG4gICAgICAgIGN0eCA9IGN0eFsgcGFydHNbaSsrXSBdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiggY3R4IClcclxuICAgICAgICBjdHhbIHBhcnRzW2ldIF0gPSB2YWx1ZTtcclxuICAgIFxyXG4gICAgcmV0dXJuICEhY3R4O1xyXG4gICAgXHJcbn1cclxuXHJcbmNvbnN0IHBlbmRpbmcgPSBbXTtcclxubGV0IG5leHRNb2RlbElkID0gMDtcclxuXHJcbmNsYXNzIE1vZGVsIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB7fTtcclxuICAgICAgICB2YXIgZGF0YSA9IHt9O1xyXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHt9O1xyXG4gICAgICAgIHZhciByZXZDaGlsZHJlbiA9IHt9O1xyXG4gICAgICAgIHZhciBwYXJlbnRzID0ge307XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggZGF0YSwgXCJfX21vZGVsX19cIiwgeyB2YWx1ZTp0aGlzLCB3cml0YWJsZTogZmFsc2UsIGVudW1lcmFibGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCB0aGlzLCB7XHJcbiAgICAgICAgICAgIHJvb3Q6eyB2YWx1ZTp0aGlzLCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTp0cnVlIH0sXHJcbiAgICAgICAgICAgIGxpc3RlbmVyczp7IHZhbHVlOmxpc3RlbmVycywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSB9LFxyXG4gICAgICAgICAgICBkYXRhOnsgdmFsdWU6ZGF0YSwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOnsgdmFsdWU6Y2hpbGRyZW4sIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgcmV2Q2hpbGRyZW46eyB2YWx1ZTpyZXZDaGlsZHJlbiwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSB9LFxyXG4gICAgICAgICAgICBwYXJlbnRzOnsgdmFsdWU6cGFyZW50cywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSB9LFxyXG4gICAgICAgICAgICBpZDp7IHZhbHVlOiArK25leHRNb2RlbElkLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlIH0sXHJcbiAgICAgICAgICAgIGRpcnR5OntcclxuICAgICAgICAgICAgICAgIGdldDooKSA9PiB0aGlzLnJvb3QuX19kaXJ0eSxcclxuICAgICAgICAgICAgICAgIHNldDooIHYgKSA9PiB0aGlzLnJvb3QuX19kaXJ0eSA9IHZcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdG9yZSggYmluYXJ5PXRydWUgKXtcclxuICAgICAgICByZXR1cm4gU3RyTGRyLnN0b3JlKCB0aGlzLmRhdGEsIGJpbmFyeSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWQoIGRhdGEsIGRvUmFpc2UgPSB0cnVlICl7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiApe1xyXG4gICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBTdHJMZHIubG9hZChkYXRhKTtcclxuICAgICAgICAgICAgfWNhdGNoKGV4KXt9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggZGF0YSAmJiBkYXRhLmJ1ZmZlciAmJiBkYXRhLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICl7XHJcbiAgICAgICAgICAgIGlmKCAhKGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSApXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoZGF0YS5idWZmZXIpO1xyXG4gICAgICAgICAgICBkYXRhID0gU3RyTGRyLmxvYWQoIGRhdGEsIHRydWUgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciggdmFyIGsgaW4gZGF0YSApe1xyXG4gICAgICAgICAgICB0aGlzLnNldEl0ZW0oIGssIGRhdGFba10sIGRvUmFpc2UgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRJdGVtKCBrLCB2LCBkb1JhaXNlID0gdHJ1ZSApe1xyXG5cclxuICAgICAgICBpZiggay5jaGFyQ29kZUF0ICkgayA9IGsuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBwcm9wID0gay5zaGlmdCgpLCBjaGlsZDtcclxuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YSwgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuLCByZXZDaGlsZHJlbiA9IHRoaXMucmV2Q2hpbGRyZW47XHJcblxyXG4gICAgICAgIGlmKCBrLmxlbmd0aCApe1xyXG5cclxuICAgICAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltwcm9wXTtcclxuICAgICAgICAgICAgaWYoICFjaGlsZCApe1xyXG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltwcm9wXSA9IG5ldyBNb2RlbCgpO1xyXG4gICAgICAgICAgICAgICAgY2hpbGQucm9vdCA9IHRoaXMucm9vdDtcclxuICAgICAgICAgICAgICAgIGNoaWxkLnBhcmVudHNbIHRoaXMuaWQgXSA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICBkYXRhW3Byb3BdID0gY2hpbGQuZGF0YTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV2Q2hpbGRyZW5bIGNoaWxkLmlkIF0gPSBbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJhaXNlKCBwcm9wLCBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5bcHJvcF0uc2V0SXRlbSggaywgdiwgZG9SYWlzZSApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBjaGlsZHJlbltwcm9wXSApe1xyXG5cclxuICAgICAgICAgICAgaWYoIGNoaWxkcmVuW3Byb3BdLmRhdGEgIT09IHYgKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltwcm9wXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdLmluZGV4T2YocHJvcCk7XHJcbiAgICAgICAgICAgIGlmKCBpbmRleCA9PT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW50ZWdyaXR5IGNvbXByb21pc2VkXCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV2Q2hpbGRyZW5bIGNoaWxkLmlkIF0uc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cclxuICAgICAgICAgICAgZGVsZXRlIGNoaWxkLnBhcmVudHNbIHRoaXMuaWQgXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggdiAmJiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiICl7XHJcblxyXG4gICAgICAgICAgICB2YXIgZG9Mb2FkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmKCAhdi5fX21vZGVsX18gKXtcclxuICAgICAgICAgICAgICAgIGNoaWxkID0gbmV3IE1vZGVsKCk7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5yb290ID0gdGhpcy5yb290O1xyXG4gICAgICAgICAgICAgICAgZG9Mb2FkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBjaGlsZCA9IHYuX19tb2RlbF9fO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiggIXJldkNoaWxkcmVuWyBjaGlsZC5pZCBdICkgcmV2Q2hpbGRyZW5bIGNoaWxkLmlkIF0gPSBbIHByb3AgXTtcclxuICAgICAgICAgICAgZWxzZSByZXZDaGlsZHJlblsgY2hpbGQuaWQgXS5wdXNoKCBwcm9wICk7XHJcbiAgICAgICAgICAgIGNoaWxkcmVuWyBwcm9wIF0gPSBjaGlsZDtcclxuICAgICAgICAgICAgY2hpbGQucGFyZW50c1sgdGhpcy5pZCBdID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGlmKCBkb0xvYWQgKXtcclxuICAgICAgICAgICAgICAgIGNoaWxkLmxvYWQoIHYsIGZhbHNlICk7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5kYXRhID0gdjtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdiwgXCJfX21vZGVsX19cIiwgeyB2YWx1ZTpjaGlsZCwgd3JpdGFibGU6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkYXRhWyBwcm9wIF0gPSB2O1xyXG5cclxuICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnJhaXNlKCBwcm9wLCBkb1JhaXNlICk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRNb2RlbCggaywgY3JlYXRlICl7XHJcblxyXG4gICAgICAgIGlmKCBrLmNoYXJDb2RlQXQgKVxyXG4gICAgICAgICAgICBrID0gay5zcGxpdChcIi5cIik7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLCBpID0gMDtcclxuICAgICAgICBpZiggY3JlYXRlICl7XHJcbiAgICAgICAgICAgIHdoaWxlKCBjdHggJiYgaTxrLmxlbmd0aCApe1xyXG4gICAgICAgICAgICAgICAgaWYoICFjdHguY2hpbGRyZW5ba1tpXV0gKVxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zZXRJdGVtKGtbaV0sIHt9KTtcclxuICAgICAgICAgICAgICAgIGN0eCA9IGN0eC5jaGlsZHJlblsga1tpKytdIF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgd2hpbGUoIGN0eCAmJiBpPGsubGVuZ3RoIClcclxuICAgICAgICAgICAgICAgIGN0eCA9IGN0eC5jaGlsZHJlblsga1tpKytdIF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY3R4O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRJdGVtKCBrLCBkZWZhdWx0VmFsdWUgKXtcclxuICAgICAgICB2YXIgdiA9IHJlYWQoIGssIHRoaXMuZGF0YSApO1xyXG4gICAgICAgIGlmKCB2ID09PSB1bmRlZmluZWQgKSB2ID0gZGVmYXVsdFZhbHVlO1xyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZUl0ZW0oaywgY2Ipe1xyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gay5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgdmFyIGtleSA9IHBhcmVudC5wb3AoKTtcclxuXHJcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5nZXRNb2RlbCggcGFyZW50ICk7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBtb2RlbC5kYXRhLCBjaGlsZHJlbiA9IG1vZGVsLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICBpZiggIShrZXkgaW4gZGF0YSkgKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmKCBjaGlsZHJlbltrZXldICl7XHJcblxyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltrZXldLCBcclxuICAgICAgICAgICAgICAgIHJldkNoaWxkcmVuID0gbW9kZWwucmV2Q2hpbGRyZW5bY2hpbGQuaWRdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gcmV2Q2hpbGRyZW4uaW5kZXhPZigga2V5ICk7XHJcbiAgICAgICAgICAgIGlmKCBpbmRleCA9PSAtMSApIHRocm93IFwiSW50ZWdyaXR5IGNvbXByb21pc2VkXCI7XHJcblxyXG4gICAgICAgICAgICByZXZDaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgICAgaWYoIHJldkNoaWxkcmVuLmxlbmd0aCA9PSAwICl7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY2hpbGQucGFyZW50c1sgbW9kZWwuaWQgXTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBtb2RlbC5yZXZDaGlsZHJlbltjaGlsZC5pZF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltrZXldO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlbGV0ZSBkYXRhW2tleV07XHJcblxyXG4gICAgICAgIG1vZGVsLnJhaXNlKCBrZXksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByYWlzZShrLCBkb1JhaXNlKXtcclxuXHJcbiAgICAgICAgcGVuZGluZ1twZW5kaW5nLmxlbmd0aCsrXSA9IHttb2RlbDp0aGlzLCBrZXk6a307XHJcblxyXG4gICAgICAgIGlmKCAhZG9SYWlzZSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaSA9IDAsIGw9cGVuZGluZy5sZW5ndGg7IGk8bDsgKytpICl7XHJcblxyXG4gICAgICAgICAgICBrID0gcGVuZGluZ1tpXS5rZXk7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHBlbmRpbmdbaV0ubW9kZWw7XHJcblxyXG4gICAgICAgICAgICBpZiggayApe1xyXG5cclxuICAgICAgICAgICAgICAgIGRpc3BhdGNoKCBtb2RlbC5saXN0ZW5lcnNba10sIG1vZGVsLmRhdGFba10sIGsgKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgcGlkIGluIG1vZGVsLnBhcmVudHMgKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IG1vZGVsLnBhcmVudHNbIHBpZCBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXZDaGlsZHJlbiA9IHBhcmVudC5yZXZDaGlsZHJlblsgbW9kZWwuaWQgXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiggIXJldkNoaWxkcmVuICkgdGhyb3cgXCJJbnRlZ3JpdHkgY29tcHJvbWlzZWRcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKCB2YXIgaiA9IDAsIHJjbCA9IHJldkNoaWxkcmVuLmxlbmd0aDsgajxyY2w7ICsraiApe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2goIHBhcmVudC5saXN0ZW5lcnNbIHJldkNoaWxkcmVuW2pdIF0sIHBhcmVudC5kYXRhLCByZXZDaGlsZHJlbltqXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGVuZGluZy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBkaXNwYXRjaCggbGlzdGVuZXJzLCB2YWx1ZSwga2V5ICl7XHJcblxyXG4gICAgICAgICAgICBpZiggIWxpc3RlbmVycyApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTAsIGw9bGlzdGVuZXJzLmxlbmd0aDsgaTxsOyArK2kgKVxyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2ldKCB2YWx1ZSwga2V5ICk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIGF0dGFjaCggazpTdHJpbmcsIGNiOkZ1bmN0aW9uIClcclxuICAgIC8vIGxpc3RlbiB0byBub3RpZmljYXRpb25zIGZyb20gYSBwYXJ0aWN1bGFyIGtleVxyXG4gICAgLy8gYXR0YWNoKCBjYjpGdW5jdGlvbiApXHJcbiAgICAvLyBsaXN0ZW4gdG8ga2V5IGFkZGl0aW9ucy9yZW1vdmFsc1xyXG4gICAgYXR0YWNoKGssIGNiKXtcclxuICAgICAgICB2YXIga2V5ID0gay5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgdmFyIG1vZGVsO1xyXG4gICAgICAgIGlmKCBrZXkubGVuZ3RoID09IDEgKXtcclxuICAgICAgICAgICAga2V5ID0gaztcclxuICAgICAgICAgICAgbW9kZWwgPSB0aGlzO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBrID0ga2V5LnBvcCgpO1xyXG4gICAgICAgICAgICBtb2RlbCA9IHRoaXMuZ2V0TW9kZWwoIGtleSwgdHJ1ZSApO1xyXG4gICAgICAgICAgICBrZXkgPSBrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiggIW1vZGVsLmxpc3RlbmVyc1trZXldIClcclxuICAgICAgICAgICAgbW9kZWwubGlzdGVuZXJzW2tleV0gPSBbIGNiIF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBtb2RlbC5saXN0ZW5lcnNba2V5XS5wdXNoKGNiKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RvcCBsaXN0ZW5pbmdcclxuICAgIGRldGFjaChrLCBjYil7XHJcblxyXG4gICAgICAgIHZhciBpbmRleCwgbGlzdGVuZXJzO1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIGsgPT0gXCJmdW5jdGlvblwiICl7XHJcbiAgICAgICAgICAgIGNiID0gaztcclxuICAgICAgICAgICAgayA9IFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVyc1trXTtcclxuICAgICAgICBpZiggIWxpc3RlbmVyc1trXSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYik7XHJcbiAgICAgICAgaWYoIGluZGV4ID09IC0xIClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxpc3RlbmVycy5zcGxpY2UoIGluZGV4LCAxICk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY29uc3QgY2FjaGUgPSB7fTtcclxuXHJcbmNsYXNzIElWaWV3IHtcclxuXHJcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XHJcbiAgICAgICAgcGFyZW50RWxlbWVudDpcIlBhcmVudEVsZW1lbnRcIixcclxuICAgICAgICBtb2RlbDpbTW9kZWwse3Njb3BlOidyb290J31dXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoIGNvbnRyb2xsZXIgKXtcclxuXHJcbiAgICAgICAgdmFyIGxheW91dCA9IFwibGF5b3V0cy9cIiArIGNvbnRyb2xsZXIuY29uc3RydWN0b3IubmFtZSArIFwiLmh0bWxcIjtcclxuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xyXG4gICAgICAgIHRoaXMuZG9tID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYoICFjYWNoZVtsYXlvdXRdICl7XHJcblxyXG4gICAgICAgICAgICBmZXRjaCggbGF5b3V0IClcclxuICAgICAgICAgICAgLnRoZW4oIChyc3ApID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiggIXJzcC5vayAmJiByc3Auc3RhdHVzICE9PSAwICkgdGhyb3cgbmV3IEVycm9yKFwiTm90IE9LIVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByc3AudGV4dCgpO1xyXG5cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oIHRleHQgPT4gKG5ldyB3aW5kb3cuRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyh0ZXh0LCBcInRleHQvaHRtbFwiKSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlWyBsYXlvdXQgXSA9IGh0bWw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRMYXlvdXQoIGh0bWwgKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goIChleCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5pbm5lckhUTUwgPSBgPGRpdj5gICsgKGV4Lm1lc3NhZ2UgfHwgZXgpICsgYDogJHtsYXlvdXR9ITwvZGl2PmA7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfWVsc2UgXHJcbiAgICAgICAgICAgIHRoaXMubG9hZExheW91dCggY2FjaGVbbGF5b3V0XSApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsb2FkTGF5b3V0KCBkb2MgKXtcclxuICAgICAgICBkb2MgPSBkb2MuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgICAgIFsuLi5kb2MuYm9keS5jaGlsZHJlbl0uZm9yRWFjaCggY2hpbGQgPT4gdGhpcy5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkKSApO1xyXG5cclxuICAgICAgICB2YXIgZG9tID0gbmV3IERPTSggdGhpcy5wYXJlbnRFbGVtZW50ICk7XHJcbiAgICAgICAgdGhpcy5kb20gPSBkb207XHJcblxyXG4gICAgICAgIHByZXBhcmVET00oIGRvbSwgdGhpcy5jb250cm9sbGVyLCB0aGlzLm1vZGVsICk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRE9NKCBkb20sIGNvbnRyb2xsZXIsIF9tb2RlbCApe1xyXG5cclxuICAgIGRvbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XHJcblxyXG4gICAgICAgIGlmKCBlbGVtZW50LmRhdGFzZXQuc3JjICYmICFlbGVtZW50LmRhdGFzZXQuaW5qZWN0ICl7XHJcbiAgICAgICAgICAgIHN3aXRjaCggZWxlbWVudC50YWdOYW1lICl7XHJcbiAgICAgICAgICAgIGNhc2UgJ1VMJzpcclxuICAgICAgICAgICAgY2FzZSAnT0wnOlxyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBfbW9kZWwuYXR0YWNoKCBlbGVtZW50LmRhdGFzZXQuc3JjLCByZW5kZXJMaXN0LmJpbmQoIGVsZW1lbnQsIHRlbXBsYXRlICkgKTtcclxuICAgICAgICAgICAgICAgIHJlbmRlckxpc3QoIGVsZW1lbnQsIHRlbXBsYXRlLCBfbW9kZWwuZ2V0SXRlbSggZWxlbWVudC5kYXRhc2V0LnNyYyApICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTA7IGk8ZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgKytpICl7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBlbGVtZW50LmF0dHJpYnV0ZXNbaV0ubmFtZTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZWxlbWVudC5hdHRyaWJ1dGVzW2ldLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhcnRzID0ga2V5LnNwbGl0KFwiLVwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKCBwYXJ0cy5sZW5ndGggPT0gMiApXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2goIHBhcnRzWzFdICl7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiY2FsbFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSByZWFkTWV0aG9kKCB2YWx1ZSwgY29udHJvbGxlciwgZG9tICk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIHRhcmdldCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggcGFydHNbMF0sIHRhcmdldCApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IGJpbmQgZXZlbnQgdG8gXCIgKyBjb250cm9sbGVyLmNvbnN0cnVjdG9yLm5hbWUgKyBcIi5cIiArIG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidG9nZ2xlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZwYXJ0cyA9IHZhbHVlLm1hdGNoKC9eKFteQF0rKVxcQChbXj1dKylcXD0oLispJC8pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB2cGFydHMgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiaW5kVG9nZ2xlKCBlbGVtZW50LCBwYXJ0c1swXSwgdnBhcnRzICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgcGFyc2UgdG9nZ2xlOiBcIiArIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWVtbyA9IHsgX19zcmM6dmFsdWUsIF9faG5kOjAgfTtcclxuICAgICAgICAgICAgdmFsdWUucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGJpbmRBdHRyaWJ1dGUuYmluZCggbnVsbCwgZWxlbWVudC5hdHRyaWJ1dGVzW2ldLCBtZW1vICkpO1xyXG4gICAgICAgICAgICB1cGRhdGVBdHRyaWJ1dGUoIGVsZW1lbnQuYXR0cmlidXRlc1tpXSwgbWVtbyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGVsZW1lbnQuZGF0YXNldC5pbmplY3QgJiYgZWxlbWVudCAhPSBkb20uZWxlbWVudCApe1xyXG5cclxuICAgICAgICAgICAgbGV0IGNoaWxkRG9tID0gbmV3IERPTShlbGVtZW50KTtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiggY2hpbGREb20sIGNoaWxkRG9tLmluZGV4KFwiaWRcIikgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBjdHJsID0gZ2V0SW5zdGFuY2VPZiggZWxlbWVudC5kYXRhc2V0LmluamVjdCwgY2hpbGREb20gKTtcclxuICAgICAgICAgICAgZG9tW2VsZW1lbnQuZGF0YXNldC5pbmplY3RdID0gY3RybDtcclxuXHJcbiAgICAgICAgICAgIHByZXBhcmVET00oIGNoaWxkRG9tLCBjdHJsICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGJpbmRUb2dnbGUoIGVsZW1lbnQsIGV2ZW50LCBjbWQgKXtcclxuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50LCAoKT0+e1xyXG4gICAgICAgICAgICBbLi4uZG9tLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjbWRbMV0pXS5mb3JFYWNoKCB0YXJnZXQgPT4gdGFyZ2V0LnNldEF0dHJpYnV0ZShjbWRbMl0sIGNtZFszXSkgKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcmVuZGVyTGlzdCggZWxlbWVudCwgdGVtcGxhdGUsIGFyciApe1xyXG5cclxuICAgICAgICB3aGlsZSggZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggKVxyXG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKCBlbGVtZW50LmNoaWxkcmVuWzBdICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKCB2YXIga2V5IGluIGFyciApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkTW9kZWwgPSBuZXcgTW9kZWwoKTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5sb2FkKCBfbW9kZWwuZGF0YSApO1xyXG4gICAgICAgICAgICBjaGlsZE1vZGVsLnNldEl0ZW0oXCJrZXlcIiwga2V5KTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5zZXRJdGVtKFwidmFsdWVcIiwgYXJyW2tleV0pO1xyXG4gICAgICAgICAgICBjaGlsZE1vZGVsLnJvb3QgPSBfbW9kZWwucm9vdDtcclxuXHJcbiAgICAgICAgICAgIFsuLi50ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkuY2hpbGRyZW5dLmZvckVhY2goY2hpbGQgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICBwcmVwYXJlRE9NKCBuZXcgRE9NKGNoaWxkKSwgY29udHJvbGxlciwgY2hpbGRNb2RlbCApO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYmluZEF0dHJpYnV0ZSggYXR0ciwgbWVtbywgbWF0Y2gsIGlubmVyICl7XHJcblxyXG4gICAgICAgIGlmKCBpbm5lciBpbiBtZW1vICkgcmV0dXJuIFwiXCI7XHJcblxyXG4gICAgICAgIF9tb2RlbC5hdHRhY2goIGlubmVyLCAodmFsdWUpPT57XHJcbiAgICAgICAgICAgIG1lbW9baW5uZXJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGlmKCBtZW1vLl9faG5kICkgcmV0dXJuO1xyXG4gICAgICAgICAgICBtZW1vLl9faG5kID0gc2V0VGltZW91dCggdXBkYXRlQXR0cmlidXRlLmJpbmQoIG51bGwsIGF0dHIsIG1lbW8gKSwgMSApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBtZW1vW2lubmVyXSA9IF9tb2RlbC5nZXRJdGVtKGlubmVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZSggYXR0ciwgbWVtbyApe1xyXG4gICAgICAgIG1lbW8uX19obmQgPSAwO1xyXG4gICAgICAgIGF0dHIudmFsdWUgPSBtZW1vLl9fc3JjLnJlcGxhY2UoXHJcblx0XHQvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csXHJcblx0ICAgIChtYXRjaCwgcGF0aCkgPT4gdHlwZW9mIG1lbW9bcGF0aF0gPT0gXCJvYmplY3RcIiA/XHJcblx0XHRKU09OLnN0cmluZ2lmeShtZW1vW3BhdGhdKVxyXG5cdFx0OiBtZW1vW3BhdGhdXHJcblx0KTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbnZhciBkZWZhdWx0TW9kZWwgPSBudWxsO1xyXG5cclxuY2xhc3MgSUNvbnRyb2xsZXIge1xyXG5cclxuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcclxuICAgICAgICB2aWV3RmFjdG9yeTpJVmlldyxcclxuICAgICAgICBwb29sOlwicG9vbFwiLFxyXG4gICAgICAgIG1vZGVsOk1vZGVsXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoICl7XHJcblxyXG4gICAgICAgIHRoaXMucG9vbC5hZGQodGhpcyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIF9zaG93KCl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGVkIHZpZXdcIik7XHJcbiAgICAgICAgdGhpcy5wb29sLmNhbGwoIFwic2V0QWN0aXZlVmlld1wiLCBudWxsICk7XHRcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMudmlld0ZhY3RvcnkoIHRoaXMgKTtcclxuICAgICAgICByZXR1cm4gdmlldztcclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBib290KCB7IG1haW4sIGVsZW1lbnQsIGNvbXBvbmVudHMsIGVudGl0aWVzIH0gKXtcclxuXHJcbiAgICBiaW5kKFBvb2wpLnRvKCdwb29sJykuc2luZ2xldG9uKCk7XHJcbiAgICBiaW5kKE1vZGVsKS50byhNb2RlbCkud2l0aFRhZ3Moe3Njb3BlOidyb290J30pLnNpbmdsZXRvbigpO1xyXG5cclxuICAgIGZvciggdmFyIGsgaW4gY29tcG9uZW50cyApXHJcbiAgICAgICAgYmluZCggY29tcG9uZW50c1trXSApLnRvKCBrICk7XHJcblxyXG4gICAgZm9yKCB2YXIgayBpbiBlbnRpdGllcyApe1xyXG4gICAgICAgIHZhciBjdHJsID0gZW50aXRpZXNba107XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIFwiQWRkaW5nIGVudGl0eSBcIiArIGssIGN0cmwgKTtcclxuICAgICAgICBiaW5kKGN0cmwpLnRvKElDb250cm9sbGVyKTtcclxuICAgICAgICBiaW5kKElWaWV3KVxyXG4gICAgICAgICAgICAudG8oSVZpZXcpXHJcbiAgICAgICAgICAgIC5pbmplY3RpbmcoXHJcbiAgICAgICAgICAgICAgICBbZG9jdW1lbnQuYm9keSwgJ1BhcmVudEVsZW1lbnQnXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC53aXRoVGFncyh7Y29udHJvbGxlcjpjdHJsfSlcclxuICAgICAgICAgICAgLmZhY3RvcnkoKTsgXHJcbiAgICB9XHJcblxyXG4gICAgYmluZChtYWluKS50byhtYWluKS5pbmplY3RpbmcoW25ldyBET00oZWxlbWVudCksIERPTV0pO1xyXG4gICAgZ2V0SW5zdGFuY2VPZiggbWFpbiApO1xyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCB7IE1vZGVsLCBJVmlldywgSUNvbnRyb2xsZXIsIGJvb3QgfTtcclxuXHJcbiIsInZhciBuZXh0VUlEID0gMDtcclxuXHJcbmZ1bmN0aW9uIGdldFVJRCgpe1xyXG4gICAgcmV0dXJuICsrbmV4dFVJRDtcclxufVxyXG5cclxuZnVuY3Rpb24gUG9vbCgpIHtcclxuICAgIHZhciBtZXRob2RzID0ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiBbXVxyXG4gICAgfTtcclxuICAgIHZhciBzaWxlbmNlID0ge1xyXG4gICAgICAgIFwib25UaWNrXCI6IDEsXHJcbiAgICAgICAgXCJvblBvc3RUaWNrXCI6IDEsXHJcbiAgICAgICAgXCJvblJlbmRlclwiOiAxXHJcbiAgICB9O1xyXG4gICAgdmFyIGRlYnVnID0gbnVsbDtcclxuICAgIHZhciBwcm94aWVzID0gW107XHJcbiAgICB2YXIgY29udGVudHMgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBvbkV2ZW50KGUpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdmFyIG5hbWVzID0gKHRhcmdldC5jbGFzc05hbWUgfHwgXCJcIikuc3BsaXQoL1xccysvKS5maWx0ZXIoZnVuY3Rpb24obikge1xyXG4gICAgICAgICAgICByZXR1cm4gbi5sZW5ndGggPiAwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgZXZlbnQgPSBlLnR5cGU7XHJcbiAgICAgICAgZXZlbnQgPSBldmVudC5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKSArIGV2ZW50LnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRhcmdldCkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSB0YXJnZXQuaWQ7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQub25jbGljaykgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBpZC5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG5hbWUgPSBuYW1lc1tpKytdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zdWJzdHIoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQkKFwib25cIiArIGV2ZW50ICsgaWQgKyBuYW1lLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCQoXCJvblwiICsgZXZlbnQgKyBpZCwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnRzID0gZnVuY3Rpb24odGFyZ2V0LCBhcmdzKSB7XHJcbiAgICAgICAgaWYgKCFhcmdzICYmIHRhcmdldCAmJiBET0MudHlwZU9mKHRhcmdldCkgPT0gXCJhcnJheVwiKSB7XHJcbiAgICAgICAgICAgIGFyZ3MgPSB0YXJnZXQ7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGFyZ2V0KSB0YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgIGlmICghYXJncykge1xyXG4gICAgICAgICAgICBhcmdzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gdGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IGsubWF0Y2goL15vbiguKykvKTtcclxuICAgICAgICAgICAgICAgIGlmICghbSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2gobVsxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uKGFyZykge1xyXG4gICAgICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihhcmcsIG9uRXZlbnQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmRlYnVnID0gZnVuY3Rpb24obSkge1xyXG4gICAgICAgIGRlYnVnID0gbTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zaWxlbmNlID0gZnVuY3Rpb24obSkge1xyXG4gICAgICAgIHNpbGVuY2VbbV0gPSAxO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZFByb3h5ID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKG9iaiAmJiBvYmouY2FsbCkgcHJveGllcy5wdXNoKG9iaik7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVtb3ZlUHJveHkgPSBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgaSA9IHByb3hpZXMuaW5kZXhPZihvYmopO1xyXG4gICAgICAgIGlmIChpID09IC0xKSByZXR1cm47XHJcbiAgICAgICAgcHJveGllcy5zcGxpY2UoaSwgMSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24ob2JqLCBlbmFibGVEaXJlY3RNc2cpIHtcclxuICAgICAgICBpZiAoIW9iaikgcmV0dXJuO1xyXG4gICAgICAgIGlmIChkZWJ1ZyAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PSBkZWJ1ZykgY29uc29sZS5sb2coXCJhZGRcIiwgb2JqKTtcclxuXHJcbiAgICAgICAgaWYgKCEoXCJfX3VpZFwiIGluIG9iaikpIG9iai5fX3VpZCA9IGdldFVJRCgpO1xyXG5cclxuICAgICAgICBpZiAoIShcIl9fdWlkXCIgaW4gb2JqKSkgY29uc29sZS53YXJuKFwiQ291bGQgbm90IGFkZCBfX3VpZCB0byBcIiwgb2JqLCBvYmouY29uc3RydWN0b3IubmFtZSk7XHJcblxyXG4gICAgICAgIGNvbnRlbnRzW29iai5fX3VpZF0gPSBvYmo7XHJcbiAgICAgICAgdmFyIGNsYXp6ID0gb2JqLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgIGlmIChvYmoubWV0aG9kcyB8fCBjbGF6ei5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBvYmoubWV0aG9kcyB8fCBjbGF6ei5tZXRob2RzO1xyXG4gICAgICAgICAgICBpZiAoIShhcnIgaW5zdGFuY2VvZiBBcnJheSkpIGFyciA9IE9iamVjdC5rZXlzKGFycik7XHJcbiAgICAgICAgICAgIHZhciBsID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtID0gYXJyW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0gJiYgbVswXSAhPSBcIl9cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuKG9iaiwgbSwgZW5hYmxlRGlyZWN0TXNnKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2xhenoubWV0YVttXSAmJiBjbGF6ei5tZXRhW21dLnNpbGVuY2UpIHRoaXMuc2lsZW5jZShtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0ge30sIGNvYmogPSBvYmo7XHJcbiAgICAgICAgICAgIGRve1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiggcHJvcGVydGllcywgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoY29iaikgKTtcclxuICAgICAgICAgICAgfXdoaWxlKCBjb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGNvYmopICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgayBpbiBwcm9wZXJ0aWVzICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmpba10gIT0gXCJmdW5jdGlvblwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGlmIChrICYmIGtbMF0gIT0gXCJfXCIpIHRoaXMubGlzdGVuKG9iaiwgayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKG9iai5jb25zdHJ1Y3Rvci5uYW1lID09IGRlYnVnKSBjb25zb2xlLmxvZyhcInJlbW92ZVwiLCBvYmopO1xyXG5cclxuICAgICAgICBkZWxldGUgY29udGVudHNbb2JqLl9fdWlkXTtcclxuXHJcblx0aWYoIG9iai5tZXRob2RzIHx8IG9iai5jb25zdHJ1Y3Rvci5tZXRob2RzICl7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gKG9iai5tZXRob2RzIHx8IG9iai5jb25zdHJ1Y3Rvci5tZXRob2RzKSApXHJcblx0XHR0aGlzLm11dGUob2JqLCBrKTtcclxuXHR9ZWxzZXtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB7fSwgY29iaiA9IG9iajtcclxuICAgICAgICAgICAgZG97XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKCBwcm9wZXJ0aWVzLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhjb2JqKSApO1xyXG4gICAgICAgICAgICB9d2hpbGUoIGNvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY29iaikgKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBrIGluIHByb3BlcnRpZXMgKVxyXG5cdFx0dGhpcy5tdXRlKG9iaiwgayk7XHJcblx0fVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBvbGwgPSBmdW5jdGlvbih0KSB7XHJcbiAgICAgICAgaWYgKCF0KSByZXR1cm4gY29udGVudHM7XHJcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjb250ZW50cyk7XHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGNvdW50IDwga2V5cy5sZW5ndGg7ICsrY291bnQpXHJcbiAgICAgICAgcmV0LnB1c2godChjb250ZW50c1trZXlzW2NvdW50XV0pKTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxpc3RlbiA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgZW5hYmxlRGlyZWN0TXNnKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IG9ialtuYW1lXTtcclxuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCAhPSBcImZ1bmN0aW9uXCIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIGFyciA9IG1ldGhvZHNbbmFtZV07XHJcbiAgICAgICAgaWYgKCFhcnIpIGFyciA9IG1ldGhvZHNbbmFtZV0gPSB7fTtcclxuICAgICAgICBhcnJbb2JqLl9fdWlkXSA9IHtcclxuICAgICAgICAgICAgVEhJUzogb2JqLFxyXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChlbmFibGVEaXJlY3RNc2cpIHtcclxuICAgICAgICAgICAgYXJyID0gbWV0aG9kc1tuYW1lICsgb2JqLl9fdWlkXTtcclxuICAgICAgICAgICAgaWYgKCFhcnIpIGFyciA9IG1ldGhvZHNbbmFtZSArIG9iai5fX3VpZF0gPSB7fTtcclxuICAgICAgICAgICAgYXJyW29iai5fX3VpZF0gPSB7XHJcbiAgICAgICAgICAgICAgICBUSElTOiBvYmosXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5tdXRlID0gZnVuY3Rpb24ob2JqLCBuYW1lKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IG9ialtuYW1lXTtcclxuICAgICAgICB2YXIgbGlzdGVuZXJzID0gbWV0aG9kc1tuYW1lXTtcclxuICAgICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuO1xyXG4gICAgICAgIGRlbGV0ZSBsaXN0ZW5lcnNbb2JqLl9fdWlkXTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jYWxsID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmRlZmluZWQgY2FsbFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGksIGw7XHJcblxyXG4gICAgICAgIC8qICogL1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG4gICAgLyovXHJcbiAgICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIGZvciAoaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAvKiAqL1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJveGllcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBwcm94aWVzW2ldLmNhbGwobWV0aG9kLCBhcmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBtZXRob2RzW21ldGhvZF07XHJcbiAgICAgICAgaWYgKCFsaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgaWYgKCEobWV0aG9kIGluIHNpbGVuY2UpKSBjb25zb2xlLmxvZyhtZXRob2QgKyBcIjogMFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhsaXN0ZW5lcnMpO1xyXG4gICAgICAgIHZhciByZXQ7IC8vPXVuZGVmaW5lZFxyXG4gICAgICAgIHZhciBjb3VudCA9IDAsXHJcbiAgICAgICAgICAgIGM7XHJcbiAgICAgICAgZm9yICg7IGNvdW50IDwga2V5cy5sZW5ndGg7ICsrY291bnQpIHtcclxuICAgICAgICAgICAgYyA9IGxpc3RlbmVyc1trZXlzW2NvdW50XV07XHJcblxyXG4gICAgICAgICAgICAvLyBERUJVR1xyXG4gICAgICAgICAgICBpZiAoZGVidWcgJiYgKG1ldGhvZCA9PSBkZWJ1ZyB8fCBjLlRISVMuY29uc3RydWN0b3IubmFtZSA9PSBkZWJ1ZykpIGNvbnNvbGUubG9nKGMuVEhJUywgbWV0aG9kLCBhcmdzKTtcclxuICAgICAgICAgICAgLy8gRU5ELURFQlVHXHJcblxyXG4gICAgICAgICAgICB2YXIgbHJldCA9IGMgJiYgYy5tZXRob2QuYXBwbHkoYy5USElTLCBhcmdzKTtcclxuICAgICAgICAgICAgaWYgKGxyZXQgIT09IHVuZGVmaW5lZCkgcmV0ID0gbHJldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobWV0aG9kIGluIHNpbGVuY2UpKSBjb25zb2xlLmxvZyhtZXRob2QgKyBcIjogXCIgKyBjb3VudCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcclxuIiwiXHJcbmZ1bmN0aW9uIHN0b3JlKCBvYmosIGFzQnVmZmVyICl7XHJcblxyXG4gICAgaWYoIHR5cGVvZiBvYmogPT0gXCJmdW5jdGlvblwiICkgb2JqID0gdW5kZWZpbmVkO1xyXG4gICAgaWYoICFvYmogfHwgdHlwZW9mIG9iaiAhPSBcIm9iamVjdFwiIClcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG5cclxuICAgIHZhciBpbnN0ID0gW10sIHN0ckluZGV4ID0ge1wiT2JqZWN0XCI6LTIsXCJBcnJheVwiOi0zfSwgYXJySW5kZXggPSB7fSwgb2JqSW5kZXggPSBbXTtcclxuXHJcbiAgICBhZGQoIG9iaiApO1xyXG5cclxuICAgIGlmKCBhc0J1ZmZlciApXHJcbiAgICAgICAgcmV0dXJuIHRvQnVmZmVyKCBpbnN0ICk7XHJcbiAgICBcclxuICAgIHJldHVybiBpbnN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZCggb2JqICl7XHJcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xyXG4gICAgICAgIGlmKCB0eXBlID09IFwiZnVuY3Rpb25cIiApe1xyXG4gICAgICAgICAgICBvYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygb2JqO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGluZGV4O1xyXG4gICAgICAgIGlmKCBvYmogPT09IHVuZGVmaW5lZCApe1xyXG4gICAgICAgICAgICBpbmRleCA9IC00O1xyXG4gICAgICAgIH1lbHNlIGlmKCB0eXBlID09IFwic3RyaW5nXCIgKXtcclxuICAgICAgICAgICAgaW5kZXggPSBzdHJJbmRleFtvYmpdO1xyXG4gICAgICAgICAgICBpZiggaW5kZXggPT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGluZGV4ID0gaW5zdC5pbmRleE9mKG9iaik7XHJcblxyXG4gICAgICAgIGlmKCBpbmRleCAhPSAtMSApIHJldHVybiBpbmRleDtcclxuXHJcbiAgICAgICAgaWYoIHR5cGUgPT0gXCJvYmplY3RcIiApe1xyXG4gICAgICAgICAgICBpbmRleCA9IG9iakluZGV4LmluZGV4T2Yob2JqKTtcclxuICAgICAgICAgICAgaWYoIGluZGV4ICE9IC0xICkgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5kZXggPSBpbnN0Lmxlbmd0aDtcclxuICAgICAgICBpbnN0W2luZGV4XSA9IG9iajtcclxuXHJcbiAgICAgICAgaWYoIHR5cGUgPT0gXCJzdHJpbmdcIiApXHJcbiAgICAgICAgICAgIHN0ckluZGV4W29ial0gPSBpbmRleDtcclxuXHJcbiAgICAgICAgaWYoICFvYmogfHwgdHlwZSAhPSBcIm9iamVjdFwiIClcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgIFxyXG4gICAgICAgIG9iakluZGV4WyBpbmRleCBdID0gb2JqO1xyXG5cclxuICAgICAgICB2YXIgY3RvckluZGV4ID0gYWRkKCBvYmouY29uc3RydWN0b3IuZnVsbE5hbWUgfHwgb2JqLmNvbnN0cnVjdG9yLm5hbWUgKTtcclxuXHJcbiAgICAgICAgaWYoIG9iai5idWZmZXIgJiYgb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICl7XHJcblxyXG4gICAgICAgICAgICBpZiggIWFzQnVmZmVyIClcclxuICAgICAgICAgICAgICAgIG9iaiA9IEFycmF5LmZyb20oIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaW5zdFtpbmRleF0gPSBbY3RvckluZGV4LCAtMywgb2JqXTtcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIga2V5LCBrZXlTZXQgPSBbXTtcclxuICAgICAgICBmb3IoIGtleSBpbiBvYmogKXtcclxuICAgICAgICAgICAgaWYoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgKXtcclxuICAgICAgICAgICAgICAgIHZhciBrZXlJbmRleCA9IHN0ckluZGV4W2tleV07XHJcbiAgICAgICAgICAgICAgICBpZigga2V5SW5kZXggPT09IHVuZGVmaW5lZCApe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleUluZGV4ID0gaW5zdC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5zdFtrZXlJbmRleF0gPSBrZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RySW5kZXhba2V5XSA9IGtleUluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIGtleUluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBrZXlTZXRba2V5U2V0Lmxlbmd0aF0gPSBrZXlJbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHN0cktleVNldCA9IEpTT04uc3RyaW5naWZ5KGtleVNldCk7XHJcbiAgICAgICAga2V5SW5kZXggPSBhcnJJbmRleFsgc3RyS2V5U2V0IF07XHJcbiAgICAgICAgaWYoIGtleUluZGV4ID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAga2V5SW5kZXggPSBpbnN0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaW5zdFtrZXlJbmRleF0gPSBrZXlTZXQ7XHJcbiAgICAgICAgICAgIGFyckluZGV4W3N0cktleVNldF0gPSBrZXlJbmRleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB2YWx1ZVNldCA9IFsgY3RvckluZGV4LCBrZXlJbmRleCBdO1xyXG5cclxuICAgICAgICBmb3IoIGtleSBpbiBvYmogKXtcclxuICAgICAgICAgICAgaWYoIG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZUluZGV4ID0gYWRkKCB2YWx1ZSApO1xyXG4gICAgICAgICAgICAgICAgdmFsdWVTZXRbdmFsdWVTZXQubGVuZ3RoXSA9IHZhbHVlSW5kZXg7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdHJLZXlTZXQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZVNldCk7XHJcbiAgICAgICAga2V5SW5kZXggPSBhcnJJbmRleFsgc3RyS2V5U2V0IF07XHJcbiAgICAgICAgaWYoIGtleUluZGV4ID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgYXJySW5kZXhbc3RyS2V5U2V0XSA9IGluZGV4O1xyXG4gICAgICAgICAgICBpbnN0W2luZGV4XSA9IHZhbHVlU2V0O1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpbnN0W2luZGV4XSA9IFtrZXlJbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkKCBhcnIsIGlzQnVmZmVyICl7XHJcblxyXG4gICAgaWYoIGlzQnVmZmVyIHx8IChhcnIgJiYgYXJyLmJ1ZmZlcikgKVxyXG4gICAgICAgIGFyciA9IGZyb21CdWZmZXIoIGFyciApO1xyXG5cclxuICAgIHZhciBTRUxGID0gbnVsbDtcclxuXHJcbiAgICBpZiggIWFyciB8fCB0eXBlb2YgYXJyICE9PSBcIm9iamVjdFwiIClcclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgXHJcbiAgICBpZiggIUFycmF5LmlzQXJyYXkoYXJyKSApXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuXHJcbiAgICAoZnVuY3Rpb24oKXsgdHJ5e1NFTEY9d2luZG93O31jYXRjaChleCl7fSB9KSgpO1xyXG4gICAgaWYoICFTRUxGIClcclxuICAgICAgICAoZnVuY3Rpb24oKXsgdHJ5e1NFTEY9Z2xvYmFsO31jYXRjaChleCl7fSB9KSgpO1xyXG5cclxuICAgIHZhciBvYmplY3RzID0gW107XHJcblxyXG4gICAgdmFyIGN1cnNvciA9IDA7XHJcbiAgICByZXR1cm4gcmVhZCgtMSk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVhZCggcG9zICl7XHJcblxyXG4gICAgICAgIHN3aXRjaCggcG9zICl7XHJcbiAgICAgICAgY2FzZSAtMTpcclxuICAgICAgICAgICAgcG9zID0gY3Vyc29yO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIC0yOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJPYmplY3RcIjtcclxuICAgICAgICBjYXNlIC0zOlxyXG4gICAgICAgICAgICByZXR1cm4gXCJBcnJheVwiO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGlmKCBvYmplY3RzW3Bvc10gKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdHNbcG9zXTtcclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIHBvcyA9PSBjdXJzb3IgKVxyXG4gICAgICAgICAgICBjdXJzb3IrKztcclxuXHJcbiAgICAgICAgdmFyIHZhbHVlID0gYXJyW3Bvc107XHJcbiAgICAgICAgaWYoICF2YWx1ZSApIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICAgICAgaWYoIHR5cGUgIT0gXCJvYmplY3RcIiApIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYoIHZhbHVlLmxlbmd0aCA9PSAxIClcclxuICAgICAgICAgICAgdmFsdWUgPSBhcnJbIHZhbHVlWzBdIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9IHJlYWQoIHZhbHVlWzBdICk7XHJcblxyXG4gICAgICAgIGlmKCAhY2xhc3NOYW1lLnNwbGl0IClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGNsYXNzTmFtZSwgdmFsdWVbMF0gKTtcclxuXHJcbiAgICAgICAgdmFyIGN0b3IgPSBTRUxGLCBvYmo7XHJcbiAgICAgICAgY2xhc3NOYW1lLnNwbGl0KFwiLlwiKS5mb3JFYWNoKCBwYXJ0ID0+IGN0b3IgPSBjdG9yW3BhcnRdICk7XHJcblxyXG4gICAgICAgIGlmKCB2YWx1ZVsxXSAhPT0gLTMgKXtcclxuICAgICAgICAgICAgb2JqID0gbmV3IGN0b3IoKTtcclxuICAgICAgICAgICAgb2JqZWN0c1sgcG9zIF0gPSBvYmo7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmllbGRSZWZMaXN0LCBtdXN0QWRkID0gdmFsdWVbMV0gPiBwb3M7XHJcblxyXG4gICAgICAgICAgICBmaWVsZFJlZkxpc3QgPSBhcnJbIHZhbHVlWzFdIF07XHJcblxyXG4gICAgICAgICAgICB2YXIgZmllbGRMaXN0ID0gZmllbGRSZWZMaXN0Lm1hcCggcmVmID0+IHJlYWQocmVmKSApO1xyXG5cclxuICAgICAgICAgICAgaWYoIG11c3RBZGQgKSBjdXJzb3IrKztcclxuXHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTI7IGk8dmFsdWUubGVuZ3RoOyArK2kgKXtcclxuICAgICAgICAgICAgICAgIHZhciB2aSA9IHZhbHVlW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYoIHZpICE9PSAtNCApXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqWyBmaWVsZExpc3RbaS0yXSBdID0gcmVhZCh2aSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIG9iaiA9IHZhbHVlWzJdO1xyXG4gICAgICAgICAgICBpZiggIWlzQnVmZmVyICkgb2JqZWN0c1sgcG9zIF0gPSBvYmogPSBjdG9yLmZyb20oIG9iaiApO1xyXG4gICAgICAgICAgICBlbHNlIG9iamVjdHNbIHBvcyBdID0gb2JqID0gbmV3IGN0b3IoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgY3Vyc29yKys7XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gdG9CdWZmZXIoIHNyYyApe1xyXG4gICAgY29uc3Qgb3V0ID0gW107XHJcblxyXG4gICAgY29uc3QgZGFiID0gbmV3IEZsb2F0NjRBcnJheSgxKTtcclxuICAgIGNvbnN0IGJhYiA9IG5ldyBVaW50OEFycmF5KGRhYi5idWZmZXIpO1xyXG4gICAgY29uc3Qgc2FiID0gbmV3IEludDMyQXJyYXkoZGFiLmJ1ZmZlcik7XHJcbiAgICBjb25zdCBmYWIgPSBuZXcgRmxvYXQzMkFycmF5KGRhYi5idWZmZXIpO1xyXG5cclxuICAgIHZhciBwPTA7XHJcblxyXG4gICAgZm9yKCB2YXIgaT0wLCBsPXNyYy5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gc3JjW2ldLFxyXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG5cclxuICAgICAgICBzd2l0Y2goIHR5cGUgKXtcclxuICAgICAgICBjYXNlIFwiYm9vbGVhblwiOiAvLyAxLCAyXHJcbiAgICAgICAgICAgIG91dFtwKytdID0gMSsodmFsdWV8MCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XHJcbiAgICAgICAgICAgIHZhciBpc0Zsb2F0ID0gTWF0aC5mbG9vciggdmFsdWUgKSAhPT0gdmFsdWU7XHJcbiAgICAgICAgICAgIGlmKCBpc0Zsb2F0ICl7XHJcblxyXG4gICAgICAgICAgICAgICAgZmFiWzBdID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIGZhYlswXSA9PT0gdmFsdWUgfHwgaXNOYU4odmFsdWUpICl7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSAzO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzBdOyBvdXRbcCsrXSA9IGJhYlsxXTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYlsyXTsgb3V0W3ArK10gPSBiYWJbM107XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBkYWJbMF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbMF07IG91dFtwKytdID0gYmFiWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzJdOyBvdXRbcCsrXSA9IGJhYlszXTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYls0XTsgb3V0W3ArK10gPSBiYWJbNV07XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbNl07IG91dFtwKytdID0gYmFiWzddO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBzYXZlSW50KCAwLCB2YWx1ZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcclxuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gcCwgcmVzdGFydCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzYXZlSW50KCAxLCB2YWx1ZS5sZW5ndGggKTtcclxuICAgICAgICAgICAgZm9yKCB2YXIgYmk9MCwgYmw9dmFsdWUubGVuZ3RoOyBiaTxibDsgKytiaSApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGJ5dGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGJpKTtcclxuICAgICAgICAgICAgICAgIGlmKCBieXRlID4gMHhGRiApe1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3RhcnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiggIXJlc3RhcnQgKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwID0gc3RhcnQ7XHJcbiAgICAgICAgICAgIHNhdmVJbnQoIDIsIHZhbHVlLmxlbmd0aCApO1xyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgYmk9MCwgYmw9dmFsdWUubGVuZ3RoOyBiaTxibDsgKytiaSApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGJ5dGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGJpKTtcclxuICAgICAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZSAmIDB4RkY7XHJcbiAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IChieXRlPj44KSAmIDB4RkY7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNhc2UgXCJvYmplY3RcIjpcclxuICAgICAgICAgICAgaWYoIHR5cGVvZiB2YWx1ZVsyXSA9PSBcIm9iamVjdFwiICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHlwZWQgPSBuZXcgVWludDhBcnJheSggdmFsdWVbMl0uYnVmZmVyICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2F2ZUludCggMywgLXR5cGVkLmxlbmd0aCApO1xyXG4gICAgICAgICAgICAgICAgc2F2ZUludCggMCwgdmFsdWVbMF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBiaT0wLCBibD10eXBlZC5sZW5ndGg7IGJpPGJsOyArK2JpICl7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSB0eXBlZFtiaV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHNhdmVJbnQoIDMsIHZhbHVlLmxlbmd0aCApO1xyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgYmk9MCwgYmw9dmFsdWUubGVuZ3RoOyBiaTxibDsgKytiaSApe1xyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVJbnQoIDAsIHZhbHVlW2JpXSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVWludDhBcnJheS5mcm9tKG91dCk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2F2ZUludCggdHlwZSwgdmFsdWUgKXtcclxuXHJcbiAgICAgICAgdmFyIGJpdENvdW50ID0gTWF0aC5jZWlsKCBNYXRoLmxvZzIoIE1hdGguYWJzKHZhbHVlKSApICk7XHJcbiAgICAgICAgdmFyIGJ5dGUgPSB0eXBlIDw8IDY7XHJcblxyXG4gICAgICAgIGlmKCBiaXRDb3VudCA8IDMgfHwgdmFsdWUgPT09IC04ICl7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gMHgzMDtcclxuICAgICAgICAgICAgYnl0ZSB8PSB2YWx1ZSAmIDB4RjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggYml0Q291bnQgPD0gOCszIHx8IHZhbHVlID09PSAtMjA0OCApe1xyXG4gICAgICAgICAgICBieXRlIHw9IDB4MTA7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gKHZhbHVlID4+PiA4KSAmIDB4RjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgICAgICBvdXRbcCsrXSA9IHZhbHVlICYgMHhGRjtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGJpdENvdW50IDw9IDE2KzMgfHwgdmFsdWUgPT09IC01MjQyODggKXtcclxuICAgICAgICAgICAgYnl0ZSB8PSAweDIwO1xyXG4gICAgICAgICAgICBieXRlIHw9ICh2YWx1ZSA+Pj4gMTYpICYgMHhGO1xyXG4gICAgICAgICAgICBvdXRbcCsrXSA9IGJ5dGU7XHJcbiAgICAgICAgICAgIG91dFtwKytdID0gKHZhbHVlPj4+OCkgJiAweEZGO1xyXG4gICAgICAgICAgICBvdXRbcCsrXSA9IHZhbHVlICYgMHhGRjtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2FiWzBdID0gdmFsdWU7XHJcbiAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgIG91dFtwKytdID0gYmFiWzBdOyBvdXRbcCsrXSA9IGJhYlsxXTtcclxuICAgICAgICBvdXRbcCsrXSA9IGJhYlsyXTsgb3V0W3ArK10gPSBiYWJbM107XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gZnJvbUJ1ZmZlciggc3JjICl7XHJcbiAgICBjb25zdCBvdXQgPSBbXTtcclxuICAgIGNvbnN0IGRhYiA9IG5ldyBGbG9hdDY0QXJyYXkoMSk7XHJcbiAgICBjb25zdCBiYWIgPSBuZXcgVWludDhBcnJheShkYWIuYnVmZmVyKTtcclxuICAgIGNvbnN0IHNhYiA9IG5ldyBJbnQzMkFycmF5KGRhYi5idWZmZXIpO1xyXG4gICAgY29uc3QgZmFiID0gbmV3IEZsb2F0MzJBcnJheShkYWIuYnVmZmVyKTtcclxuXHJcbiAgICB2YXIgcG9zID0gMDtcclxuXHJcbiAgICBmb3IoIHZhciBsPXNyYy5sZW5ndGg7IHBvczxsOyApXHJcbiAgICAgICAgb3V0W291dC5sZW5ndGhdID0gcmVhZCgpO1xyXG5cclxuICAgIHJldHVybiBvdXQ7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVhZCgpe1xyXG4gICAgICAgIHZhciB0bXA7XHJcbiAgICAgICAgdmFyIGJ5dGUgPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHN3aXRjaCggYnl0ZSApe1xyXG4gICAgICAgIGNhc2UgMDogYnJlYWs7XHJcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBjYXNlIDM6IHJldHVybiBkZWNvZGVGbG9hdDMyKCk7XHJcbiAgICAgICAgY2FzZSA0OiByZXR1cm4gZGVjb2RlRmxvYXQ2NCgpO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHZhciBoYiA9IGJ5dGUgPj4+IDQ7XHJcbiAgICAgICAgdmFyIGxiID0gYnl0ZSAmIDB4RjtcclxuICAgICAgICBzd2l0Y2goIGhiICYgMyApe1xyXG4gICAgICAgIGNhc2UgMDogLy8gMzIgYml0IGludFxyXG4gICAgICAgICAgICB0bXAgPSBkZWNvZGVJbnQzMigpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDE6IC8vIDEyIGJpdCBpbnRcclxuICAgICAgICAgICAgdG1wID0gc3JjW3BvcysrXSB8ICgobGI8PDI4KT4+MjApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6IC8vIDE5IGJpdCBpbnRcclxuICAgICAgICAgICAgdG1wID0gKChsYjw8MjgpPj4xMikgfCBzcmNbcG9zXSB8IChzcmNbcG9zKzFdPDw4KTtcclxuICAgICAgICAgICAgcG9zICs9IDI7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzogLy8gNC1iaXQgaW50XHJcbiAgICAgICAgICAgIHRtcCA9IChsYjw8MjgpPj4yODsgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2goIGhiPj4yICl7XHJcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gdG1wO1xyXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGRlY29kZVN0cjgoIHRtcCApO1xyXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGRlY29kZVN0cjE2KCB0bXAgKTtcclxuICAgICAgICBjYXNlIDM6IHJldHVybiBkZWNvZGVBcnJheSggdG1wICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWNvZGVTdHI4KCBzaXplICl7XHJcbiAgICAgICAgdmFyIGFjYyA9IFwiXCI7XHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPHNpemU7ICsraSApXHJcbiAgICAgICAgICAgIGFjYyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCBzcmNbcG9zKytdIClcclxuICAgICAgICByZXR1cm4gYWNjO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlY29kZVN0cjE2KCBzaXplICl7XHJcbiAgICAgICAgdmFyIGFjYyA9IFwiXCI7XHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPHNpemU7ICsraSApe1xyXG4gICAgICAgICAgICB2YXIgaCA9IHNyY1twb3MrK107XHJcbiAgICAgICAgICAgIGFjYyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCAoaDw8OCkgfCBzcmNbcG9zKytdIClcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjYztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWNvZGVBcnJheSggc2l6ZSApe1xyXG5cclxuICAgICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgICAgaWYoIHNpemUgPCAwICl7XHJcblxyXG4gICAgICAgICAgICByZXRbMF0gPSByZWFkKCk7IC8vIHR5cGVcclxuICAgICAgICAgICAgcmV0WzFdID0gLTM7XHJcblxyXG4gICAgICAgICAgICBzaXplID0gLXNpemU7XHJcblxyXG4gICAgICAgICAgICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShzaXplKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKVxyXG4gICAgICAgICAgICAgICAgYnl0ZXNbaV0gPSBzcmNbcG9zKytdXHJcblxyXG4gICAgICAgICAgICByZXRbMl0gPSBieXRlcy5idWZmZXI7XHJcblxyXG4gICAgICAgIH1lbHNle1xyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wOyBpPHNpemU7ICsraSApXHJcbiAgICAgICAgICAgICAgICByZXRbaV0gPSByZWFkKCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlSW50MzIoKXtcclxuICAgICAgICBiYWJbMF0gPSBzcmNbcG9zKytdOyBiYWJbMV0gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIGJhYlsyXSA9IHNyY1twb3MrK107IGJhYlszXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgcmV0dXJuIHNhYlswXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWNvZGVGbG9hdDMyKCl7XHJcbiAgICAgICAgYmFiWzBdID0gc3JjW3BvcysrXTsgYmFiWzFdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbMl0gPSBzcmNbcG9zKytdOyBiYWJbM10gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHJldHVybiBmYWJbMF07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlRmxvYXQ2NCgpe1xyXG4gICAgICAgIGJhYlswXSA9IHNyY1twb3MrK107IGJhYlsxXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgYmFiWzJdID0gc3JjW3BvcysrXTsgYmFiWzNdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbNF0gPSBzcmNbcG9zKytdOyBiYWJbNV0gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIGJhYls2XSA9IHNyY1twb3MrK107IGJhYls3XSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgcmV0dXJuIGRhYlswXTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0geyBzdG9yZSwgbG9hZCB9O1xyXG4iLCIvLyBsZXQge2JpbmQsIGluamVjdCwgZ2V0SW5zdGFuY2VPZn0gPSByZXF1aXJlKCcuL2xpYi9kcnktZGkuanMnKTtcclxuaW1wb3J0IHtiaW5kLCBpbmplY3QsIGdldEluc3RhbmNlT2Z9IGZyb20gJ2RyeS1kaSc7XHJcblxyXG5cclxuaW1wb3J0IEFwcCBmcm9tICcuL0FwcC5qcyc7XHJcbmltcG9ydCBJU3RvcmUgZnJvbSAnLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgTm9kZVN0b3JlIGZyb20gJy4vc3RvcmUvTm9kZS5qcyc7XHJcbmltcG9ydCBNVCBmcm9tICcuL2xpYi9tdC5qcyc7XHJcbmltcG9ydCB7IE1vZGVsLCBib290IH0gZnJvbSAnLi9saWIvbXZjLmpzJztcclxuXHJcbmltcG9ydCAqIGFzIGVudGl0aWVzIGZyb20gJy4vZW50aXRpZXMvKi5qcyc7XHJcbmltcG9ydCAqIGFzIGNvbXBvbmVudHMgZnJvbSAnLi9jb21wb25lbnRzLyouanMnO1xyXG5pbXBvcnQgKiBhcyBzY2VuZWNvbXBvbmVudHMgZnJvbSAnLi9zY2VuZWNvbXBvbmVudHMvKi5qcyc7XHJcbmltcG9ydCAqIGFzIHNjZW5lY29udHJvbGxlcnMgZnJvbSAnLi9zY2VuZWNvbnRyb2xsZXJzLyouanMnO1xyXG5cclxuZnVuY3Rpb24gbWFrZVJORyggc2VlZCApe1xyXG4gICAgdmFyIHJuZyA9IG5ldyBNVCggTWF0aC5yb3VuZCggc2VlZHx8MCApICk7XHJcbiAgICByZXR1cm4gcm5nLnJhbmRvbS5iaW5kKHJuZyk7XHJcbn1cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XHJcbnNldFRpbWVvdXQoIGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgYmluZChOb2RlU3RvcmUpLnRvKElTdG9yZSkuc2luZ2xldG9uKCk7XHJcbiAgICBiaW5kKG1ha2VSTkcpLnRvKFwiUk5HXCIpLmZhY3RvcnkoKTtcclxuXHJcbiAgICBmb3IoIGxldCBrIGluIHNjZW5lY29tcG9uZW50cyApXHJcbiAgICAgICAgYmluZChzY2VuZWNvbXBvbmVudHNba10pLnRvKGspLndpdGhUYWdzKHsgc2NlbmVjb21wb25lbnQ6dHJ1ZSB9KTtcclxuICAgIGZvciggbGV0IGsgaW4gc2NlbmVjb250cm9sbGVycyApXHJcbiAgICAgICAgYmluZChzY2VuZWNvbnRyb2xsZXJzW2tdKS50byhrKS53aXRoVGFncyh7IHNjZW5lY29udHJvbGxlcjp0cnVlIH0pO1xyXG5cclxuICAgIGJvb3Qoe1xyXG4gICAgICAgIG1haW46QXBwLFxyXG4gICAgICAgIGVsZW1lbnQ6ZG9jdW1lbnQuYm9keSxcclxuICAgICAgICBjb21wb25lbnRzLFxyXG4gICAgICAgIGVudGl0aWVzLFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ2RlZmF1bHQnXHJcbiAgICB9KTtcclxuXHJcbn0sIDIwMDApO1xyXG59ICk7IiwibGV0IGZzID0gbnVsbDtcclxuXHJcbmZ1bmN0aW9uIG1rZGlycCggYmFzZSwgcGF0aCwgY2FsbGJhY2spIHtcclxuICAgIGxldCBhY2MgPSBiYXNlIHx8IFwiXCI7XHJcbiAgICBsZXQgcGF0aHMgPSBwYXRoLnNwbGl0KC9bXFwvXFxcXF0rLyk7XHJcbiAgICBwYXRocy5wb3AoKTsgLy8gcmVtb3ZlIGxhc3QgZmlsZS9lbXB0eSBlbnRyeVxyXG4gICAgd29yaygpO1xyXG4gICAgcmV0dXJuO1xyXG5cclxuICAgIGZ1bmN0aW9uIHdvcmsoKXtcclxuICAgICAgICBpZiggIXBhdGhzLmxlbmd0aCApXHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0cnVlKTtcclxuICAgICAgICBsZXQgY3VycmVudCA9IHBhdGhzLnNoaWZ0KCk7XHJcbiAgICAgICAgZnMubWtkaXIoIGFjYyArIGN1cnJlbnQsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgaWYoIGVyciAmJiBlcnIuY29kZSAhPSAnRUVYSVNUJyApe1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGFjYyArPSBjdXJyZW50ICsgJy8nO1xyXG4gICAgICAgICAgICAgICAgd29yaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmxldCBvbmxvYWQgPSBbXSwgd2FzSW5pdCA9IGZhbHNlO1xyXG5sZXQgbG9jayA9IHt9O1xyXG5cclxuY2xhc3MgSVN0b3JlIHtcclxuXHJcbiAgICBzZXQgb25sb2FkKCBjYiApe1xyXG4gICAgICAgIGlmKCB3YXNJbml0IClcclxuICAgICAgICAgICAgY2IoKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIG9ubG9hZC5wdXNoKGNiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgZnMoIF9mcyApe1xyXG5cclxuICAgICAgICBpZiggZnMgKSByZXR1cm47XHJcblxyXG4gICAgICAgIGZzID0gX2ZzO1xyXG5cclxuICAgICAgICBta2RpcnAoIHRoaXMucm9vdCwgXCJzdG9yZS9cIiwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yb290ICs9IFwic3RvcmUvXCI7XHJcblxyXG4gICAgICAgICAgICB3YXNJbml0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGk9MCwgY2I7IGNiPW9ubG9hZFtpXTsgKytpIClcclxuICAgICAgICAgICAgICAgIGNiKCk7XHJcblxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGV4dEl0ZW0oIGssIGNiICl7XHJcblxyXG4gICAgICAgIGlmKCBsb2NrW2tdICkgY2IobG9ja1trXSApO1xyXG4gICAgICAgIGVsc2UgZnMucmVhZEZpbGUoIHRoaXMucm9vdCArIGssIFwidXRmLThcIiwgKGVyciwgZGF0YSkgPT4gY2IoZGF0YSkgKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SXRlbUJ1ZmZlciggaywgY2IgKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsb2NrW2tdICkgY2IobG9ja1trXSApO1xyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWFkaW5nIFwiLCBrKTtcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKCB0aGlzLnJvb3QgKyBrLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWFkIFwiLCBrLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNiKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEl0ZW0oIGssIHYsIGNiICl7XHJcblxyXG4gICAgICAgIG1rZGlycCggdGhpcy5yb290LCBrLCAoc3VjY2Vzcyk9PntcclxuXHJcbiAgICAgICAgICAgIGlmKCAhc3VjY2VzcyApe1xyXG4gICAgICAgICAgICAgICAgY2IoZmFsc2UpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggbG9ja1trXSApe1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCggdGhpcy5zZXRJdGVtLmJpbmQodGhpcywgaywgdiwgY2IpLCAyMDAgKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBsb2NrW2tdID0gdjtcclxuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZSggdGhpcy5yb290ICsgaywgdiwgKGVycikgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbG9ja1trXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiggY2IgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYighZXJyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElTdG9yZTtcclxuIiwiXHJcbmxldCBJU3RvcmUgPSByZXF1aXJlKCcuL0lTdG9yZS5qcycpO1xyXG5cclxuaWYoIHdpbmRvdy5yZXF1aXJlICl7XHJcblxyXG4gICAgdmFyIGZzID0gd2luZG93LnJlcXVpcmUoJ2ZzJyk7XHJcbiAgICB2YXIgeyByZW1vdGU6e2FwcH0gfSA9IHdpbmRvdy5yZXF1aXJlKCdlbGVjdHJvbicpO1xyXG5cclxuICAgIHZhciB7d2ViRnJhbWV9ID0gd2luZG93LnJlcXVpcmUoJ2VsZWN0cm9uJyk7XHJcbiAgICB3ZWJGcmFtZS5yZWdpc3RlclVSTFNjaGVtZUFzUHJpdmlsZWdlZCgnZmlsZScsIHt9KTtcclxuXHJcbn1lbHNle1xyXG5cclxuICAgIGZzID0ge1xyXG5cclxuICAgICAgICBta2RpciggcGF0aCwgY2IgKXsgY2IoKTsgfSxcclxuXHJcbiAgICAgICAgcmVhZEZpbGUoIHBhdGgsIGVuYywgY2IgKXtcclxuXHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCBwYXRoICk7XHJcblxyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBlbmMgPT09IFwiZnVuY3Rpb25cIiApe1xyXG5cclxuICAgICAgICAgICAgICAgIGNiID0gZW5jO1xyXG4gICAgICAgICAgICAgICAgaWYoIGRhdGEgPT09IG51bGwgKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiggXCJFTk9FTlRcIiApO1xyXG5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgVWludDhBcnJheSggZGF0YS5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgIGZvciggdmFyIGk9MCwgbD1kYXRhLmxlbmd0aDsgaTxsOyArK2kgKVxyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltpXSA9IGRhdGFbaV0gfCAwO1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IGJ1ZmZlcjtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBkYXRhID09PSBudWxsIClcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYiggXCJFTk9FTlRcIiApO1xyXG5cclxuICAgICAgICAgICAgY2IoIHVuZGVmaW5lZCwgZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3cml0ZUZpbGUoIHBhdGgsIGRhdGEsIGNiICl7XHJcblxyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSggcGF0aCwgZGF0YSApO1xyXG4gICAgICAgICAgICBjYih0cnVlKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTm9kZVN0b3JlIGV4dGVuZHMgSVN0b3JlIHtcclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICBpZiggYXBwIClcclxuICAgICAgICAgICAgdGhpcy5yb290ID0gYXBwLmdldFBhdGgoXCJ1c2VyRGF0YVwiKSArIFwiL1wiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5yb290ID0gXCJcIjtcclxuXHJcbiAgICAgICAgdGhpcy5mcyA9IGZzO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGVTdG9yZTsiXX0=
