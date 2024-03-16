import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import layoutModel from "../models/layoutModel";
import cloudinary from "cloudinary";

// create Layout
export const createLayout = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;

			const isTypeExist = await layoutModel.findOne({ type });

			if (isTypeExist) {
				return next(new ErrorHandler(`${type} is already exist.`, 400));
			}

			if (type === "Banner") {
				const { image, title, subTitle } = req.body;
				const myCloud = await cloudinary.v2.uploader.upload(image, {
					folder: "Layouts",
				});
				const banner = {
					image: {
						public_id: myCloud.public_id,
						url: myCloud.secure_url,
					},
					title,
					subTitle,
				};
				await layoutModel.create();
			}

			if (type === "FAQ") {
				const { faq } = req.body;
				const faqItems = await Promise.all(
					faq.map((item: any) => {
						return {
							question: item.question,
							answer: item.answer,
						};
					})
				);

				await layoutModel.create({ type: "FAQ", faq: faqItems });
			}

			if (type === "Categories") {
				const { categories } = req.body;
				const catItems = await Promise.all(
					categories.map((item: any) => {
						return {
							title: item.title,
						};
					})
				);
				await layoutModel.create({ type: "Categories", categories: catItems });
			}

			res.status(200).json({
				success: true,
				message: "Layout created successfully.",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
