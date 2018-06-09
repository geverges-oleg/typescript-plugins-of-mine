import { Node, Scope, TypeGuards } from 'ts-simple-ast';
import * as ts from 'typescript';
import { CodeFix, CodeFixOptions } from '../codeFixes';
import { getKindName, findAscendant } from 'typescript-ast-util';

let newExpr: ts.NewExpression

/**
# description

adds missing constructor

# attacks

"code": "2554","message": "Expected 0 arguments, but got 3.",

# example

```alpha2 = new Alpha('hello', 1, new Date())```

# TODO

 * should call super if class extends
 * config 
 
 */
export const codeFixCreateConstructor: CodeFix = {

  name: 'Declare constructor',

  config: { 
    // TODO
    variableType: 'const',
    // TODO 'none'|'private'|'public'|'protected' 
    constructorParameterScope: 'none',
    // TODO could be false|true|string
    constructorJsDoc: true
  },
  
  predicate: (arg: CodeFixOptions) => {
    newExpr = ts.isNewExpression(arg.containingTarget) ? arg.containingTarget : findAscendant(arg.containingTarget, ts.isNewExpression)

    if (newExpr && arg.diagnostics.find(d => d.code === 2554 && d.start <= arg.containingTargetLight.getStart() && d.start+d.length>=arg.containingTargetLight.getEnd())) {
      return true
    } else {
      arg.log(`predicate false because no NewExpression ascendant was found containingTarget.kind==${getKindName(arg.containingTarget.kind)}, containingTarget.parent.kind==${getKindName(arg.containingTarget.parent.kind)}`)
      return false
    }
  },

  description: (arg: CodeFixOptions): string =>  `Declare constructor "${newExpr.expression.getText()}"`,

  apply: (arg: CodeFixOptions) => {
    const originalKind = arg.simpleNode.getKind()
    if (!TypeGuards.isNewExpression(arg.simpleNode)) {
      arg.simpleNode = arg.simpleNode.getFirstAncestorByKind(ts.SyntaxKind.NewExpression)
    }
    if (!arg.simpleNode || !TypeGuards.isNewExpression(arg.simpleNode)) {
      arg.log(`apply fail because couldnt find a NewExpression from arg.simpleNode returned by sourcefile..getDescendantAtPos(positionOrRangeToNumber(positionOrRange) - returned arg.simpleNode kind was ${getKindName(originalKind)}`)
      return
    }
    const argTypes = arg.simpleNode.getArguments().map(arg => arg.getType().getApparentType().getText())
    const classDeclaration = arg.simpleNode.getExpression().getSymbol()!.getDeclarations()[0]
    if (TypeGuards.isClassDeclaration(classDeclaration)) {
      classDeclaration.addConstructor({
        // docs: 'Autogenerated constructor', //TODO. add some jsdoc to generated constructor
        scope: Scope.Public,
        parameters: argTypes.map(type => ({
          name: `a${type.substring(0, 1).toUpperCase()}${type.substring(1, type.length)}`,
          hasQuestionToken: false,
          type,
          isRestParameter: false,
          // scope: Scope.Public  TODO: this could be configurable
        })),
        bodyText: `throw new Error('Not implemented');`
      })
    } else {
      arg.log(`apply fail because arg.simpleNode is not ClassDeclaration is ${getKindName(classDeclaration.getKind())}`)
    }
  }
};
