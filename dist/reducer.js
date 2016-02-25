'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function propagateStats(report, child) {
  // if we don't have a properly populated child then we're doing
  // testing on an individual reduction function
  if (!('complexity' in child)) return;

  if (!child.complexity.node.functionType) {
    var _report$body$operator, _report$body$operands;

    report.body.lloc += child.complexity.node.lloc + (child.complexity.body.lloc || 0);
    report.body.cyclomatic += child.complexity.node.cyclomatic + (child.complexity.body.cyclomatic || 0);
    (_report$body$operator = report.body.operators).push.apply(_report$body$operator, _toConsumableArray(child.complexity.node.operators).concat(_toConsumableArray(child.complexity.body.operators)));
    (_report$body$operands = report.body.operands).push.apply(_report$body$operands, _toConsumableArray(child.complexity.node.operands).concat(_toConsumableArray(child.complexity.body.operands)));
  } else {
    var _report$body$operator2, _report$body$operands2;

    report.body.lloc += child.complexity.node.lloc;
    report.body.cyclomatic += child.complexity.node.cyclomatic;
    (_report$body$operator2 = report.body.operators).push.apply(_report$body$operator2, _toConsumableArray(child.complexity.node.operators));
    (_report$body$operands2 = report.body.operands).push.apply(_report$body$operands2, _toConsumableArray(child.complexity.node.operands));
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
    this.cyclomatic = 0;
    this.operators = [];
    this.operands = [];
    this.functions = [];
  }

  _createClass(ComplexityReducer, [{
    key: 'updateStats',
    value: function updateStats(node, children, stats) {

      var report = {
        body: {
          lloc: 0,
          cyclomatic: 0,
          operators: [],
          operands: []
        },
        node: {
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

        if (report.node.functionType && child.type === 'BindingIdentifier') {
          report.node.operands.push(child.name);
        } else {
          if (Array.isArray(child)) {
            child.forEach(function (_) {
              return propagateStats(report, _);
            });
          } else {
            propagateStats(report, child);
          }
        }
      }

      this.lloc += stats[0];
      report.node.lloc += stats[0];
      this.cyclomatic += stats[1];
      report.node.cyclomatic += stats[1];

      if (report.node.functionType) {
        this.functions.push(node);
      }

      if (node.type === 'ArrowExpression' && node.body.type !== 'FunctionBody') {
        report.body.lloc++;
      }

      if (stats[2]) {
        var _report$node$operator, _operators;

        (_report$node$operator = report.node.operators).push.apply(_report$node$operator, _toConsumableArray(stats[2]));
        (_operators = this.operators).push.apply(_operators, _toConsumableArray(stats[2]));
      }

      if (stats[3]) {
        var _report$node$operands, _operands;

        (_report$node$operands = report.node.operands).push.apply(_report$node$operands, _toConsumableArray(stats[3]));
        (_operands = this.operands).push.apply(_operands, _toConsumableArray(stats[3]));
      }

      if (report.node.rootType) {
        // every path starts at 1 cyclomatic, so add our missing 1
        report.body.cyclomatic += report.node.cyclomatic;
        report.body.cyclomatic++;
        this.cyclomatic++;
        //report.body.lloc += report.node.lloc;
        //report.body.operators.push(...report.node.operators);
        //report.body.operands.push(...report.node.operands);
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
//# sourceMappingURL=data:application/json;base64,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LE1BQUQsRUFBUyxNQUFULENBQXhCLEVBQTBDLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFDLE9BQUQsQ0FBUCxFQUFrQixFQUFsQixDQUExQyxDQUFQLENBRGdDOzs7O3dDQUlkLE1BQU0sT0FBTztBQUMvQixhQUFPLEtBQUssV0FBTCxDQUFpQixLQUFqQixFQUF3QixDQUFDLFFBQUQsRUFBVyxNQUFYLENBQXhCLEVBQTRDLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFDLE1BQUQsQ0FBUCxFQUFpQixFQUFqQixDQUE1QyxDQUFQLENBRCtCOzs7OzBDQUlYLE1BQU0sT0FBTztBQUNqQyxhQUFPLEtBQUssV0FBTCxDQUFpQixLQUFqQixFQUF3QixDQUFDLFlBQUQsQ0FBeEIsRUFBd0MsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQUMsT0FBRCxDQUFQLEVBQWtCLEVBQWxCLENBQXhDLENBQVAsQ0FEaUM7Ozs7bURBSUosTUFBTSxPQUFPO0FBQzFDLGFBQU8sS0FBSyxXQUFMLENBQWlCLEtBQWpCLEVBQXdCLENBQUMsWUFBRCxDQUF4QixFQUF3QyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUIsRUFBbkIsQ0FBeEMsQ0FBUCxDQUQwQzs7OztTQXpieEM7OztrQkErYlMiLCJmaWxlIjoicmVkdWNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuZnVuY3Rpb24gcHJvcGFnYXRlU3RhdHMocmVwb3J0LCBjaGlsZCkge1xuICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgcHJvcGVybHkgcG9wdWxhdGVkIGNoaWxkIHRoZW4gd2UncmUgZG9pbmdcbiAgLy8gdGVzdGluZyBvbiBhbiBpbmRpdmlkdWFsIHJlZHVjdGlvbiBmdW5jdGlvblxuICBpZiAoISgnY29tcGxleGl0eScgaW4gY2hpbGQpKSByZXR1cm47XG5cbiAgaWYgKCFjaGlsZC5jb21wbGV4aXR5Lm5vZGUuZnVuY3Rpb25UeXBlKSB7XG4gICAgcmVwb3J0LmJvZHkubGxvYyArPVxuICAgICAgY2hpbGQuY29tcGxleGl0eS5ub2RlLmxsb2MgKyAoY2hpbGQuY29tcGxleGl0eS5ib2R5Lmxsb2MgfHwgMCk7XG4gICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYyArPVxuICAgICAgY2hpbGQuY29tcGxleGl0eS5ub2RlLmN5Y2xvbWF0aWMgKyAoY2hpbGQuY29tcGxleGl0eS5ib2R5LmN5Y2xvbWF0aWMgfHwgMCk7XG4gICAgcmVwb3J0LmJvZHkub3BlcmF0b3JzLnB1c2goXG4gICAgICAuLi5jaGlsZC5jb21wbGV4aXR5Lm5vZGUub3BlcmF0b3JzLFxuICAgICAgLi4uY2hpbGQuY29tcGxleGl0eS5ib2R5Lm9wZXJhdG9ycyk7XG4gICAgcmVwb3J0LmJvZHkub3BlcmFuZHMucHVzaChcbiAgICAgIC4uLmNoaWxkLmNvbXBsZXhpdHkubm9kZS5vcGVyYW5kcyxcbiAgICAgIC4uLmNoaWxkLmNvbXBsZXhpdHkuYm9keS5vcGVyYW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgcmVwb3J0LmJvZHkubGxvYyArPSBjaGlsZC5jb21wbGV4aXR5Lm5vZGUubGxvYztcbiAgICByZXBvcnQuYm9keS5jeWNsb21hdGljICs9IGNoaWxkLmNvbXBsZXhpdHkubm9kZS5jeWNsb21hdGljO1xuICAgIHJlcG9ydC5ib2R5Lm9wZXJhdG9ycy5wdXNoKC4uLmNoaWxkLmNvbXBsZXhpdHkubm9kZS5vcGVyYXRvcnMpO1xuICAgIHJlcG9ydC5ib2R5Lm9wZXJhbmRzLnB1c2goLi4uY2hpbGQuY29tcGxleGl0eS5ub2RlLm9wZXJhbmRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uVHlwZSh0eXBlKSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICBjYXNlICdGdW5jdGlvbkRlY2xhcmF0aW9uJzpcbiAgY2FzZSAnRnVuY3Rpb25FeHByZXNzaW9uJzpcbiAgY2FzZSAnQXJyb3dFeHByZXNzaW9uJzpcbiAgY2FzZSAnTWV0aG9kJzpcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzUm9vdFR5cGUodHlwZSkge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnRnVuY3Rpb25EZWNsYXJhdGlvbic6XG4gIGNhc2UgJ0Z1bmN0aW9uRXhwcmVzc2lvbic6XG4gIGNhc2UgJ0Fycm93RXhwcmVzc2lvbic6XG4gIGNhc2UgJ01ldGhvZCc6XG4gIGNhc2UgJ01vZHVsZSc6XG4gIGNhc2UgJ1NjcmlwdCc6XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5jbGFzcyBDb21wbGV4aXR5UmVkdWNlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sbG9jID0gMDtcbiAgICB0aGlzLmN5Y2xvbWF0aWMgPSAwO1xuICAgIHRoaXMub3BlcmF0b3JzID0gW107XG4gICAgdGhpcy5vcGVyYW5kcyA9IFtdO1xuICAgIHRoaXMuZnVuY3Rpb25zID0gW107XG4gIH1cblxuICB1cGRhdGVTdGF0cyhub2RlLCBjaGlsZHJlbiwgc3RhdHMpIHtcblxuICAgIHZhciByZXBvcnQgPSB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGxsb2M6IDAsXG4gICAgICAgIGN5Y2xvbWF0aWM6IDAsXG4gICAgICAgIG9wZXJhdG9yczogW10sXG4gICAgICAgIG9wZXJhbmRzOiBbXVxuICAgICAgfSxcbiAgICAgIG5vZGU6IHtcbiAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICBsbG9jOiAwLFxuICAgICAgICBjeWNsb21hdGljOiAwLFxuICAgICAgICBvcGVyYXRvcnM6IFtdLFxuICAgICAgICBvcGVyYW5kczogW10sXG4gICAgICAgIHJvb3RUeXBlOiBpc1Jvb3RUeXBlKG5vZGUudHlwZSksXG4gICAgICAgIGZ1bmN0aW9uVHlwZTogaXNGdW5jdGlvblR5cGUobm9kZS50eXBlKVxuICAgICAgfVxuICAgIH07XG5cbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgY2hpbGRQcm9wID0gY2hpbGRyZW5baV07XG4gICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgaWYgKCEoY2hpbGRQcm9wIGluIG5vZGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hpbGQgcHJvcGVydHkgc3BlY2lmaWVkOiAnICsgbm9kZS50eXBlICsgJ1snICsgY2hpbGRQcm9wICsgJ10nKTtcbiAgICAgIGxldCBjaGlsZCA9IG5vZGVbY2hpbGRQcm9wXTtcblxuICAgICAgaWYgKCFjaGlsZCkgY29udGludWU7XG5cbiAgICAgIGlmIChyZXBvcnQubm9kZS5mdW5jdGlvblR5cGUgJiYgY2hpbGQudHlwZSA9PT0gJ0JpbmRpbmdJZGVudGlmaWVyJykge1xuICAgICAgICByZXBvcnQubm9kZS5vcGVyYW5kcy5wdXNoKGNoaWxkLm5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XG4gICAgICAgICAgY2hpbGQuZm9yRWFjaChfID0+IHByb3BhZ2F0ZVN0YXRzKHJlcG9ydCwgXykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb3BhZ2F0ZVN0YXRzKHJlcG9ydCwgY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5sbG9jICs9IHN0YXRzWzBdO1xuICAgIHJlcG9ydC5ub2RlLmxsb2MgKz0gc3RhdHNbMF07XG4gICAgdGhpcy5jeWNsb21hdGljICs9IHN0YXRzWzFdO1xuICAgIHJlcG9ydC5ub2RlLmN5Y2xvbWF0aWMgKz0gc3RhdHNbMV07XG5cbiAgICBpZiAocmVwb3J0Lm5vZGUuZnVuY3Rpb25UeXBlKSB7XG4gICAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICBcbiAgICBpZiAobm9kZS50eXBlID09PSAnQXJyb3dFeHByZXNzaW9uJyAmJiBub2RlLmJvZHkudHlwZSAhPT0gJ0Z1bmN0aW9uQm9keScpIHtcbiAgICAgIHJlcG9ydC5ib2R5Lmxsb2MrKztcbiAgICB9XG5cbiAgICBpZiAoc3RhdHNbMl0pIHtcbiAgICAgIHJlcG9ydC5ub2RlLm9wZXJhdG9ycy5wdXNoKC4uLnN0YXRzWzJdKTtcbiAgICAgIHRoaXMub3BlcmF0b3JzLnB1c2goLi4uc3RhdHNbMl0pO1xuICAgIH1cblxuICAgIGlmIChzdGF0c1szXSkge1xuICAgICAgcmVwb3J0Lm5vZGUub3BlcmFuZHMucHVzaCguLi5zdGF0c1szXSk7XG4gICAgICB0aGlzLm9wZXJhbmRzLnB1c2goLi4uc3RhdHNbM10pO1xuICAgIH1cblxuICAgIGlmIChyZXBvcnQubm9kZS5yb290VHlwZSkge1xuICAgICAgLy8gZXZlcnkgcGF0aCBzdGFydHMgYXQgMSBjeWNsb21hdGljLCBzbyBhZGQgb3VyIG1pc3NpbmcgMVxuICAgICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYyArPSByZXBvcnQubm9kZS5jeWNsb21hdGljO1xuICAgICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYysrO1xuICAgICAgdGhpcy5jeWNsb21hdGljKys7XG4gICAgICAvL3JlcG9ydC5ib2R5Lmxsb2MgKz0gcmVwb3J0Lm5vZGUubGxvYztcbiAgICAgIC8vcmVwb3J0LmJvZHkub3BlcmF0b3JzLnB1c2goLi4ucmVwb3J0Lm5vZGUub3BlcmF0b3JzKTtcbiAgICAgIC8vcmVwb3J0LmJvZHkub3BlcmFuZHMucHVzaCguLi5yZXBvcnQubm9kZS5vcGVyYW5kcyk7XG4gICAgfVxuXG4gICAgbm9kZS5jb21wbGV4aXR5ID0gcmVwb3J0O1xuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICByZWR1Y2VBcnJheUJpbmRpbmcobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydlbGVtZW50cyddLCBbMCwgMCwgWydbXT0nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUFycmF5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2VsZW1lbnRzJ10sIFswLCAwLCBbJ1tdJ10sIFsnPGFycmF5PiddXSk7XG4gIH1cblxuICByZWR1Y2VBcnJvd0V4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgbGxvYyA9IG5vZGUuYm9keS50eXBlID09PSAnRnVuY3Rpb25Cb2R5JyA/IDAgOiAxO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3BhcmFtcycsICdib2R5J10sIFtsbG9jLCAwLCBbJz0+J10sIFsnPGFub255bW91cz4nXV0pO1xuICB9XG5cbiAgcmVkdWNlQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2V4cHJlc3Npb24nXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluYXJ5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xlZnQnLCAncmlnaHQnXSwgWzAsIG5vZGUub3BlcmF0b3IgPT09ICd8fCcgPyAxIDogMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluZGluZ0lkZW50aWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCB1bmRlZmluZWQsIFtub2RlLm5hbWVdXSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmluZGluZycsICdpbml0J10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdiaW5kaW5nJ10sIFswLCAwLCBbJzo9J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nV2l0aERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydpbml0JywgJ2JpbmRpbmcnXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmxvY2sobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydzdGF0ZW1lbnRzJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmxvY2snXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQnJlYWtTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydsYWJlbCddLCBbMSwgMCwgWydicmVhayddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2FsbEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgbGxvYyA9IG5vZGUuY2FsbGVlLnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nID8gMSA6IDA7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLCBbbGxvYywgMCwgWycoKSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2F0Y2hDbGF1c2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2JvZHknXSwgWzEsIDEsIFsnY2F0Y2gnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNsYXNzRGVjbGFyYXRpb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3N1cGVyJywgJ2VsZW1lbnRzJ10sIFswLCAwLCBbJ2NsYXNzJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VDbGFzc0VsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydtZXRob2QnXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2xhc3NFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdzdXBlcicsICdlbGVtZW50cyddLCBbMCwgMCwgbm9kZS5zdXBlciA/IFsnY2xhc3MnLCAnZXh0ZW5kcyddIDogWydjbGFzcyddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JpbmRpbmcnLCAnZXhwcmVzc2lvbiddLCBbMCwgMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIG9uRXh0ZW5kZWRFeHByZXNzaW9uID0gW1xuICAgICAgJ0Fycm93RXhwcmVzc2lvbicsICdGdW5jdGlvbkV4cHJlc3Npb24nLCAnQXJyYXlFeHByZXNzaW9uJywgJ09iamVjdEV4cHJlc3Npb24nLCAnQ2xhc3NFeHByZXNzaW9uJ1xuICAgIF0uaW5kZXhPZihub2RlLm9iamVjdC50eXBlKSA+IC0xO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ29iamVjdCcsICdleHByZXNzaW9uJ10sIFtvbkV4dGVuZGVkRXhwcmVzc2lvbiA/IDEgOiAwLCAwLCBbJy4nXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRQcm9wZXJ0eU5hbWUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3Rlc3QnLCAnY29uc2VxdWVudCcsICdhbHRlcm5hdGUnXSwgWzAsIDEsIFsnOj8nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbnRpbnVlU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbGFiZWwnXSwgWzEsIDAsIFsnY29udGludWUnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZURhdGFQcm9wZXJ0eShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnZXhwcmVzc2lvbiddLCBbMSwgMCwgWyc6J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VEZWJ1Z2dlclN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzEsIDAsIFsnZGVidWdnZXInXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZURpcmVjdGl2ZShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFsndXNlJ10sIFtub2RlLnJhd1ZhbHVlXV0pO1xuICB9XG5cbiAgcmVkdWNlRG9XaGlsZVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknLCAndGVzdCddLCBbMiwgMSwgWydkb3doaWxlJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFbXB0eVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVjbGFyYXRpb24nXSwgWzAsIDAsIFsnZXhwb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRBbGxGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgWydleHBvcnQnLCAnZnJvbSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0RGVmYXVsdChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknXSwgWzAsIDAsIFsnZXhwb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgWydleHBvcnQnLCAnZnJvbSddLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRTcGVjaWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFsxLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUZvckluU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbGVmdCcsICdyaWdodCcsICdib2R5J10sIFsxLCAxLCBbJ2ZvcmluJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VGb3JPZlN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xlZnQnLCAncmlnaHQnLCAnYm9keSddLCBbMSwgMSwgWydmb3JvZiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRm9yU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnaW5pdCcsICd0ZXN0JywgJ3VwZGF0ZScsICdib2R5J10sIFsxLCAxLCBbJ2ZvciddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRm9ybWFsUGFyYW1ldGVycyhub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2l0ZW1zJywgJ3Jlc3QnXSwgWzAsIDAsIG5vZGUucmVzdCA/IFsnLi4uJ10gOiB1bmRlZmluZWQsIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uQm9keShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3N0YXRlbWVudHMnXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAncGFyYW1zJywgJ2JvZHknXSwgWzEsIDAsIFtub2RlLmlzR2VuZXJhdG9yID8gJ2Z1bmN0aW9uKicgOiAnZnVuY3Rpb24nXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdwYXJhbXMnLCAnYm9keSddLCBbMCwgMCwgW25vZGUuaXNHZW5lcmF0b3IgPyAnZnVuY3Rpb24qJyA6ICdmdW5jdGlvbiddLCBub2RlLm5hbWUgPyB1bmRlZmluZWQgOiBbJzxhbm9ueW1vdXM+J11dKTtcbiAgfVxuXG4gIHJlZHVjZUdldHRlcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnYm9keSddLCBbMSwgMCwgWydnZXQnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbbm9kZS5uYW1lXV0pO1xuICB9XG5cbiAgcmVkdWNlSWZTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgYWx0ID0gbm9kZS5hbHRlcm5hdGU7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsndGVzdCcsICdjb25zZXF1ZW50JywgJ2FsdGVybmF0ZSddLCBbYWx0ID8gMiA6IDEsIDEsIGFsdCA/IFsnaWYnLCAnZWxzZSddIDogWydpZiddLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWZhdWx0QmluZGluZycsICduYW1lZEltcG9ydHMnXSwgWzEsIDAsIFsnaW1wb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnROYW1lc3BhY2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWZhdWx0QmluZGluZycsICduYW1lc3BhY2VCaW5kaW5nJ10sIFsxLCAwLCBbJ2ltcG9ydCcsICdpbXBvcnQqJ10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUltcG9ydFNwZWNpZmllcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JpbmRpbmcnXSwgWzAsIDAsIFsnaW1wb3J0e30nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUxhYmVsZWRTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydib2R5J10sIFswLCAwLCBbJ2xhYmVsJ10sIFtub2RlLmxhYmVsXV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgWzJlMzA4XV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bGxFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW251bGxdXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBudWxsLCBbbm9kZS52YWx1ZV1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUucGF0dGVybl1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VNZXRob2Qobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3BhcmFtcycsICdib2R5J10sIFsxLCAwLCBbJ2Z1bmN0aW9uJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VNb2R1bGUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydpdGVtcyddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VOZXdFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIG9uRXh0ZW5kZWRFeHByZXNzaW9uID0gW1xuICAgICAgJ0Z1bmN0aW9uRXhwcmVzc2lvbicsICdDbGFzc0V4cHJlc3Npb24nXG4gICAgXS5pbmRleE9mKG5vZGUuY2FsbGVlLnR5cGUpID4gLTE7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLCBbb25FeHRlbmRlZEV4cHJlc3Npb24gPyAxIDogMCwgMCwgWyduZXcnXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlTmV3VGFyZ2V0RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgWyduZXcudGFyZ2V0J11dKTtcbiAgfVxuXG4gIHJlZHVjZU9iamVjdEJpbmRpbmcobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydwcm9wZXJ0aWVzJ10sIFswLCAwLCBbJ3t9J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsncHJvcGVydGllcyddLCBbMCwgMCwgWyd7fSddLCBbJzxvYmplY3Q+J11dKTtcbiAgfVxuXG4gIHJlZHVjZVJldHVyblN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2V4cHJlc3Npb24nXSwgWzEsIDAsIFsncmV0dXJuJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VTY3JpcHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydzdGF0ZW1lbnRzJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVNldHRlcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAncGFyYW0nLCAnYm9keSddLCBbMSwgMCwgWydzZXQnXSwgW11dKTtcblxuICB9XG5cbiAgcmVkdWNlU2hvcnRoYW5kUHJvcGVydHkobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFsxLCAwLCBbJzonXSwgW25vZGUubmFtZV1dKTtcbiAgfVxuXG4gIHJlZHVjZVNwcmVhZEVsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbJy4uLiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljTWVtYmVyRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHZhciBvbkV4dGVuZGVkRXhwcmVzc2lvbiA9IFtcbiAgICAgICdBcnJvd0V4cHJlc3Npb24nLCAnRnVuY3Rpb25FeHByZXNzaW9uJywgJ0FycmF5RXhwcmVzc2lvbicsICdPYmplY3RFeHByZXNzaW9uJywgJ0NsYXNzRXhwcmVzc2lvbidcbiAgICBdLmluZGV4T2Yobm9kZS5vYmplY3QudHlwZSkgPiAtMTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvYmplY3QnXSwgW29uRXh0ZW5kZWRFeHByZXNzaW9uID8gMSA6IDAsIDAsIFsnLiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljUHJvcGVydHlOYW1lKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbbm9kZS52YWx1ZV1dKTtcbiAgfVxuXG4gIHJlZHVjZVN1cGVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbJ3N1cGVyJ11dKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaENhc2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0ZXN0JywgJ2NvbnNlcXVlbnQnXSwgWzEsIDEsIFsnY2FzZSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoRGVmYXVsdChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2NvbnNlcXVlbnQnXSwgWzEsIDAsIFsnZGVmYXVsdCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGlzY3JpbWluYW50JywgJ2Nhc2VzJ10sIFsxLCAwLCBbJ3N3aXRjaCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkaXNjcmltaW5hbnQnLCAncHJlRGVmYXVsdENhc2VzJywgJ2RlZmF1bHRDYXNlJywgJ3Bvc3REZWZhdWx0Q2FzZXMnXSwgWzEsIDAsIFsnc3dpdGNoJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUZW1wbGF0ZUVsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBudWxsLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VUZW1wbGF0ZUV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0YWcnLCAnZWxlbWVudHMnXSwgWzAsIDAsIFsnYGAnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVRoaXNFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbJ3RoaXMnXV0pO1xuICB9XG5cbiAgcmVkdWNlVGhyb3dTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFsxLCAwLCBbJ3Rocm93J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUcnlDYXRjaFN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknLCAnY2F0Y2hDbGF1c2UnXSwgWzEsIDAsIFsndHJ5J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUcnlGaW5hbGx5U3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYm9keScsICdjYXRjaENsYXVzZScsICdmaW5hbGl6ZXInXSwgWzEsIDAsIFsndHJ5JywgJ2ZpbmFsbHknXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlVW5hcnlFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnb3BlcmFuZCddLCBbMCwgMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVXBkYXRlRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ29wZXJhbmQnXSwgWzEsIDAsIFtub2RlLm9wZXJhdG9yXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWNsYXJhdG9ycyddLCBbMSwgMCwgWyd2YXInXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWNsYXJhdGlvbiddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2luaXQnXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlV2hpbGVTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0ZXN0JywgJ2JvZHknXSwgWzEsIDEsIFsnd2hpbGUnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVdpdGhTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvYmplY3QnLCAnYm9keSddLCBbMSwgMCwgWyd3aXRoJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VZaWVsZEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAxLCBbJ3lpZWxkJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbJ3lpZWxkKiddLCBbXV0pO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcGxleGl0eVJlZHVjZXI7XG5cbiJdfQ==