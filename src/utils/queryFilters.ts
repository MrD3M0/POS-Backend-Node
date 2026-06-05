type Query = {
  limit?: number;
  page?: number;
  search?: string;
};

export function queryFilters(req: Request) {
  const query = req.body;
  const { limit, page, search } = query as Query;
  return { limit, page, search };
}

// Calculate skip and take
export const calculateSkipAndTake = (
  page: number,
  limit: number,
): { skip: number; take: number | undefined } => {
  // Calculate the skip and take
  const skip = limit === -1 ? 0 : (page - 1) * limit;
  const take = limit !== -1 ? limit : undefined;

  return { skip, take };
};
