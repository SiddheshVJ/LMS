import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModel";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendEmail";
require("dotenv").config();

// Register User
interface IRestrationBody {
	name: string;
	email: string;
	password: string;
	avatar?: string;
}

export const registerUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email, password } = req.body;

			const isEmailExist = await userModel.findOne({ email });
			if (isEmailExist) {
				return next(new ErrorHandler("Email already exists", 400));
			}

			const user: IRestrationBody = {
				name,
				email,
				password,
			};

			const activationToken = createActivationToken(user);

			const activationCode = activationToken.activationCode;

			const data = { user: { name: user.name }, activationCode };

			const html = await ejs.renderFile(
				path.join(__dirname, "../mails/activationMail.ejs"),
				data
			);

			try {
				await sendMail({
					email: user.email,
					subject: "Activate your account",
					template: "activationMail.ejs",
					data,
				});

				res.status(201).json({
					success: true,
					message: `Please check your email ${user.email} to activate your account.`,
					activationToken: activationToken.token,
				});
			} catch (error) {
				return next(new ErrorHandler(error.message, 400));
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

interface IActivationToken {
	token: string;
	activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
	const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
	const token = jwt.sign(
		{
			user,
			activationCode,
		},
		process.env.ACCESS_TOKEN,
		{
			expiresIn: "5m",
		}
	);
	return { token, activationCode };
};


// Activate user