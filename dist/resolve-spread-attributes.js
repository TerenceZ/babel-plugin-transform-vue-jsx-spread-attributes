"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var rootAttributes = ["staticClass", "class", "style", "key", "ref", "refInFor", "slot", "scopedSlots", "model"];
var prefixes = ["props", "domProps", "on", "nativeOn", "hook", "attrs"];
var prefixRegexp = new RegExp("(^".concat(prefixes.join("|^"), ")"));
var reservedKeys = ["staticClass", "class", "style", "key", "ref", "refInFor", "slot", "scopedSlots", "model"].concat(prefixes).reduce(function (map, key) {
  map[key] = true;
  return map;
}, {});

var _default = function _default(attrs) {
  var result = Object.create(null);

  for (var _i = 0, _Object$keys = Object.keys(attrs); _i < _Object$keys.length; _i++) {
    var key = _Object$keys[_i];

    if (reservedKeys[key] || key[0] === "$") {
      if (key === "attrs") {
        if (result[key]) {
          result[key] = _objectSpread({}, result[key], attrs[key]);
        } else {
          result[key] = _objectSpread({}, attrs[key]);
        }
      } else {
        result[key] = attrs[key];
      }
    } else {
      var prefix = prefixRegexp.exec(key);
      var category = "attrs";
      var name = key;

      if (prefix) {
        category = prefix[1];
        name = key[category.length].toLowerCase() + key.substr(category.length + 1);
      }

      if (result[category]) {
        result[category][name] = attrs[key];
      } else {
        result[category] = _defineProperty({}, name, attrs[key]);
      }
    }
  }

  return result;
};

exports["default"] = _default;