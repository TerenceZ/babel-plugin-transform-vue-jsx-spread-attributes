"use strict";

const { addDefault } = require("@babel/helper-module-imports");
const { default: syntaxJsx } = require("@babel/plugin-syntax-jsx");
const { resolve: resolvePath } = require("path");
const { reserved: reservedAttributes } = require("./constants");

module.exports = babel => {
  const t = babel.types;
  let helper;

  return {
    name: "babel-plugin-transform-vue-jsx-spread-attributes",
    inherits: syntaxJsx,
    visitor: {
      Program(programPath) {
        programPath.traverse({
          JSXOpeningElement(element) {
            element.get("attributes").forEach(path => {
              if (!path.isJSXSpreadAttribute()) {
                return;
              }
              if (path.get("argument").isObjectExpression()) {
                transformJSXSpreadAttributesInOjbectExpression(path);
              } else {
                path
                  .get("argument")
                  .replaceWith(
                    t.callExpression(addHelper(), [path.node.argument])
                  );
              }
            });
          }
        });

        function addHelper() {
          return (
            helper ||
            (helper = addDefault(
              programPath,
              resolvePath(__dirname, "./resolve-spread-attributes.js"),
              {
                nameHint: "_mergeJSXAttributes"
              }
            ))
          );
        }

        function transformJSXSpreadAttributesInOjbectExpression(path) {
          const attributes = [];
          const lastAttribute = () => attributes[attributes.length - 1];
          const addSpreadAttribute = node => {
            if (lastAttribute() && t.isJSXSpreadAttribute(lastAttribute())) {
              lastAttribute().argument.properties.push(node);
            } else {
              attributes.push(t.jsxSpreadAttribute(t.objectExpression([node])));
            }
          };

          path.get("argument.properties").forEach(p => {
            if (p.isSpreadElement()) {
              addSpreadAttribute(
                t.spreadElement(
                  t.callExpression(addHelper(), [p.node.argument])
                )
              );
              return;
            }
            const name = p.get("key").isIdentifier()
              ? p.node.key.name
              : p.node.key.value;

            if (p.node.computed || /[^a-zA-Z0-9$_\-]/.test(name)) {
              addSpreadAttribute(
                t.spreadElement(
                  t.callExpression(addHelper(), t.objectExpression([p.node]))
                )
              );
              return;
            }

            if (name.startsWith("$") || reservedAttributes.indexOf(name) >= 0) {
              addSpreadAttribute(p.node);
              return;
            }

            if (p.isObjectMethod()) {
              if (p.kind !== "method" || p.decorators) {
                addSpreadAttribute(
                  t.spreadElement(
                    t.callExpression(addHelper(), t.objectExpression([p.node]))
                  )
                );
              } else {
                attributes.push(
                  t.jsxAttribute(
                    t.jsxIdentifier(name),
                    t.jsxExpressionContainer(
                      t.functionExpression(
                        p.node.key,
                        p.node.params,
                        p.node.body,
                        p.node.generator,
                        p.node.async
                      )
                    )
                  )
                );
              }
              return;
            }
            attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier(name),
                t.jsxExpressionContainer(p.node.value)
              )
            );
          });

          attributes.forEach(attrib => {
            path.insertBefore(attrib);
          });

          path.remove();
        }
      }
    }
  };
};
