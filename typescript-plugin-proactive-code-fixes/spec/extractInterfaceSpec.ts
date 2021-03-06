const sourceFileText = `
/**
 * a fruit is a living thing, produced by trees
 */
class Fruit extends LivingThing  { // suggested from anywhere inside the class declaration
  /**
   * use undefined for 100% transparency
   */
  color: string | undefined
  /** shouldn't be exported */
  private creationDate: Date
  /**
   * will resolve when it's worthwhile
   */|
  foo() {
    return Promise.resolve([['smile']])
  }
  /**
   * @param greet the greeting to show in all user's screens 
   */
  bar(greet: string): Promise<string[]> { return null }
}
const obj21 = { // suggested from anywhere inside the object literal expression
  color: 'red',
  creationDate: new Date(),
  foo: () => Promise.resolve([new Date()]),
  bar(greet: string): Promise<string[]> { return null }
}
`
import { codeFixes, CodeFixOptions } from '../src/codeFixes';
import { defaultAfterEach, defaultBeforeEach, DefaultBeforeEachResult, expectToContainFixer, removeWhiteSpaces } from './testUtil';

describe('declareInterface', () => {
  let config: DefaultBeforeEachResult
  const log = (msg) => { };//console.log

  beforeEach(() => {
    config = defaultBeforeEach({ createNewFile: true })
    config.newSourceFile.addStatements(sourceFileText)
  });

  it('extract interface from class', async () => {
    const child = config.newSourceFile.getDescendantAtPos(161);
    const arg: CodeFixOptions = {
      diagnostics: [], containingTarget: child.compilerNode,
      containingTargetLight: child.compilerNode,
      log, simpleNode: child, program: config.simpleProject.getProgram().compilerObject,
      sourceFile: config.newSourceFile.compilerNode
    }
    const fixes = codeFixes.filter(fix => fix.predicate(arg));
    if (!fixes || !fixes.length) {
      return fail();
    }
    const fix = expectToContainFixer(fixes, 'extractInterface')
    expect(!!fix.predicate(arg)).toBe(true)
    expect(config.newSourceFile.getText()).not.toContain(`interface IFruit {`)

    fix.apply(arg)

    expect(removeWhiteSpaces(config.newSourceFile.getText(), ' ')).toContain(`interface IFruit { /** * use undefined for 100% transparency */ color: string | undefined; } /** * a fruit is a living thing, produced by trees */ class Fruit extends LivingThing implements IFruit`)
  })

  it('extract interface from obj literal', async () => {
    const child = config.newSourceFile.getDescendantAtPos(641);
    const arg: CodeFixOptions = {
      diagnostics: [],
      containingTarget: child.compilerNode,
      containingTargetLight: child.compilerNode,
      log, simpleNode: child,
      program: config.simpleProject.getProgram().compilerObject,
      sourceFile: config.newSourceFile.compilerNode
    }
    const fixes = codeFixes.filter(fix => fix.predicate(arg));
    if (!fixes || !fixes.length) {
      return fail();
    }
    const fix = expectToContainFixer(fixes, 'extractInterface')
    expect(!!fix.predicate(arg)).toBe(true)

    fix.apply(arg)

    expect(removeWhiteSpaces(config.newSourceFile.getText(), ' ')).toContain(`class Fruit extends LivingThing { // suggested from anywhere inside the class declaration /** * use undefined for 100% transparency */ color: string | undefined /** shouldn't be exported */ private creationDate: Date /** * will resolve when it's worthwhile */| foo() { return Promise.resolve([['smile']]) } interface Iobj21 { color: string; creationDate: Date; foo(): Promise<Date[]>; bar(greet: string): Promise<string[]>; } /** * @param greet the greeting to show in all user's screens */ bar(greet: string): Promise<string[]>`)
  })

  afterEach(() => {
    defaultAfterEach(config)
  })
});
