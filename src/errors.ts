export const handleSimulationError = (e: string | {}) => {
  if (e.toString().includes("TooManyAccountLocks")) {
    throw new TooManyAccountsLockError(
      "Too many account locks: consider using the option reduceToTwoHops in the options when getting the routes"
    );
  }
};
export class TooManyAccountsLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TooManyAccountsLockError";
  }
}
