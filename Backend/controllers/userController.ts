import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModel";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import cloudinary from "cloudinary";
import path from "path";
import sendMail from "../utils/sendEmail";
import {
	accessTokenOptions,
	refreshTokenOptions,
	sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import {
	getAllUsersService,
	getUserById,
	updateUserRoleService,
} from "../services/user.service";

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
			} catch (error: any) {
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
		process.env.ACTIVATION_SECRET,
		{
			expiresIn: "5m",
		}
	);
	return { token, activationCode };
};

// Activate user

interface IActivationRequest {
	activation_token: string;
	activation_code: string;
}

export const activateUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { activation_token, activation_code } =
				req.body as IActivationRequest;
			const newUser: { user: IUser; activationCode: string } = jwt.verify(
				activation_token,
				process.env.ACTIVATION_SECRET as string
			) as { user: IUser; activationCode: string };

			if (newUser.activationCode !== activation_code) {
				return next(new ErrorHandler("Invalid Activation Code.", 400));
			}

			const { name, email, password } = newUser.user;
			const existUser = await userModel.findOne({ email });

			if (existUser) {
				return next(new ErrorHandler("User already exists.", 400));
			}

			const user = await userModel.create({
				name,
				email,
				password,
			});

			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Login user
interface ILoginRequest {
	email: string;
	password: string;
}

export const loginUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body as ILoginRequest;

			if (!email || !password) {
				return next(new ErrorHandler("Please enter email or password.", 400));
			}

			const user = await userModel.findOne({ email }).select("+password");
			if (!user) {
				return next(new ErrorHandler("Invalid email or password.", 400));
			}

			const isPassMatched = await user.comparePassword(password);
			if (!isPassMatched) {
				return next(new ErrorHandler("Invalid email or password.", 400));
			}

			sendToken(user, 200, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// logout user
export const logoutUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.cookie("access_token", "", { maxAge: 1 });
			res.cookie("refresh_token", "", { maxAge: 1 });

			const userId = req.user?._id || "";
			redis.del(userId);

			res.status(200).json({
				success: true,
				message: "Logged out successfully.",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// update access token
export const updateAccessToken = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const refresh_token = req.cookies.refresh_token as string;
			const decoded = jwt.verify(
				refresh_token,
				process.env.REFRESH_TOKEN as string
			) as JwtPayload;

			const message = `Could not refresh token.`;
			if (!decoded) {
				return next(new ErrorHandler(message, 400));
			}

			const session = await redis.get(decoded.id as string);

			if (!session) {
				return next(
					new ErrorHandler("Please login to access this resources.", 400)
				);
			}
			const user = JSON.parse(session);
			const accessToken = jwt.sign(
				{ id: user._id },
				process.env.ACCESS_TOKEN as string,
				{ expiresIn: "5m" }
			);
			const refreshToken = jwt.sign(
				{ id: user._id },
				process.env.REFRESH_TOKEN as string,
				{ expiresIn: "3d" }
			);

			req.user = user;

			res.cookie("access_token", accessToken, accessTokenOptions);
			res.cookie("refresh_token", refreshToken, refreshTokenOptions);

			await redis.set(user._id, JSON.stringify(user), "EX", 5); // 604800 = 7 days

			res.status(200).json({
				status: "Success",
				accessToken,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// get user info
export const getUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userID = req.user._id;
			getUserById(userID, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

interface ISocialAuthBody {
	email: string;
	name: string;
	avatar: string;
}

// Social auth
export const socialAuth = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, name, avatar } = req.body;
			const user = await userModel.findOne({ email });

			if (!user) {
				const newUser = await userModel.create({ email, name, avatar });
				sendToken(newUser, 200, res);
			} else {
				sendToken(user, 200, res);
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// update user info
interface IUpdateInfo {
	email: string;
	name: string;
}

export const updateUserInfo = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email } = req.body as IUpdateInfo;
			const userId = req.user?._id;
			const user = await userModel.findById(userId);
			if (user && email) {
				const isEmailExist = await userModel.findOne({ email });
				if (isEmailExist) {
					return next(new ErrorHandler("Email already exist", 400));
				}
				user.email = email;
				if (name && user) {
					user.name = name;
				}
				await user?.save();

				await redis.set(userId, JSON.stringify(user));
				res.status(201).json({
					success: true,
					user,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Update user password
interface IUpdatePass {
	oldPass: string;
	newPass: string;
}

export const updateUserPassword = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { oldPass, newPass } = req.body as IUpdatePass;

			if (!oldPass || !newPass) {
				return next(
					new ErrorHandler("Please enter old and new password.", 400)
				);
			}

			const user = await userModel.findById(req.user?._id).select("+password");

			if (user?.password === undefined) {
				return next(new ErrorHandler("Invalid user.", 400));
			}

			const isPasswordMatch = await user?.comparePassword(oldPass);

			if (!isPasswordMatch) {
				return next(new ErrorHandler("Invalid old password.", 400));
			}
			user.password = newPass;
			await user.save();
			redis.set(req.user?._id, JSON.stringify(user));
			res.status(201).json({
				success: true,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Update profile piccture and avatar
interface IUpdateProfilePic {
	avatar: string;
}
export const updateProfilePicture = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { avatar } = req.body as IUpdateProfilePic;
			const userId = req.user?._id;
			const user = await userModel.findById(userId);

			if (avatar && user) {
				// If we have one avatar then call this if
				if (user?.avatar?.public_id) {
					// First delete old image
					await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

					const myCloud = await cloudinary.v2.uploader.upload(avatar, {
						folder: "Avatars",
						width: 150,
					});
					user.avatar = {
						public_id: myCloud.public_id,
						url: myCloud.url,
					};
				} else {
					const myCloud = await cloudinary.v2.uploader.upload(avatar, {
						folder: "Avatars",
						width: 150,
					});
					user.avatar = {
						public_id: myCloud.public_id,
						url: myCloud.url,
					};
				}
			}

			await user.save();
			await redis.set(userId, JSON.stringify(user));
			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// get all users to admin dashbboard
export const getAllUsersServices = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			getAllUsersService(res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// update user role - only for admin
export const updateUserRole = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = req.body;
			updateUserRoleService(res, id, role);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Delete user role - only for admin
export const deleteUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;

			const user = await userModel.findById(id);
			if (!user) {
				return next(new ErrorHandler("User not found.", 404));
			}

			await userModel.deleteOne({ _id: id });
			await redis.del(id);
			res.status(200).json({
				success: true,
				message: "User deleted successfully.",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
