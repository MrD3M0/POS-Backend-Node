"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = require("@/lib/prismaClient");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const response_1 = require("@/utils/response");
const validator_1 = require("./validator");
const CustomError_1 = require("@/errors/CustomError");
const CategoryController = {
    index: async (req, res) => {
        try {
            // Get the user info from the response locals
            const context = res.locals.context;
            // Get the user id from the context
            const userId = context.userId;
            // Get the request query for pagination and search
            const { limit, page, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            // Get the Data from the database
            const { skip, take } = (0, queryFilters_1.calculateSkipAndTake)(pageNumber, limitNumber);
            const searchTerm = typeof search === "string" ? search : "";
            // Fetch categories from the database
            const categories = await prismaClient_1.prismaMain.category.findMany({
                where: {
                    name: searchTerm ? { contains: searchTerm } : undefined,
                    userId,
                },
                skip,
                take,
            });
            // Get the total count of the category without pagination
            const totalCategory = await prismaClient_1.prismaMain.category.count({
                where: {
                    name: searchTerm ? { contains: searchTerm } : undefined,
                    userId,
                },
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Categories fetched successfully!",
                data: {
                    data: categories,
                    pagination: {
                        page: page || 1,
                        limit: limit || 15,
                        total: totalCategory,
                    },
                },
            });
        }
        catch (error) {
            // Handle errors
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            // Get the user info from the response locals
            const context = res.locals.context;
            // Get the user id from the context
            const userId = context.userId;
            // Validated the data from the User
            const { name, shortName } = (0, validator_1.validateCategoryCreate)(req.body);
            // Validating whether the Category Name Exists or Not
            const existingCategoryByName = await prismaClient_1.prismaMain.category.findFirst({
                where: { name },
            });
            if (existingCategoryByName)
                throw new CustomError_1.ValidationError({
                    name: "Category with the same name already exists",
                });
            // Validating whether the Category ShortName Exists or Not
            const existingCategoryByShortName = await prismaClient_1.prismaMain.category.findFirst({
                where: { shortName },
            });
            if (existingCategoryByShortName)
                throw new CustomError_1.ValidationError({
                    name: "Category with the same short name already exists",
                });
            //Create the Category
            const category = await prismaClient_1.prismaMain.category.create({
                data: {
                    name,
                    shortName,
                    userId,
                },
            });
            // Return the response
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Category created successfully",
                data: category,
            });
        }
        catch (error) {
            // If error occus, handle the error
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            // Get the parameter from the Url
            const categoryId = req.params.id;
            // Validating Where categoryId exists or not
            const category = await prismaClient_1.prismaMain.category.findUnique({
                where: { id: categoryId },
            });
            // if meal not found, throw error
            if (!category)
                throw new CustomError_1.CustomError("Category not found", 404);
            response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Category fetched successfully",
                data: category,
            });
        }
        catch (error) {
            // If error occus, handle the error
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            // Get parameter from the URL
            const categoryId = req.params.id;
            // Validate the data from the request body
            const data = (0, validator_1.validateCategoryCreate)(req.body);
            // Get the existing Data by using Category Id
            const existingCategory = await prismaClient_1.prismaMain.category.findUnique({
                where: { id: categoryId },
            });
            // If Category not found, throw error
            if (!existingCategory)
                throw new CustomError_1.CustomError("Category not Found", 404);
            // If name and shortName already exist in the db throw error
            const existingCategoryByName = await prismaClient_1.prismaMain.category.findFirst({
                where: { name: data.name },
            });
            if (!!existingCategoryByName &&
                existingCategory.name !== existingCategoryByName.name)
                throw new CustomError_1.ValidationError({
                    name: "Category with the same name already exists",
                });
            const existingCategoryByShortName = await prismaClient_1.prismaMain.category.findFirst({
                where: { shortName: data.shortName },
            });
            if (!!existingCategoryByShortName &&
                existingCategory.id !== existingCategoryByShortName.id)
                throw new CustomError_1.ValidationError({
                    shortName: "Category with the same short name already exists",
                });
        }
        catch (error) {
            // If error occus, handle the error
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
exports.default = CategoryController;
