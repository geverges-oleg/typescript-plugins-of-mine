import * as assert from 'assert';
import { Node } from "ts-simple-ast";
import * as ts from 'typescript';
import { dumpAst, dumpNode, dumpNodes, filterChildren, findAscendant, findChild, findChildContainingPosition, findChildContainingRange, getAscendants, getDiagnosticsInCurrentLocation, getKindName, positionOrRangeToNumber, positionOrRangeToRange } from "typescript-ast-util";
import { EventEmitter } from 'events';



/** Utilities that easy working with native TypeScript AST Nodes */
export interface EvalContextUtil {
  /** pretty-prints AST structure of given node's descendants */
  printAst(node: Node | ts.Node, getChildrenMode?: boolean): string
  positionOrRangeToRange: typeof positionOrRangeToRange
  positionOrRangeToNumber: typeof positionOrRangeToNumber
  findChildContainingRange: typeof findChildContainingRange
  nodeAtCursor: typeof findChildContainingPosition
  getDiagnosticsInCurrentLocation: typeof getDiagnosticsInCurrentLocation
  findChildContainingPosition: typeof findChildContainingPosition
  getKindName: typeof getKindName
  findAscendant: typeof findAscendant
  filterChildren: typeof filterChildren
  getAscendants: typeof getAscendants
  findChild: (n: ts.Node, predicate: (n: ts.Node) => boolean) => ts.Node | undefined
  findDescendants: typeof findChild
  assert: typeof assert
  printNode: typeof dumpNode
  printNodes: typeof dumpNodes
  /** so we are able to cast in JavaScript at least for not showing errors so typechecking for other stuff don't screw up  */
  asAny: (obj: any) => any
  // hostEmitter:  EventEmitter
  // guestEmitter:  EventEmitter
}


export class EvalContextUtilImpl implements EvalContextUtil {
  constructor(){
    // this.hostEmitter = (global as any).hostEmitter
    // this.guestEmitter = (global as any). guestEmitter 
  }
  printAst(node: Node | ts.Node, getChildrenMode: boolean = false): string {
    return dumpAst((node as any).compilerNode || node, getChildrenMode)
  }
  hostEmitter:  EventEmitter
  guestEmitter: EventEmitter
  positionOrRangeToRange = positionOrRangeToRange
  positionOrRangeToNumber = positionOrRangeToNumber
  findChildContainingRange = findChildContainingRange
  findChildContainingPosition = findChildContainingPosition
  nodeAtCursor = findChildContainingPosition
  getDiagnosticsInCurrentLocation = getDiagnosticsInCurrentLocation
  getKindName = getKindName
  findAscendant = findAscendant
  filterChildren = filterChildren
  getAscendants = getAscendants
  findChild = (n: ts.Node, predicate: (n: ts.Node) => boolean): ts.Node | undefined => findChild(n, predicate, false)
  findDescendants = findChild
  assert = assert
  printNode = dumpNode
  printNodes = dumpNodes
  asAny(obj: any): any { return obj as any }
}


// // what's these horrible things :  because I want other plugins to emit events globally so evalCode & cia can get this info and show it / simulate it to the editor's user
// (global as any).guestEmitter = new EventEmitter();
// (global as any).hostEmitter = new EventEmitter();
