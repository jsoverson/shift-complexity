
var assert = require('chai').assert;
var parse = require('shift-parser').parseModule;

var complexity = require('../dist/');

function run(src) {
  return complexity.analyze(parse(src));
}

suite('module:', function () {
  suite('require:', function () {
    test('analyze function is exported', function () {
      assert.isFunction(complexity.analyze);
    });

    test('analyze does not throw with valid arguments', function () {
      assert.doesNotThrow(function () {
        complexity.analyze(parse(''));
      });
    });

    test('analyze throws when ast is string', function () {
      assert.throws(function () {
        complexity.analyze('console.log("foo");');
      });
    });

    test('analyze returns object', function () {
      assert.isObject(complexity.analyze(parse('')));
    });

    test('simple module', function () {
      var report = complexity.analyze(parse('if (a) {b} else {c}'));
      assert.equal(report.average.complexity, 2);
      assert.equal(report.average.lloc, 4);
    });
    
    test('multi function', function () {
      var report = run(
        'function c(){ if (d) { e; } else { f; } }' +
        'function z(){ if (d) { e; } else { f; } }'
      );
      assert.equal(report.average.complexity, 5/3);
      assert.equal(report.average.functionComplexity, 2);
      assert.equal(report.average.lloc, 10/3);
      assert.equal(report.average.functionLloc, 4);
    });
  })
});