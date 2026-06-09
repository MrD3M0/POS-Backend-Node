"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.CustomError = void 0;
class CustomError extends Error {
    status;
    message;
    constructor(message, status) {
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
exports.CustomError = CustomError;
class ValidationError extends Error {
    status;
    fields;
    constructor(fields, message = "Validation Error") {
        super(message);
        this.status = 422;
        this.message = message;
        // Normalize all field values to string arrays
        this.fields = {};
        for (const [key, value] of Object.entries(fields)) {
            if (Array.isArray(value)) {
                this.fields[key] = value.map((v) => String(v));
            }
            else if (typeof value === "object" && value !== null) {
                this.fields[key] = [JSON.stringify(value)];
            }
            else {
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
exports.ValidationError = ValidationError;
