import { TypedEmitter } from "tiny-typed-emitter";
import { JobExecutorEvents } from "./JobExecutorEvents";
import { StepHandlerParams } from "./StepHandlerParams";
import { StepContainer } from "./JobFunctions";

export interface JobExecutorOptions {
  delayModifier: (delay: number, error?: Error) => number;
}

export const Complete = "_complete";
export const Shutdown = "_shutdown";
export const Error = "_error";

export class JobExecutor extends TypedEmitter<JobExecutorEvents> {
  currentStepIdx: number = 0;
  previousStep?: string;
  stepHandlers: StepContainer[] = [];
  context: any;
  isShutdown: boolean = false;
  protected options?: JobExecutorOptions;

  constructor(public errorRetryingDelay: number, options?: JobExecutorOptions) {
    super();
    this.options = options;
  }

  shutdown() {
    this.isShutdown = true;
  }

  public async addStep(
    step: string,
    handler: (params: StepHandlerParams) => Promise<string>
  ) {
    const theNextStep = {
      step: step,
      handle: handler,
    };

    // add it to our list
    this.stepHandlers.push(theNextStep);
  }

  protected async goToNextStep(): Promise<string> {
    this.previousStep = this.stepHandlers[this.currentStepIdx].step;
    this.currentStepIdx = this.currentStepIdx + 1;
    this.emit("willProgressStep");

    return await this.workOnCurrentStep();
  }

  isFinished() {
    return this.currentStepIdx >= this.stepHandlers.length;
  }

  async workOnCurrentStep(
    isFromRetry: boolean = false,
    retryCount: number = 0,
    error?: Error
  ): Promise<string> {
    const container = this.stepHandlers[this.currentStepIdx];
    if (this.isShutdown) {
      return Promise.resolve(Complete);
    }
    if (!container) {
      this.emit("finished");
      return Promise.resolve(Complete);
    }
    this.emit("willStartStep", retryCount);

    if (isFromRetry) {
      this.emit("willRetryStep", retryCount, error);
    }

    try {
      return await container.handle({
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
          container.executor!.addStep(step, handler);
        },

        next: async (step, delay) => {
          // it has steps that have been added
          if (container.executor && !container.executor.isFinished()) {
            await container.executor.workOnCurrentStep();
          }

          if (step && delay) {
            return await this.goToStepWithDelay(step, delay);
          }
          if (step) {
            return await this.goToStep(step);
          }
          return await this.goToNextStep();
        },

        retry: async (delay) => {
          return await this.retryStep(delay, retryCount + 1);
        },
        error: async (message) => {
          return await this.stepError(message);
        },

        context: this.context,
        isFromRetry: isFromRetry,
        retryCount: retryCount,
        previousStep: this.previousStep,
        current: container.step,
      });
    } catch (e: any) {
      this.emit("stepThrewError", e);
      const delay = this.options
        ? this.options.delayModifier(this.errorRetryingDelay, e)
        : this.errorRetryingDelay;

      return this.retryStep(delay, retryCount + 1, e);
    }
  }

  protected getStepIndex(step: string) {
    const idx = this.stepHandlers.findIndex((h) => h.step === step);
    return idx;
  }

  protected async goToStep(step: string) {
    this.previousStep = this.stepHandlers[this.currentStepIdx].step;
    this.currentStepIdx = this.getStepIndex(step);
    return await this.workOnCurrentStep();
  }

  protected modifyDelay(delay: number, error?: Error) {
    return this.options ? this.options.delayModifier(delay, error) : delay;
  }

  protected async retryStep(
    timeout: number,
    retryCount?: number,
    error?: Error
  ): Promise<string> {
    return await new Promise((resolve) => {
      timeout = this.modifyDelay(timeout);
      setTimeout(
        async () =>
          resolve(await this.workOnCurrentStep(true, retryCount, error)),
        timeout
      );
    });
  }

  protected async goToStepWithDelay(
    step: string,
    delay: number
  ): Promise<string> {
    return await new Promise((resolve) => {
      delay = this.modifyDelay(delay);

      setTimeout(async () => resolve(await this.goToStep(step)), delay);
    });
  }

  protected stepError(message: string): Promise<string> {
    this.emit("finishedWithError", message);
    return Promise.resolve(Error);
  }

  public currentStep(): string {
    return this.stepHandlers[this.currentStepIdx]?.step;
  }
}

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
