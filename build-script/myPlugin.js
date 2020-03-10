const fs = require("fs");
const path = require("path");

class GenerateTypesIndexPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('GenerateTypesIndexPlugin', () => {
    //   fs.writeFileSync(
    //     path.join(__dirname, '../types/index.d.ts'),
    //     'export * from \'./dist\'\n'
    //   )
    });
  }
}

module.exports = GenerateTypesIndexPlugin;