
import assert from 'assert';

import Reducer from '../src/reducer';

suite('Complex ASTs', function () {
  'use strict';

  var parseModule = require('shift-parser').parseModule;

  var reduce = require( 'shift-reducer' ).default;

  suite('Tree reductions', function () {
    var reducer;
    
    beforeEach(function () {
      reducer = new Reducer();
    });
    
    test('ternary conditional expression assigned to variable', function () {
      var result = reduce(reducer, parseModule('var foo = true ? "bar" : "baz";'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 4);
    });

    test('nested ternary condtional expression', function () {

      var result = reduce(reducer, parseModule('var foo = true ? "bar" : (false ? "baz" : "qux");'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 3);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 6);
    });

    test('logical or expression assigned to variable', function () {

      var result = reduce(reducer, parseModule('var foo = true || false;'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('anonymous function assigned to variable', function () {
      var result = reduce(reducer, parseModule('var foo = function () { return; }'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.functions[0].name, null);
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 1);
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 2);
    });

    test('ternary condtional expression returned from function', function () {
      reduce(reducer, parseModule('function foo () { return true ? "bar" : "baz"; }'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.functions[0].name.name, 'foo');
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 1);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 4);
    });

    test('ternary condtional expression returned from function', function () {
      reduce(reducer, parseModule('function foo () { return a || b; }'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(reducer.functions[0].name.name, 'foo');
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 1);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('anonymous function returned from function', function () {
      reduce(reducer, parseModule('function a () { return function () { return; }; }'));
      assert.strictEqual(reducer.lloc, 3);
      assert.strictEqual(reducer.functions.length, 2);
      assert.strictEqual(reducer.functions[0].name, null);
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 1);
      assert.strictEqual(reducer.functions[1].name.name, 'a');
      assert.strictEqual(reducer.functions[1].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions[1].complexity.body.lloc, 1);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 2);
    });

    test('ternary condtional expression passed as argument', function () {
      var result = reduce(reducer, parseModule('a("10", true ? 10 : 8);'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 2);
      assert.strictEqual(reducer.operands.length, 5);
    });

    test('anonymous function passed as argument', function () {
      var result = reduce(reducer, parseModule('a(function () { return; }, 1000);'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(result.complexity.node.cyclomatic, 0);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('switch statement', function () {
      var result = reduce(reducer, parseModule('switch (a) { case b: true; break; case c: false; break; default: null; }'));
      assert.strictEqual(reducer.lloc, 9);
      assert.strictEqual(result.complexity.body.cyclomatic, 3);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 6);
      assert.strictEqual(reducer.operands.length, 6);
    });

    test('for...in loop', function () {
      var result = reduce(reducer, parseModule('for (var a in { b: b, c: c }) { true }'));
      assert.strictEqual(reducer.lloc, 5);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 6);
      assert.strictEqual(reducer.operands.length, 7);
    });

    test('try...catch', function () {
      var result = reduce(reducer, parseModule('try { a() } catch (e) { b(); }'));
      assert.strictEqual(reducer.lloc, 4);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('&&', function () {
      var result = reduce(reducer, parseModule('if (a && b) { }'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 2);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 2);
      assert.strictEqual(reducer.operands.length, 2);
    });

    test('||', function () {
      var result = reduce(reducer, parseModule('if (a || b) { }'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 3);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 2);
      assert.strictEqual(reducer.operands.length, 2);
    });

    test('class', function () {
      var result = reduce(reducer, parseModule('class a {b(){} c(){}}'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 2);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('generators + yield', function () {
      var result = reduce(reducer, parseModule('function* a() {yield;yield;yield}'));
      assert.strictEqual(reducer.lloc, 4);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.functions[0].name.name, 'a');
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 4);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 1);
    });

    test('template strings', function () {
      var result = reduce(reducer, parseModule('let a=tag`a${b()}c${d()}`'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 5);
      assert.strictEqual(reducer.operands.length, 4);
    });

    test('arrow expressions', function () {
      var result = reduce(reducer, parseModule('const a=x=>x*2'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.functions[0].name, undefined);
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 5);
    });

    test('multi variable assignment', function () {
      var result = reduce(reducer, parseModule('let a=1,b=2,c=3'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 4);
      assert.strictEqual(reducer.operands.length, 6);
    });

    test('terse destructuring', function () {
      var result = reduce(reducer, parseModule('let {a,b} = c'));
      assert.strictEqual(reducer.lloc, 1);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 0);
      assert.strictEqual(reducer.operators.length, 3);
      assert.strictEqual(reducer.operands.length, 3);
    });

    test('rest&spread', function () {
      reduce(reducer, parseModule('function a(b, ...c) {return d(...c)}'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(reducer.functions.length, 1);
      assert.strictEqual(reducer.operators.length, 5);
      assert.strictEqual(reducer.operands.length, 5);
    });

    test('arrow exp returning function exp', function () {
      var result = reduce(reducer, parseModule('x => function inner(){}'));
      assert.strictEqual(reducer.lloc, 2);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 2);
      assert.strictEqual(reducer.functions[0].name.name, 'inner');
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 0);
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions[1].name, undefined);
      assert.strictEqual(reducer.functions[1].complexity.body.lloc, 1);
      assert.strictEqual(reducer.functions[1].complexity.body.cyclomatic, 1);
    });

    test('multiple nested functions with varying complexity', function () {
      var result = reduce(reducer, parseModule(
        'rootFn = function outer(b,c) {' +
          'return b || c || (' +
            'x => function inner(f){' +
              'if (f) return f * x; else if (f * 2) return f' +
            '}' +
          ')' +
        '}'));
      assert.strictEqual(reducer.lloc, 8);
      assert.strictEqual(result.complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions.length, 3);
      assert.strictEqual(reducer.functions[0].name.name, 'inner');
      assert.strictEqual(reducer.functions[0].complexity.body.lloc, 5);
      assert.strictEqual(reducer.functions[0].complexity.body.cyclomatic, 3);
      assert.strictEqual(reducer.functions[0].complexity.body.operators.length, 7);
      assert.strictEqual(reducer.functions[0].complexity.body.operands.length, 7);
      assert.strictEqual(reducer.functions[1].name, undefined);
      assert.strictEqual(reducer.functions[1].complexity.body.lloc, 1);
      assert.strictEqual(reducer.functions[1].complexity.body.cyclomatic, 1);
      assert.strictEqual(reducer.functions[1].complexity.body.operators.length, 1);
      assert.strictEqual(reducer.functions[1].complexity.body.operands.length, 2);
      assert.strictEqual(reducer.functions[2].name.name, 'outer');
      assert.strictEqual(reducer.functions[2].complexity.body.lloc, 2);
      assert.strictEqual(reducer.functions[2].complexity.body.cyclomatic, 3);
      assert.strictEqual(reducer.functions[2].complexity.body.operators.length, 4);
      assert.strictEqual(reducer.functions[2].complexity.body.operands.length, 5);
      assert.strictEqual(reducer.operators.length, 14);
      assert.strictEqual(reducer.operands.length, 16);
    });

  });

});

