"use strict";

var _require = require("@babel/helper-module-imports"),
    addDefault = _require.addDefault;

var _require2 = require("@babel/plugin-syntax-jsx"),
    syntaxJsx = _require2["default"];

var _require3 = require("path"),
    resolvePath = _require3.resolve;

var reservedAttributes = ["staticClass", "class", "style", "key", "ref", "refInFor", "slot", "scopedSlots", "model", "props", "domProps", "on", "nativeOn", "hook", "attrs"];

module.exports = function (babel) {
  var t = babel.types;
  return {
    name: "babel-plugin-transform-vue-jsx-spread-attributes",
    inherits: syntaxJsx,
    visitor: {
      Program: function Program(path) {
        path.traverse({
          JSXSpreadAttribute: function JSXSpreadAttribute(path) {
            // If the argument is object expression,
            // we can handle it in place.
            if (path.get("argument").isObjectExpression()) {
              transformJSXSpreadAttributesInOjbectExpression(path);
            } else {
              var helper = addDefault(path, resolvePath(__dirname, "./resolve-spread-attributes.js"), {
                nameHint: "_mergeJSXAttributes"
              });
              path.get("argument").replaceWith(t.callExpression(helper, [path.node.argument]));
            }
          }
        });
      }
    }
  };

  function transformJSXSpreadAttributesInOjbectExpression(path) {
    var propPaths = path.get("argument.properties");
    var newProps = [];
    var propPathsToMergeInAttrs = [];
    var cursor = 0;
    var attrCursor = -1;
    var attrs; // filter out attrs to be merged.

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = propPaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var propPath = _step.value;

        if (propPath.node.computed || propPath.node.key.name.startsWith("$")) {
          newProps.push(propPath.node);
        } else if (reservedAttributes.indexOf(propPath.node.key.name) !== -1) {
          if (propPath.node.key.name === "attrs") {
            attrCursor = cursor;
            attrs = propPath.node;
          }

          newProps.push(propPath.node);
        } else {
          propPathsToMergeInAttrs.push({
            cursor: cursor,
            path: propPath
          });
        }

        ++cursor;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (!propPathsToMergeInAttrs.length) {
      return;
    }

    var insertIntoAttrsIfOK = function insertIntoAttrsIfOK(path) {
      if (attrs) {
        if (t.isObjectExpression(attrs.value)) {
          if (attrs.value.properties.some(function (p) {
            return p.computed === path.node.computed && p.key.name === path.node.key.name;
          })) {
            return false;
          }

          attrs.value.properties.push(path.node);
          return true;
        } else {
          return false;
        }
      }

      attrs = t.objectProperty(t.identifier("attrs"), t.objectExpression([path.node]));
      newProps.push(attrs);
      return true;
    }; // filter out to be spread before attrs


    var attrsBefore = [];
    propPathsToMergeInAttrs.filter(function (_ref) {
      var cursor = _ref.cursor;
      return cursor < attrCursor;
    }).forEach(function (_ref2) {
      var path = _ref2.path;

      if (!insertIntoAttrsIfOK(path)) {
        attrsBefore.push(path.node);
      }
    }); // filter out to be spread after attrs

    var attrsAfter = [];
    propPathsToMergeInAttrs.filter(function (_ref3) {
      var cursor = _ref3.cursor;
      return cursor > attrCursor;
    }).forEach(function (_ref4) {
      var path = _ref4.path;

      if (!insertIntoAttrsIfOK(path)) {
        attrsAfter.push(path.node);
      }
    });

    if (attrsBefore.length || attrsAfter.length) {
      if (!attrs) {
        attrs = t.objectProperty(t.identifier("attrs"), t.objectExpression([]));
        newProps.push(attrs);
      }
    }

    var attrsValue = attrs.value;

    if (attrsBefore.length) {
      attrsValue = t.objectExpression(attrsBefore.concat([t.spreadElement(attrsValue)]));
    }

    if (attrsAfter.length) {
      if (attrsBefore.length) {
        attrsValue.properties.push(t.spreadElement(t.objectExpression(attrsAfter)));
      } else {
        attrsValue = t.objectExpression([t.spreadElement(attrsValue), t.spreadElement(t.objectExpression(attrsAfter))]);
      }
    }

    attrs.value = attrsValue;
    path.node.argument.properties = newProps;
  }
};