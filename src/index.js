
var reduce = require( 'shift-reducer').default;

import ComplexityReducer from './reducer';

function uniq(array) {
  return Object.keys(array.reduce((p,n) => {p[n] = true; return p;},{}));
}

export function analyze(ast) {
  if (typeof ast !== 'object') throw new Error('invalid argument to analyze(), AST required');
  
  var reducer = new ComplexityReducer();
  var decoratedAst = reduce(reducer, ast);
  
  var stats = {};

  stats.root = computeStats({
    cyclomatic: decoratedAst.complexity.body.cyclomatic,
    numOperators: decoratedAst.complexity.body.operators.length,
    numOperands: decoratedAst.complexity.body.operands.length,
    numDistinctOperators: uniq(decoratedAst.complexity.body.operators).length,
    numDistinctOperands: uniq(decoratedAst.complexity.body.operands).length,
    lloc: decoratedAst.complexity.body.lloc,
  });
  
  stats.root.operators = decoratedAst.complexity.body.operators;
  stats.root.operands = decoratedAst.complexity.body.operands;
  
  stats.total = computeStats({
    cyclomatic: reducer.cyclomatic,
    lloc: reducer.lloc,
    numOperators: reducer.operators.length,
    numOperands: reducer.operands.length,
    numDistinctOperators: uniq(reducer.operators).length,
    numDistinctOperands: uniq(reducer.operands).length,
  });

  stats.total.operators = reducer.operators;
  stats.total.operands = reducer.operands;
  
  var numScopes = reducer.functions.length + 1;

  stats.average = computeStats({
    cyclomatic: stats.total.cyclomatic / numScopes,
    lloc: stats.total.lloc / numScopes,
    numOperands: stats.total.numOperands / numScopes,
    numOperators: stats.total.numOperators / numScopes,
    numDistinctOperands: stats.total.numDistinctOperands / numScopes,
    numDistinctOperators: stats.total.numDistinctOperators / numScopes,
  });

  stats.functions = summarizeFunctions(reducer);
  stats._ = {
    ast : decoratedAst,
    result : reducer,
  };
  
  return stats;
}

function summarizeFunctions(reducer) {
  return reducer.functions.map(fn => {
    var stats = computeStats({
      cyclomatic: fn.complexity.body.cyclomatic,
      numOperators: fn.complexity.body.operators.length,
      numOperands: fn.complexity.body.operands.length,
      numDistinctOperators: uniq(fn.complexity.body.operators).length,
      numDistinctOperands: uniq(fn.complexity.body.operands).length,
      lloc: fn.complexity.body.lloc,
    });
    stats.operators = fn.complexity.body.operators;
    stats.operands = fn.complexity.body.operands;
    stats.name = fn.name ? fn.name.name : '<anonymous>';
    stats.node = fn;
    return stats;
  });
}

function computeStats(stats) {
  var computed = {
    lloc: stats.lloc,
    cyclomatic: stats.cyclomatic, 
    numOperators: stats.numOperators,
    numOperands: stats.numOperands,
    numDistinctOperators: stats.numDistinctOperators,
    numDistinctOperands: stats.numDistinctOperands,
    vocabulary:0,
    length:0,
    volume:0,
    difficulty:0,
    effort:0,
    time:0,
    bugs:0,
    maintainability:0,
  };
  
  computed.vocabulary = computed.numDistinctOperands + computed.numDistinctOperators;
  computed.length = computed.numOperands + computed.numOperators;
  computed.volume = computed.length === 0 ? 0 : computed.length * (Math.log(computed.vocabulary) / Math.LN2);
  computed.difficulty = computed.numDistinctOperands === 0 ? 
    0 : 
    (computed.numDistinctOperators / 2) * (computed.numOperators / computed.numDistinctOperands);
  computed.effort = computed.difficulty * computed.volume;
  computed.time = 1000 * (computed.effort / 18);
  computed.bugs = Math.pow(computed.effort, 2/3) / 3000;

  computed.maintainability =
    Math.min(100, Math.max(0, (
        171 -
        5.2 * Math.log(computed.volume) -
        0.23 * computed.cyclomatic -
        16.2 * Math.log(computed.lloc)
      ) * 100 / 171));
  
  return computed;
}

export default {
  analyze
};



