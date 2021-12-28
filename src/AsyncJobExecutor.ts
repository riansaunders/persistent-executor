import { StepHandlerParams } from "./StepHandlerParams";
import { StepContainer } from "./JobFunctions";

import { Complete, JobExecutor, JobExecutorOptions } from "./JobExecutor";

export class AsyncJobExecutor extends JobExecutor {
  finished: boolean = false;
  constructor(public errorRetryingDelay: number, options?: JobExecutorOptions) {
    super(errorRetryingDelay, options);
  }

  private makeParams(
    container: StepContainer,
    onComplete: () => void
  ): StepHandlerParams {
    return {
      setContext: (context) => {
        this.context = context;
      },

      addAsyncStep: (step, handler) => {
        if (!container.executor) {
          container.executor = new AsyncJobExecutor(
            this.errorRetryingDelay,
            this.options
          );
        }
        container.executor.addStep(step, handler);
      },

      next: async () => {
        // it has steps that have been added
        if (container.executor && !container.executor.isFinished()) {
          await container.executor.workOnCurrentStep();
        }
        onComplete();
        return Complete;
      },

      retry: async (delay) => {
        return await new Promise((resolve) => {
          const timeout = this.modifyDelay(delay);
          container.retryCount = container.retryCount
            ? container.retryCount + 1
            : 1;
          setTimeout(
            async () =>
              resolve(
                await container.handle(this.makeParams(container, onComplete))
              ),
            timeout
          );
        });
      },
      error: async (message) => {
        onComplete();
        return await this.stepError(message);
      },

      context: this.context,
      isFromRetry: container.retryCount ? true : false,
      retryCount: container.retryCount || 0,
      previousStep: this.previousStep,
      current: container.step,
    };
  }

  isFinished(): boolean {
    return this.finished;
  }

  shutdown() {
    super.shutdown();
    this.finished = true;
  }

  async workOnCurrentStep(): Promise<string> {
    const promises: Promise<any>[] = [];

    for (let container of this.stepHandlers) {
      promises.push(
        new Promise(async (resolve) => {
          const onComplete = () => resolve(Complete);

          const goHandler = async () => {
            if (this.isShutdown || this.isFinished()) {
              resolve(Complete);
              return;
            }
            try {
              await container.handle(this.makeParams(container, onComplete));
            } catch (e: any) {
              this.emit("stepThrewError", e);
              setTimeout(
                async () => resolve(await goHandler()),
                this.modifyDelay(this.errorRetryingDelay, e)
              );
            }
          };
          await goHandler();
        })
      );
    }

    await Promise.all(promises);
    this.finished = true;
    this.emit("finished");

    return Complete;
  }
}
