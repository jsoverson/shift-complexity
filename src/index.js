
import reduce from 'shift-reducer';
import ComplexityReducer from './reducer';
import {default as uniq} from 'lodash/array/uniq';

"use strict";

function analyze(ast) {
  if (typeof ast !== 'object') throw new Error('invalid argument to analyze(), AST required');
  var reducer = new ComplexityReducer();
  var reduced = reduce(reducer, ast);

  console.log('');
  console.log(reducer);
  console.log(reduced);
  
  var report = {
    average : {
      complexity: calculateAverage('cyclomatic', reducer, reduced),
      lloc: calculateAverage('lloc', reducer, reduced),
      functionComplexity: calculateAverage('cyclomatic', reducer, {}),
      functionLloc: calculateAverage('lloc', reducer, {})
    },
    functions: summarizeFunctions(reduced),
    operators: reducer.operators,
    operands: reducer.operands,
    distinctOperators: uniq(reducer.operators),
    distinctOperands: uniq(reducer.operands)
  };
  
  console.log(require('util').inspect(report,{depth:6}));
  
  return report;
}



function isRootNode(ast) {
  return ast.type === 'Module' || ast.type === 'Script';
}

function calculateAverage(prop, reducer, ast) {
  let scopes = reducer.functions.concat();
  if (isRootNode(ast)) scopes.push(ast);

  var total = scopes.reduce((p,n) => p + n.aggregateStats[prop], 0);
  console.log(total);
  return total / scopes.length;
}

function summarizeFunctions(ast) {
  
}

export {
  analyze
};


