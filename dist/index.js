'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.analyze = analyze;

var _reducer = require('./reducer');

var _reducer2 = _interopRequireDefault(_reducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var reduce = require('shift-reducer').default;

function uniq(array) {
  return Object.keys(array.reduce(function (p, n) {
    p[n] = true;return p;
  }, {}));
}

function analyze(ast) {
  if ((typeof ast === 'undefined' ? 'undefined' : _typeof(ast)) !== 'object') throw new Error('invalid argument to analyze(), AST required');

  var reducer = new _reducer2.default();
  var decoratedAst = reduce(reducer, ast);

  var stats = {};

  stats.root = computeStats({
    cyclomatic: decoratedAst.complexity.body.cyclomatic,
    numOperators: decoratedAst.complexity.body.operators.length,
    numOperands: decoratedAst.complexity.body.operands.length,
    numDistinctOperators: uniq(decoratedAst.complexity.body.operators).length,
    numDistinctOperands: uniq(decoratedAst.complexity.body.operands).length,
    lloc: decoratedAst.complexity.body.lloc
  });

  stats.root.operators = decoratedAst.complexity.body.operators;
  stats.root.operands = decoratedAst.complexity.body.operands;

  stats.total = computeStats({
    cyclomatic: reducer.cyclomatic,
    lloc: reducer.lloc,
    numOperators: reducer.operators.length,
    numOperands: reducer.operands.length,
    numDistinctOperators: uniq(reducer.operators).length,
    numDistinctOperands: uniq(reducer.operands).length
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
    numDistinctOperators: stats.total.numDistinctOperators / numScopes
  });

  stats.functions = summarizeFunctions(reducer);
  stats._ = {
    ast: decoratedAst,
    result: reducer
  };

  return stats;
}

function summarizeFunctions(reducer) {
  return reducer.functions.map(function (fn) {
    var stats = computeStats({
      cyclomatic: fn.complexity.body.cyclomatic,
      numOperators: fn.complexity.body.operators.length,
      numOperands: fn.complexity.body.operands.length,
      numDistinctOperators: uniq(fn.complexity.body.operators).length,
      numDistinctOperands: uniq(fn.complexity.body.operands).length,
      lloc: fn.complexity.body.lloc
    });
    stats.operators = fn.complexity.body.operators;
    stats.operands = fn.complexity.body.operands;
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
    vocabulary: 0,
    length: 0,
    volume: 0,
    difficulty: 0,
    effort: 0,
    time: 0,
    bugs: 0,
    maintainability: 0
  };

  computed.vocabulary = computed.numDistinctOperands + computed.numDistinctOperators;
  computed.length = computed.numOperands + computed.numOperators;
  computed.volume = computed.length === 0 ? 0 : computed.length * (Math.log(computed.vocabulary) / Math.LN2);
  computed.difficulty = computed.numDistinctOperands === 0 ? 0 : computed.numDistinctOperators / 2 * (computed.numOperators / computed.numDistinctOperands);
  computed.effort = computed.difficulty * computed.volume;
  computed.time = 1000 * (computed.effort / 18);
  computed.bugs = Math.pow(computed.effort, 2 / 3) / 3000;

  computed.maintainability = Math.min(100, Math.max(0, (171 - 5.2 * Math.log(computed.volume) - 0.23 * computed.cyclomatic - 16.2 * Math.log(computed.lloc)) * 100 / 171));

  return computed;
}

exports.default = {
  analyze: analyze
};
//# sourceMappingURL=data:application/json;base64,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SUFBVCxDQUFoQixDQUpzQixHQUtwQixHQUxvQixHQUtkLEdBTGMsQ0FBMUIsQ0FERixDQTVCMkI7O0FBb0MzQixTQUFPLFFBQVAsQ0FwQzJCO0NBQTdCOztrQkF1Q2U7QUFDYixrQkFEYSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIHJlZHVjZSA9IHJlcXVpcmUoICdzaGlmdC1yZWR1Y2VyJykuZGVmYXVsdDtcblxuaW1wb3J0IENvbXBsZXhpdHlSZWR1Y2VyIGZyb20gJy4vcmVkdWNlcic7XG5cbmZ1bmN0aW9uIHVuaXEoYXJyYXkpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGFycmF5LnJlZHVjZSgocCxuKSA9PiB7cFtuXSA9IHRydWU7IHJldHVybiBwO30se30pKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emUoYXN0KSB7XG4gIGlmICh0eXBlb2YgYXN0ICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGFyZ3VtZW50IHRvIGFuYWx5emUoKSwgQVNUIHJlcXVpcmVkJyk7XG4gIFxuICB2YXIgcmVkdWNlciA9IG5ldyBDb21wbGV4aXR5UmVkdWNlcigpO1xuICB2YXIgZGVjb3JhdGVkQXN0ID0gcmVkdWNlKHJlZHVjZXIsIGFzdCk7XG4gIFxuICB2YXIgc3RhdHMgPSB7fTtcblxuICBzdGF0cy5yb290ID0gY29tcHV0ZVN0YXRzKHtcbiAgICBjeWNsb21hdGljOiBkZWNvcmF0ZWRBc3QuY29tcGxleGl0eS5ib2R5LmN5Y2xvbWF0aWMsXG4gICAgbnVtT3BlcmF0b3JzOiBkZWNvcmF0ZWRBc3QuY29tcGxleGl0eS5ib2R5Lm9wZXJhdG9ycy5sZW5ndGgsXG4gICAgbnVtT3BlcmFuZHM6IGRlY29yYXRlZEFzdC5jb21wbGV4aXR5LmJvZHkub3BlcmFuZHMubGVuZ3RoLFxuICAgIG51bURpc3RpbmN0T3BlcmF0b3JzOiB1bmlxKGRlY29yYXRlZEFzdC5jb21wbGV4aXR5LmJvZHkub3BlcmF0b3JzKS5sZW5ndGgsXG4gICAgbnVtRGlzdGluY3RPcGVyYW5kczogdW5pcShkZWNvcmF0ZWRBc3QuY29tcGxleGl0eS5ib2R5Lm9wZXJhbmRzKS5sZW5ndGgsXG4gICAgbGxvYzogZGVjb3JhdGVkQXN0LmNvbXBsZXhpdHkuYm9keS5sbG9jLFxuICB9KTtcbiAgXG4gIHN0YXRzLnJvb3Qub3BlcmF0b3JzID0gZGVjb3JhdGVkQXN0LmNvbXBsZXhpdHkuYm9keS5vcGVyYXRvcnM7XG4gIHN0YXRzLnJvb3Qub3BlcmFuZHMgPSBkZWNvcmF0ZWRBc3QuY29tcGxleGl0eS5ib2R5Lm9wZXJhbmRzO1xuICBcbiAgc3RhdHMudG90YWwgPSBjb21wdXRlU3RhdHMoe1xuICAgIGN5Y2xvbWF0aWM6IHJlZHVjZXIuY3ljbG9tYXRpYyxcbiAgICBsbG9jOiByZWR1Y2VyLmxsb2MsXG4gICAgbnVtT3BlcmF0b3JzOiByZWR1Y2VyLm9wZXJhdG9ycy5sZW5ndGgsXG4gICAgbnVtT3BlcmFuZHM6IHJlZHVjZXIub3BlcmFuZHMubGVuZ3RoLFxuICAgIG51bURpc3RpbmN0T3BlcmF0b3JzOiB1bmlxKHJlZHVjZXIub3BlcmF0b3JzKS5sZW5ndGgsXG4gICAgbnVtRGlzdGluY3RPcGVyYW5kczogdW5pcShyZWR1Y2VyLm9wZXJhbmRzKS5sZW5ndGgsXG4gIH0pO1xuXG4gIHN0YXRzLnRvdGFsLm9wZXJhdG9ycyA9IHJlZHVjZXIub3BlcmF0b3JzO1xuICBzdGF0cy50b3RhbC5vcGVyYW5kcyA9IHJlZHVjZXIub3BlcmFuZHM7XG4gIFxuICB2YXIgbnVtU2NvcGVzID0gcmVkdWNlci5mdW5jdGlvbnMubGVuZ3RoICsgMTtcblxuICBzdGF0cy5hdmVyYWdlID0gY29tcHV0ZVN0YXRzKHtcbiAgICBjeWNsb21hdGljOiBzdGF0cy50b3RhbC5jeWNsb21hdGljIC8gbnVtU2NvcGVzLFxuICAgIGxsb2M6IHN0YXRzLnRvdGFsLmxsb2MgLyBudW1TY29wZXMsXG4gICAgbnVtT3BlcmFuZHM6IHN0YXRzLnRvdGFsLm51bU9wZXJhbmRzIC8gbnVtU2NvcGVzLFxuICAgIG51bU9wZXJhdG9yczogc3RhdHMudG90YWwubnVtT3BlcmF0b3JzIC8gbnVtU2NvcGVzLFxuICAgIG51bURpc3RpbmN0T3BlcmFuZHM6IHN0YXRzLnRvdGFsLm51bURpc3RpbmN0T3BlcmFuZHMgLyBudW1TY29wZXMsXG4gICAgbnVtRGlzdGluY3RPcGVyYXRvcnM6IHN0YXRzLnRvdGFsLm51bURpc3RpbmN0T3BlcmF0b3JzIC8gbnVtU2NvcGVzLFxuICB9KTtcblxuICBzdGF0cy5mdW5jdGlvbnMgPSBzdW1tYXJpemVGdW5jdGlvbnMocmVkdWNlcik7XG4gIHN0YXRzLl8gPSB7XG4gICAgYXN0IDogZGVjb3JhdGVkQXN0LFxuICAgIHJlc3VsdCA6IHJlZHVjZXIsXG4gIH07XG4gIFxuICByZXR1cm4gc3RhdHM7XG59XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZUZ1bmN0aW9ucyhyZWR1Y2VyKSB7XG4gIHJldHVybiByZWR1Y2VyLmZ1bmN0aW9ucy5tYXAoZm4gPT4ge1xuICAgIHZhciBzdGF0cyA9IGNvbXB1dGVTdGF0cyh7XG4gICAgICBjeWNsb21hdGljOiBmbi5jb21wbGV4aXR5LmJvZHkuY3ljbG9tYXRpYyxcbiAgICAgIG51bU9wZXJhdG9yczogZm4uY29tcGxleGl0eS5ib2R5Lm9wZXJhdG9ycy5sZW5ndGgsXG4gICAgICBudW1PcGVyYW5kczogZm4uY29tcGxleGl0eS5ib2R5Lm9wZXJhbmRzLmxlbmd0aCxcbiAgICAgIG51bURpc3RpbmN0T3BlcmF0b3JzOiB1bmlxKGZuLmNvbXBsZXhpdHkuYm9keS5vcGVyYXRvcnMpLmxlbmd0aCxcbiAgICAgIG51bURpc3RpbmN0T3BlcmFuZHM6IHVuaXEoZm4uY29tcGxleGl0eS5ib2R5Lm9wZXJhbmRzKS5sZW5ndGgsXG4gICAgICBsbG9jOiBmbi5jb21wbGV4aXR5LmJvZHkubGxvYyxcbiAgICB9KTtcbiAgICBzdGF0cy5vcGVyYXRvcnMgPSBmbi5jb21wbGV4aXR5LmJvZHkub3BlcmF0b3JzO1xuICAgIHN0YXRzLm9wZXJhbmRzID0gZm4uY29tcGxleGl0eS5ib2R5Lm9wZXJhbmRzO1xuICAgIHJldHVybiBzdGF0cztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTdGF0cyhzdGF0cykge1xuICB2YXIgY29tcHV0ZWQgPSB7XG4gICAgbGxvYzogc3RhdHMubGxvYyxcbiAgICBjeWNsb21hdGljOiBzdGF0cy5jeWNsb21hdGljLCBcbiAgICBudW1PcGVyYXRvcnM6IHN0YXRzLm51bU9wZXJhdG9ycyxcbiAgICBudW1PcGVyYW5kczogc3RhdHMubnVtT3BlcmFuZHMsXG4gICAgbnVtRGlzdGluY3RPcGVyYXRvcnM6IHN0YXRzLm51bURpc3RpbmN0T3BlcmF0b3JzLFxuICAgIG51bURpc3RpbmN0T3BlcmFuZHM6IHN0YXRzLm51bURpc3RpbmN0T3BlcmFuZHMsXG4gICAgdm9jYWJ1bGFyeTowLFxuICAgIGxlbmd0aDowLFxuICAgIHZvbHVtZTowLFxuICAgIGRpZmZpY3VsdHk6MCxcbiAgICBlZmZvcnQ6MCxcbiAgICB0aW1lOjAsXG4gICAgYnVnczowLFxuICAgIG1haW50YWluYWJpbGl0eTowLFxuICB9O1xuICBcbiAgY29tcHV0ZWQudm9jYWJ1bGFyeSA9IGNvbXB1dGVkLm51bURpc3RpbmN0T3BlcmFuZHMgKyBjb21wdXRlZC5udW1EaXN0aW5jdE9wZXJhdG9ycztcbiAgY29tcHV0ZWQubGVuZ3RoID0gY29tcHV0ZWQubnVtT3BlcmFuZHMgKyBjb21wdXRlZC5udW1PcGVyYXRvcnM7XG4gIGNvbXB1dGVkLnZvbHVtZSA9IGNvbXB1dGVkLmxlbmd0aCA9PT0gMCA/IDAgOiBjb21wdXRlZC5sZW5ndGggKiAoTWF0aC5sb2coY29tcHV0ZWQudm9jYWJ1bGFyeSkgLyBNYXRoLkxOMik7XG4gIGNvbXB1dGVkLmRpZmZpY3VsdHkgPSBjb21wdXRlZC5udW1EaXN0aW5jdE9wZXJhbmRzID09PSAwID8gXG4gICAgMCA6IFxuICAgIChjb21wdXRlZC5udW1EaXN0aW5jdE9wZXJhdG9ycyAvIDIpICogKGNvbXB1dGVkLm51bU9wZXJhdG9ycyAvIGNvbXB1dGVkLm51bURpc3RpbmN0T3BlcmFuZHMpO1xuICBjb21wdXRlZC5lZmZvcnQgPSBjb21wdXRlZC5kaWZmaWN1bHR5ICogY29tcHV0ZWQudm9sdW1lO1xuICBjb21wdXRlZC50aW1lID0gMTAwMCAqIChjb21wdXRlZC5lZmZvcnQgLyAxOCk7XG4gIGNvbXB1dGVkLmJ1Z3MgPSBNYXRoLnBvdyhjb21wdXRlZC5lZmZvcnQsIDIvMykgLyAzMDAwO1xuXG4gIGNvbXB1dGVkLm1haW50YWluYWJpbGl0eSA9XG4gICAgTWF0aC5taW4oMTAwLCBNYXRoLm1heCgwLCAoXG4gICAgICAgIDE3MSAtXG4gICAgICAgIDUuMiAqIE1hdGgubG9nKGNvbXB1dGVkLnZvbHVtZSkgLVxuICAgICAgICAwLjIzICogY29tcHV0ZWQuY3ljbG9tYXRpYyAtXG4gICAgICAgIDE2LjIgKiBNYXRoLmxvZyhjb21wdXRlZC5sbG9jKVxuICAgICAgKSAqIDEwMCAvIDE3MSkpO1xuICBcbiAgcmV0dXJuIGNvbXB1dGVkO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFuYWx5emVcbn07XG5cblxuXG4iXX0=