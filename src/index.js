"use strict";

const { addDefault } = require("@babel/helper-module-imports");
const { default: syntaxJsx } = require("@babel/plugin-syntax-jsx");
const { resolve: resolvePath } = require("path");

const reservedAttributes = [
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
];

module.exports = babel => {
  const t = babel.types;

  return {
    name: "babel-plugin-transform-vue-jsx-spread-attributes",
    inherits: syntaxJsx,
    visitor: {
      Program(path) {
        path.traverse({
          JSXSpreadAttribute(path) {
            // If the argument is object expression,
            // we can handle it in place.
            if (path.get("argument").isObjectExpression()) {
              transformJSXSpreadAttributesInOjbectExpression(path);
            } else {
              const helper = addDefault(
                path,
                resolvePath(__dirname, "./resolve-spread-attributes.js"),
                {
                  nameHint: "_mergeJSXAttributes"
                }
              );
              path
                .get("argument")
                .replaceWith(t.callExpression(helper, [path.node.argument]));
            }
          }
        });
      }
    }
  };

  function transformJSXSpreadAttributesInOjbectExpression(path) {
    const propPaths = path.get("argument.properties");
    const newProps = [];
    const propPathsToMergeInAttrs = [];
    let cursor = 0;
    let attrCursor = -1;
    let attrs;

    // filter out attrs to be merged.
    for (const propPath of propPaths) {
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
          cursor,
          path: propPath
        });
      }

      ++cursor;
    }

    if (!propPathsToMergeInAttrs.length) {
      return;
    }

    const insertIntoAttrsIfOK = path => {
      if (attrs) {
        if (t.isObjectExpression(attrs.value)) {
          if (
            attrs.value.properties.some(
              p =>
                p.computed === path.node.computed &&
                p.key.name === path.node.key.name
            )
          ) {
            return false;
          }
          attrs.value.properties.push(path.node);
          return true;
        } else {
          return false;
        }
      }

      attrs = t.objectProperty(
        t.identifier("attrs"),
        t.objectExpression([path.node])
      );
      newProps.push(attrs);
      return true;
    };

    // filter out to be spread before attrs
    const attrsBefore = [];
    propPathsToMergeInAttrs
      .filter(({ cursor }) => cursor < attrCursor)
      .forEach(({ path }) => {
        if (!insertIntoAttrsIfOK(path)) {
          attrsBefore.push(path.node);
        }
      });

    // filter out to be spread after attrs
    const attrsAfter = [];
    propPathsToMergeInAttrs
      .filter(({ cursor }) => cursor > attrCursor)
      .forEach(({ path }) => {
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
    let attrsValue = attrs.value;

    if (attrsBefore.length) {
      attrsValue = t.objectExpression(
        attrsBefore.concat([t.spreadElement(attrsValue)])
      );
    }

    if (attrsAfter.length) {
      if (attrsBefore.length) {
        attrsValue.properties.push(
          t.spreadElement(t.objectExpression(attrsAfter))
        );
      } else {
        attrsValue = t.objectExpression([
          t.spreadElement(attrsValue),
          t.spreadElement(t.objectExpression(attrsAfter))
        ]);
      }
    }

    attrs.value = attrsValue;
    path.node.argument.properties = newProps;
  }
};
