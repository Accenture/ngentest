const getImportLib = require('./lib/util.js').getImportLib;
const reIndent = require('./lib/util.js').reIndent;
const path = require('path');

module.exports = function getServiceData(tsParsed, filePath, specFuncBlocks) {
  let result = {
    className: tsParsed.name,
    classParams: [],
    imports: {
      [`./${path.basename(filePath)}`.replace(/.ts$/,'')]: [tsParsed.name], // the directive itself
    },
    mocks: {},
    functionTests: {}
  };

  //
  // Iterate constructor parameters
  //  . create mocks and constructor parameters
  //
  (tsParsed.constructor.parameters || []).forEach(param => { // name, type, body
    //param.type, param.name, param.body
    result.mocks[param.type] = reIndent(`
      const ${param.name}: any = {
        // mock properties here 
      }
    `, '  ');

    result.classParams.push(param.name);
  });

  // Adding the existing spec It Blocks
  result.functionTests['spec'] = specFuncBlocks;

  //
  // Iterate methods
  //  . Javascript to call the function with parameter;
  //
  for (var key in tsParsed.methods) {
    let method = tsParsed.methods[key];
    let parameters = (method.parameters || []).map(el => el.name).join(', ');
    let js = `${key}(${parameters})`;
    (method.type !== 'void') && (js = `const result = ${js}`); 
    if(specFuncBlocks.indexOf(key) == -1){
      result.functionTests[key] = reIndent(`
        it('should run #${key}()', async () => {
          // ${js};
        });
      `, '  ');
    }
  }

  return result;
}
