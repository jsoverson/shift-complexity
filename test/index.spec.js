
import assert from 'assert';

import complexity from '../src/';

suite('module:', function () {
  var parse = require('shift-parser').parseModule;

  function run(src) {
    return complexity.analyze(parse(src)); 
  }
  
  suite('require:', function () {
    test('analyze does not throw with valid arguments', function () {
      assert.doesNotThrow(function () {
        complexity.analyze(parse(''));
      });
    });

    test('empty function', function () {
      var report = complexity.analyze(parse('function a(){}'));
      assert.equal(report.root.lloc, 1);
      assert.equal(report.root.cyclomatic, 1);
      assert.equal(report.root.maintainability.toFixed(2), 97.76);
      assert.equal(report.functions[0].lloc, 0);
      assert.equal(report.functions[0].cyclomatic, 1);
      assert.equal(report.functions[0].maintainability.toFixed(2), 100.00);
      assert.equal(report.average.complexity, 1);
      assert.equal(report.average.functionComplexity, 1);
      assert.equal(report.average.lloc, .5);
      assert.equal(report.average.functionLloc, 0);
    });

    test('simple module', function () {
      var report = complexity.analyze(parse('if (a) {b} else {c}'));
      assert.equal(report.root.lloc, 4);
      assert.equal(report.root.cyclomatic, 2);
      assert.equal(report.average.complexity, 2);
      assert.equal(report.average.lloc, 4);
    });

    test('multi function', function () {
      var report = run(
        'function c(){ if (d) { e; } else { f; } }' +
        'function z(){ if (d) { e; } else { f; }; return true || false; }'
      );

      assert.equal(report.functions[0].lloc, 4);
      assert.equal(report.functions[0].cyclomatic, 2);
      assert.equal(report.functions[1].lloc, 5);
      assert.equal(report.functions[1].cyclomatic, 3);
      assert.equal(report.total.operators.length, 8);
      assert.equal(report.total.operands.length, 10);
      assert.equal(report.total.distinctOperators.length, 5);
      assert.equal(report.total.distinctOperands.length, 7);
      assert.equal(report.average.complexity, 6/3);
      assert.equal(report.average.functionComplexity, 2.5);
      assert.equal(report.average.lloc, 11/3);
      assert.equal(report.average.functionLloc, 4.5);
    });
    
    test('multi function2', function(){
      var src = 'if (1) {}\n' +
        'function a() {if (1) {}}\n' +
        'function b() {if (1) {}}\n' +
        'function c() {if (1) {}}\n' +
        'function d() {if (1) {}}\n';

      var report = run(src);

      assert.equal(report.average.complexity, 6/3);
      assert.equal(report.average.functionComplexity, 2);
      assert.equal(report.average.lloc, 9/5);
      assert.equal(report.average.functionLloc, 1);
      assert.equal(report.functions[0].lloc, 1);
      assert.equal(report.functions[0].cyclomatic, 2);
      assert.equal(report.functions[1].lloc, 1);
      assert.equal(report.functions[1].cyclomatic, 2);
      assert.equal(report.root.cyclomatic, 2);
      assert.equal(report.root.maintainability.toFixed(2), 74.34);
      assert.equal(report.total.operators.length, 9);
      assert.equal(report.total.operands.length, 9);
      assert.equal(report.total.distinctOperators.length, 2);
      assert.equal(report.total.distinctOperands.length, 5);
      
    });
  });
});