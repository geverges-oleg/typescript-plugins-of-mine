/*
Attacks this problem:   

//"code": "2355",	"message": "A function whose declared type is neither 'void' nor 'any' must return a value.",
*/

import * as ts from 'typescript';
import { getKindName } from 'typescript-ast-util';
import { CodeFix, CodeFixNodeOptions } from '../codeFixes';
import { Statement } from '../../../typescript-ast-util/node_modules/typescript/lib/tsserverlibrary';
import { Block, SourceFile, TypeGuards, StatementedNode, Node } from 'ts-simple-ast';

export const addReturnStatement: CodeFix = {
  name: 'addReturnStatement',
  config: {},
  predicate: (arg: CodeFixNodeOptions): boolean => {
    //TODO: review this predicate
    if (!arg.diagnostics.find(d => d.code === 2355)) {
      return false
    }
    const kind = getKindName(arg.containingTarget)
    const kindToIncludeAnyOf = ['Identifier', 'Keyword', 'Type']
    if (kindToIncludeAnyOf.find(k=>kind.includes(k))) {
      return true
    }    
    else {
      arg.log('addReturnStatement predicate false because child.kind dont include any of ' + kindToIncludeAnyOf.join(', '))
      return false
    }
  },

  description: (arg: CodeFixNodeOptions): string => `Add return statement?`,

  apply: (arg: CodeFixNodeOptions): ts.ApplicableRefactorInfo[] | void => {
    const firstStatementedNode = arg.simpleNode.getAncestors().find(TypeGuards.isStatementedNode)
    if(firstStatementedNode){
      addReturnStatementImpl(arg.simpleNode.getSourceFile(), firstStatementedNode)
    }
  }
}

function addReturnStatementImpl(sourceFile: SourceFile, node: StatementedNode&Node){
  const statements = node.getStatements()
  // methodDecl.addStatements('return null;')  // this fails (  https://github.com/dsherret/ts-ast-viewer/issues/20)so we hack: 
  if(statements.length){
    sourceFile.insertText(statements[statements.length-1].getEnd(), '\nreturn null;')
  }  
  else{
    sourceFile.insertText(node.getEnd()-1, '\nreturn null;\n')
  }
}