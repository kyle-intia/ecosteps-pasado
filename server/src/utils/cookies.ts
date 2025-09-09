import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";
<<<<<<< HEAD
import { NODE_ENV } from "../constants/env";

export const REFRESH_PATH = "/auth/refresh";
const secure = NODE_ENV !== "development";
=======

export const REFRESH_PATH = "/auth/refresh";
>>>>>>> c6059f8e8fe8634fc8af4f54f89449f8e645847e

const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
<<<<<<< HEAD
  secure,
=======
  secure: true,
>>>>>>> c6059f8e8fe8634fc8af4f54f89449f8e645847e
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};
export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken", { path: REFRESH_PATH });