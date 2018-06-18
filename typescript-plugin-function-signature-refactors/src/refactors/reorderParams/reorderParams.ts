import { CallExpression, Node, ReferenceFindableNode, SignaturedDeclaration, TypeGuards } from "ts-simple-ast";
import { getChildrenForEachChild, getName } from "typescript-plugin-util";

/**
 * collect al references of given node and returns those nodes that need to be refactored
 */
function getAllCallsExpressions(targetDeclaration: Node & ReferenceFindableNode, log: (msg: string) => void): ((CallExpression | SignaturedDeclaration) & Node)[] {
  const calls: (Node & (CallExpression | SignaturedDeclaration))[] = []
  for (const referencedSymbol of targetDeclaration.findReferences()) {
    for (const reference of referencedSymbol.getReferences()) {
      const parent = reference.getNode().getParent()
      const extras = [parent, parent.getParent && parent.getParent(), targetDeclaration]
      const collection = (extras.concat(getChildrenForEachChild(parent)))
        .filter((value, pos, arr) => arr.indexOf(value) === pos)
      const found = collection
        .find(p =>
          (!getName(p) || getName(targetDeclaration) === getName(p)) &&
          (TypeGuards.isCallExpression(p) || TypeGuards.isSignaturedDeclaration(p))
        ) as (CallExpression | SignaturedDeclaration) & Node
      if (found) {
        calls.push(found)
      }
      else {
        log('getAllCallsExpressions ignoring reference parent: ' + parent.getKindName() +
          ' ref: ' + reference.getNode().getKindName() +
          ', chh ' + parent.getChildren().map(c => c.getKindName()).join(', ') +
          ' ancestors: ' + parent.getAncestors().map(c => c.getKindName()).join(', ')
        )
      }
    }
  }
  return calls.filter((value, pos, arr) => arr.indexOf(value) === pos)
}

/**
 * For all references that must be refactored calls changeCallArgs.
 * 
 * TODO: check that user is not removing parameters. For example, this is invalid in a three 
 * parameter function : [1, 2] 
 * because the first parameter will be removed. Or throw exception or touch the reorder argument so it contains them all 
 * @param targetDeclaration the function-like declaration to reorder its parameters
 * @param reorder [1,0] means switching the positions between first and second params
 */
export function reorderParameters(node: Node, reorder: number[], log: (msg: string) => void) {
  if (TypeGuards.isReferenceFindableNode(node)) {
    getAllCallsExpressions(node, log).forEach(call => {
      if (TypeGuards.isCallExpression(call)) {
        changeCallArgs(reorder, call.getArguments(), log)
      }
      else {
        changeCallArgs(reorder, call.getParameters(), log)
      }
    })
  }
  else {// if(TypeGuards.isConstructorDeclaration(node)) {
    console.log('!TypeGuards.isReferenceFindableNode(node) ' + node.getText());

    //TODO: find interface constructor implememted by this one and rename that one and then run this function calling it with node.getAncestors().find(TypeGuards.isReferenceFindableNode) to rename new A calls
    return []
  }
}

function changeCallArgs(reorder: ReadonlyArray<number>, args: ReadonlyArray<Node>, log: (msg: string) => void) {
  type T = { index: number, arg: string, name: string }

  // will use indexOccupied to reasign new positions to those nodes that must move implicitly
  let indexOccupied = new Array(args.length).fill(-1)
  reorder.forEach((r, i) => {
    if (r >= indexOccupied.length) {
      //user error provided incorrect reorder array
    }
    indexOccupied[r] = i
  })
  function findNextFreeIndexFor(index) {
    const id = indexOccupied.indexOf(-1)
    indexOccupied[id] = index
    return id
  }
  // reorderedArgs will have metadata regarding the new params/args locations
  let reorderedArgs: T[] = args.map((arg, i) => {
    if (i < reorder.length) {
      return {
        index: reorder[i],
        arg: arg.getText(),
        name: getName(arg)
      }
    }
  }).filter(a => !!a)

  // missingArgs contains  metadata regarding those nodes that must implicitly move
  const missingArgs: T[] = args.map((arg, index) => {
    if (index >= reorder.length) {
      const newIndex = findNextFreeIndexFor(index)
      return {
        index: newIndex,
        arg: arg.getText(),
        name: getName(arg)
      }
    }
  }).filter(a => !!a)
  reorderedArgs = reorderedArgs.concat(missingArgs)
  // store movements metadata here so we move all together at the end (performance - avoid conflicts)
  const replacements = []
  args.forEach((a, index) => {
    const arg = reorderedArgs.find(r => r.index === index)
    if (arg) {
      replacements.push({ node: args[arg.index], text: arg.arg })
    } else {
      log('changeCallArgs ignoring arg: ' + a.getKindName() + ' - text: ' + a.getText())
    }
  })
  for (const r of replacements) {
    r.node.replaceWithText(r.text)
  }
}
