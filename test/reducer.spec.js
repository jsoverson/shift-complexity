
import assert from 'assert';

import Reducer from '../src/reducer';

suite('Reducer', function () {
  'use strict';

  var parseModule = require('shift-parser').parseModule;
  var parseScript = require('shift-parser').parseScript;
  
  function parse(program) {
    return parseModule(program,{loc:true}).items[0];
  }

  function parseExpression(program) {
    return parse(program).expression;
  }

  function testReduction(ast) {
    var reducer = new Reducer();
    return reducer['reduce' + ast.type](ast, ast);
  }

  suite('Reduction functions', function(){
    test('VariableDeclarationStatement', function () {
      var ast = parse('var a;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('VariableDeclaration', function () {
      var ast = parse('var a;').declaration;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.deepEqual(updated.complexity.node.operators, ['var']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('VariableDeclarator', function () {
      var ast = parse('var a;').declaration.declarators[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BindingIdentifier', function () {
      var ast = parse('var a;').declaration.declarators[0].binding;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('LiteralNumericExpression', function () {
      var ast = parseExpression('2;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, [2]);
    });

    test('LiteralStringExpression', function () {
      var ast = parseModule(';"a";').items[1].expression;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('LiteralRegExpExpression', function () {
      var ast = parseExpression('/^ab$/;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['^ab$']);
    });

    test('LiteralInfinityExpression', function () {
      var ast = parseExpression('2e308;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['2e308']);
    });

    test('LiteralNullExpression', function () {
      var ast = parseExpression('null;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, [null]);
    });

    test('LiteralBooleanExpression', function () {
      var ast = parseExpression('true;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, [true]);
    });

    test('ArrayExpression', function () {
      var ast = parseExpression('[];');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['[]']);
      assert.deepEqual(updated.complexity.node.operands, ['<array>']);
    });
    
    test('terse ArrowExpressions', function () {
      var ast = parseExpression('x => x * 2;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.deepEqual(updated.complexity.node.operators, ['=>']);
      assert.deepEqual(updated.complexity.node.operands, ['<anonymous>']);
    });

    test('verbose ArrowExpressions', function () {
      var ast = parseExpression('(x) => {return x * 2;}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['=>']);
      assert.deepEqual(updated.complexity.node.operands, ['<anonymous>']);
    });

    test('BinaryExpression:+', function () {
      var ast = parseExpression('1+2;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['+']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BinaryExpression:||', function () {
      var ast = parseExpression('1||2;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['||']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('AssignmentExpression', function () {
      var ast = parseExpression('a = 2;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('CallExpression', function () {
      var ast = parseExpression('foo()');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['()']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('CallExpression (iife case)', function () {
      var ast = parseExpression('(function(){}())');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.deepEqual(updated.complexity.node.operators, ['()']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ClassExpression + extends', function () {
      var ast = parseExpression('(class foo extends bar{})');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['class', 'extends']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ClassExpression', function () {
      var ast = parseExpression('(class foo {})');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['class']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('CompoundAssignmentExpression', function () {
      var ast = parseExpression('a+=2');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.deepEqual(updated.complexity.node.operators, ['+=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });
    
    suite('ComputedMemberExpression',function(){
      test('IdentifiedExpression', function () {
        var ast = parseExpression('x[0]');
        var updated = testReduction(ast);

        assert.strictEqual(updated.complexity.node.lloc, 0);
        assert.deepEqual(updated.complexity.node.operators, ['.']);
        assert.deepEqual(updated.complexity.node.operands, []);
      });

      test('ArrayExpression', function () {
        var updated = testReduction(parseExpression('[][0]'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });
      
      test('ObjectExpression', function () {
        var updated = testReduction(parseExpression('({})[0]'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('FunctionExpression', function () {
        var updated = testReduction(parseExpression('(function(){})[0]'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('ArrowExpression', function () {
        var updated = testReduction(parseExpression('(x=>x*2)[0]'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('ClassExpression', function () {
        var updated = testReduction(parseExpression('(class foo{})[0]'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });
    });

    test('ConditionalExpression', function () {
      var ast = parseExpression('1 ? 1 : 0;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, [':?']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ExpressionStatement', function () {
      var ast = parse('1 ? 1 : 0;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);

    });

    test('FunctionExpression', function () {
      var ast = parseExpression('(function(){})');
      var updated = testReduction(ast);
      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['function']);
      assert.deepEqual(updated.complexity.node.operands, ['<anonymous>']);
    });

    test('named FunctionExpression', function () {
      var ast = parseExpression('(function a(){})');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['function']);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('FunctionExpression (generator)', function () {
      var ast = parseExpression('(function*(){})');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['function*']);
      assert.deepEqual(updated.complexity.node.operands, ['<anonymous>']);
    });

    test('IdentifierExpression', function () {
      var ast = parseExpression('a');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });
    
    suite('NewExpression',function(){
      test('when called on an IdentifierExpression', function () {
        var ast = parseExpression('new a');
        var updated = testReduction(ast);

        assert.strictEqual(updated.complexity.node.lloc, 0);
        assert.strictEqual(updated.complexity.node.cyclomatic, 0);
        assert.deepEqual(updated.complexity.node.operators, ['new']);
        assert.deepEqual(updated.complexity.node.operands, []);
      });

      test('when called on a ClassExpression', function () {
        var updated = testReduction(parseExpression('new (class a {})'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('when called on a FunctionExpression', function () {
        var updated = testReduction(parseExpression('new (function () {})'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

    });

    test('NewTargetExpression', function () {
      var ast = parseExpression('(function() {new.target})').body.statements[0].expression;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['new.target']);
    });

    suite('StaticMemberExpression',function(){
      test('IdentifierExpression', function () {
        var ast = parseExpression('x.a');
        var updated = testReduction(ast);

        assert.strictEqual(updated.complexity.node.lloc, 0);
        assert.strictEqual(updated.complexity.node.cyclomatic, 0);
        assert.deepEqual(updated.complexity.node.operators, ['.']);
        assert.deepEqual(updated.complexity.node.operands, []);
      });

      test('ArrayExpression', function () {
        var updated = testReduction(parseExpression('[].length'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('ObjectExpression', function () {
        var updated = testReduction(parseExpression('({}).a'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('FunctionExpression', function () {
        var updated = testReduction(parseExpression('(function(){}).a'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('ArrowExpression', function () {
        var updated = testReduction(parseExpression('(x=>x*2).a'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });

      test('ClassExpression', function () {
        var updated = testReduction(parseExpression('(class foo{}).a'));
        assert.strictEqual(updated.complexity.node.lloc, 1);
      });
    });

    test('TemplateExpression', function () {
      var ast = parseExpression('``');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['``']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('TemplateElement', function () {
      var ast = parseExpression('``').elements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ThisExpression', function () {
      var ast = parseExpression('this');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['this']);
    });

    test('UnaryExpression', function () {
      var ast = parseExpression('!a');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['!']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('UpdateExpression', function () {
      var ast = parseExpression('a++');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['++']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('YieldExpression', function () {
      var ast = parse('function* a(){yield}').body.statements[0].expression;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['yield']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('YieldGeneratorExpression', function () {
      var ast = parse('function* a(){yield* b}').body.statements[0].expression;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['yield*']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ArrayBinding', function () {
      var ast = parseExpression('[a] = []').binding;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['[]=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ObjectBinding', function () {
      var ast = parseExpression('({a} = {})').binding;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['{}']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BindingPropertyIdentifier', function () {
      var ast = parseExpression('({a} = {})').binding.properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BindingPropertyIdentifier', function () {
      var ast = parseExpression('({a:a} = {})').binding.properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, [':=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BindingIdentifier', function () {
      var ast = parseExpression('({a} = {})').binding.properties[0].binding;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('BindingWithDefault', function () {
      var ast = parseExpression('[a=2]=[]').binding.elements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['=']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BlockStatement', function () {
      var ast = parse('{}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('BreakStatement', function () {
      var ast = parse('for(;;) {break}').body.block.statements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['break']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('CatchClause', function () {
      var ast = parse('try{}catch(e){}').catchClause;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['catch']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ClassDeclaration', function () {
      var ast = parse('class a{}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['class']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ClassElement', function () {
      var ast = parse('class a{b(){}}').elements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ComputedPropertyName', function () {
      var ast = parse('({["a"]:1})').expression.properties[0].name;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('DataProperty', function () {
      var ast = parse('({["a"]:1})').expression.properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, [':']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ContinueStatement', function () {
      var ast = parse('for(;;){continue}').body.block.statements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['continue']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('DebuggerStatement', function () {
      var ast = parse('debugger');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['debugger']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('DirectiveStatement', function () {
      var ast = parseModule('"use strict"').directives[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['use']);
      assert.deepEqual(updated.complexity.node.operands, ['use strict']);
    });

    test('DoWhileStatement', function () {
      var ast = parse('do{}while(true)');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 2);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['dowhile']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('EmptyStatement', function () {
      var ast = parse(';');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ExportFrom', function () {
      var ast = parse('export {} from "a"');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['export','from']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ExportAllFrom', function () {
      var ast = parse('export * from "a"');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['export','from']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('Export', function () {
      var ast = parse('export var a');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['export']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ExportDefault', function () {
      var ast = parse('export default {}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['export']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ExportSpecifier', function () {
      var ast = parse('export { a } from "b"').namedExports[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ForInStatement', function () {
      var ast = parse('for(var a in b){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['forin']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ForOfStatement', function () {
      var ast = parse('for(var a of b){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['forof']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ForStatement', function () {
      var ast = parse('for(;;){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['for']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('FormalParameters', function () {
      var ast = parse('function a(b){}').params;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('FunctionBody', function () {
      var ast = parse('function a(){}').body;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('FunctionDeclaration', function () {
      var ast = parse('function a(){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.body.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['function']);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('Getter', function () {
      var ast = parse('({get a(){}})').expression.properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['get']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('Setter', function () {
      var ast = parse('({set a(b){}})').expression.properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['set']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('IfStatement', function () {
      var ast = parse('if(a){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['if']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('IfStatement + else', function () {
      var ast = parse('if(a){}else{}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 2);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['if','else']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('Import', function () {
      var ast = parse('import a from "b";');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['import']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ImportNamespace', function () {
      var ast = parse('import * as a from "b";');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['import','import*']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ImportSpecifier', function () {
      var ast = parse('import {a} from "b";').namedImports[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['import{}']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('LabeledStatement', function () {
      var ast = parse('a:;');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['label']);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('Method', function () {
      var ast = parse('class a {b(){}}').elements[0].method;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['function']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('Module', function () {
      var ast = parseModule('');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('Script', function () {
      var ast = parseScript('');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ReturnStatement', function () {
      var ast = parse('function a() {return}').body.statements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['return']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ShorthandProperty', function () {
      var ast = parseExpression('({a})').properties[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, [':']);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('SpreadElement', function () {
      var ast = parseExpression('a(...b)').arguments[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['...']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('StaticPropertyName', function () {
      var ast = parseExpression('({a:b})').properties[0].name;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['a']);
    });

    test('Super', function () {
      var ast = parse('class a extends b{constructor(){super()}}').elements[0].method.body.statements[0].expression.callee;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 0);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, []);
      assert.deepEqual(updated.complexity.node.operands, ['super']);
    });

    test('SwitchCase', function () {
      var ast = parse('switch (a){case b:}').cases[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['case']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('SwitchDefault', function () {
      var ast = parse('switch (a){default :}').defaultCase;
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['default']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('SwitchStatement', function () {
      var ast = parse('switch (a){case b:}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['switch']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('SwitchStatementWithDefault', function () {
      var ast = parse('switch (a){default:}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['switch']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('ThrowStatement', function () {
      var ast = parse('throw a');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['throw']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('TryCatchStatement', function () {
      var ast = parse('try{}catch(e){}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['try']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('TryFinallyStatement', function () {
      var ast = parse('try{}finally{}');
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['try','finally']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('WithStatement', function () {
      var ast = parseScript('with(a){}').statements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 0);
      assert.deepEqual(updated.complexity.node.operators, ['with']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });

    test('WhileStatement', function () {
      var ast = parseScript('while(a){}').statements[0];
      var updated = testReduction(ast);

      assert.strictEqual(updated.complexity.node.lloc, 1);
      assert.strictEqual(updated.complexity.node.cyclomatic, 1);
      assert.deepEqual(updated.complexity.node.operators, ['while']);
      assert.deepEqual(updated.complexity.node.operands, []);
    });
  });
});