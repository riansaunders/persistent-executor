import {
  AddStepFunction,
  NextStepFunction,
  RetryStepFunction,
  SetContextFunction,
  StepErrorFunction,
} from "./JobFunctions";

export interface StepHandlerParams {
  next: NextStepFunction;
  retry: RetryStepFunction;
  error: StepErrorFunction;
  setContext: SetContextFunction;

  addAsyncStep: AddStepFunction;

  context: any;
  isFromRetry: boolean;
  retryCount: number;
  current: string;
  previousStep?: string;
}
