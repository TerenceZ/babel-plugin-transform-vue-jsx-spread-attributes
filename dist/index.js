"use strict";

var _require = require("@babel/helper-module-imports"),
    addDefault = _require.addDefault;

var _require2 = require("@babel/plugin-syntax-jsx"),
    syntaxJsx = _require2["default"];

var _require3 = require("path"),
    resolvePath = _require3.resolve;

var _require4 = require("./constants"),
    reservedAttributes = _require4.reserved;

module.exports = function (babel) {
  var t = babel.types;
  var helper;
  return {
    name: "babel-plugin-transform-vue-jsx-spread-attributes",
    inherits: syntaxJsx,
    visitor: {
      Program: function Program(programPath) {
        programPath.traverse({
          JSXOpeningElement: function JSXOpeningElement(element) {
            element.get("attributes").forEach(function (path) {
              if (!path.isJSXSpreadAttribute()) {
                return;
              }

              if (path.get("argument").isObjectExpression()) {
                transformJSXSpreadAttributesInOjbectExpression(path);
              } else {
                path.get("argument").replaceWith(t.callExpression(addHelper(), [path.node.argument]));
              }
            });
          }
        });

        function addHelper() {
          return helper || (helper = addDefault(programPath, resolvePath(__dirname, "./resolve-spread-attributes.js"), {
            nameHint: "_mergeJSXAttributes"
          }));
        }

        function transformJSXSpreadAttributesInOjbectExpression(path) {
          var attributes = [];

          var lastAttribute = function lastAttribute() {
            return attributes[attributes.length - 1];
          };

          var addSpreadAttribute = function addSpreadAttribute(node) {
            if (lastAttribute() && t.isJSXSpreadAttribute(lastAttribute())) {
              lastAttribute().argument.properties.push(node);
            } else {
              attributes.push(t.jsxSpreadAttribute(t.objectExpression([node])));
            }
          };

          path.get("argument.properties").forEach(function (p) {
            if (p.isSpreadElement()) {
              addSpreadAttribute(t.spreadElement(t.callExpression(addHelper(), [p.node.argument])));
              return;
            }

            var name = p.get("key").isIdentifier() ? p.node.key.name : p.node.key.value;

            if (p.node.computed || /[^a-zA-Z0-9$_\-]/.test(name)) {
              addSpreadAttribute(t.spreadElement(t.callExpression(addHelper(), t.objectExpression([p.node]))));
              return;
            }

            if (name.startsWith("$") || reservedAttributes.indexOf(name) >= 0) {
              addSpreadAttribute(p.node);
              return;
            }

            if (p.isObjectMethod()) {
              if (p.kind !== "method" || p.decorators) {
                addSpreadAttribute(t.spreadElement(t.callExpression(addHelper(), t.objectExpression([p.node]))));
              } else {
                attributes.push(t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(t.functionExpression(p.node.key, p.node.params, p.node.body, p.node.generator, p.node.async))));
              }

              return;
            }

            attributes.push(t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(p.node.value)));
          });
          attributes.forEach(function (attrib) {
            path.insertBefore(attrib);
          });
          path.remove();
        }
      }
    }
  };
};