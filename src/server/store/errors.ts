/** An error the user should see, with the HTTP status the route should return. */
export class StoreError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StoreError";
  }
}

export const notFound = (what: string) => new StoreError(404, `${what} not found`);
