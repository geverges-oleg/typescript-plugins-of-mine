import * as shell from 'shelljs';
import  Project, { TypeGuards } from 'ts-simple-ast';
import * as ts from 'typescript';
import { getDiagnosticsInCurrentLocation } from 'typescript-ast-util';
import { codeFixes, CodeFixOptions } from '../src/codeFixes';
import { defaultBeforeEach, defaultLog } from './testUtil';

describe('tests', () => {
  let simpleProject: Project
  const projectPath = `assets/sampleProject1_1_copy`;

  beforeEach(() => {
    const result  = defaultBeforeEach({projectPath});
    simpleProject = result.simpleProject
  });

  it('Declare variable fix', async () => {
    const sourceFile = simpleProject.getSourceFiles().find(sf => sf.getFilePath().includes(`src/index.ts`));
    const cursorPosition = 61
    const diagnostics = getDiagnosticsInCurrentLocation(simpleProject.getProgram().compilerObject, sourceFile.compilerNode, cursorPosition);
    if (!diagnostics || !diagnostics.length) {
      return fail();
    }
    const child = sourceFile.getDescendantAtPos(cursorPosition);
    const arg: CodeFixOptions = { diagnostics, containingTarget: child.compilerNode, containingTargetLight: child.compilerNode, log: defaultLog, simpleNode: child, program: simpleProject.getProgram().compilerObject, sourceFile: sourceFile.compilerNode }
    const fixes = codeFixes.filter(fix => fix.predicate(arg));
    if (!fixes || !fixes.length) {
      return fail();
    }
    fixes[0].apply(arg);
    simpleProject.saveSync();
    simpleProject.emit();
    expect(shell.cat(`${projectPath}/src/index.ts`).toString()).toContain('const i=f()')
  })
});