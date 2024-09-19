import { HOST } from "../server";
import { TokenUserType } from "../types/auth.types";
import jwt from "jsonwebtoken";

export function createAuthTokens(user: TokenUserType) {
  const expiration_time_access = Number(process.env.ACCESS_TOKEN_HRS) || 24;
  const expiration_time_refresh = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
  const SECRET_KEY = process.env?.SECRET_KEY || "random_string";
  console.log('secret key2', SECRET_KEY)

  const access = jwt.sign(
    {
      iss: HOST,
      sub: { ...user },
    },
    SECRET_KEY,
    { expiresIn: `${expiration_time_access}h` }
  );

  const refresh = jwt.sign(
    {
      iss: HOST,
      sub: { ...user },
    },
    SECRET_KEY,
    { expiresIn: `${expiration_time_refresh}d` }
  );

  return { access, refresh };
}
