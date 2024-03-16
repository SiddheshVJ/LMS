import { Request, Response, NextFunction, response } from "express";
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

// Edit Layout
export const editLayout = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type } = req.body;

			if (type === "Banner") {
				const bannerData: any = await layoutModel.findOne({ type: "Banner" });
				const { image, title, subTitle } = req.body;
				if (bannerData) {
					await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
				}

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
				await layoutModel.findByIdAndUpdate(bannerData._id, { banner });
			}

			if (type === "FAQ") {
				const { faq } = req.body;

				const faqItem = await layoutModel.findOne({ type: "FAQ" });

				const faqItems = await Promise.all(
					faq.map((item: any) => {
						return {
							question: item.question,
							answer: item.answer,
						};
					})
				);

				await layoutModel.findByIdAndUpdate(faqItem._id, {
					type: "FAQ",
					faq: faqItems,
				});
			}

			if (type === "Categories") {
				const { categories } = req.body;
				const categoriesData = await layoutModel.findOne({
					type: "Categories",
				});
				const catItems = await Promise.all(
					categories.map((item: any) => {
						return {
							title: item.title,
						};
					})
				);
				await layoutModel.findByIdAndUpdate(categoriesData._id, {
					type: "Categories",
					categories: catItems,
				});
			}

			res.status(200).json({
				success: true,
				message: "Layout updated successfully.",
			});
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// get layout by  type
export const getLayoutByType = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const layout = await layoutModel.findOne({ type: req.body.type });
			res.status(200).json({
				success: true,
				layout,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
