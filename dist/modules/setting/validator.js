"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSettingValueBody = exports.validateSettingUpdate = exports.validateSettingCreate = exports.settingValueSchema = exports.settingUpdateInputSchema = exports.settingCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.settingCreateInputSchema = zod_1.z.object({
    key: zod_1.z.string().min(1, "Setting key is required").max(100, "Setting key is too long"),
    // String settings may be cleared (e.g. an empty college phone). Number and
    // enum values are still required by the registry validation.
    value: zod_1.z.string().max(5000, "Setting value is too long"),
    description: zod_1.z.string().max(500, "Description too long").optional().nullable(),
});
exports.settingUpdateInputSchema = exports.settingCreateInputSchema.partial();
/** Body for PUT /settings/key/:key — the registry validates the value against the key. */
exports.settingValueSchema = zod_1.z.object({
    value: zod_1.z.string().max(5000, "Setting value is too long"),
});
const validateSettingCreate = (data) => {
    return exports.settingCreateInputSchema.parse(data);
};
exports.validateSettingCreate = validateSettingCreate;
const validateSettingUpdate = (data) => {
    return exports.settingUpdateInputSchema.parse(data);
};
exports.validateSettingUpdate = validateSettingUpdate;
const validateSettingValueBody = (data) => {
    return exports.settingValueSchema.parse(data);
};
exports.validateSettingValueBody = validateSettingValueBody;
