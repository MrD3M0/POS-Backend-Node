import { prismaMain } from "@/lib/prismaClient";
import { CustomError, ValidationError } from "@/errors/CustomError";
import { T_CategoryCreateInput } from "./validator";

export const CategoryService = {
  index: async (
    page: number,
    limit: number,
    search: string,
    userId: string,
  ) => {
    const skip = (page - 1) * limit;
    const searchTerm = typeof search === "string" ? search : "";

    // Get all categories from the database
    const categories = await prismaMain.category.findMany({
      where: {
        name: searchTerm
          ? { contains: searchTerm, mode: "insensitive" }
          : undefined,
        userId,
      },
      skip,
      take: limit,
    });

    // Get the total count of categories without pagination
    const totalCategories = await prismaMain.category.count({
      where: {
        name: searchTerm
          ? { contains: searchTerm, mode: "insensitive" }
          : undefined,
        userId,
      },
    });

    return {
      categories,
      pagination: {
        page,
        limit,
        total: totalCategories,
      },
    };
  },

  create: async (data: T_CategoryCreateInput, userId: string) => {
    // Validate if category with same name exists
    const existingCategoryByName = await prismaMain.category.findFirst({
      where: { name: data.name },
    });
    if (existingCategoryByName)
      throw new ValidationError({
        name: "Category with the same name already exists",
      });

    // Validate if category with same shortName exists
    const existingCategoryByShortName = await prismaMain.category.findFirst({
      where: { shortName: data.shortName },
    });
    if (existingCategoryByShortName)
      throw new ValidationError({
        shortName: "Category with the same short name already exists",
      });

    // Create the category
    return await prismaMain.category.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        userId,
      },
    });
  },

  getById: async (id: string) => {
    const category = await prismaMain.category.findUnique({
      where: { id },
    });

    if (!category) throw new CustomError("Category not found", 404);

    return category;
  },

  update: async (id: string, data: T_CategoryCreateInput) => {
    // Get the existing category
    const existingCategory = await prismaMain.category.findUnique({
      where: { id },
    });

    if (!existingCategory) throw new CustomError("Category not found", 404);

    // Validate if category with same name exists
    const existingCategoryByName = await prismaMain.category.findFirst({
      where: { name: data.name },
    });
    if (
      !!existingCategoryByName &&
      existingCategory.id !== existingCategoryByName.id
    )
      throw new ValidationError({
        name: "Category with the same name already exists",
      });

    // Validate if category with same shortName exists
    const existingCategoryByShortName = await prismaMain.category.findFirst({
      where: { shortName: data.shortName },
    });
    if (
      !!existingCategoryByShortName &&
      existingCategory.id !== existingCategoryByShortName.id
    )
      throw new ValidationError({
        shortName: "Category with the same short name already exists",
      });

    // Update the category
    return await prismaMain.category.update({
      where: { id },
      data: {
        name: data.name,
        shortName: data.shortName,
      },
    });
  },

  getByName: async (name: string) => {
    return await prismaMain.category.findFirst({
      where: { name },
    });
  },

  getByShortName: async (shortName: string) => {
    return await prismaMain.category.findFirst({
      where: { shortName },
    });
  },
};
