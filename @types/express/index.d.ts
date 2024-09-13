import { TokenUserType } from "../../src/types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user: TokenUserType;
    }
  }
}
