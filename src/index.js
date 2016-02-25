
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
    operators: decoratedAst.complexity.body.operators,
    operands: decoratedAst.complexity.body.operands,
    lloc: decoratedAst.complexity.body.lloc,
  });
  
  stats.average = {
    complexity: calculateAverage('cyclomatic', reducer, decoratedAst),
    lloc: calculateAverage('lloc', reducer, decoratedAst),
    functionComplexity: calculateAverage('cyclomatic', reducer, null),
    functionLloc: calculateAverage('lloc', reducer, null)
  };
  
  stats.total = computeStats({
    cyclomatic: reducer.cyclomatic,
    lloc: reducer.lloc,
    operators: reducer.operators,
    operands: reducer.operands,
    distinctOperators: uniq(reducer.operators),
    distinctOperands: uniq(reducer.operands),
  });
  
  stats.functions = summarizeFunctions(reducer);
  stats._ = {
    ast : decoratedAst,
    result : reducer,
  };
  
  return stats;
}

function isRootNode(ast) {
  return ast.type === 'Module' || ast.type === 'Script';
}

function calculateAverage(prop, reducer, ast) {
  let scopes = reducer.functions.concat();
  if (ast && isRootNode(ast)) scopes.push(ast);
  //console.log('property : %s', prop);
  //console.log(scopes.length);
  //console.log(scopes);

  var total = scopes.reduce((p,n) => p + n.complexity.body[prop], 0);
  return total / scopes.length;
}

function summarizeFunctions(reducer) {
  return reducer.functions.map(fn => computeStats(fn.complexity.body));
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
  computed.volume = computed.length === 0 ? 0 : computed.length * (Math.log(computed.vocabulary) / Math.LN2);
  computed.difficulty = computed.distinctOperands.length === 0 ? 
    0 : 
    (computed.distinctOperators.length / 2) * (computed.operators.length / computed.distinctOperands.length);
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



