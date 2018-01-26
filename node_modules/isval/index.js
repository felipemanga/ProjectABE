module.exports = function isval(value, type) {
  if (arguments.length === 2 && typeof type === 'undefined') {
    type = 'undefined';
  } else if (Number.isNaN(type)) {
    type = 'NaN';
  }

  function isObject(obj) {
    return typeof value === 'object' && value !== null;
  }

  function constructorType(constructor) {
    return constructor.name.toLowerCase()
  }

  switch (type) {
    case 'boolean':
    case 'function':
    case 'string':
      return typeof value === type;

    case 'number':
      return typeof value === type && !isNaN(value);

    case Number:
      if (isNaN(value)) { return false; }
    // fall through
    case String:
    case Boolean:
      return typeof value === constructorType(type);

    case Object:
    case 'object':
      return isObject(value);

    case 'array':
      return Array.isArray(value);

    case 'regex':
    case 'regexp':
      return value instanceof RegExp;

    case 'date':
      return value instanceof Date;

    case 'null':
    case null:
      return value === null;

    case 'undefined':
      return typeof value === 'undefined';

    case 'NaN':
      return Number.isNaN(value);

    case 'arguments':
      if (isObject(value)) {
        return (typeof value.callee === 'function')
          || (/arguments/i).test(value.toString());
      }
      return false;


    default:
      return (typeof type === 'function')
        ? value instanceof type
        : value;
  }
};
