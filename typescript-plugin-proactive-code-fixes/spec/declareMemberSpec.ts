import { declareMember } from '../src/code-fix/declareMember';
import { removeWhiteSpaces, testCodeFixRefactorEditInfo } from './testUtil';

describe('declareMember', () => {

  it('add missing method to object literal', () => {

    const code = `
const o = {
  foo: () => { return 1 }
}
const val: string[] = o.bar123123(1, ['w'], true) 
`
    const result = testCodeFixRefactorEditInfo(code, code.indexOf('bar123123(1') + 1, declareMember.name)
    const s = removeWhiteSpaces(result.edits[0].textChanges[0].newText, ' ')
    // console.log(s);
    expect(s).toContain(`bar123123(arg0: number, arg1: string[], arg2: boolean): string[] { throw new Error('Not Implemented') }`)
  })

  it('add missing prop to object literal', () => {
    const code = `
const o = {
  foo: () => { return 1 }
}
const val: string[] = o.bar
`
    const result = testCodeFixRefactorEditInfo(code, code.indexOf('o.bar') + 3, declareMember.name)
    const s = removeWhiteSpaces(result.edits[0].textChanges[0].newText, ' ')
    // console.log(s);
    expect(s).toContain(`bar: null`)
  })

  it('add missing method to object\'s interface', async () => {
    const code = `
interface Hello {}
const hello: Hello = {}
let i: string[]
i = hello.world([[1, 2, 3], [4, 5]])    
    `
    const result = testCodeFixRefactorEditInfo(code, code.indexOf('hello.world(') + 6, declareMember.name)
    const s = removeWhiteSpaces(result.edits[0].textChanges[0].newText, ' ')
    // console.log(s);
    expect(s).toContain(`world(arg0: number[][]): any;`)
    // expect(result.edits[0].textChanges[0].span.start).toBeCloseTo(code.indexOf('interface Hello {')+'interface Hello {'.length, 2)
  })


  it('add missing method to object\'s interface 2', async () => {
    const code = `
interface Hello {}
const hello: Hello = {}
const k = hello.mama(1, 2, 3) + ' how are you?'
    `
    const result = testCodeFixRefactorEditInfo(code, code.indexOf('hello.mama(') + 6, declareMember.name)
    const s = removeWhiteSpaces(result.edits[0].textChanges[0].newText, ' ')
    // console.log(s);
    
    expect(s).toContain(`mama(arg0: number, arg1: number, arg2: number): string`)
  })


})
