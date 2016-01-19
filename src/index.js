
var uniq = require('lodash/array/uniq');
var reduce = require( 'shift-reducer').default;

import ComplexityReducer from './reducer';

function analyze(ast) {
  if (typeof ast !== 'object') throw new Error('invalid argument to analyze(), AST required');
  
  var reducer = new ComplexityReducer();
  var reduced = reduce(reducer, ast);

  return {
    average : {
      complexity: calculateAverage('cyclomatic', reducer, reduced),
      lloc: calculateAverage('lloc', reducer, reduced),
      functionComplexity: calculateAverage('cyclomatic', reducer, null),
      functionLloc: calculateAverage('lloc', reducer, null)
    },
    lloc: 0,
    functions: summarizeFunctions(reducer),
    operators: reducer.operators,
    operands: reducer.operands,
    distinctOperators: uniq(reducer.operators),
    distinctOperands: uniq(reducer.operands)
  };
}

function isRootNode(ast) {
  return ast.type === 'Module' || ast.type === 'Script';
}

function calculateAverage(prop, reducer, ast) {
  let scopes = reducer.functions.concat();
  if (ast && isRootNode(ast)) scopes.push(ast);

  var total = scopes.reduce((p,n) => p + n.complexity.aggregate[prop], 0);
  return total / scopes.length;
}

function summarizeFunctions(reducer) {
  return reducer.functions.map(fn => computeStats(fn.complexity.aggregate));
}

function computeStats(stats) {
  var computed = {
    lloc: stats.lloc,
    cyclomatic: stats.cyclomatic,
    operators: stats.operators,
    operands: stats.operands,
    distinctOperators: uniq(stats.operators),
    distinctOperands: uniq(stats.operands),
    vocabulary:0,
    length:0,
    volume:0,
    difficulty:0,
    effort:0,
    time:0,
    bugs:0,
    maintainability:0,
  };
  
  computed.vocabulary = computed.distinctOperands.length + computed.distinctOperators.length;
  computed.length = computed.operands.length + computed.operators.length;
  computed.volume = computed.length * (Math.log(computed.vocabulary) / Math.LN2);
  computed.difficulty = (computed.distinctOperators.length / 2) * (computed.operators.length / computed.distinctOperands.length);
  computed.effort = computed.difficulty * computed.volume;
  computed.time = 1000 * (computed.effort / 18);
  computed.bugs = Math.pow(computed.effort, 2/3) / 3000;
  
  computed.maintainability =
      Math.max(0, (
              171 -
              5.2 * Math.log(computed.volume) -
              0.23 * computed.cyclomatic -
              16.2 * Math.log(computed.lloc)
          ) * 100 / 171);
  return computed;
}

export default {
  analyze
};


