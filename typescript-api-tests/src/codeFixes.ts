import * as shell from 'shelljs'
import Project, {SourceFile, Node, Diagnostic} from 'ts-simple-ast'
import   {addTextToSourceFile, getKindName} from 'typescript-ast-util'
import * as ts from 'typescript'

// TODO: test with jsdoc or a trailing comment
const codeFixCreateVariable:CodeFix = {
  name: 'Declare variable',
  config: { variableType: 'const' },
  predicate: (diag: ts.Diagnostic, child: ts.Node):boolean => diag.code === 2304 && // Cannot find name 'i'
    child.kind === ts.SyntaxKind.Identifier &&
    child.parent.kind === ts.SyntaxKind.BinaryExpression &&
    child.parent.parent.kind === ts.SyntaxKind.ExpressionStatement,
  description: (diag:  ts.Diagnostic, child:  ts.Node) : string => `Declare variable "${child.getText()}"`,
  apply: (diag: ts.Diagnostic, child:  Node): void => {
    child.getSourceFile().insertText(child.getStart(), 'const ')
  }
};

const codeFixCreateConstructor:CodeFix = {
  name: 'Declare constructor',
  config: { variableType: 'const' },
  predicate: (diag: ts.Diagnostic, child:ts.Node) => {
    if(diag.code === 2554 && child.parent.kind === ts.SyntaxKind.VariableDeclarationList){
      const syntaxList = child.parent.getChildren().find(c=>c.kind===ts.SyntaxKind.SyntaxList)
      if(!syntaxList){return false}
      const variableDecl = syntaxList.getChildren().find(c=>c.kind===ts.SyntaxKind.VariableDeclaration)
      if(!variableDecl){return false}
      const newExpression = variableDecl.getChildren().find(c=>c.kind==ts.SyntaxKind.NewExpression)
      if(!newExpression){return false}
      return true
    }
    return false
  },
  description: (diag: ts.Diagnostic, child: ts.Node) : string => `Declare constructor "${child.getText()}"`,
  apply: (diag: ts.Diagnostic, child: Node) => {
    const newExpression = child.getParent().getChildrenOfKind(ts.SyntaxKind.SyntaxList)[0].getChildrenOfKind(ts.SyntaxKind.VariableDeclaration)[0].getChildrenOfKind(ts.SyntaxKind.NewExpression)[0]

    const argTypes = newExpression.getArguments().map(arg=>arg.getType().getApparentType().getText())


  }
};

export interface CodeFix {
  name: string
  config: any
  predicate(diag: ts.Diagnostic, child:ts.Node) : boolean
  description (diag: ts.Diagnostic, child: ts.Node) : string
  apply(diag: ts.Diagnostic, child: Node):void
}


export const codeFixes = [
  codeFixCreateVariable, codeFixCreateConstructor
];