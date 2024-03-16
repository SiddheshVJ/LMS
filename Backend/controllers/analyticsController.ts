import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import userModel from "../models/userModel";
import courseModel from "../models/courseModel";
import orderModel from "../models/orderModel";

// Get User analytics -- admin only
export const getUserAnalytics = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const users = await generateLast12MonthData(userModel);
			res.status(200).json({
				success: true,
				users,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Get Course analytics -- admin only
export const getCourseAnalytics = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courses = await generateLast12MonthData(courseModel);
			res.status(200).json({
				success: true,
				courses,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Get Course analytics -- admin only
export const getOrderAnalytics = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const orders = await generateLast12MonthData(orderModel);
			res.status(200).json({
				success: true,
				orders,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
