import { TokenUserType } from "../../src/types/auth.types";

// declare global {
//   namespace Express {
//     interface Request {
//       user: TokenUserType;
//     }
//   }
// }

// Extended Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
