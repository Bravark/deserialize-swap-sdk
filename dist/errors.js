"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyAccountsLockError = exports.handleSimulationError = void 0;
const handleSimulationError = (e) => {
    if (e.toString().includes("TooManyAccountLocks")) {
        throw new TooManyAccountsLockError("Too many account locks: consider using the option reduceToTwoHops in the options when getting the routes");
    }
};
exports.handleSimulationError = handleSimulationError;
class TooManyAccountsLockError extends Error {
    constructor(message) {
        super(message);
        this.name = "TooManyAccountsLockError";
    }
}
exports.TooManyAccountsLockError = TooManyAccountsLockError;
//# sourceMappingURL=errors.js.map