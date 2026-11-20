"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingService = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const queryFilters_1 = require("@/utils/queryFilters");
const CustomError_1 = require("@/errors/CustomError");
const settings_1 = require("@/lib/settings");
exports.SettingService = {
    async index(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = (0, queryFilters_1.resolvePageLimit)(query.limit, 10);
        const skip = limit === -1 ? 0 : (page - 1) * limit;
        const whereClause = { deletedAt: null };
        if (query.search) {
            whereClause.OR = [
                { key: { contains: query.search, mode: "insensitive" } },
                { value: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [settings, total] = await Promise.all([
            prismaClient_1.prismaMain.setting.findMany({
                where: whereClause,
                skip,
                take: (0, queryFilters_1.toPrismaTake)(limit),
                orderBy: { createdAt: "desc" },
            }),
            prismaClient_1.prismaMain.setting.count({ where: whereClause }),
        ]);
        return { settings, pagination: { page, limit, total } };
    },
    async create(data, userId) {
        // Typed registry: only known keys with valid values may be created
        (0, settings_1.assertKnownSettingKey)(data.key);
        (0, settings_1.validateSettingValue)(data.key, data.value);
        const existing = await prismaClient_1.prismaMain.setting.findFirst({
            where: { key: data.key, deletedAt: null },
        });
        if (existing)
            throw new CustomError_1.CustomError("A setting with this key already exists", 409);
        try {
            const setting = await prismaClient_1.prismaMain.setting.create({
                data: { ...data, createdBy: userId },
            });
            (0, settings_1.invalidateSettingCache)(data.key);
            return setting;
        }
        catch (error) {
            if (error.code === "P2002")
                throw new CustomError_1.CustomError("A setting with this key already exists", 409);
            throw error;
        }
    },
    async getById(id) {
        const setting = await prismaClient_1.prismaMain.setting.findFirst({
            where: { id, deletedAt: null },
        });
        if (!setting)
            throw new CustomError_1.CustomError("Setting not found", 404);
        return setting;
    },
    async getByKey(key) {
        (0, settings_1.assertKnownSettingKey)(key);
        const setting = await prismaClient_1.prismaMain.setting.findFirst({
            where: { key, deletedAt: null },
        });
        if (!setting)
            throw new CustomError_1.CustomError("Setting not found", 404);
        return setting;
    },
    /**
     * Creates or updates a setting by key. Registry defaults have no stored row
     * yet, so the settings screen saves through this instead of PATCH /:id.
     */
    async upsertByKey(key, value, userId, role) {
        (0, settings_1.assertKnownSettingKey)(key);
        // A principal owns the college identity (name, logo, contacts, ID cards)
        // but not attendance / payroll / fee behaviour.
        if (role === "PRINCIPAL" && (0, settings_1.getSettingDefinition)(key).group !== "college") {
            throw new CustomError_1.CustomError("A principal may only change college identity settings", 403);
        }
        (0, settings_1.validateSettingValue)(key, value);
        const existing = await prismaClient_1.prismaMain.setting.findFirst({
            where: { key, deletedAt: null },
        });
        const saved = existing
            ? await prismaClient_1.prismaMain.setting.update({
                where: { id: existing.id },
                data: { value, updatedBy: userId },
            })
            : await prismaClient_1.prismaMain.setting.create({
                data: { key, value, createdBy: userId },
            });
        (0, settings_1.invalidateSettingCache)(key);
        return saved;
    },
    /** Typed registry view (definitions + defaults merged with stored rows). */
    async effective() {
        return (0, settings_1.listEffectiveSettings)();
    },
    /**
     * College identity used on printed documents (student ID cards). Open to
     * every signed-in user because it is public identity, not configuration.
     */
    async institution() {
        const settings = await (0, settings_1.listEffectiveSettings)();
        const values = new Map(settings.map((setting) => [setting.key, setting.value]));
        const text = (key) => values.get(key) ?? "";
        const programmes = text("COLLEGE_PROGRAMMES")
            .split(",")
            .map((programme) => programme.trim())
            .filter(Boolean);
        return {
            affiliation: text("COLLEGE_AFFILIATION"),
            name: text("COLLEGE_NAME"),
            address: text("COLLEGE_ADDRESS"),
            phone: text("COLLEGE_PHONE"),
            since: text("COLLEGE_SINCE"),
            website: text("COLLEGE_WEBSITE"),
            email: text("COLLEGE_EMAIL"),
            pan: text("COLLEGE_PAN"),
            programmes,
            logoUrl: text("COLLEGE_LOGO_URL"),
            signatureUrl: text("COLLEGE_SIGNATURE_URL"),
            signatureLabel: text("COLLEGE_SIGNATURE_LABEL") || "Principal",
        };
    },
    async update(id, data, userId, role) {
        const existing = await prismaClient_1.prismaMain.setting.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Setting not found", 404);
        // Key changes are forbidden — keys are registry identifiers, not free text
        if (data.key && data.key !== existing.key) {
            throw new CustomError_1.CustomError("Setting key cannot be changed", 400);
        }
        if (role === "PRINCIPAL" && (0, settings_1.getSettingDefinition)(existing.key).group !== "college") {
            throw new CustomError_1.CustomError("A principal may only change college identity settings", 403);
        }
        if (data.value !== undefined) {
            (0, settings_1.validateSettingValue)(existing.key, data.value);
        }
        try {
            const updated = await prismaClient_1.prismaMain.setting.update({
                where: { id },
                data: {
                    ...(data.value !== undefined ? { value: data.value } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    updatedBy: userId,
                },
            });
            (0, settings_1.invalidateSettingCache)(existing.key);
            return updated;
        }
        catch (error) {
            if (error.code === "P2002")
                throw new CustomError_1.CustomError("A setting with this key already exists", 409);
            throw error;
        }
    },
    async delete(id, userId) {
        const existing = await prismaClient_1.prismaMain.setting.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new CustomError_1.CustomError("Setting not found", 404);
        await prismaClient_1.prismaMain.setting.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        (0, settings_1.invalidateSettingCache)(existing.key);
        return null;
    },
};
