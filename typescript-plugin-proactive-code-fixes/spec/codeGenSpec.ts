import * as shell from 'shelljs'
import Project, {SourceFile, Node, Diagnostic} from 'ts-simple-ast'
import * as ts from 'typescript'
import { codeFixes } from '../src/codeFixes';
import {getDiagnosticsInCurrentLocation} from 'typescript-ast-util'

describe('method delegate interface', () => {
  let simpleProject: Project, program: ts.Program
  const projectPath = `assets/sampleProject1_1_copy`;
  it(`interfaces`, () => {
    shell.rm(`-rf`, projectPath);
    shell.cp(`-r`, `assets/sampleProject1`, `${projectPath}`);
    simpleProject = new Project({
      tsConfigFilePath: `${projectPath}/tsconfig.json`
    });
    program = simpleProject.getProgram().compilerObject
  });

  it('Declare variable fix ', ()=>{
    const sourceFile = simpleProject.getSourceFiles().find(sf => sf.getFilePath().includes(`src/index.ts`));
    const fn = sourceFile.getFunction('main');
    const cursorPosition = 61
    const dignostics = getDiagnosticsInCurrentLocation(program, sourceFile.compilerNode, cursorPosition);
    if (!dignostics || !dignostics.length) {
      return fail();
    }
    const diag = dignostics[0];
    const child = sourceFile.getDescendantAtPos(cursorPosition);
    const fixes = codeFixes.filter(fix => fix.predicate(diag, child.compilerNode));
    if (!fixes || !fixes.length) {
      return fail();
    }
    fixes[0].apply(diag, child);
    simpleProject.saveSync();
    simpleProject.emit();
    expect(shell.cat(`${projectPath}/src/index.ts`).toString()).toContain('const i=f()')

  })

  it('Declare constructor fix ', ()=>{
    const sourceFile = simpleProject.getSourceFiles().find(sf => sf.getFilePath().includes(`src/index.ts`));
    const fn = sourceFile.getFunction('main');
    const cursorPosition = 137// ts.getPositionOfLineAndCharacter(sourceFile.compilerNode, 15, 13)
    const dignostics = getDiagnosticsInCurrentLocation(program, sourceFile.compilerNode, cursorPosition);
    if (!dignostics || !dignostics.length) {
      return fail('no dignostics found');
    }
    const diag = dignostics[0];
    const child = sourceFile.getDescendantAtPos(cursorPosition);
    const fixes = codeFixes.filter(fix => fix.predicate(diag, child.compilerNode));
    if (!fixes || !fixes.length) {
      return fail('no fixes for knowndiagnostic');
    }
    fixes[0].apply(diag, child);
    simpleProject.saveSync();
    simpleProject.emit();
    expect(shell.cat(`${projectPath}/src/index.ts`).toString()).toContain(`class A{
    public constructor(aString: String) {`)
  })
});




// export function findChildContainingPosition(sourceFile: SourceFile, position: number): Node | undefined {
//   let found:Node
//   function find(node:  Node, stop: ()=>void):void {
//     if (position >= node.getStart() && position < node.getEnd()) {
//       node.forEachChild(find)
//       if(!found){
//         found= node
//         stop()
//       }
//     }
//   }
//   find(sourceFile, ()=>{})
//   return found
// }