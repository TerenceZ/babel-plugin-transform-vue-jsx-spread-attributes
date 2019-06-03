const root = [
  "staticClass",
  "class",
  "style",
  "key",
  "ref",
  "refInFor",
  "slot",
  "scopedSlots",
  "model"
];

const prefixes = ["props", "domProps", "on", "nativeOn", "hook", "attrs"];

const reserved = root.concat(prefixes);

module.exports = {
  root: root,
  prefixes,
  reserved: reserved
};
