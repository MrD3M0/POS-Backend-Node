import { prismaMain } from "@/lib/prismaClient";
import { ErrorHandler } from "@/utils/error";
import { calculateSkipAndTake, queryFilters } from "@/utils/queryFilters";
import { ResponseHandler } from "@/utils/response";
import { Request, Response } from "express";
import { create } from "node_modules/axios/index.cjs";
import { validateCategoryCreate } from "./validator";
import { ValidationError } from "@/errors/CustomError";

const CategoryController = {
  retrieve: async (req: Request, res: Response) => {
    try {
      // Get the user info from the response locals
      const context = res.locals.context;

      // Get the user id from the context
      const userId = context.userId;

      // Get the request body for pagination and search
      const { limit, page, search } = req.body;

      // Get the Data from the database
      const { skip, take } = calculateSkipAndTake(page, limit);

      // Fetch categories from the database
      const categories = await prismaMain.category.findMany({
        where: {
          name: search ? { contains: search } : undefined,
          userId,
        },
        skip,
        take,
      });

      // Get the total count of the category without pagination
      const totalCategory = await prismaMain.category.count({
        where: { name: search ? { contains: search } : undefined, userId },
      });

      return ResponseHandler.success({
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
    } catch (error) {
      // Handle errors
      return ErrorHandler.handleError(res, error);
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      console.log(" I am inside create");
      // Get the user info from the response locals
      const context = res.locals.context;

      // Get the user id from the context
      const userId = context.userId;

      // Validated the data from the User
      const { name, shortName } = validateCategoryCreate(req.body);

      // Validating whether the Category Name Exists or Not
      const existingCategoryByName = await prismaMain.category.findFirst({
        where: { name },
      });
      if (existingCategoryByName)
        throw new ValidationError({
          name: "Category with the same name already exists",
        });

      // Validating whether the Category ShortName Exists or Not
      const existingCategoryByShortName = await prismaMain.category.findFirst({
        where: { shortName },
      });
      if (existingCategoryByShortName)
        throw new ValidationError({
          name: "Category with the same short name already exists",
        });

      //Create the Category
      const category = await prismaMain.category.create({
        data: {
          name,
          shortName,
          userId,
        },
      });
      // Return the response
      return ResponseHandler.success({
        res,
        code: 201,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      // If error occus, handle the error
      return ErrorHandler.handleError(res, error);
    }
  },
};

export default CategoryController;
