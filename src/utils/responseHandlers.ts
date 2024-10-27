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

export const downloadResponse = (res: Response, status: number, data?: any) => {
  res.setHeader("Content-disposition", "attachment; filename=data.csv");
  res.set("Content-Type", "text/csv");
  return res.status(Number(status)).send(data);
};
