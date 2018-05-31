//TODO: arrow funcs
function g(): GResult {	// THIS works
  return { a: 1, b: 's' }
}
const g2 = (): GResult2 => ({ a: 1, b: 's' })// TODO: doesn't work
const g3 = (): GResult3 => { return { a: 1, b: 's' } } // TODO: doesn't work
const h2 = (): HResult2 => ({ // TODO this doesn't work - error!
  a: 1, b: 's', log: (msg) => true, kill: function () { return 1 }
})
const h3 = (): HelloType => {  // TODO this doesn't work 
  return {
    a: 1, b: 's', log: (msg) => true, kill: function () { return 1 }
  }
}
function h(): Magallanes { //TODO: generates empty interface 
  return {
    a: 1, b: 's', log: (msg: boolean) => { return true }, kill: function () { return 1 }
  }
}
function fn<T>(): FNResult<T> { // THIS works
  return { a: 1, b: 's', log: (msg: string) => { return Math.random() > 0.1 ? true : 'foo' }, kill: function <T>() { return 1 } }
}


import { EvalContext } from 'typescript-plugin-ast-inspector';
declare const c: EvalContext;

function evaluateMe() {

  const Project = c.tsa.Project, print = c.print, ts = c.ts, TypeGuards = c.tsa.TypeGuards, getKindName = c.util.getKindName, findAscendant = c.util.findAscendant

  const position = 379
  const project = new c.SimpleProjectConstructor();
  const sourceFile = c.project.createSourceFile('tmp/tmp_sourcefile_' + new Date().getTime() + '.ts', c.node.getSourceFile().getFullText())
  const node = sourceFile.getDescendantAtPos(position)

  const inferReturnType = (decl) => {
    const tmpSourceFile = project.createSourceFile('tmp2.ts', decl.getText() + '; const tmp = ' + decl.getName() + '()')
    const tmpDecl = tmpSourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[0]
    const typeargs = tmpDecl.getReturnType().getTypeArguments()
    tmpDecl.removeReturnType()
    const tmp = tmpSourceFile.getFirstDescendantByKind(ts.SyntaxKind.VariableDeclaration)
    const type = project.getTypeChecker().getTypeAtLocation(tmp)
    print('tp: ' + tmp.getText() + 'ssss+***' + type.getText())
    const intStructure = {
      name: decl.getReturnTypeNode().getText(),
      properties: type.getProperties()
        .filter(p => { const v = p.getValueDeclaration(); return TypeGuards.isPropertyAssignment(v) && !v.getInitializer().getKindName().includes('Function') })
        .map(p => ({
          name: p.getName(),
          type: project.getTypeChecker().getTypeAtLocation(p.getValueDeclaration()).getText(),
          val: p.getValueDeclaration()
        })),
      methods: type.getProperties()
        .filter(p => {
          const v = p.getValueDeclaration();
          return TypeGuards.isPropertyAssignment(v) && v.getInitializer().getKindName().includes('Function')
        })
        .map(p => {
          const v = p.getValueDeclaration()
          if (!TypeGuards.isPropertyAssignment(v)) {
            return []
          }
          const init = v.getInitializer()
          if (!TypeGuards.isArrowFunction(init) && !TypeGuards.isFunctionExpression(init)) {
            return []
          }
          return {
            name: p.getName(),
            returnType: init.getReturnType() ? init.getReturnType().getText() : 'any',
            parameters: init.getParameters().map(pa => ({
              name: pa.getName(),
              type: pa.getType().getText()
            }))
          }
        }),
      typeParameters: typeargs.map(ta => ({
        name: ta.getSymbol().getName()
      })),
    }
    tmpSourceFile.delete()
    return intStructure
  }
  const decl = node.getFirstAncestorByKind(ts.SyntaxKind.FunctionDeclaration)

  const intStruct = inferReturnType(decl)
  sourceFile.addInterface(intStruct)
  print(sourceFile.getText())

  sourceFile.deleteImmediatelySync()

}
