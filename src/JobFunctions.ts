import { JobExecutor } from "./JobExecutor";
import { StepHandlerParams } from "./StepHandlerParams";

export type NextStepFunction = (
  step?: string,
  delay?: number
) => Promise<string>;

export type RetryStepFunction = (delay: number) => Promise<string>;

export type StepErrorFunction = (statusCode: string) => Promise<string>;

export type SetContextFunction = (context: any) => void;

export type AddStepFunction = (
  step: string,
  handler: (params: StepHandlerParams) => Promise<string>
) => void;

export interface StepContainer {
  retryCount?: number;
  step: string;
  executor?: JobExecutor;
  handle: (params: StepHandlerParams) => Promise<string>;
}
