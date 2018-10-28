import { Node, SourceFile, ReferenceEntry, Project, ClassDeclaration, TypeGuards } from 'ts-simple-ast'
import { ok, equal } from 'assert';
import { moveNode } from './moveNode';

export function moveNodeTest(){

  const project = new Project({ useVirtualFileSystem: true })

  const lionFile = project.createSourceFile('src/animal/lion/Lion.ts', `
  import {Food} from '../../food/Food'
  import {Animal} from '../Animal'
  export class Lion extends Animal{
    eat(meat: Food){}
  }
  `)
  const animalFile = project.createSourceFile('src/animal/Animal.ts', `
  export class Animal {
    breath(air: number){}
  }
  `)
  const energyFile = project.createSourceFile('src/energy/Energy.ts', `
  export class Energy {
    burn(): number {return 1}
  }
  `)
  
  const foodFile = project.createSourceFile('src/food/Food.ts', `
  import {Animal} from '../animal/Animal'
  import {Energy} from '../energy/Energy'
  export class Food {
    energy: Energy
    canEatBy: Animal[]
  }
  `)
  
  const Food = foodFile.getClass('Food')
  const tmpFile = project.createSourceFile('tmp.ts', '')
  
  // console.log('ERRORS: '+project.getPreEmitDiagnostics().map(e=>e.getMessageText()+' - '+(e.getSourceFile() && e.getSourceFile().getFilePath())).join('\n'))
  
  moveNode(Food, animalFile)
  // console.log(printSourceFile(lionFile));
  
  
  equal(printSourceFile(foodFile), '')
  equal(printSourceFile(animalFile), 'import { Energy } from "../energy/Energy"; export class Animal { breath(air: number){} } export class Food { energy: Energy; canEatBy: Animal[]; }')
  equal(printSourceFile(lionFile), `import {Animal} from '../Animal' import { Food } from "../animal/Animal"; export class Lion extends Animal{ eat(meat: Food){} }`)
}


function printSourceFile(sf: SourceFile) {
  return sf.getText().trim().replace(/[\s]+/gm, ' ')
}

