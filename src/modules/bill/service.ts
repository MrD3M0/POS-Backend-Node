// bill/service.ts
import { prismaMain } from "@/lib/prismaClient";
import { CustomError, ValidationError } from "@/errors/CustomError";
import { T_BillCreateInput } from "./validator";

export const BillService = {
  index: async (pageNumber: number, limitNumber: number, userId: string) => {
    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    const bills = await prismaMain.bill.findMany({
      where: {
        userId,
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalBills = await prismaMain.bill.count({
      where: {
        userId,
      },
    });

    return {
      bills,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalBills,
      },
    };
  },

  create: async (data: T_BillCreateInput, userId: string) => {
    const { discountType, discount, products } = data;

    // Validate all products exist and belong to the user
    const productIds = products.map((p) => p.productId);
    const dbProducts = await prismaMain.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        userId,
      },
    });

    if (dbProducts.length !== productIds.length)
      throw new ValidationError({
        products: "One or more products not found or don't belong to this user",
      });

    // Calculate total and prepare bill items
    let total = 0;
    const billItemsData = products.map((p) => {
      const product = dbProducts.find((dp) => dp.id === p.productId);
      if (!product) throw new CustomError("Product not found", 404);

      // Check if quantity is available
      if (product.quantity < p.quantity)
        throw new ValidationError({
          quantity: `Insufficient quantity for product ${product.name}. Available: ${product.quantity}`,
        });

      const itemTotal = product.price * p.quantity;
      total += itemTotal;

      return {
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: product.price,
        total: itemTotal,
      };
    });

    // Calculate final bill amount
    let finalBillAmount = total;
    if (discountType === "Percentage") {
      finalBillAmount = total - (total * discount) / 100;
    } else if (discountType === "Exact") {
      finalBillAmount = total - discount;
    }

    // Ensure final bill amount is not negative
    if (finalBillAmount < 0) finalBillAmount = 0;

    // Create the bill with bill items and decrease product quantities
    const bill = await prismaMain.bill.create({
      data: {
        userId,
        discountType,
        discount,
        total,
        finalBillAmount,
        billItems: {
          createMany: {
            data: billItemsData,
          },
        },
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Decrease product quantities
    for (const item of billItemsData) {
      await prismaMain.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return bill;
  },

  getById: async (billId: string) => {
    const bill = await prismaMain.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!bill) throw new CustomError("Bill not found", 404);

    return bill;
  },

  update: async (billId: string, data: T_BillCreateInput) => {
    // Get existing bill with items
    const existingBill = await prismaMain.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: true,
      },
    });

    if (!existingBill) throw new CustomError("Bill not found", 404);

    const { discountType, discount, products } = data;

    // Validate all products exist and belong to the user
    const productIds = products.map((p) => p.productId);
    const dbProducts = await prismaMain.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        userId: existingBill.userId,
      },
    });

    if (dbProducts.length !== productIds.length)
      throw new ValidationError({
        products: "One or more products not found",
      });

    // Calculate total and prepare bill items
    let total = 0;
    const billItemsData = products.map((p) => {
      const product = dbProducts.find((dp) => dp.id === p.productId);
      if (!product) throw new CustomError("Product not found", 404);

      const itemTotal = product.price * p.quantity;
      total += itemTotal;

      return {
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: product.price,
        total: itemTotal,
      };
    });

    // Calculate final bill amount
    let finalBillAmount = total;
    if (discountType === "Percentage") {
      finalBillAmount = total - (total * discount) / 100;
    } else if (discountType === "Exact") {
      finalBillAmount = total - discount;
    }

    if (finalBillAmount < 0) finalBillAmount = 0;

    // Restore old quantities first
    for (const oldItem of existingBill.billItems) {
      await prismaMain.product.update({
        where: { id: oldItem.productId },
        data: {
          quantity: {
            increment: oldItem.quantity,
          },
        },
      });
    }

    // Delete old bill items
    await prismaMain.billItem.deleteMany({
      where: { billId },
    });

    // Update bill with new items
    const updatedBill = await prismaMain.bill.update({
      where: { id: billId },
      data: {
        discountType,
        discount,
        total,
        finalBillAmount,
        billItems: {
          createMany: {
            data: billItemsData,
          },
        },
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Decrease new product quantities
    for (const newItem of billItemsData) {
      await prismaMain.product.update({
        where: { id: newItem.productId },
        data: {
          quantity: {
            decrement: newItem.quantity,
          },
        },
      });
    }

    return updatedBill;
  },

  delete: async (billId: string) => {
    const bill = await prismaMain.bill.findUnique({
      where: { id: billId },
      include: {
        billItems: true,
      },
    });

    if (!bill) throw new CustomError("Bill not found", 404);

    // Restore product quantities before deleting bill
    for (const item of bill.billItems) {
      await prismaMain.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete bill items first (cascade should handle this, but explicit delete is safer)
    await prismaMain.billItem.deleteMany({
      where: { billId },
    });

    // Delete the bill
    return await prismaMain.bill.delete({
      where: { id: billId },
    });
  },

  getBillsByDateRange: async (
    userId: string,
    startDate: Date,
    endDate: Date,
    pageNumber: number,
    limitNumber: number,
  ) => {
    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    const bills = await prismaMain.bill.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prismaMain.bill.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      bills,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
      },
    };
  },

  getTotalSales: async (userId: string) => {
    const result = await prismaMain.bill.aggregate({
      where: { userId },
      _sum: {
        finalBillAmount: true,
      },
      _count: true,
    });

    return {
      totalBills: result._count,
      totalSales: result._sum.finalBillAmount || 0,
    };
  },

  getBillsByCategory: async (
    userId: string,
    categoryId: string,
    pageNumber: number,
    limitNumber: number,
  ) => {
    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    const bills = await prismaMain.bill.findMany({
      where: {
        userId,
        billItems: {
          some: {
            product: {
              categoryId,
            },
          },
        },
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          where: {
            product: {
              categoryId,
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prismaMain.bill.count({
      where: {
        userId,
        billItems: {
          some: {
            product: {
              categoryId,
            },
          },
        },
      },
    });

    return {
      bills,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
      },
    };
  },
};
