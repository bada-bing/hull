import { logCurrentState, logEndDiffing, logStartDiffing } from "./diff-logger";
import { VText } from "./h";

export function withoutNullsOrUndefines<T>(
  nodes: (T | null | undefined)[],
): T[] {
  return nodes.filter((val) => val !== null && val !== undefined);
}

type Diff = {
  added: string[];
  removed: string[];
};

/**
 * Used by the reconciliation algorithm, i.e., patchDOM()
 * to compare the class list of two vNodes, i.e., old and new state of a vNode
 *
 * @param a old state
 * @param b new state
 * @returns diff, i.e., difference
 */
export function arraysDiff(a: string[], b: string[]): Diff {
  if (!Array.isArray(a)) throw new Error("a is not an array");
  if (!Array.isArray(b)) throw new Error("b is not an array");

  const added = b.filter((item) => !a.includes(item));
  const removed = a.filter((item) => !b.includes(item));

  return {
    added,
    removed,
  };
}

type Operation =
  | { operation: "remove"; item: string; index: number }
  | { operation: "noop"; item: string; originalIndex: number; index: number }
  | { operation: "add"; item: string; index: number }
  | {
      operation: "move";
      item: string;
      originalIndex: number;
      from: number;
      index: number;
    };

/**
 * Used by the reconciliation algorithm, i.e., patchDOM()
 * to compare the children of two vNodes, i.e., old and new state of a vNode
 *
 * The algorithm registers operations necessary to reconcile the `oldArray` and the `newArray`
 * -> it iterates through the list of items of the `newArray`
 * -> in each iteration it aims to make the `oldArray[idx]` same as `newArray[idx]`
 *
 * @param oldArray
 * @param newArray
 * @returns sequence of operation
 */
export function arraysDiffSequence<T extends string>(
  oldArray: T[],
  newArray: T[],
  equalsFn = (a: T, b: T) => a === b,
) {
  logStartDiffing();

  const listOfOperations: Operation[] = [];
  const currentState = new ArrayWithOriginalIndices(oldArray, equalsFn);

  logCurrentState(currentState.array, newArray, listOfOperations);

  //TODO confirm: this is a temporary fix for an implementation error of the algorithm from the book
  if (newArray.length < 1) throw new Error("the new array is empty!");

  // iterate through indices of newArray,
  // in each iteration reconcile the current item in old array with the item in new array
  for (let idx = 0; idx < newArray.length; idx++) {
    const newItem = newArray[idx];
    const oldItem = currentState.array[idx];

    // if there is no item in the "old" array at current position, we need to add it
    if (!oldItem) {
      const addOp = currentState.addItem(newItem, idx);
      listOfOperations.push(addOp);
    } else {
      // if items are same, it is noop!
      if (equalsFn(newItem, oldItem)) {
        const noop = currentState.noop(idx);
        listOfOperations.push(noop);
      } else {
        // if newArray doesn't include the 'oldItem', it needs to be removed
        if (!newArray.includes(oldItem)) {
          const removeOp = currentState.removeItem(idx);
          listOfOperations.push(removeOp);
          idx--; // start again from idx, without iterating (because newItem didn't change, but oldItem did)
          logCurrentState(currentState.array, newArray, listOfOperations);
          continue;
        }

        // if items are different, and oldArray includes new Item -> it means that item moved
        if (currentState.array.includes(newItem, idx + 1)) {
          const moveOperation = currentState.moveItem(newItem, idx)
          listOfOperations.push(moveOperation);
        } else {
          // if the items are different, and the oldArray doesn't include the new Item, it means the item is added
          const addOperation = currentState.addItem(newItem, idx);
          listOfOperations.push(addOperation);
        }
      }
    }
    logCurrentState(currentState.array, newArray, listOfOperations);
  }

  while (currentState.array.length > newArray.length) {
    const removeOp = currentState.removeItem(newArray.length)
    listOfOperations.push(removeOp);
    logCurrentState(currentState.array, newArray, listOfOperations);
  }

  logEndDiffing(listOfOperations);
  return listOfOperations;
}

/**
 * reconciliation array
 * an array which starts as an old array
 * and in each iteration is one step closer to being new array
 *
 * wrapper around an array that keeps track of the original indices of items
 * as they move around
 *
 * it tracks items as they move. It answers the question:
 * "Where did the item that is now at index X come from in the original array?"
 *
 * it tracks the original (starting) position of an item,
 * so algorithm can distinguish between an item that needs to be
 * actively moved (a MOVE operation) and an item that just shifted forwards or backwards
 * because other items were added or removed around it (a NOOP operation).
 */
class ArrayWithOriginalIndices<T extends string> {
  #array: T[]; // array that gets modified
  #orignalIndices: number[]; // stays in sync with the 'array' but keeps track of the original indices
  #equalsFn: (a: T, b: T) => boolean;

  constructor(originalArray: T[], equalsFn: (a: T, b: T) => boolean) {
    this.#array = [...originalArray];
    this.#orignalIndices = originalArray.map((_, idx) => idx);
    this.#equalsFn = equalsFn;
  }

  // only for logging purposes
  get array() {
    return this.#array;
  }

  // get length() {
  //   return this.#array.length;
  // }

  getOriginalIndex(index: number) {
    return this.#orignalIndices[index];
  }

  getFromIndex(item: T, startPosition: number) {
    for (let i = startPosition; i < this.#array.length; i++) {
      if (this.#equalsFn(item, this.#array[i])) return i;
    }
    return -1;
  }

  addItem(item: T, index: number): Operation {
    this.#array.splice(index, 0, item);
    // the item doesn't exist in old array, so there is no idx for it
    this.#orignalIndices.splice(index, 0, -1);

    return {
      operation: "add",
      index,
      item,
    };
  }

  noop(index: number): Operation {
    return {
      operation: "noop",
      index,
      item: this.array[index],
      originalIndex: this.getOriginalIndex(index),
    };
  }

  removeItem(index: number): Operation {
    const [item] = this.#array.splice(index, 1);

    // length of #originalIndices stays in sync with #array
    // items which are removed are irrelevant, and we don't keep their original indices
    this.#orignalIndices.splice(index, 1);

    return {
      operation: "remove",
      index,
      item,
    };
  }

  moveItem(item: T, toIndex: number): Operation {
    // if oldItem is not same as newItem, but oldArray includes newItem

    const fromIndex = this.getFromIndex(item, toIndex + 1); // where is item in current array

    const moveOperation: Operation = {
      operation: "move",
      originalIndex: this.getOriginalIndex(fromIndex),
      from: fromIndex,
      index: toIndex,
      item,
    };

    this.#array.splice(fromIndex, 1); // remove from old position
    this.#array.splice(toIndex, 0, item); // insert into new position

    // keep position and length of #originalIndices in sync with #array
    const [originalIndex] = this.#orignalIndices.splice(fromIndex, 1)
    this.#orignalIndices.splice(toIndex, 0, originalIndex)

    return moveOperation
  }
}
