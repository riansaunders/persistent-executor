import { JobExecutor } from "./src/JobExecutor";

const executor = new JobExecutor(1000);

executor.addStep("hello_world", (params) => {
  if (params.retryCount < 1) {
    throw new Error("I am throwing this error just because I can.");
  }

  return params.next();
});

executor.once("stepThrewError", (e: Error) => {
  console.log(`[${executor.currentStep()}]: ${e.stack}`);
});

executor.once("finished", () => {
  console.log("Executor has finished.");
});

async function doExample() {
  return await executor.workOnCurrentStep();
}

doExample();
