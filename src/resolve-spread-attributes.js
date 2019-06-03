const { root: rootAttributes, prefixes } = require("./constants");

const prefixRegexp = new RegExp(`(^${prefixes.join("|^")})`);
const reservedKeys = rootAttributes.concat(prefixes).reduce((map, key) => {
  map[key] = true;
  return map;
}, {});

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
      const prefix = prefixRegexp.exec(key);
      let category = "attrs";
      let name = key;
      if (prefix) {
        category = prefix[1];
        const offset = category.length;
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
