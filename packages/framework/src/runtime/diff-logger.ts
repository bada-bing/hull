
export const ENABLE_DIFF_LOGS = false;

const log = (...args: any[]) => {
  if (ENABLE_DIFF_LOGS) {
    console.debug(...args);
  }
};

function getPreviousStepsText(operations: any[]): string {
  return operations.map((op) => op.operation).join(" > ");
}

function logSeparator() {
  log("------");
}

export function logStartDiffing() {
  log("Start Diffing");
}

export function logCurrentState(
  currentOldArray: string[],
  currentNewArray: string[],
  operations: any[],
) {
  log(`Steps so far: ${getPreviousStepsText(operations)}`);
  log("current:", currentOldArray);
  log("desired:", currentNewArray);
  logSeparator();
}

export function logEndDiffing(operations: any[]) {
  const finalResultText = getPreviousStepsText(operations);
  log("End Diffing: ", finalResultText);
}
