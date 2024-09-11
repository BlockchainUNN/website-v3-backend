export type ROLES = "superadmin" | "admin" | "judge" | "event_admin" | "writer";

export type TokenUserType = {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
};
