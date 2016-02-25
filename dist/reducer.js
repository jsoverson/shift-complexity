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
//# sourceMappingURL=data:application/json;base64,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RUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzFFOzs7MENBRXFCLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDakMsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdkU7OzttREFFOEIsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUMxQyxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN4RTs7O1NBM2JHLGlCQUFpQjs7O2tCQStiUixpQkFBaUIiLCJmaWxlIjoicmVkdWNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuZnVuY3Rpb24gcHJvcGFnYXRlU3RhdHMocmVwb3J0LCBjaGlsZCkge1xuICAvLyBpZiB3ZSBkb24ndCBoYXZlIGEgcHJvcGVybHkgcG9wdWxhdGVkIGNoaWxkIHRoZW4gd2UncmUgZG9pbmdcbiAgLy8gdGVzdGluZyBvbiBhbiBpbmRpdmlkdWFsIHJlZHVjdGlvbiBmdW5jdGlvblxuICBpZiAoISgnY29tcGxleGl0eScgaW4gY2hpbGQpKSByZXR1cm47XG5cbiAgaWYgKCFjaGlsZC5jb21wbGV4aXR5Lm5vZGUuZnVuY3Rpb25UeXBlKSB7XG4gICAgcmVwb3J0LmJvZHkubGxvYyArPVxuICAgICAgY2hpbGQuY29tcGxleGl0eS5ub2RlLmxsb2MgKyAoY2hpbGQuY29tcGxleGl0eS5ib2R5Lmxsb2MgfHwgMCk7XG4gICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYyArPVxuICAgICAgY2hpbGQuY29tcGxleGl0eS5ub2RlLmN5Y2xvbWF0aWMgKyAoY2hpbGQuY29tcGxleGl0eS5ib2R5LmN5Y2xvbWF0aWMgfHwgMCk7XG4gICAgcmVwb3J0LmJvZHkub3BlcmF0b3JzLnB1c2goXG4gICAgICAuLi5jaGlsZC5jb21wbGV4aXR5Lm5vZGUub3BlcmF0b3JzLFxuICAgICAgLi4uY2hpbGQuY29tcGxleGl0eS5ib2R5Lm9wZXJhdG9ycyk7XG4gICAgcmVwb3J0LmJvZHkub3BlcmFuZHMucHVzaChcbiAgICAgIC4uLmNoaWxkLmNvbXBsZXhpdHkubm9kZS5vcGVyYW5kcyxcbiAgICAgIC4uLmNoaWxkLmNvbXBsZXhpdHkuYm9keS5vcGVyYW5kcyk7XG4gIH0gZWxzZSB7XG4gICAgcmVwb3J0LmJvZHkubGxvYyArPSBjaGlsZC5jb21wbGV4aXR5Lm5vZGUubGxvYztcbiAgICByZXBvcnQuYm9keS5jeWNsb21hdGljICs9IGNoaWxkLmNvbXBsZXhpdHkubm9kZS5jeWNsb21hdGljO1xuICAgIHJlcG9ydC5ib2R5Lm9wZXJhdG9ycy5wdXNoKC4uLmNoaWxkLmNvbXBsZXhpdHkubm9kZS5vcGVyYXRvcnMpO1xuICAgIHJlcG9ydC5ib2R5Lm9wZXJhbmRzLnB1c2goLi4uY2hpbGQuY29tcGxleGl0eS5ub2RlLm9wZXJhbmRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uVHlwZSh0eXBlKSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICBjYXNlICdGdW5jdGlvbkRlY2xhcmF0aW9uJzpcbiAgY2FzZSAnRnVuY3Rpb25FeHByZXNzaW9uJzpcbiAgY2FzZSAnQXJyb3dFeHByZXNzaW9uJzpcbiAgY2FzZSAnTWV0aG9kJzpcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzUm9vdFR5cGUodHlwZSkge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnRnVuY3Rpb25EZWNsYXJhdGlvbic6XG4gIGNhc2UgJ0Z1bmN0aW9uRXhwcmVzc2lvbic6XG4gIGNhc2UgJ0Fycm93RXhwcmVzc2lvbic6XG4gIGNhc2UgJ01ldGhvZCc6XG4gIGNhc2UgJ01vZHVsZSc6XG4gIGNhc2UgJ1NjcmlwdCc6XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5jbGFzcyBDb21wbGV4aXR5UmVkdWNlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sbG9jID0gMDtcbiAgICB0aGlzLmN5Y2xvbWF0aWMgPSAwO1xuICAgIHRoaXMub3BlcmF0b3JzID0gW107XG4gICAgdGhpcy5vcGVyYW5kcyA9IFtdO1xuICAgIHRoaXMuZnVuY3Rpb25zID0gW107XG4gIH1cblxuICB1cGRhdGVTdGF0cyhub2RlLCBjaGlsZHJlbiwgc3RhdHMpIHtcblxuICAgIHZhciByZXBvcnQgPSB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGxsb2M6IDAsXG4gICAgICAgIGN5Y2xvbWF0aWM6IDAsXG4gICAgICAgIG9wZXJhdG9yczogW10sXG4gICAgICAgIG9wZXJhbmRzOiBbXVxuICAgICAgfSxcbiAgICAgIG5vZGU6IHtcbiAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICBsbG9jOiAwLFxuICAgICAgICBjeWNsb21hdGljOiAwLFxuICAgICAgICBvcGVyYXRvcnM6IFtdLFxuICAgICAgICBvcGVyYW5kczogW10sXG4gICAgICAgIHJvb3RUeXBlOiBpc1Jvb3RUeXBlKG5vZGUudHlwZSksXG4gICAgICAgIGZ1bmN0aW9uVHlwZTogaXNGdW5jdGlvblR5cGUobm9kZS50eXBlKVxuICAgICAgfVxuICAgIH07XG5cbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgY2hpbGRQcm9wID0gY2hpbGRyZW5baV07XG4gICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgaWYgKCEoY2hpbGRQcm9wIGluIG5vZGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hpbGQgcHJvcGVydHkgc3BlY2lmaWVkOiAnICsgbm9kZS50eXBlICsgJ1snICsgY2hpbGRQcm9wICsgJ10nKTtcbiAgICAgIGxldCBjaGlsZCA9IG5vZGVbY2hpbGRQcm9wXTtcblxuICAgICAgaWYgKCFjaGlsZCkgY29udGludWU7XG5cbiAgICAgIGlmIChyZXBvcnQubm9kZS5mdW5jdGlvblR5cGUgJiYgY2hpbGQudHlwZSA9PT0gJ0JpbmRpbmdJZGVudGlmaWVyJykge1xuICAgICAgICByZXBvcnQubm9kZS5vcGVyYW5kcy5wdXNoKGNoaWxkLm5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XG4gICAgICAgICAgY2hpbGQuZm9yRWFjaChfID0+IHByb3BhZ2F0ZVN0YXRzKHJlcG9ydCwgXykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb3BhZ2F0ZVN0YXRzKHJlcG9ydCwgY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5sbG9jICs9IHN0YXRzWzBdO1xuICAgIHJlcG9ydC5ub2RlLmxsb2MgKz0gc3RhdHNbMF07XG4gICAgdGhpcy5jeWNsb21hdGljICs9IHN0YXRzWzFdO1xuICAgIHJlcG9ydC5ub2RlLmN5Y2xvbWF0aWMgKz0gc3RhdHNbMV07XG5cbiAgICBpZiAocmVwb3J0Lm5vZGUuZnVuY3Rpb25UeXBlKSB7XG4gICAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICBcbiAgICBpZiAobm9kZS50eXBlID09PSAnQXJyb3dFeHByZXNzaW9uJyAmJiBub2RlLmJvZHkudHlwZSAhPT0gJ0Z1bmN0aW9uQm9keScpIHtcbiAgICAgIHJlcG9ydC5ib2R5Lmxsb2MrKztcbiAgICB9XG5cbiAgICBpZiAoc3RhdHNbMl0pIHtcbiAgICAgIHJlcG9ydC5ub2RlLm9wZXJhdG9ycy5wdXNoKC4uLnN0YXRzWzJdKTtcbiAgICAgIHRoaXMub3BlcmF0b3JzLnB1c2goLi4uc3RhdHNbMl0pO1xuICAgIH1cblxuICAgIGlmIChzdGF0c1szXSkge1xuICAgICAgcmVwb3J0Lm5vZGUub3BlcmFuZHMucHVzaCguLi5zdGF0c1szXSk7XG4gICAgICB0aGlzLm9wZXJhbmRzLnB1c2goLi4uc3RhdHNbM10pO1xuICAgIH1cblxuICAgIGlmIChyZXBvcnQubm9kZS5yb290VHlwZSkge1xuICAgICAgLy8gZXZlcnkgcGF0aCBzdGFydHMgYXQgMSBjeWNsb21hdGljLCBzbyBhZGQgb3VyIG1pc3NpbmcgMVxuICAgICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYyArPSByZXBvcnQubm9kZS5jeWNsb21hdGljO1xuICAgICAgcmVwb3J0LmJvZHkuY3ljbG9tYXRpYysrO1xuICAgICAgdGhpcy5jeWNsb21hdGljKys7XG4gICAgICAvL3JlcG9ydC5ib2R5Lmxsb2MgKz0gcmVwb3J0Lm5vZGUubGxvYztcbiAgICAgIC8vcmVwb3J0LmJvZHkub3BlcmF0b3JzLnB1c2goLi4ucmVwb3J0Lm5vZGUub3BlcmF0b3JzKTtcbiAgICAgIC8vcmVwb3J0LmJvZHkub3BlcmFuZHMucHVzaCguLi5yZXBvcnQubm9kZS5vcGVyYW5kcyk7XG4gICAgfVxuXG4gICAgbm9kZS5jb21wbGV4aXR5ID0gcmVwb3J0O1xuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICByZWR1Y2VBcnJheUJpbmRpbmcobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydlbGVtZW50cyddLCBbMCwgMCwgWydbXT0nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUFycmF5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2VsZW1lbnRzJ10sIFswLCAwLCBbJ1tdJ10sIFsnPGFycmF5PiddXSk7XG4gIH1cblxuICByZWR1Y2VBcnJvd0V4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgbGxvYyA9IG5vZGUuYm9keS50eXBlID09PSAnRnVuY3Rpb25Cb2R5JyA/IDAgOiAxO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3BhcmFtcycsICdib2R5J10sIFtsbG9jLCAwLCBbJz0+J10sIFsnPGFub255bW91cz4nXV0pO1xuICB9XG5cbiAgcmVkdWNlQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2V4cHJlc3Npb24nXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluYXJ5RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xlZnQnLCAncmlnaHQnXSwgWzAsIG5vZGUub3BlcmF0b3IgPT09ICd8fCcgPyAxIDogMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmluZGluZ0lkZW50aWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCB1bmRlZmluZWQsIFtub2RlLm5hbWVdXSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmluZGluZycsICdpbml0J10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdiaW5kaW5nJ10sIFswLCAwLCBbJzo9J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VCaW5kaW5nV2l0aERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydpbml0JywgJ2JpbmRpbmcnXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQmxvY2sobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydzdGF0ZW1lbnRzJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYmxvY2snXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQnJlYWtTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydsYWJlbCddLCBbMSwgMCwgWydicmVhayddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2FsbEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgbGxvYyA9IG5vZGUuY2FsbGVlLnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nID8gMSA6IDA7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLCBbbGxvYywgMCwgWycoKSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2F0Y2hDbGF1c2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2JvZHknXSwgWzEsIDEsIFsnY2F0Y2gnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNsYXNzRGVjbGFyYXRpb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3N1cGVyJywgJ2VsZW1lbnRzJ10sIFswLCAwLCBbJ2NsYXNzJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VDbGFzc0VsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydtZXRob2QnXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ2xhc3NFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdzdXBlcicsICdlbGVtZW50cyddLCBbMCwgMCwgbm9kZS5zdXBlciA/IFsnY2xhc3MnLCAnZXh0ZW5kcyddIDogWydjbGFzcyddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JpbmRpbmcnLCAnZXhwcmVzc2lvbiddLCBbMCwgMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIG9uRXh0ZW5kZWRFeHByZXNzaW9uID0gW1xuICAgICAgJ0Fycm93RXhwcmVzc2lvbicsICdGdW5jdGlvbkV4cHJlc3Npb24nLCAnQXJyYXlFeHByZXNzaW9uJywgJ09iamVjdEV4cHJlc3Npb24nLCAnQ2xhc3NFeHByZXNzaW9uJ1xuICAgIF0uaW5kZXhPZihub2RlLm9iamVjdC50eXBlKSA+IC0xO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ29iamVjdCcsICdleHByZXNzaW9uJ10sIFtvbkV4dGVuZGVkRXhwcmVzc2lvbiA/IDEgOiAwLCAwLCBbJy4nXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRQcm9wZXJ0eU5hbWUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3Rlc3QnLCAnY29uc2VxdWVudCcsICdhbHRlcm5hdGUnXSwgWzAsIDEsIFsnOj8nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUNvbnRpbnVlU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbGFiZWwnXSwgWzEsIDAsIFsnY29udGludWUnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZURhdGFQcm9wZXJ0eShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnZXhwcmVzc2lvbiddLCBbMSwgMCwgWyc6J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VEZWJ1Z2dlclN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzEsIDAsIFsnZGVidWdnZXInXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZURpcmVjdGl2ZShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFsndXNlJ10sIFtub2RlLnJhd1ZhbHVlXV0pO1xuICB9XG5cbiAgcmVkdWNlRG9XaGlsZVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknLCAndGVzdCddLCBbMiwgMSwgWydkb3doaWxlJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFbXB0eVN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGVjbGFyYXRpb24nXSwgWzAsIDAsIFsnZXhwb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRBbGxGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgWydleHBvcnQnLCAnZnJvbSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRXhwb3J0RGVmYXVsdChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknXSwgWzAsIDAsIFsnZXhwb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRGcm9tKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgWydleHBvcnQnLCAnZnJvbSddLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VFeHBvcnRTcGVjaWZpZXIobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFsxLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUZvckluU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbGVmdCcsICdyaWdodCcsICdib2R5J10sIFsxLCAxLCBbJ2ZvcmluJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VGb3JPZlN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2xlZnQnLCAncmlnaHQnLCAnYm9keSddLCBbMSwgMSwgWydmb3JvZiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRm9yU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnaW5pdCcsICd0ZXN0JywgJ3VwZGF0ZScsICdib2R5J10sIFsxLCAxLCBbJ2ZvciddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRm9ybWFsUGFyYW1ldGVycyhub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2l0ZW1zJywgJ3Jlc3QnXSwgWzAsIDAsIG5vZGUucmVzdCA/IFsnLi4uJ10gOiB1bmRlZmluZWQsIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uQm9keShub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ3N0YXRlbWVudHMnXSwgWzAsIDAsIFtdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAncGFyYW1zJywgJ2JvZHknXSwgWzEsIDAsIFtub2RlLmlzR2VuZXJhdG9yID8gJ2Z1bmN0aW9uKicgOiAnZnVuY3Rpb24nXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnbmFtZScsICdwYXJhbXMnLCAnYm9keSddLCBbMCwgMCwgW25vZGUuaXNHZW5lcmF0b3IgPyAnZnVuY3Rpb24qJyA6ICdmdW5jdGlvbiddLCBub2RlLm5hbWUgPyB1bmRlZmluZWQgOiBbJzxhbm9ueW1vdXM+J11dKTtcbiAgfVxuXG4gIHJlZHVjZUdldHRlcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAnYm9keSddLCBbMSwgMCwgWydnZXQnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbbm9kZS5uYW1lXV0pO1xuICB9XG5cbiAgcmVkdWNlSWZTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICB2YXIgYWx0ID0gbm9kZS5hbHRlcm5hdGU7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsndGVzdCcsICdjb25zZXF1ZW50JywgJ2FsdGVybmF0ZSddLCBbYWx0ID8gMiA6IDEsIDEsIGFsdCA/IFsnaWYnLCAnZWxzZSddIDogWydpZiddLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWZhdWx0QmluZGluZycsICduYW1lZEltcG9ydHMnXSwgWzEsIDAsIFsnaW1wb3J0J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VJbXBvcnROYW1lc3BhY2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWZhdWx0QmluZGluZycsICduYW1lc3BhY2VCaW5kaW5nJ10sIFsxLCAwLCBbJ2ltcG9ydCcsICdpbXBvcnQqJ10sIG51bGxdKTtcbiAgfVxuXG4gIHJlZHVjZUltcG9ydFNwZWNpZmllcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JpbmRpbmcnXSwgWzAsIDAsIFsnaW1wb3J0e30nXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZUxhYmVsZWRTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydib2R5J10sIFswLCAwLCBbJ2xhYmVsJ10sIFtub2RlLmxhYmVsXV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgWzJlMzA4XV0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bGxFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW251bGxdXSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBudWxsLCBbbm9kZS52YWx1ZV1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUucGF0dGVybl1dKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgbnVsbCwgW25vZGUudmFsdWVdXSk7XG4gIH1cblxuICByZWR1Y2VNZXRob2Qobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyduYW1lJywgJ3BhcmFtcycsICdib2R5J10sIFsxLCAwLCBbJ2Z1bmN0aW9uJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VNb2R1bGUobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydpdGVtcyddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VOZXdFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgdmFyIG9uRXh0ZW5kZWRFeHByZXNzaW9uID0gW1xuICAgICAgJ0Z1bmN0aW9uRXhwcmVzc2lvbicsICdDbGFzc0V4cHJlc3Npb24nXG4gICAgXS5pbmRleE9mKG5vZGUuY2FsbGVlLnR5cGUpID4gLTE7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLCBbb25FeHRlbmRlZEV4cHJlc3Npb24gPyAxIDogMCwgMCwgWyduZXcnXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlTmV3VGFyZ2V0RXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbXSwgWzAsIDAsIHVuZGVmaW5lZCwgWyduZXcudGFyZ2V0J11dKTtcbiAgfVxuXG4gIHJlZHVjZU9iamVjdEJpbmRpbmcobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydwcm9wZXJ0aWVzJ10sIFswLCAwLCBbJ3t9J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsncHJvcGVydGllcyddLCBbMCwgMCwgWyd7fSddLCBbJzxvYmplY3Q+J11dKTtcbiAgfVxuXG4gIHJlZHVjZVJldHVyblN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2V4cHJlc3Npb24nXSwgWzEsIDAsIFsncmV0dXJuJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VTY3JpcHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydzdGF0ZW1lbnRzJ10sIFswLCAwLCBbXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVNldHRlcihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ25hbWUnLCAncGFyYW0nLCAnYm9keSddLCBbMSwgMCwgWydzZXQnXSwgW11dKTtcblxuICB9XG5cbiAgcmVkdWNlU2hvcnRoYW5kUHJvcGVydHkobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFsxLCAwLCBbJzonXSwgW25vZGUubmFtZV1dKTtcbiAgfVxuXG4gIHJlZHVjZVNwcmVhZEVsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbJy4uLiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljTWVtYmVyRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHZhciBvbkV4dGVuZGVkRXhwcmVzc2lvbiA9IFtcbiAgICAgICdBcnJvd0V4cHJlc3Npb24nLCAnRnVuY3Rpb25FeHByZXNzaW9uJywgJ0FycmF5RXhwcmVzc2lvbicsICdPYmplY3RFeHByZXNzaW9uJywgJ0NsYXNzRXhwcmVzc2lvbidcbiAgICBdLmluZGV4T2Yobm9kZS5vYmplY3QudHlwZSkgPiAtMTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvYmplY3QnXSwgW29uRXh0ZW5kZWRFeHByZXNzaW9uID8gMSA6IDAsIDAsIFsnLiddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljUHJvcGVydHlOYW1lKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbbm9kZS52YWx1ZV1dKTtcbiAgfVxuXG4gIHJlZHVjZVN1cGVyKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbJ3N1cGVyJ11dKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaENhc2Uobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0ZXN0JywgJ2NvbnNlcXVlbnQnXSwgWzEsIDEsIFsnY2FzZSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoRGVmYXVsdChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2NvbnNlcXVlbnQnXSwgWzEsIDAsIFsnZGVmYXVsdCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnZGlzY3JpbWluYW50JywgJ2Nhc2VzJ10sIFsxLCAwLCBbJ3N3aXRjaCddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkaXNjcmltaW5hbnQnLCAncHJlRGVmYXVsdENhc2VzJywgJ2RlZmF1bHRDYXNlJywgJ3Bvc3REZWZhdWx0Q2FzZXMnXSwgWzEsIDAsIFsnc3dpdGNoJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUZW1wbGF0ZUVsZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgW10sIFswLCAwLCBudWxsLCBudWxsXSk7XG4gIH1cblxuICByZWR1Y2VUZW1wbGF0ZUV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0YWcnLCAnZWxlbWVudHMnXSwgWzAsIDAsIFsnYGAnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVRoaXNFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFtdLCBbMCwgMCwgdW5kZWZpbmVkLCBbJ3RoaXMnXV0pO1xuICB9XG5cbiAgcmVkdWNlVGhyb3dTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFsxLCAwLCBbJ3Rocm93J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUcnlDYXRjaFN0YXRlbWVudChub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ2JvZHknLCAnY2F0Y2hDbGF1c2UnXSwgWzEsIDAsIFsndHJ5J10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VUcnlGaW5hbGx5U3RhdGVtZW50KG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnYm9keScsICdjYXRjaENsYXVzZScsICdmaW5hbGl6ZXInXSwgWzEsIDAsIFsndHJ5JywgJ2ZpbmFsbHknXSwgbnVsbF0pO1xuICB9XG5cbiAgcmVkdWNlVW5hcnlFeHByZXNzaW9uKG5vZGUsIHN0YXRlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlU3RhdHMoc3RhdGUsIFsnb3BlcmFuZCddLCBbMCwgMCwgW25vZGUub3BlcmF0b3JdLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlVXBkYXRlRXhwcmVzc2lvbihub2RlLCBzdGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0YXRzKHN0YXRlLCBbJ29wZXJhbmQnXSwgWzEsIDAsIFtub2RlLm9wZXJhdG9yXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWNsYXJhdG9ycyddLCBbMSwgMCwgWyd2YXInXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydkZWNsYXJhdGlvbiddLCBbMCwgMCwgW10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydiaW5kaW5nJywgJ2luaXQnXSwgWzAsIDAsIFsnPSddLCBbXV0pO1xuICB9XG5cbiAgcmVkdWNlV2hpbGVTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWyd0ZXN0JywgJ2JvZHknXSwgWzEsIDEsIFsnd2hpbGUnXSwgW11dKTtcbiAgfVxuXG4gIHJlZHVjZVdpdGhTdGF0ZW1lbnQobm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydvYmplY3QnLCAnYm9keSddLCBbMSwgMCwgWyd3aXRoJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VZaWVsZEV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAxLCBbJ3lpZWxkJ10sIFtdXSk7XG4gIH1cblxuICByZWR1Y2VZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24obm9kZSwgc3RhdGUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVTdGF0cyhzdGF0ZSwgWydleHByZXNzaW9uJ10sIFswLCAwLCBbJ3lpZWxkKiddLCBbXV0pO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcGxleGl0eVJlZHVjZXI7XG5cbiJdfQ==