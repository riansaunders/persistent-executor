"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncJobExecutor = exports.JobExecutor = exports.Error = exports.Shutdown = exports.Complete = void 0;
var tiny_typed_emitter_1 = require("tiny-typed-emitter");
exports.Complete = "_complete";
exports.Shutdown = "_shutdown";
exports.Error = "_error";
var JobExecutor = /** @class */ (function (_super) {
    __extends(JobExecutor, _super);
    function JobExecutor(errorRetryingDelay, options) {
        var _this = _super.call(this) || this;
        _this.errorRetryingDelay = errorRetryingDelay;
        _this.currentStepIdx = 0;
        _this.stepHandlers = [];
        _this.isShutdown = false;
        _this.options = options;
        return _this;
    }
    JobExecutor.prototype.shutdown = function () {
        this.isShutdown = true;
    };
    JobExecutor.prototype.addStep = function (step, handler) {
        return __awaiter(this, void 0, void 0, function () {
            var theNextStep;
            return __generator(this, function (_a) {
                theNextStep = {
                    step: step,
                    handle: handler,
                };
                // add it to our list
                this.stepHandlers.push(theNextStep);
                return [2 /*return*/];
            });
        });
    };
    JobExecutor.prototype.goToNextStep = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.previousStep = this.stepHandlers[this.currentStepIdx].step;
                        this.currentStepIdx = this.currentStepIdx + 1;
                        this.emit("willProgressStep");
                        return [4 /*yield*/, this.workOnCurrentStep()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JobExecutor.prototype.isFinished = function () {
        return this.currentStepIdx >= this.stepHandlers.length;
    };
    JobExecutor.prototype.workOnCurrentStep = function (isFromRetry, retryCount, error) {
        if (isFromRetry === void 0) { isFromRetry = false; }
        if (retryCount === void 0) { retryCount = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var container, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("helloooo");
                        container = this.stepHandlers[this.currentStepIdx];
                        if (this.isShutdown) {
                            return [2 /*return*/, Promise.resolve(exports.Complete)];
                        }
                        if (!container) {
                            this.emit("finished");
                            return [2 /*return*/, Promise.resolve(exports.Complete)];
                        }
                        this.emit("willStartStep", retryCount);
                        if (isFromRetry) {
                            this.emit("willRetryStep", retryCount, error);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, container
                                .handle({
                                setContext: function (context) {
                                    _this.context = context;
                                },
                                addAsyncStep: function (step, handler) {
                                    if (!container.executor) {
                                        container.executor = new AsyncJobExecutor(_this.errorRetryingDelay, _this.options);
                                    }
                                    container.executor.addStep(step, handler);
                                },
                                next: function (step, delay) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(container.executor && !container.executor.isFinished())) return [3 /*break*/, 2];
                                                return [4 /*yield*/, container.executor.workOnCurrentStep()];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2:
                                                console.log("Next!");
                                                if (!(step && delay)) return [3 /*break*/, 4];
                                                return [4 /*yield*/, this.goToStepWithDelay(step, delay)];
                                            case 3: return [2 /*return*/, _a.sent()];
                                            case 4:
                                                if (!step) return [3 /*break*/, 6];
                                                return [4 /*yield*/, this.goToStep(step)];
                                            case 5: return [2 /*return*/, _a.sent()];
                                            case 6: return [4 /*yield*/, this.goToNextStep()];
                                            case 7: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                retry: function (delay) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.retryStep(delay, retryCount + 1)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                error: function (message) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.stepError(message)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                context: this.context,
                                isFromRetry: isFromRetry,
                                retryCount: retryCount,
                                previousStep: this.previousStep,
                                current: container.step,
                            })
                                .catch(function (e) {
                                console.log("Eror lol");
                                _this.emit("stepThrewError", e);
                                var delay = _this.options
                                    ? _this.options.delayModifier(_this.errorRetryingDelay, e)
                                    : _this.errorRetryingDelay;
                                return _this.retryStep(delay, retryCount + 1, e);
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        err_1 = _a.sent();
                        console.log("WTF", err_1);
                        return [2 /*return*/, exports.Complete];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    JobExecutor.prototype.getStepIndex = function (step) {
        var idx = this.stepHandlers.findIndex(function (h) { return h.step === step; });
        return idx;
    };
    JobExecutor.prototype.goToStep = function (step) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.previousStep = this.stepHandlers[this.currentStepIdx].step;
                        this.currentStepIdx = this.getStepIndex(step);
                        return [4 /*yield*/, this.workOnCurrentStep()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JobExecutor.prototype.modifyDelay = function (delay, error) {
        return this.options ? this.options.delayModifier(delay, error) : delay;
    };
    JobExecutor.prototype.retryStep = function (timeout, retryCount, error) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            timeout = _this.modifyDelay(timeout);
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = resolve;
                                        return [4 /*yield*/, this.workOnCurrentStep(true, retryCount, error)];
                                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                }
                            }); }); }, timeout);
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JobExecutor.prototype.goToStepWithDelay = function (step, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            delay = _this.modifyDelay(delay);
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = resolve;
                                        return [4 /*yield*/, this.goToStep(step)];
                                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                }
                            }); }); }, delay);
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JobExecutor.prototype.stepError = function (message) {
        this.emit("finishedWithError", message);
        return Promise.resolve(exports.Error);
    };
    JobExecutor.prototype.currentStep = function () {
        var _a;
        return (_a = this.stepHandlers[this.currentStepIdx]) === null || _a === void 0 ? void 0 : _a.step;
    };
    return JobExecutor;
}(tiny_typed_emitter_1.TypedEmitter));
exports.JobExecutor = JobExecutor;
var AsyncJobExecutor = /** @class */ (function (_super) {
    __extends(AsyncJobExecutor, _super);
    function AsyncJobExecutor(errorRetryingDelay, options) {
        var _this = _super.call(this, errorRetryingDelay, options) || this;
        _this.errorRetryingDelay = errorRetryingDelay;
        _this.finished = false;
        return _this;
    }
    AsyncJobExecutor.prototype.makeParams = function (container, onComplete) {
        var _this = this;
        return {
            setContext: function (context) {
                _this.context = context;
            },
            addAsyncStep: function (step, handler) {
                if (!container.executor) {
                    container.executor = new AsyncJobExecutor(_this.errorRetryingDelay, _this.options);
                }
                container.executor.addStep(step, handler);
            },
            next: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(container.executor && !container.executor.isFinished())) return [3 /*break*/, 2];
                            return [4 /*yield*/, container.executor.workOnCurrentStep()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            onComplete();
                            return [2 /*return*/, exports.Complete];
                    }
                });
            }); },
            retry: function (delay) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var timeout = _this.modifyDelay(delay);
                                container.retryCount = container.retryCount
                                    ? container.retryCount + 1
                                    : 1;
                                setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = resolve;
                                                return [4 /*yield*/, container.handle(this.makeParams(container, onComplete))];
                                            case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                        }
                                    });
                                }); }, timeout);
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
            error: function (message) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            onComplete();
                            return [4 /*yield*/, this.stepError(message)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
            context: this.context,
            isFromRetry: container.retryCount ? true : false,
            retryCount: container.retryCount || 0,
            previousStep: this.previousStep,
            current: container.step,
        };
    };
    AsyncJobExecutor.prototype.isFinished = function () {
        return this.finished;
    };
    AsyncJobExecutor.prototype.shutdown = function () {
        _super.prototype.shutdown.call(this);
        this.finished = true;
    };
    AsyncJobExecutor.prototype.workOnCurrentStep = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promises, _loop_1, _i, _a, container;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        promises = [];
                        _loop_1 = function (container) {
                            promises.push(new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                                var onComplete, goHandler;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            onComplete = function () { return resolve(exports.Complete); };
                                            goHandler = function () { return __awaiter(_this, void 0, void 0, function () {
                                                var e_1;
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (this.isShutdown || this.isFinished()) {
                                                                resolve(exports.Complete);
                                                                return [2 /*return*/];
                                                            }
                                                            _a.label = 1;
                                                        case 1:
                                                            _a.trys.push([1, 3, , 4]);
                                                            return [4 /*yield*/, container.handle(this.makeParams(container, onComplete))];
                                                        case 2:
                                                            _a.sent();
                                                            return [3 /*break*/, 4];
                                                        case 3:
                                                            e_1 = _a.sent();
                                                            this.emit("stepThrewError", e_1);
                                                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
                                                                switch (_b.label) {
                                                                    case 0:
                                                                        _a = resolve;
                                                                        return [4 /*yield*/, goHandler()];
                                                                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                                                                }
                                                            }); }); }, this.modifyDelay(this.errorRetryingDelay, e_1));
                                                            return [3 /*break*/, 4];
                                                        case 4: return [2 /*return*/];
                                                    }
                                                });
                                            }); };
                                            return [4 /*yield*/, goHandler()];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }));
                        };
                        for (_i = 0, _a = this.stepHandlers; _i < _a.length; _i++) {
                            container = _a[_i];
                            _loop_1(container);
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _b.sent();
                        this.finished = true;
                        this.emit("finished");
                        return [2 /*return*/, exports.Complete];
                }
            });
        });
    };
    return AsyncJobExecutor;
}(JobExecutor));
exports.AsyncJobExecutor = AsyncJobExecutor;
