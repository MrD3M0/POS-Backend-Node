import type { CookieOptions } from "express";

const parseSeconds = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const defaultAccessTtl = parseSeconds(process.env.JWT_EXPIRES_IN, 900);
const defaultRefreshTtl = parseSeconds(
  process.env.JWT_REFRESH_EXPIRES_IN,
  86400,
);

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

const buildCookieOptions = (ttlSeconds: number): CookieOptions => ({
  ...baseCookieOptions,
  maxAge: ttlSeconds * 1000,
});

export const CookieManager = {
  accessToken: () => buildCookieOptions(defaultAccessTtl),
  refreshToken: () => buildCookieOptions(defaultRefreshTtl),
};
