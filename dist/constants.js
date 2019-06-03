"use strict";

var root = ["staticClass", "class", "style", "key", "ref", "refInFor", "slot", "scopedSlots", "model"];
var prefixes = ["props", "domProps", "on", "nativeOn", "hook", "attrs"];
var reserved = root.concat(prefixes);
module.exports = {
  root: root,
  prefixes: prefixes,
  reserved: reserved
};