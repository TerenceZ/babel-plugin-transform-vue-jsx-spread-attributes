const reservedKeys = [
  "staticClass",
  "class",
  "style",
  "key",
  "ref",
  "refInFor",
  "slot",
  "scopedSlots",
  "model",
  "props",
  "domProps",
  "on",
  "nativeOn",
  "hook",
  "attrs"
].reduce((map, key) => {
  map[key] = true;
  return map;
}, {});

export default attrs => {
  const result = Object.create(null);
  for (const key of Object.keys(attrs)) {
    if (reservedKeys[key]) {
      if (key === "attrs") {
        if (result[key]) {
          result[key] = { ...result[key], ...attrs[key] };
        } else {
          result[key] = { ...attrs[key] };
        }
      } else {
        result[key] = attrs[key];
      }
    } else if (result["attrs"]) {
      result["attrs"][key] = attrs[key];
    } else {
      result["attrs"] = { [key]: attrs[key] };
    }
  }

  return result;
};
