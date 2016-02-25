
function propagateStats(report, child) {
  // if we don't have a properly populated child then we're doing
  // testing on an individual reduction function
  if (!('complexity' in child)) return;

  if (!child.complexity.node.functionType) {
    report.body.lloc +=
      child.complexity.node.lloc + (child.complexity.body.lloc || 0);
    report.body.cyclomatic +=
      child.complexity.node.cyclomatic + (child.complexity.body.cyclomatic || 0);
    report.body.operators.push(
      ...child.complexity.node.operators,
      ...child.complexity.body.operators);
    report.body.operands.push(
      ...child.complexity.node.operands,
      ...child.complexity.body.operands);
  } else {
    report.body.lloc += child.complexity.node.lloc;
    report.body.cyclomatic += child.complexity.node.cyclomatic;
    report.body.operators.push(...child.complexity.node.operators);
    report.body.operands.push(...child.complexity.node.operands);
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

class ComplexityReducer {

  constructor() {
    this.lloc = 0;
    this.cyclomatic = 0;
    this.operators = [];
    this.operands = [];
    this.functions = [];
  }

  updateStats(node, children, stats) {

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
      let childProp = children[i];
      // istanbul ignore next
      if (!(childProp in node)) throw new Error('Invalid child property specified: ' + node.type + '[' + childProp + ']');
      let child = node[childProp];

      if (!child) continue;

      if (report.node.functionType && child.type === 'BindingIdentifier') {
        report.node.operands.push(child.name);
      } else {
        if (Array.isArray(child)) {
          child.forEach(_ => propagateStats(report, _));
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
      report.node.operators.push(...stats[2]);
      this.operators.push(...stats[2]);
    }

    if (stats[3]) {
      report.node.operands.push(...stats[3]);
      this.operands.push(...stats[3]);
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

  reduceArrayBinding(node, state) {
    return this.updateStats(state, ['elements'], [0, 0, ['[]='], []]);
  }

  reduceArrayExpression(node, state) {
    return this.updateStats(state, ['elements'], [0, 0, ['[]'], ['<array>']]);
  }

  reduceArrowExpression(node, state) {
    var lloc = node.body.type === 'FunctionBody' ? 0 : 1;
    return this.updateStats(state, ['params', 'body'], [lloc, 0, ['=>'], ['<anonymous>']]);
  }

  reduceAssignmentExpression(node, state) {
    return this.updateStats(state, ['binding', 'expression'], [0, 0, ['='], []]);
  }

  reduceBinaryExpression(node, state) {
    return this.updateStats(state, ['left', 'right'], [0, node.operator === '||' ? 1 : 0, [node.operator], []]);
  }

  reduceBindingIdentifier(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, [node.name]]);
  }

  reduceBindingPropertyIdentifier(node, state) {
    return this.updateStats(state, ['binding', 'init'], [0, 0, [], []]);
  }

  reduceBindingPropertyProperty(node, state) {
    return this.updateStats(state, ['name', 'binding'], [0, 0, [':='], []]);
  }

  reduceBindingWithDefault(node, state) {
    return this.updateStats(state, ['init', 'binding'], [0, 0, ['='], []]);
  }

  reduceBlock(node, state) {
    return this.updateStats(state, ['statements'], [0, 0, [], []]);
  }

  reduceBlockStatement(node, state) {
    return this.updateStats(state, ['block'], [0, 0, [], []]);
  }

  reduceBreakStatement(node, state) {
    return this.updateStats(state, ['label'], [1, 0, ['break'], []]);
  }

  reduceCallExpression(node, state) {
    var lloc = node.callee.type === 'FunctionExpression' ? 1 : 0;
    return this.updateStats(state, ['callee', 'arguments'], [lloc, 0, ['()'], []]);
  }

  reduceCatchClause(node, state) {
    return this.updateStats(state, ['binding', 'body'], [1, 1, ['catch'], []]);
  }

  reduceClassDeclaration(node, state) {
    return this.updateStats(state, ['name', 'super', 'elements'], [0, 0, ['class'], []]);
  }

  reduceClassElement(node, state) {
    return this.updateStats(state, ['method'], [0, 0, [], []]);
  }

  reduceClassExpression(node, state) {
    return this.updateStats(state, ['name', 'super', 'elements'], [0, 0, node.super ? ['class', 'extends'] : ['class'], []]);
  }

  reduceCompoundAssignmentExpression(node, state) {
    return this.updateStats(state, ['binding', 'expression'], [0, 0, [node.operator], []]);
  }

  reduceComputedMemberExpression(node, state) {
    var onExtendedExpression = [
      'ArrowExpression', 'FunctionExpression', 'ArrayExpression', 'ObjectExpression', 'ClassExpression'
    ].indexOf(node.object.type) > -1;
    return this.updateStats(state, ['object', 'expression'], [onExtendedExpression ? 1 : 0, 0, ['.'], null]);
  }

  reduceComputedPropertyName(node, state) {
    return this.updateStats(state, ['expression'], [0, 0, [], []]);
  }

  reduceConditionalExpression(node, state) {
    return this.updateStats(state, ['test', 'consequent', 'alternate'], [0, 1, [':?'], []]);
  }

  reduceContinueStatement(node, state) {
    return this.updateStats(state, ['label'], [1, 0, ['continue'], []]);
  }

  reduceDataProperty(node, state) {
    return this.updateStats(state, ['name', 'expression'], [1, 0, [':'], []]);
  }

  reduceDebuggerStatement(node, state) {
    return this.updateStats(state, [], [1, 0, ['debugger'], []]);
  }

  reduceDirective(node, state) {
    return this.updateStats(state, [], [0, 0, ['use'], [node.rawValue]]);
  }

  reduceDoWhileStatement(node, state) {
    return this.updateStats(state, ['body', 'test'], [2, 1, ['dowhile'], []]);
  }

  reduceEmptyStatement(node, state) {
    return this.updateStats(state, [], [0, 0, [], []]);
  }

  reduceExport(node, state) {
    return this.updateStats(state, ['declaration'], [0, 0, ['export'], []]);
  }

  reduceExportAllFrom(node, state) {
    return this.updateStats(state, [], [0, 0, ['export', 'from'], []]);
  }

  reduceExportDefault(node, state) {
    return this.updateStats(state, ['body'], [0, 0, ['export'], []]);
  }

  reduceExportFrom(node, state) {
    return this.updateStats(state, [], [0, 0, ['export', 'from'], null]);
  }

  reduceExportSpecifier(node, state) {
    return this.updateStats(state, [], [0, 0, [], []]);
  }

  reduceExpressionStatement(node, state) {
    return this.updateStats(state, ['expression'], [1, 0, [], []]);
  }

  reduceForInStatement(node, state) {
    return this.updateStats(state, ['left', 'right', 'body'], [1, 1, ['forin'], []]);
  }

  reduceForOfStatement(node, state) {
    return this.updateStats(state, ['left', 'right', 'body'], [1, 1, ['forof'], []]);
  }

  reduceForStatement(node, state) {
    return this.updateStats(state, ['init', 'test', 'update', 'body'], [1, 1, ['for'], []]);
  }

  reduceFormalParameters(node, state) {
    return this.updateStats(state, ['items', 'rest'], [0, 0, node.rest ? ['...'] : undefined, null]);
  }

  reduceFunctionBody(node, state) {
    return this.updateStats(state, ['statements'], [0, 0, [], []]);
  }

  reduceFunctionDeclaration(node, state) {
    return this.updateStats(state, ['name', 'params', 'body'], [1, 0, [node.isGenerator ? 'function*' : 'function'], null]);
  }

  reduceFunctionExpression(node, state) {
    return this.updateStats(state, ['name', 'params', 'body'], [0, 0, [node.isGenerator ? 'function*' : 'function'], node.name ? undefined : ['<anonymous>']]);
  }

  reduceGetter(node, state) {
    return this.updateStats(state, ['name', 'body'], [1, 0, ['get'], []]);
  }

  reduceIdentifierExpression(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, [node.name]]);
  }

  reduceIfStatement(node, state) {
    var alt = node.alternate;
    return this.updateStats(state, ['test', 'consequent', 'alternate'], [alt ? 2 : 1, 1, alt ? ['if', 'else'] : ['if'], null]);
  }

  reduceImport(node, state) {
    return this.updateStats(state, ['defaultBinding', 'namedImports'], [1, 0, ['import'], []]);
  }

  reduceImportNamespace(node, state) {
    return this.updateStats(state, ['defaultBinding', 'namespaceBinding'], [1, 0, ['import', 'import*'], null]);
  }

  reduceImportSpecifier(node, state) {
    return this.updateStats(state, ['binding'], [0, 0, ['import{}'], []]);
  }

  reduceLabeledStatement(node, state) {
    return this.updateStats(state, ['body'], [0, 0, ['label'], [node.label]]);
  }

  reduceLiteralBooleanExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [node.value]]);
  }

  reduceLiteralInfinityExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [2e308]]);
  }

  reduceLiteralNullExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [null]]);
  }

  reduceLiteralNumericExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [node.value]]);
  }

  reduceLiteralRegExpExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [node.pattern]]);
  }

  reduceLiteralStringExpression(node, state) {
    return this.updateStats(state, [], [0, 0, null, [node.value]]);
  }

  reduceMethod(node, state) {
    return this.updateStats(state, ['name', 'params', 'body'], [1, 0, ['function'], []]);
  }

  reduceModule(node, state) {
    return this.updateStats(state, ['items'], [0, 0, [], []]);
  }

  reduceNewExpression(node, state) {
    var onExtendedExpression = [
      'FunctionExpression', 'ClassExpression'
    ].indexOf(node.callee.type) > -1;
    return this.updateStats(state, ['callee', 'arguments'], [onExtendedExpression ? 1 : 0, 0, ['new'], null]);
  }

  reduceNewTargetExpression(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, ['new.target']]);
  }

  reduceObjectBinding(node, state) {
    return this.updateStats(state, ['properties'], [0, 0, ['{}'], []]);
  }

  reduceObjectExpression(node, state) {
    return this.updateStats(state, ['properties'], [0, 0, ['{}'], ['<object>']]);
  }

  reduceReturnStatement(node, state) {
    return this.updateStats(state, ['expression'], [1, 0, ['return'], []]);
  }

  reduceScript(node, state) {
    return this.updateStats(state, ['statements'], [0, 0, [], []]);
  }

  reduceSetter(node, state) {
    return this.updateStats(state, ['name', 'param', 'body'], [1, 0, ['set'], []]);

  }

  reduceShorthandProperty(node, state) {
    return this.updateStats(state, [], [1, 0, [':'], [node.name]]);
  }

  reduceSpreadElement(node, state) {
    return this.updateStats(state, ['expression'], [0, 0, ['...'], []]);
  }

  reduceStaticMemberExpression(node, state) {
    var onExtendedExpression = [
      'ArrowExpression', 'FunctionExpression', 'ArrayExpression', 'ObjectExpression', 'ClassExpression'
    ].indexOf(node.object.type) > -1;
    return this.updateStats(state, ['object'], [onExtendedExpression ? 1 : 0, 0, ['.'], []]);
  }

  reduceStaticPropertyName(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, [node.value]]);
  }

  reduceSuper(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, ['super']]);
  }

  reduceSwitchCase(node, state) {
    return this.updateStats(state, ['test', 'consequent'], [1, 1, ['case'], []]);
  }

  reduceSwitchDefault(node, state) {
    return this.updateStats(state, ['consequent'], [1, 0, ['default'], []]);
  }

  reduceSwitchStatement(node, state) {
    return this.updateStats(state, ['discriminant', 'cases'], [1, 0, ['switch'], []]);
  }

  reduceSwitchStatementWithDefault(node, state) {
    return this.updateStats(state, ['discriminant', 'preDefaultCases', 'defaultCase', 'postDefaultCases'], [1, 0, ['switch'], []]);
  }

  reduceTemplateElement(node, state) {
    return this.updateStats(state, [], [0, 0, null, null]);
  }

  reduceTemplateExpression(node, state) {
    return this.updateStats(state, ['tag', 'elements'], [0, 0, ['``'], []]);
  }

  reduceThisExpression(node, state) {
    return this.updateStats(state, [], [0, 0, undefined, ['this']]);
  }

  reduceThrowStatement(node, state) {
    return this.updateStats(state, ['expression'], [1, 0, ['throw'], []]);
  }

  reduceTryCatchStatement(node, state) {
    return this.updateStats(state, ['body', 'catchClause'], [1, 0, ['try'], []]);
  }

  reduceTryFinallyStatement(node, state) {
    return this.updateStats(state, ['body', 'catchClause', 'finalizer'], [1, 0, ['try', 'finally'], null]);
  }

  reduceUnaryExpression(node, state) {
    return this.updateStats(state, ['operand'], [0, 0, [node.operator], []]);
  }

  reduceUpdateExpression(node, state) {
    return this.updateStats(state, ['operand'], [1, 0, [node.operator], []]);
  }

  reduceVariableDeclaration(node, state) {
    return this.updateStats(state, ['declarators'], [1, 0, ['var'], []]);
  }

  reduceVariableDeclarationStatement(node, state) {
    return this.updateStats(state, ['declaration'], [0, 0, [], []]);
  }

  reduceVariableDeclarator(node, state) {
    return this.updateStats(state, ['binding', 'init'], [0, 0, ['='], []]);
  }

  reduceWhileStatement(node, state) {
    return this.updateStats(state, ['test', 'body'], [1, 1, ['while'], []]);
  }

  reduceWithStatement(node, state) {
    return this.updateStats(state, ['object', 'body'], [1, 0, ['with'], []]);
  }

  reduceYieldExpression(node, state) {
    return this.updateStats(state, ['expression'], [0, 1, ['yield'], []]);
  }

  reduceYieldGeneratorExpression(node, state) {
    return this.updateStats(state, ['expression'], [0, 0, ['yield*'], []]);
  }

}

export default ComplexityReducer;

