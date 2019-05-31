const rootAttributes = [
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
const prefixRegexp = new RegExp(`(^${prefixes.join("|^")})`);

const reservedKeys = [
  "staticClass",
  "class",
  "style",
  "key",
  "ref",
  "refInFor",
  "slot",
  "scopedSlots",
  "model"
]
  .concat(prefixes)
  .reduce((map, key) => {
    map[key] = true;
    return map;
  }, {});

export default attrs => {
  const result = Object.create(null);
  for (const key of Object.keys(attrs)) {
    if (reservedKeys[key] || key[0] === "$") {
      if (key === "attrs") {
        if (result[key]) {
          result[key] = { ...result[key], ...attrs[key] };
        } else {
          result[key] = { ...attrs[key] };
        }
      } else {
        result[key] = attrs[key];
      }
    } else {
      const prefix = prefixRegexp.exec(key);
      let category = "attrs";
      let name = key;
      if (prefix) {
        category = prefix[1];
        name =
          key[category.length].toLowerCase() + key.substr(category.length + 1);
      }
      if (result[category]) {
        result[category][name] = attrs[key];
      } else {
        result[category] = { [name]: attrs[key] };
      }
    }
  }

  return result;
};
