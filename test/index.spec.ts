/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />

import * as assert from 'assert';

import complexity from '../src/';

suite('module:', function () {
  var parse = require('shift-parser').parseModule;

  function run(src:string) {
    return complexity.analyze(parse(src)); 
  }
  
  suite('require:', function () {
    test('analyze does not throw with valid arguments', function () {
      assert.doesNotThrow(function () {
        complexity.analyze(parse(''));
      });
    });

    test('simple module', function () {
      var report = complexity.analyze(parse('if (a) {b} else {c}'));
      assert.equal(report.average.complexity, 2);
      assert.equal(report.average.lloc, 4);
    });
    
    test('multi function', function () {
      var report = run(
        'function c(){ if (d) { e; } else { f; } }' +
        'function z(){ if (d) { e; } else { f; }; return true || false; }'
      );

      assert.equal(report.average.complexity, 6/3);
      assert.equal(report.average.functionComplexity, 2.5);
      assert.equal(report.average.lloc, 9/3);
      assert.equal(report.average.functionLloc, 4.5);
      assert.equal(report.functions[0].lloc, 4);
      assert.equal(report.functions[0].cyclomatic, 2);
      assert.equal(report.functions[1].lloc, 5);
      assert.equal(report.functions[1].cyclomatic, 3);
    });
  })
});