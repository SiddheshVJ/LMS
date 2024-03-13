import userModel from "../models/userModel";
import { Response } from "express";

// get user by id
export const getUserById = async (id: string, res: Response) => {
	const user = await userModel.findById(id);
	res.status(200).json({
		success: true,
		user,
	});
};
