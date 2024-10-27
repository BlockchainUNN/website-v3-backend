import { Response } from "express";
import { format } from "fast-csv";

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

export const cvsResponse = (
  res: Response,
  status: number,
  filename: string,
  data: any[]
) => {
  res.header("Content-Type", "text/csv");
  res.attachment(filename + ".csv");

  // Use fast-csv to write the CSV data and pipe it to the response
  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  // Write data to CSV stream and end the stream
  data.forEach((record) => csvStream.write(record));
  csvStream.end();
  return res.status(Number(status));
};
