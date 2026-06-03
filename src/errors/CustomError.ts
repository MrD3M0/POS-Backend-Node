export class CustomError extends Error {
  public status: number;
  public override message: string;

  constructor(message: string, status: number) {
    super(message);

    this.status = status;
    this.message = message;
    this.name = this.constructor.name;

    // Ensure the message property is enumerable and configurable
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  getErrorMessage() {
    return this.message;
  }
}

export class ValidationError extends Error {
  public status: number;
  public fields: Record<string, string[]>;

  constructor(
    fields: Record<string, string | string[] | Record<string, unknown>>,
    message: string = "Validation Error",
  ) {
    super(message);

    this.status = 422;
    this.message = message;

    // Normalize all field values to string arrays
    this.fields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value)) {
        this.fields[key] = value.map((v) => String(v));
      } else if (typeof value === "object" && value !== null) {
        this.fields[key] = [JSON.stringify(value)];
      } else {
        this.fields[key] = [String(value)];
      }
    }

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  getFields() {
    return this.fields;
  }
}
