import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { IOrder } from "../models/orderModel";
import userModel from "../models/userModel";
import courseModel from "../models/courseModel";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendEmail";
import notificationModel from "../models/notificationModel";
import { newOrder } from "../services/order.service";

// Create order

export const createOrder = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { courseId, payment_info } = req.body as IOrder;

			const user = await userModel.findById(req.user?._id);

			const courseExist = user?.courses.some(
				(course: any) => course._id.toString() === courseId
			);

			if (courseExist) {
				return next(new ErrorHandler("You have already purchased course", 400));
			}

			const course = await courseModel.findById(courseId);

			if (!course) {
				return next(new ErrorHandler("Course not found..", 400));
			}

			const data: any = {
				courseId: course._id,
				userId: user?._id,
			};

			const mailData = {
				order: {
					_id: course._id.toString().slice(0, 6),
					name: course.name,
					price: course.price,
					date: new Date().toLocaleDateString("en-us", {
						year: "numeric",
						month: "long",
						day: "numeric",
					}),
				},
			};
			const html = await ejs.renderFile(
				path.join(__dirname, "../mails/order-confirmation.ejs"),
				{ order: mailData }
			);

			try {
				if (user) {
					await sendMail({
						email: user.email,
						subject: "Order Confirmation",
						template: "order-confirmation.ejs",
						data: mailData,
					});
				}
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 400));
			}

			user?.courses.push(course?._id);
			await user.save();

			const notification = await notificationModel.create({
				user: user?._id,
				title: "New Order",
				message: `You have a new order from ${course?.name} `,
			});

			course.purchased ? course.purchased += 1 : course.purchased;

			await course.save();

			newOrder(data, res, next);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
