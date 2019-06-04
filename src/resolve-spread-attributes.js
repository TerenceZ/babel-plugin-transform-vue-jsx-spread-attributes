const { root: rootAttributes, prefixes } = require("./constants");

const prefixRegexp = new RegExp(`(^${prefixes.join("|^")})`);
const reservedKeys = rootAttributes.concat(prefixes).reduce((map, key) => {
  map[key] = true;
  return map;
}, {});

const isDirective = src =>
  src.startsWith(`v-`) ||
  (src.startsWith("v") && src.length >= 2 && src[1] >= "A" && src[1] <= "Z");

export default attrs => {
  const result = Object.create(null);
  for (const key of Object.keys(attrs)) {
    if (reservedKeys[key] || key[0] === "$") {
      if (key === "attrs") {
        result[key] = { ...result[key], ...attrs[key] };
      } else {
        result[key] = attrs[key];
      }
    } else {
      let prefix = prefixRegexp.exec(key);
      let category = "attrs";
      let name = key;
      let offset = 0;

      if (prefix) {
        category = prefix[1];
        offset = category.length;
      } else if (isDirective(key)) {
        prefix = "v";
        category = "directives";
        offset = 1;
      }

      if (prefix) {
        name =
          key[offset] === "-"
            ? key.substr(offset + 1)
            : key[offset].toLowerCase() + key.substr(offset + 1);
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
