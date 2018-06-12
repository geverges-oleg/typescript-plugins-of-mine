import * as ts from 'typescript';
import { getKindName } from 'typescript-ast-util';
import { CodeFix, CodeFixOptions } from '../codeFixes';
import { TypeGuards } from 'ts-simple-ast';

/**

# description 

declares undeclared variables or functions 

# example

a=1 // before
const a = 1 // after

const result = nonDeclared(1,2,{a: 'g}) // before
// after:
function nonDeclared(arg1: number, arg2: number, arg3: {a: string}) {
  throw new Error('Not Implemented');
}
const result = nonDeclared(1,2,{a: 'g})

# attacks 

"code": "2304", Cannot find name 'b'.",

TODO: test with jsdoc or a trailing comment
ISSUE : incorrectly suggesting in this case when cursor is on "Alpha" : const foo = new Alpha('hello')
*/
export const codeFixCreateVariable: CodeFix = {

  name: 'Declare variable or function',

  config: { variableType: 'const' },

  predicate: (options: CodeFixOptions): boolean => {
    if (
      options.containingTargetLight.kind===ts.SyntaxKind.Identifier &&
      options.diagnostics.find(d => d.code === 2304 && d.start === options.containingTargetLight.getStart())) {
      return true
    }
    else {
      options.log(`predicate false because child.kind dont match ${getKindName(options.containingTargetLight.kind)}`)
      return false
    }
  },

  description: (options: CodeFixOptions) =>`Declare "${options.containingTargetLight.getText()}"`,

  apply: (options: CodeFixOptions): ts.ApplicableRefactorInfo[] | void => {
    const parent = options.simpleNode.getParent()
    if(TypeGuards.isIdentifier(options.simpleNode) && TypeGuards.isCallExpression(parent)){
      const expression = parent.getExpression()
      if(TypeGuards.isIdentifier(expression)){
        const container = parent.getFirstAncestorByKind(ts.SyntaxKind.Block) || parent.getSourceFile()//.sourceFile
        const statementAncestor = parent.getAncestors().find(a=>a.getParent() === container)//TypeGuards.isStatement)
        if(statementAncestor && container){
          container.insertStatements(statementAncestor.getChildIndex(), `function ${options.simpleNode.getText()}(${parent.getArguments().map((a, index) => 'arg'+index+': '+a.getType().getText()).join(', ')}){
            throw new Error('Not Implemented');
          }`)
        } // LOG else
      }// LOG else
    }
    else{
      // it's a variable declaration
      options.simpleNode.getSourceFile().insertText(options.simpleNode.getStart(), 'const ')
    }

  }

}