// product/service.ts
import { prismaMain } from "@/lib/prismaClient";
import { CustomError, ValidationError } from "@/errors/CustomError";
import { T_ProductCreateInput } from "./validator";

export const ProductService = {
  index: async (
    pageNumber: number,
    limitNumber: number,
    searchTerm: string,
    userId: string,
  ) => {
    // Calculate skip and take
    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    // Fetch products from the database
    const products = await prismaMain.product.findMany({
      where: {
        userId,
        ...(searchTerm && {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            {
              category: { name: { contains: searchTerm, mode: "insensitive" } },
            },
          ],
        }),
      },
      include: {
        category: true,
      },
      skip,
      take,
    });

    // Get the total count of products without pagination
    const totalProducts = await prismaMain.product.count({
      where: {
        name: searchTerm ? { contains: searchTerm } : undefined,
        userId,
      },
    });

    return {
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalProducts,
      },
    };
  },

  create: async (data: T_ProductCreateInput, userId: string) => {
    const { name, shortName, price, quantity, categoryId } = data;

    // Validating whether the Product Name Exists or Not
    const existingProductByName = await prismaMain.product.findFirst({
      where: { name },
    });
    if (existingProductByName)
      throw new ValidationError({
        name: "Product with the same name already exists",
      });

    // Validating whether the Product ShortName Exists or Not
    const existingProductByShortName = await prismaMain.product.findFirst({
      where: { shortName },
    });
    if (existingProductByShortName)
      throw new ValidationError({
        shortName: "Product with the same short name already exists",
      });

    // Validating whether the Category Exists or Not
    const category = await prismaMain.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new CustomError("Category not found", 404);

    // Create the Product
    return await prismaMain.product.create({
      data: {
        name,
        shortName,
        price,
        quantity,
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });
  },

  getById: async (productId: string) => {
    // Validating Where productId exists or not
    const product = await prismaMain.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    // if product not found, throw error
    if (!product) throw new CustomError("Product not found", 404);

    return product;
  },

  update: async (productId: string, data: T_ProductCreateInput) => {
    // Get the existing Data by using Product Id
    const existingProduct = await prismaMain.product.findUnique({
      where: { id: productId },
    });

    // If Product not found, throw error
    if (!existingProduct) throw new CustomError("Product not found", 404);

    // Validating whether the Category Exists or Not
    if (data.categoryId) {
      const category = await prismaMain.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) throw new CustomError("Category not found", 404);
    }

    // If name already exists in the db throw error
    const existingProductByName = await prismaMain.product.findFirst({
      where: { name: data.name },
    });
    if (
      !!existingProductByName &&
      existingProduct.name !== existingProductByName.name
    )
      throw new ValidationError({
        name: "Product with the same name already exists",
      });

    // If shortName already exists in the db throw error
    const existingProductByShortName = await prismaMain.product.findFirst({
      where: { shortName: data.shortName },
    });
    if (
      !!existingProductByShortName &&
      existingProduct.id !== existingProductByShortName.id
    )
      throw new ValidationError({
        shortName: "Product with the same short name already exists",
      });

    // Update the product
    return await prismaMain.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        shortName: data.shortName,
        price: data.price,
        quantity: data.quantity,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });
  },

  getByName: async (name: string) => {
    return await prismaMain.product.findFirst({
      where: { name },
      include: {
        category: true,
      },
    });
  },

  getByShortName: async (shortName: string) => {
    return await prismaMain.product.findFirst({
      where: { shortName },
      include: {
        category: true,
      },
    });
  },

  getByCategoryId: async (categoryId: string, userId: string) => {
    return await prismaMain.product.findMany({
      where: {
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });
  },
  // product/service.ts

  delete: async (productId: string) => {
    // Validating where productId exists or not
    const product = await prismaMain.product.findUnique({
      where: { id: productId },
    });

    // if product not found, throw error
    if (!product) throw new CustomError("Product not found", 404);

    // Delete the product
    return await prismaMain.product.delete({
      where: { id: productId },
    });
  },
};
