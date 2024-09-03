import { Response } from "express";

export const successResponse = (
  res: Response,
  status: number,
  message: string,
  data?: any
) => {
  return res.status(Number(status)).json({
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  status: number,
  error: string,
  details?: any
) => {
  return res.status(Number(status)).json({
    error,
    details,
  });
};
