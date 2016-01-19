'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function propagateStats(report, child) {
  // if we don't have a properly populated child then we're doing
  // testing on an individual reduction function
  if (!('complexity' in child)) return;

  if (!child.complexity.stats.functionType) {
    var _report$aggregate$ope, _report$aggregate$ope2;

    report.aggregate.lloc += child.complexity.stats.lloc + (child.complexity.aggregate.lloc || 0);
    report.aggregate.cyclomatic += child.complexity.stats.cyclomatic + (child.complexity.aggregate.cyclomatic || 0);
    (_report$aggregate$ope = report.aggregate.operators).push.apply(_report$aggregate$ope, _toConsumableArray(child.complexity.stats.operators).concat(_toConsumableArray(child.complexity.aggregate.operators)));
    (_report$aggregate$ope2 = report.aggregate.operands).push.apply(_report$aggregate$ope2, _toConsumableArray(child.complexity.stats.operands).concat(_toConsumableArray(child.complexity.aggregate.operands)));
  }
}

function isFunctionType(type) {
  switch (type) {
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowExpression':
    case 'Method':
      return true;
  }
  return false;
}

function isRootType(type) {
  switch (type) {
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowExpression':
    case 'Method':
    case 'Module':
    case 'Script':
      return true;
  }
  return false;
}

var ComplexityReducer = function () {
  function ComplexityReducer() {
    _classCallCheck(this, ComplexityReducer);

    this.lloc = 0;
    this.operators = [];
    this.operands = [];
    this.functions = [];
  }

  _createClass(ComplexityReducer, [{
    key: 'updateStats',
    value: function updateStats(node, children, stats) {

      var report = {
        aggregate: {
          lloc: 0,
          cyclomatic: 0,
          operators: [],
          operands: []
        },
        stats: {
          type: node.type,
          lloc: 0,
          cyclomatic: 0,
          operators: [],
          operands: [],
          rootType: isRootType(node.type),
          functionType: isFunctionType(node.type)
        }
      };

      for (var i = 0; i < children.length; i++) {
        var childProp = children[i];
        // istanbul ignore next
        if (!(childProp in node)) throw new Error('Invalid child property specified: ' + node.type + '[' + childProp + ']');
        var child = node[childProp];

        if (!child) continue;

        if (Array.isArray(child)) {
          child.forEach(function (_) {
            return propagateStats(report, _);
          });
        } else {
          propagateStats(report, child);
        }
      }

      this.lloc += stats[0];
      report.stats.lloc += stats[0];
      report.stats.cyclomatic += stats[1];

      if (report.stats.functionType) {
        this.functions.push(node);
      }

      if (stats[2]) {
        var _report$stats$operato, _operators;

        (_report$stats$operato = report.stats.operators).push.apply(_report$stats$operato, _toConsumableArray(stats[2]));
        (_operators = this.operators).push.apply(_operators, _toConsumableArray(stats[2]));
      }

      if (stats[3]) {
        var _report$stats$operand, _operands;

        (_report$stats$operand = report.stats.operands).push.apply(_report$stats$operand, _toConsumableArray(stats[3]));
        (_operands = this.operands).push.apply(_operands, _toConsumableArray(stats[3]));
      }

      if (report.stats.rootType) {
        // every path starts at 1 cyclomatic, so add our missing 1
        report.stats.cyclomatic++;
        report.aggregate.cyclomatic += report.stats.cyclomatic;
        //report.aggregate.lloc += report.stats.lloc;
        //report.aggregate.operators.push(...report.stats.operators);
        //report.aggregate.operands.push(...report.stats.operands);
      }

      node.complexity = report;

      return node;
    }
  }, {
    key: 'reduceArrayBinding',
    value: function reduceArrayBinding(node, state) {
      return this.updateStats(state, ['elements'], [0, 0, ['[]='], []]);
    }
  }, {
    key: 'reduceArrayExpression',
    value: function reduceArrayExpression(node, state) {
      return this.updateStats(state, ['elements'], [0, 0, ['[]'], ['<array>']]);
    }
  }, {
    key: 'reduceArrowExpression',
    value: function reduceArrowExpression(node, state) {
      var lloc = node.body.type === 'FunctionBody' ? 0 : 1;
      return this.updateStats(state, ['params', 'body'], [lloc, 0, ['=>'], ['<anonymous>']]);
    }
  }, {
    key: 'reduceAssignmentExpression',
    value: function reduceAssignmentExpression(node, state) {
      return this.updateStats(state, ['binding', 'expression'], [0, 0, ['='], []]);
    }
  }, {
    key: 'reduceBinaryExpression',
    value: function reduceBinaryExpression(node, state) {
      return this.updateStats(state, ['left', 'right'], [0, node.operator === '||' ? 1 : 0, [node.operator], []]);
    }
  }, {
    key: 'reduceBindingIdentifier',
    value: function reduceBindingIdentifier(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, [node.name]]);
    }
  }, {
    key: 'reduceBindingPropertyIdentifier',
    value: function reduceBindingPropertyIdentifier(node, state) {
      return this.updateStats(state, ['binding', 'init'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceBindingPropertyProperty',
    value: function reduceBindingPropertyProperty(node, state) {
      return this.updateStats(state, ['name', 'binding'], [0, 0, [':='], []]);
    }
  }, {
    key: 'reduceBindingWithDefault',
    value: function reduceBindingWithDefault(node, state) {
      return this.updateStats(state, ['init', 'binding'], [0, 0, ['='], []]);
    }
  }, {
    key: 'reduceBlock',
    value: function reduceBlock(node, state) {
      return this.updateStats(state, ['statements'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceBlockStatement',
    value: function reduceBlockStatement(node, state) {
      return this.updateStats(state, ['block'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceBreakStatement',
    value: function reduceBreakStatement(node, state) {
      return this.updateStats(state, ['label'], [1, 0, ['break'], []]);
    }
  }, {
    key: 'reduceCallExpression',
    value: function reduceCallExpression(node, state) {
      var lloc = node.callee.type === 'FunctionExpression' ? 1 : 0;
      return this.updateStats(state, ['callee', 'arguments'], [lloc, 0, ['()'], []]);
    }
  }, {
    key: 'reduceCatchClause',
    value: function reduceCatchClause(node, state) {
      return this.updateStats(state, ['binding', 'body'], [1, 1, ['catch'], []]);
    }
  }, {
    key: 'reduceClassDeclaration',
    value: function reduceClassDeclaration(node, state) {
      return this.updateStats(state, ['name', 'super', 'elements'], [0, 0, ['class'], []]);
    }
  }, {
    key: 'reduceClassElement',
    value: function reduceClassElement(node, state) {
      return this.updateStats(state, ['method'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceClassExpression',
    value: function reduceClassExpression(node, state) {
      return this.updateStats(state, ['name', 'super', 'elements'], [0, 0, node.super ? ['class', 'extends'] : ['class'], []]);
    }
  }, {
    key: 'reduceCompoundAssignmentExpression',
    value: function reduceCompoundAssignmentExpression(node, state) {
      return this.updateStats(state, ['binding', 'expression'], [0, 0, [node.operator], []]);
    }
  }, {
    key: 'reduceComputedMemberExpression',
    value: function reduceComputedMemberExpression(node, state) {
      var onExtendedExpression = ['ArrowExpression', 'FunctionExpression', 'ArrayExpression', 'ObjectExpression', 'ClassExpression'].indexOf(node.object.type) > -1;
      return this.updateStats(state, ['object', 'expression'], [onExtendedExpression ? 1 : 0, 0, ['.'], null]);
    }
  }, {
    key: 'reduceComputedPropertyName',
    value: function reduceComputedPropertyName(node, state) {
      return this.updateStats(state, ['expression'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceConditionalExpression',
    value: function reduceConditionalExpression(node, state) {
      return this.updateStats(state, ['test', 'consequent', 'alternate'], [0, 1, [':?'], []]);
    }
  }, {
    key: 'reduceContinueStatement',
    value: function reduceContinueStatement(node, state) {
      return this.updateStats(state, ['label'], [1, 0, ['continue'], []]);
    }
  }, {
    key: 'reduceDataProperty',
    value: function reduceDataProperty(node, state) {
      return this.updateStats(state, ['name', 'expression'], [1, 0, [':'], []]);
    }
  }, {
    key: 'reduceDebuggerStatement',
    value: function reduceDebuggerStatement(node, state) {
      return this.updateStats(state, [], [1, 0, ['debugger'], []]);
    }
  }, {
    key: 'reduceDirective',
    value: function reduceDirective(node, state) {
      return this.updateStats(state, [], [0, 0, ['use'], [node.rawValue]]);
    }
  }, {
    key: 'reduceDoWhileStatement',
    value: function reduceDoWhileStatement(node, state) {
      return this.updateStats(state, ['body', 'test'], [2, 1, ['dowhile'], []]);
    }
  }, {
    key: 'reduceEmptyStatement',
    value: function reduceEmptyStatement(node, state) {
      return this.updateStats(state, [], [0, 0, [], []]);
    }
  }, {
    key: 'reduceExport',
    value: function reduceExport(node, state) {
      return this.updateStats(state, ['declaration'], [0, 0, ['export'], []]);
    }
  }, {
    key: 'reduceExportAllFrom',
    value: function reduceExportAllFrom(node, state) {
      return this.updateStats(state, [], [0, 0, ['export', 'from'], []]);
    }
  }, {
    key: 'reduceExportDefault',
    value: function reduceExportDefault(node, state) {
      return this.updateStats(state, ['body'], [0, 0, ['export'], []]);
    }
  }, {
    key: 'reduceExportFrom',
    value: function reduceExportFrom(node, state) {
      return this.updateStats(state, [], [0, 0, ['export', 'from'], null]);
    }
  }, {
    key: 'reduceExportSpecifier',
    value: function reduceExportSpecifier(node, state) {
      return this.updateStats(state, [], [0, 0, [], []]);
    }
  }, {
    key: 'reduceExpressionStatement',
    value: function reduceExpressionStatement(node, state) {
      return this.updateStats(state, ['expression'], [1, 0, [], []]);
    }
  }, {
    key: 'reduceForInStatement',
    value: function reduceForInStatement(node, state) {
      return this.updateStats(state, ['left', 'right', 'body'], [1, 1, ['forin'], []]);
    }
  }, {
    key: 'reduceForOfStatement',
    value: function reduceForOfStatement(node, state) {
      return this.updateStats(state, ['left', 'right', 'body'], [1, 1, ['forof'], []]);
    }
  }, {
    key: 'reduceForStatement',
    value: function reduceForStatement(node, state) {
      return this.updateStats(state, ['init', 'test', 'update', 'body'], [1, 1, ['for'], []]);
    }
  }, {
    key: 'reduceFormalParameters',
    value: function reduceFormalParameters(node, state) {
      return this.updateStats(state, ['items', 'rest'], [0, 0, node.rest ? ['...'] : undefined, null]);
    }
  }, {
    key: 'reduceFunctionBody',
    value: function reduceFunctionBody(node, state) {
      return this.updateStats(state, ['statements'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceFunctionDeclaration',
    value: function reduceFunctionDeclaration(node, state) {
      return this.updateStats(state, ['name', 'params', 'body'], [1, 0, [node.isGenerator ? 'function*' : 'function'], null]);
    }
  }, {
    key: 'reduceFunctionExpression',
    value: function reduceFunctionExpression(node, state) {
      return this.updateStats(state, ['name', 'params', 'body'], [0, 0, [node.isGenerator ? 'function*' : 'function'], node.name ? undefined : ['<anonymous>']]);
    }
  }, {
    key: 'reduceGetter',
    value: function reduceGetter(node, state) {
      return this.updateStats(state, ['name', 'body'], [1, 0, ['get'], []]);
    }
  }, {
    key: 'reduceIdentifierExpression',
    value: function reduceIdentifierExpression(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, [node.name]]);
    }
  }, {
    key: 'reduceIfStatement',
    value: function reduceIfStatement(node, state) {
      var alt = node.alternate;
      return this.updateStats(state, ['test', 'consequent', 'alternate'], [alt ? 2 : 1, 1, alt ? ['if', 'else'] : ['if'], null]);
    }
  }, {
    key: 'reduceImport',
    value: function reduceImport(node, state) {
      return this.updateStats(state, ['defaultBinding', 'namedImports'], [1, 0, ['import'], []]);
    }
  }, {
    key: 'reduceImportNamespace',
    value: function reduceImportNamespace(node, state) {
      return this.updateStats(state, ['defaultBinding', 'namespaceBinding'], [1, 0, ['import', 'import*'], null]);
    }
  }, {
    key: 'reduceImportSpecifier',
    value: function reduceImportSpecifier(node, state) {
      return this.updateStats(state, ['binding'], [0, 0, ['import{}'], []]);
    }
  }, {
    key: 'reduceLabeledStatement',
    value: function reduceLabeledStatement(node, state) {
      return this.updateStats(state, ['body'], [0, 0, ['label'], [node.label]]);
    }
  }, {
    key: 'reduceLiteralBooleanExpression',
    value: function reduceLiteralBooleanExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [node.value]]);
    }
  }, {
    key: 'reduceLiteralInfinityExpression',
    value: function reduceLiteralInfinityExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [2e308]]);
    }
  }, {
    key: 'reduceLiteralNullExpression',
    value: function reduceLiteralNullExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [null]]);
    }
  }, {
    key: 'reduceLiteralNumericExpression',
    value: function reduceLiteralNumericExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [node.value]]);
    }
  }, {
    key: 'reduceLiteralRegExpExpression',
    value: function reduceLiteralRegExpExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [node.pattern]]);
    }
  }, {
    key: 'reduceLiteralStringExpression',
    value: function reduceLiteralStringExpression(node, state) {
      return this.updateStats(state, [], [0, 0, null, [node.value]]);
    }
  }, {
    key: 'reduceMethod',
    value: function reduceMethod(node, state) {
      return this.updateStats(state, ['name', 'params', 'body'], [1, 0, ['function'], []]);
    }
  }, {
    key: 'reduceModule',
    value: function reduceModule(node, state) {
      return this.updateStats(state, ['items'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceNewExpression',
    value: function reduceNewExpression(node, state) {
      var onExtendedExpression = ['FunctionExpression', 'ClassExpression'].indexOf(node.callee.type) > -1;
      return this.updateStats(state, ['callee', 'arguments'], [onExtendedExpression ? 1 : 0, 0, ['new'], null]);
    }
  }, {
    key: 'reduceNewTargetExpression',
    value: function reduceNewTargetExpression(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, ['new.target']]);
    }
  }, {
    key: 'reduceObjectBinding',
    value: function reduceObjectBinding(node, state) {
      return this.updateStats(state, ['properties'], [0, 0, ['{}'], []]);
    }
  }, {
    key: 'reduceObjectExpression',
    value: function reduceObjectExpression(node, state) {
      return this.updateStats(state, ['properties'], [0, 0, ['{}'], ['<object>']]);
    }
  }, {
    key: 'reduceReturnStatement',
    value: function reduceReturnStatement(node, state) {
      return this.updateStats(state, ['expression'], [1, 0, ['return'], []]);
    }
  }, {
    key: 'reduceScript',
    value: function reduceScript(node, state) {
      return this.updateStats(state, ['statements'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceSetter',
    value: function reduceSetter(node, state) {
      return this.updateStats(state, ['name', 'param', 'body'], [1, 0, ['set'], []]);
    }
  }, {
    key: 'reduceShorthandProperty',
    value: function reduceShorthandProperty(node, state) {
      return this.updateStats(state, [], [1, 0, [':'], [node.name]]);
    }
  }, {
    key: 'reduceSpreadElement',
    value: function reduceSpreadElement(node, state) {
      return this.updateStats(state, ['expression'], [0, 0, ['...'], []]);
    }
  }, {
    key: 'reduceStaticMemberExpression',
    value: function reduceStaticMemberExpression(node, state) {
      var onExtendedExpression = ['ArrowExpression', 'FunctionExpression', 'ArrayExpression', 'ObjectExpression', 'ClassExpression'].indexOf(node.object.type) > -1;
      return this.updateStats(state, ['object'], [onExtendedExpression ? 1 : 0, 0, ['.'], []]);
    }
  }, {
    key: 'reduceStaticPropertyName',
    value: function reduceStaticPropertyName(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, [node.value]]);
    }
  }, {
    key: 'reduceSuper',
    value: function reduceSuper(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, ['super']]);
    }
  }, {
    key: 'reduceSwitchCase',
    value: function reduceSwitchCase(node, state) {
      return this.updateStats(state, ['test', 'consequent'], [1, 1, ['case'], []]);
    }
  }, {
    key: 'reduceSwitchDefault',
    value: function reduceSwitchDefault(node, state) {
      return this.updateStats(state, ['consequent'], [1, 0, ['default'], []]);
    }
  }, {
    key: 'reduceSwitchStatement',
    value: function reduceSwitchStatement(node, state) {
      return this.updateStats(state, ['discriminant', 'cases'], [1, 0, ['switch'], []]);
    }
  }, {
    key: 'reduceSwitchStatementWithDefault',
    value: function reduceSwitchStatementWithDefault(node, state) {
      return this.updateStats(state, ['discriminant', 'preDefaultCases', 'defaultCase', 'postDefaultCases'], [1, 0, ['switch'], []]);
    }
  }, {
    key: 'reduceTemplateElement',
    value: function reduceTemplateElement(node, state) {
      return this.updateStats(state, [], [0, 0, null, null]);
    }
  }, {
    key: 'reduceTemplateExpression',
    value: function reduceTemplateExpression(node, state) {
      return this.updateStats(state, ['tag', 'elements'], [0, 0, ['``'], []]);
    }
  }, {
    key: 'reduceThisExpression',
    value: function reduceThisExpression(node, state) {
      return this.updateStats(state, [], [0, 0, undefined, ['this']]);
    }
  }, {
    key: 'reduceThrowStatement',
    value: function reduceThrowStatement(node, state) {
      return this.updateStats(state, ['expression'], [1, 0, ['throw'], []]);
    }
  }, {
    key: 'reduceTryCatchStatement',
    value: function reduceTryCatchStatement(node, state) {
      return this.updateStats(state, ['body', 'catchClause'], [1, 0, ['try'], []]);
    }
  }, {
    key: 'reduceTryFinallyStatement',
    value: function reduceTryFinallyStatement(node, state) {
      return this.updateStats(state, ['body', 'catchClause', 'finalizer'], [1, 0, ['try', 'finally'], null]);
    }
  }, {
    key: 'reduceUnaryExpression',
    value: function reduceUnaryExpression(node, state) {
      return this.updateStats(state, ['operand'], [0, 0, [node.operator], []]);
    }
  }, {
    key: 'reduceUpdateExpression',
    value: function reduceUpdateExpression(node, state) {
      return this.updateStats(state, ['operand'], [1, 0, [node.operator], []]);
    }
  }, {
    key: 'reduceVariableDeclaration',
    value: function reduceVariableDeclaration(node, state) {
      return this.updateStats(state, ['declarators'], [1, 0, ['var'], []]);
    }
  }, {
    key: 'reduceVariableDeclarationStatement',
    value: function reduceVariableDeclarationStatement(node, state) {
      return this.updateStats(state, ['declaration'], [0, 0, [], []]);
    }
  }, {
    key: 'reduceVariableDeclarator',
    value: function reduceVariableDeclarator(node, state) {
      return this.updateStats(state, ['binding', 'init'], [0, 0, ['='], []]);
    }
  }, {
    key: 'reduceWhileStatement',
    value: function reduceWhileStatement(node, state) {
      return this.updateStats(state, ['test', 'body'], [1, 1, ['while'], []]);
    }
  }, {
    key: 'reduceWithStatement',
    value: function reduceWithStatement(node, state) {
      return this.updateStats(state, ['object', 'body'], [1, 0, ['with'], []]);
    }
  }, {
    key: 'reduceYieldExpression',
    value: function reduceYieldExpression(node, state) {
      return this.updateStats(state, ['expression'], [0, 1, ['yield'], []]);
    }
  }, {
    key: 'reduceYieldGeneratorExpression',
    value: function reduceYieldGeneratorExpression(node, state) {
      return this.updateStats(state, ['expression'], [0, 0, ['yield*'], []]);
    }
  }]);

  return ComplexityReducer;
}();

exports.default = ComplexityReducer;
//# sourceMappingURL=data:application/json;base64,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QyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3pFOzs7d0NBRW1CLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDL0IsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzFFOzs7MENBRXFCLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDakMsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdkU7OzttREFFOEIsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUMxQyxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN4RTs7O1NBL2FHLGlCQUFpQjs7O2tCQW1iUixpQkFBaUIiLCJmaWxlIjoicmVkdWNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuZnVuY3Rpb24gcHJvcGFnYXRlU3RhdHMocmVwb3J0LCBjaGlsZCkge1xuICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgcHJvcGVybHkgcG9wdWxhdGVkIGNoaWxkIHRoZW4gd2UncmUgZG9pbmdcbiAgLy8gdGVzdGluZyBvbiBhbiBpbmRpdmlkdWFsIHJlZHVjdGlvbiBmdW5jdGlvblxuICBpZiAoISgnY29tcGxleGl0eScgaW4gY2hpbGQpKSByZXR1cm47XG5cbiAgaWYgKCFjaGlsZC5jb21wbGV4aXR5LnN0YXRzLmZ1bmN0aW9uVHlwZSkge1xuICAgIHJlcG9ydC5hZ2dyZWdhdGUubGxvYyArPVxuICAgICAgY2hpbGQuY29tcGxleGl0eS5zdGF0cy5sbG9jICsgKGNoaWxkLmNvbXBsZXhpdHkuYWdncmVnYXRlLmxsb2MgfHwgMCk7XG4gICAgcmVwb3J0LmFnZ3JlZ2F0ZS5jeWNsb21hdGljICs9XG4gICAgICBjaGlsZC5jb21wbGV4aXR5LnN0YXRzLmN5Y2xvbWF0aWMgKyAoY2hpbGQuY29tcGxleGl0eS5hZ2dyZWdhdGUuY3ljbG9tYXRpYyB8fCAwKTtcbiAgICByZXBvcnQuYWdncmVnYXRlLm9wZXJhdG9ycy5wdXNoKFxuICAgICAgLi4uY2hpbGQuY29tcGxleGl0eS5zdGF0cy5vcGVyYXRvcnMsXG4gICAgICAuLi5jaGlsZC5jb21wbGV4aXR5LmFnZ3JlZ2F0ZS5vcGVyYXRvcnMpO1xuICAgIHJlcG9ydC5hZ2dyZWdhdGUub3BlcmFuZHMucHVzaChcbiAgICAgIC4uLmNoaWxkLmNvbXBsZXhpdHkuc3RhdHMub3BlcmFuZHMsXG4gICAgICAuLi5jaGlsZC5jb21wbGV4aXR5LmFnZ3JlZ2F0ZS5vcGVyYW5kcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvblR5cGUodHlwZSkge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnRnVuY3Rpb25EZWNsYXJhdGlvbic6XG4gIGNhc2UgJ0Z1bmN0aW9uRXhwcmVzc2lvbic6XG4gIGNhc2UgJ0Fycm93RXhwcmVzc2lvbic6XG4gIGNhc2UgJ01ldGhvZCc6XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1Jvb3RUeXBlKHR5cGUpIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gIGNhc2UgJ0Z1bmN0aW9uRGVjbGFyYXRpb24nOlxuICBjYXNlICdGdW5jdGlvbkV4cHJlc3Npb24nOlxuICBjYXNlICdBcnJvd0V4cHJlc3Npb24nOlxuICBjYXNlICdNZXRob2QnOlxuICBjYXNlICdNb2R1bGUnOlxuICBjYXNlICdTY3JpcHQnOlxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuY2xhc3MgQ29tcGxleGl0eVJlZHVjZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGxvYyA9IDA7XG4gICAgdGhpcy5vcGVyYXRvcnMgPSBbXTtcbiAgICB0aGlzLm9wZXJhbmRzID0gW107XG4gICAgdGhpcy5mdW5jdGlvbnMgPSBbXTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRzKG5vZGUsIGNoaWxkcmVuLCBzdGF0cykge1xuXG4gICAgdmFyIHJlcG9ydCA9IHtcbiAgICAgIGFnZ3JlZ2F0ZToge1xuICAgICAgICBsbG9jOiAwLFxuICAgICAgICBjeWNsb21hdGljOiAwLFxuICAgICAgICBvcGVyYXRvcnM6IFtdLFxuICAgICAgICBvcGVyYW5kczogW11cbiAgICAgIH0sXG4gICAgICBzdGF0czoge1xuICAgICAgICB0eXBlOiBub2RlLnR5cGUsXG4gICAgICAgIGxsb2M6IDAsXG4gICAgICAgIGN5Y2xvbWF0aWM6IDAsXG4gICAgICAgIG9wZXJhdG9yczogW10sXG4gICAgICAgIG9wZXJhbmRzOiBbXSxcbiAgICAgICAgcm9vdFR5cGU6IGlzUm9vdFR5cGUobm9kZS50eXBlKSxcbiAgICAgICAgZnVuY3Rpb25UeXBlOiBpc0Z1bmN0aW9uVHlwZShub2RlLnR5cGUpXG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBjaGlsZFByb3AgPSBjaGlsZHJlbltpXTtcbiAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICBpZiAoIShjaGlsZFByb3AgaW4gbm9kZSkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGlsZCBwcm9wZXJ0eSBzcGVjaWZpZWQ6ICcgKyBub2RlLnR5cGUgKyAnWycgKyBjaGlsZFByb3AgKyAnXScpO1xuICAgICAgbGV0IGNoaWxkID0gbm9kZVtjaGlsZFByb3BdO1xuXG4gICAgICBpZiAoIWNoaWxkKSBjb250aW51ZTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XG4gICAgICAgIGNoaWxkLmZvckVhY2goXyA9PiBwcm9wYWdhdGVTdGF0cyhyZXBvcnQsIF8pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb3BhZ2F0ZVN0YXRzKHJlcG9ydCwgY2hpbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubGxvYyArPSBzdGF0c1swXTtcbiAgICByZXBvcnQuc3RhdHMubGxvYyArPSBzdGF0c1swXTtcbiAgICByZXBvcnQuc3RhdHMuY3ljbG9tYXRpYyArPSBzdGF0c1sxXTtcblxuICAgIGlmIChyZXBvcnQuc3RhdHMuZnVuY3Rpb25UeXBlKSB7XG4gICAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKG5vZGUpO1xuICAgIH1cblxuICAgIGlmIChzdGF0c1syXSkge1xuICAgICAgcmVwb3J0LnN0YXRzLm9wZXJhdG9ycy5wdXNoKC4uLnN0YXRzWzJdKTtcbiAgICAgIHRoaXMub3BlcmF0b3JzLnB1c2goLi4uc3RhdHNbMl0pO1xuICAgIH1cblxuICAgIGlmIChzdGF0c1szXSkge1xuICAgICAgcmVwb3J0LnN0YXRzLm9wZXJhbmRzLnB1c2goLi4uc3RhdHNbM10pO1xuICAgICAgdGhpcy5vcGVyYW5kcy5wdXNoKC4uLnN0YXRzWzNdKTtcbiAgICB9XG5cbiAgICBpZiAocmVwb3J0LnN0YXRzLnJvb3RUeXBlKSB7XG4gICAgICAvLyBldmVyeSBwYXRoIHN0YXJ0cyBhdCAxIGN5Y2xvbWF0aWMsIHNvIGFkZCBvdXIgbWlzc2luZyAxXG4gICAgICByZXBvcnQuc3RhdHMuY3ljbG9tYXRpYysrO1xuICAgICAgcmVwb3J0LmFnZ3JlZ2F0ZS5jeWNsb21hdGljICs9IHJlcG9ydC5zdGF0cy5jeWNsb21hdGljO1xuICAgICAgLy9yZXBvcnQuYWdncmVnYXRlLmxsb2MgKz0gcmVwb3J0LnN0YXRzLmxsb2M7XG4gICAgICAvL3JlcG9ydC5hZ2dyZWdhdGUub3BlcmF0b3JzLnB1c2goLi4ucmVwb3J0LnN0YXRzLm9wZXJhdG9ycyk7XG4gICAgICAvL3JlcG9ydC5hZ2dyZWdhdGUub3BlcmFuZHMucHVzaCguLi5yZXBvcnQuc3RhdHMub3BlcmFuZHMpO1xuICAgIH1cblxuICAgIG5vZGUuY29tcGxleGl0eSA9IHJlcG9ydDtcblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcmVkdWNlQXJyYXlCaW5kaW5nKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZWxlbWVudHMnXSwgWzAsIDAsIFsnW109J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VBcnJheUV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydlbGVtZW50cyddLCBbMCwgMCwgWydbXSddLCBbJzxhcnJheT4nXV0pO1xuICB9XG5cbiAgcmVkdWNlQXJyb3dFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIGxsb2MgPSBub2RlLmJvZHkudHlwZSA9PT0gJ0Z1bmN0aW9uQm9keScgPyAwIDogMTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydwYXJhbXMnLCAnYm9keSddLCBbbGxvYywgMCwgWyc9PiddLCBbJzxhbm9ueW1vdXM+J11dKTtcbiAgfVxuXG4gIHJlZHVjZUFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmluZGluZycsICdleHByZXNzaW9uJ10sIFswLCAwLCBbJz0nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJpbmFyeUV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydsZWZ0JywgJ3JpZ2h0J10sIFswLCBub2RlLm9wZXJhdG9yID09PSAnfHwnID8gMSA6IDAsIFtub2RlLm9wZXJhdG9yXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJpbmRpbmdJZGVudGlmaWVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbbm9kZS5uYW1lXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JpbmRpbmcnLCAnaW5pdCddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnYmluZGluZyddLCBbMCwgMCwgWyc6PSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluZGluZ1dpdGhEZWZhdWx0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnaW5pdCcsICdiaW5kaW5nJ10sIFswLCAwLCBbJz0nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnc3RhdGVtZW50cyddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VCbG9ja1N0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2Jsb2NrJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJyZWFrU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbGFiZWwnXSwgWzEsIDAsIFsnYnJlYWsnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNhbGxFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIGxsb2MgPSBub2RlLmNhbGxlZS50eXBlID09PSAnRnVuY3Rpb25FeHByZXNzaW9uJyA/IDEgOiAwO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2NhbGxlZScsICdhcmd1bWVudHMnXSwgW2xsb2MsIDAsIFsnKCknXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNhdGNoQ2xhdXNlKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmluZGluZycsICdib2R5J10sIFsxLCAxLCBbJ2NhdGNoJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VDbGFzc0RlY2xhcmF0aW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdzdXBlcicsICdlbGVtZW50cyddLCBbMCwgMCwgWydjbGFzcyddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2xhc3NFbGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbWV0aG9kJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNsYXNzRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnc3VwZXInLCAnZWxlbWVudHMnXSwgWzAsIDAsIG5vZGUuc3VwZXIgPyBbJ2NsYXNzJywgJ2V4dGVuZHMnXSA6IFsnY2xhc3MnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2V4cHJlc3Npb24nXSwgWzAsIDAsIFtub2RlLm9wZXJhdG9yXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHZhciBvbkV4dGVuZGVkRXhwcmVzc2lvbiA9IFtcbiAgICAgICdBcnJvd0V4cHJlc3Npb24nLCAnRnVuY3Rpb25FeHByZXNzaW9uJywgJ0FycmF5RXhwcmVzc2lvbicsICdPYmplY3RFeHByZXNzaW9uJywgJ0NsYXNzRXhwcmVzc2lvbidcbiAgICBdLmluZGV4T2Yobm9kZS5vYmplY3QudHlwZSkgPiAtMTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvYmplY3QnLCAnZXhwcmVzc2lvbiddLCBbb25FeHRlbmRlZEV4cHJlc3Npb24gPyAxIDogMCwgMCwgWycuJ10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUNvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VDb25kaXRpb25hbEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0ZXN0JywgJ2NvbnNlcXVlbnQnLCAnYWx0ZXJuYXRlJ10sIFswLCAxLCBbJzo/J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VDb250aW51ZVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xhYmVsJ10sIFsxLCAwLCBbJ2NvbnRpbnVlJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VEYXRhUHJvcGVydHkobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ2V4cHJlc3Npb24nXSwgWzEsIDAsIFsnOiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRGVidWdnZXJTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFsxLCAwLCBbJ2RlYnVnZ2VyJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VEaXJlY3RpdmUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBbJ3VzZSddLCBbbm9kZS5yYXdWYWx1ZV1dKTtcbiAgfVxuXG4gIHJlZHVjZURvV2hpbGVTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydib2R5JywgJ3Rlc3QnXSwgWzIsIDEsIFsnZG93aGlsZSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRW1wdHlTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUV4cG9ydChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2RlY2xhcmF0aW9uJ10sIFswLCAwLCBbJ2V4cG9ydCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0QWxsRnJvbShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFsnZXhwb3J0JywgJ2Zyb20nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUV4cG9ydERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydib2R5J10sIFswLCAwLCBbJ2V4cG9ydCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0RnJvbShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFsnZXhwb3J0JywgJ2Zyb20nXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0U3BlY2lmaWVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMSwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VGb3JJblN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xlZnQnLCAncmlnaHQnLCAnYm9keSddLCBbMSwgMSwgWydmb3JpbiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRm9yT2ZTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydsZWZ0JywgJ3JpZ2h0JywgJ2JvZHknXSwgWzEsIDEsIFsnZm9yb2YnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUZvclN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2luaXQnLCAndGVzdCcsICd1cGRhdGUnLCAnYm9keSddLCBbMSwgMSwgWydmb3InXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUZvcm1hbFBhcmFtZXRlcnMobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydpdGVtcycsICdyZXN0J10sIFswLCAwLCBub2RlLnJlc3QgPyBbJy4uLiddIDogdW5kZWZpbmVkLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VGdW5jdGlvbkJvZHkobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydzdGF0ZW1lbnRzJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3BhcmFtcycsICdib2R5J10sIFsxLCAwLCBbbm9kZS5pc0dlbmVyYXRvciA/ICdmdW5jdGlvbionIDogJ2Z1bmN0aW9uJ10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAncGFyYW1zJywgJ2JvZHknXSwgWzAsIDAsIFtub2RlLmlzR2VuZXJhdG9yID8gJ2Z1bmN0aW9uKicgOiAnZnVuY3Rpb24nXSwgbm9kZS5uYW1lID8gdW5kZWZpbmVkIDogWyc8YW5vbnltb3VzPiddXSk7XG4gIH1cblxuICByZWR1Y2VHZXR0ZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ2JvZHknXSwgWzEsIDAsIFsnZ2V0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgW25vZGUubmFtZV1dKTtcbiAgfVxuXG4gIHJlZHVjZUlmU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIGFsdCA9IG5vZGUuYWx0ZXJuYXRlO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3Rlc3QnLCAnY29uc2VxdWVudCcsICdhbHRlcm5hdGUnXSwgW2FsdCA/IDIgOiAxLCAxLCBhbHQgPyBbJ2lmJywgJ2Vsc2UnXSA6IFsnaWYnXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlSW1wb3J0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVmYXVsdEJpbmRpbmcnLCAnbmFtZWRJbXBvcnRzJ10sIFsxLCAwLCBbJ2ltcG9ydCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlSW1wb3J0TmFtZXNwYWNlKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVmYXVsdEJpbmRpbmcnLCAnbmFtZXNwYWNlQmluZGluZyddLCBbMSwgMCwgWydpbXBvcnQnLCAnaW1wb3J0KiddLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnRTcGVjaWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJ10sIFswLCAwLCBbJ2ltcG9ydHt9J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VMYWJlbGVkU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYm9keSddLCBbMCwgMCwgWydsYWJlbCddLCBbbm9kZS5sYWJlbF1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIG51bGwsIFtub2RlLnZhbHVlXV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIG51bGwsIFsyZTMwOF1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxOdWxsRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIG51bGwsIFtudWxsXV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIG51bGwsIFtub2RlLnBhdHRlcm5dXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIG51bGwsIFtub2RlLnZhbHVlXV0pO1xuICB9XG5cbiAgcmVkdWNlTWV0aG9kKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdwYXJhbXMnLCAnYm9keSddLCBbMSwgMCwgWydmdW5jdGlvbiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlTW9kdWxlKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnaXRlbXMnXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlTmV3RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHZhciBvbkV4dGVuZGVkRXhwcmVzc2lvbiA9IFtcbiAgICAgICdGdW5jdGlvbkV4cHJlc3Npb24nLCAnQ2xhc3NFeHByZXNzaW9uJ1xuICAgIF0uaW5kZXhPZihub2RlLmNhbGxlZS50eXBlKSA+IC0xO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2NhbGxlZScsICdhcmd1bWVudHMnXSwgW29uRXh0ZW5kZWRFeHByZXNzaW9uID8gMSA6IDAsIDAsIFsnbmV3J10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZU5ld1RhcmdldEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCB1bmRlZmluZWQsIFsnbmV3LnRhcmdldCddXSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RCaW5kaW5nKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsncHJvcGVydGllcyddLCBbMCwgMCwgWyd7fSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlT2JqZWN0RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3Byb3BlcnRpZXMnXSwgWzAsIDAsIFsne30nXSwgWyc8b2JqZWN0PiddXSk7XG4gIH1cblxuICByZWR1Y2VSZXR1cm5TdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFsxLCAwLCBbJ3JldHVybiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU2NyaXB0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnc3RhdGVtZW50cyddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VTZXR0ZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3BhcmFtJywgJ2JvZHknXSwgWzEsIDAsIFsnc2V0J10sIFtdXSk7XG5cbiAgfVxuXG4gIHJlZHVjZVNob3J0aGFuZFByb3BlcnR5KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMSwgMCwgWyc6J10sIFtub2RlLm5hbWVdXSk7XG4gIH1cblxuICByZWR1Y2VTcHJlYWRFbGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMCwgMCwgWycuLi4nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY01lbWJlckV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgb25FeHRlbmRlZEV4cHJlc3Npb24gPSBbXG4gICAgICAnQXJyb3dFeHByZXNzaW9uJywgJ0Z1bmN0aW9uRXhwcmVzc2lvbicsICdBcnJheUV4cHJlc3Npb24nLCAnT2JqZWN0RXhwcmVzc2lvbicsICdDbGFzc0V4cHJlc3Npb24nXG4gICAgXS5pbmRleE9mKG5vZGUub2JqZWN0LnR5cGUpID4gLTE7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnb2JqZWN0J10sIFtvbkV4dGVuZGVkRXhwcmVzc2lvbiA/IDEgOiAwLCAwLCBbJy4nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY1Byb3BlcnR5TmFtZShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VTdXBlcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgWydzdXBlciddXSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hDYXNlKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsndGVzdCcsICdjb25zZXF1ZW50J10sIFsxLCAxLCBbJ2Nhc2UnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydjb25zZXF1ZW50J10sIFsxLCAwLCBbJ2RlZmF1bHQnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2Rpc2NyaW1pbmFudCcsICdjYXNlcyddLCBbMSwgMCwgWydzd2l0Y2gnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGlzY3JpbWluYW50JywgJ3ByZURlZmF1bHRDYXNlcycsICdkZWZhdWx0Q2FzZScsICdwb3N0RGVmYXVsdENhc2VzJ10sIFsxLCAwLCBbJ3N3aXRjaCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVGVtcGxhdGVFbGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlVGVtcGxhdGVFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsndGFnJywgJ2VsZW1lbnRzJ10sIFswLCAwLCBbJ2BgJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUaGlzRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgWyd0aGlzJ11dKTtcbiAgfVxuXG4gIHJlZHVjZVRocm93U3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMSwgMCwgWyd0aHJvdyddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVHJ5Q2F0Y2hTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydib2R5JywgJ2NhdGNoQ2xhdXNlJ10sIFsxLCAwLCBbJ3RyeSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVHJ5RmluYWxseVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknLCAnY2F0Y2hDbGF1c2UnLCAnZmluYWxpemVyJ10sIFsxLCAwLCBbJ3RyeScsICdmaW5hbGx5J10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZVVuYXJ5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ29wZXJhbmQnXSwgWzAsIDAsIFtub2RlLm9wZXJhdG9yXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVVwZGF0ZUV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvcGVyYW5kJ10sIFsxLCAwLCBbbm9kZS5vcGVyYXRvcl0sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVjbGFyYXRvcnMnXSwgWzEsIDAsIFsndmFyJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVjbGFyYXRpb24nXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdG9yKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmluZGluZycsICdpbml0J10sIFswLCAwLCBbJz0nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVdoaWxlU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsndGVzdCcsICdib2R5J10sIFsxLCAxLCBbJ3doaWxlJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VXaXRoU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnb2JqZWN0JywgJ2JvZHknXSwgWzEsIDAsIFsnd2l0aCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlWWllbGRFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMCwgMSwgWyd5aWVsZCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlWWllbGRHZW5lcmF0b3JFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZXhwcmVzc2lvbiddLCBbMCwgMCwgWyd5aWVsZConXSwgW11dKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBsZXhpdHlSZWR1Y2VyO1xuXG4iXX0=