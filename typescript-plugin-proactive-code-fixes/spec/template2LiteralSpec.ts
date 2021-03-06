const code = `
const template1 = \`hello \${name} we are "glad" \${'you'} have \${1 + 2 + 3} years old\` ;
const concat1 = 'hello ' + name
const concat2 = 'hello ' + name + '. Have a good ' + day
const concat3 = 'hello ' + name + '. Have a good ' + day + \` and thanks for \${verb1} \${subject1}\. \`
`

import { basicTest, defaultAfterEach, defaultBeforeEach, DefaultBeforeEachResult, testCodeFixRefactorEditInfo } from './testUtil'
import { template2Literal } from '../src/code-fix/template2Literal';

describe('template2Literal', () => {
  let config: DefaultBeforeEachResult
  beforeEach(() => {
    config = defaultBeforeEach({ createNewFile: code })
  })
  it('to string concat', async () => {
    // const result = testCodeFixRefactorEditInfo(code, code.indexOf(`we are "glad" \${'you'}`), template2Literal.name)
    // expect(result.edits[0].textChanges[0].newText).toBe(`'hello world2'`)
    // console.log(result.edits[0].textChanges[0].newText);
    basicTest(code.indexOf(`we are "glad" \${'you'}`), config, 'template2Literal', [`+ " have " + (1 + 2 + 3) + " years old"`])
  })
  it('to template basic', async () => {
    basicTest(110, config, 'template2Literal', ['const concat1 = `hello ${name}`'])
  })
  it('to template complex concat token 1', async () => {
    basicTest(145, config, 'template2Literal', ['const concat2 = `hello ${name}. Have a good ${day}` const concat3'])
  })
  it('to template complex concat token 2', async () => {
    basicTest(154, config, 'template2Literal', ['const concat2 = `hello ${name}. Have a good ${day}` const concat3'])
  })
  it('to template complex concat token 3', async () => {
    basicTest(166, config, 'template2Literal', ['const concat2 = `hello ${name}. Have a good ${day}` const concat3'])
  })
  it('to template complex concat token 4', async () => {
    basicTest(166, config, 'template2Literal', ['const concat2 = `hello ${name}. Have a good ${day}` const concat3'])
  })
  //TODO: make the other complex case concat3
  afterEach(() => {
    defaultAfterEach(config)
  })
})