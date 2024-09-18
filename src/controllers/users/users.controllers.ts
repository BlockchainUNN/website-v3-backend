import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";


const getUsers = async (req: Request, res: Response) => {
    try {
        //to fetch all users
        const users = await prisma.user.findMany();

        return successResponse(res, 200, "user retrieved successfully", users)
        
    } catch (error) {
        return errorResponse(
            res,
            500,
            "An error occurred while fetching users",
            error
        
        )
    }
}


export default {getUsers}