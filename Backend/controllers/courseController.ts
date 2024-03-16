import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import courseModel from "../models/courseModel";
import cloudinary from "cloudinary";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
import { createCourse } from "../services/course.service";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendEmail";

require("dotenv").config();

// upload course

export const uploadCourse = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "Courses",
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}
			createCourse(data, res, next);
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Edit course
export const editCourse = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				await cloudinary.v2.uploader.destroy(thumbnail.public_id);
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "Courses",
				});
				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			const courseId = req.params.id;
			const course = await courseModel.findByIdAndUpdate(
				courseId,
				{
					$set: data,
				},
				{
					new: true,
				}
			);

			res.status(201).json({
				success: true,
				course,
			});
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Get single course
export const getSingleCourse = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;

			const isCatchExist = await redis.get(courseId);

			if (isCatchExist) {
				const course = JSON.parse(isCatchExist);
				res.status(200).json({
					success: true,
					course,
				});
			} else {
				const course = await courseModel
					.findById(req.params.id)
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
					);
				await redis.set(courseId, JSON.stringify(course));
				res.status(200).json({
					success: true,
					course,
				});
			}
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Get All Courses
export const getAllCourse = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;

			const isCatchExist = await redis.get("allcourses");

			if (isCatchExist) {
				const courses = JSON.parse(isCatchExist);
				res.status(200).json({
					success: true,
					courses,
				});
			} else {
				const courses = await courseModel
					.find()
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
					);

				await redis.set("allcourses", JSON.stringify(courses));

				res.status(200).json({
					success: true,
					courses,
				});
			}
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Get course content only for valid user
export const getCourseByUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;

			const courseExist = userCourseList?.find(
				(course: any) => course._id === courseId
			);

			if (!courseExist) {
				return next(
					new ErrorHandler("You are not eligible to access this course.", 400)
				);
			}
			const course = await courseModel.findById(courseId);
			const content = course?.courseData;
			res.status(200).json({
				success: true,
				content,
			});
		} catch (error) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Add questions i course
interface IAddQuestionData {
	question: string;
	courseId: string;
	contentId: string;
}

export const addQuestion = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { question, courseId, contentId }: IAddQuestionData = req.body;
			const course = await courseModel.findById(courseId);

			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid content id.", 400));
			}

			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);

			if (!courseContent) {
				return next(new ErrorHandler("Invalid content id.", 400));
			}

			// Create a neq quetsion oject
			const newQuestion: any = {
				user: req.user,
				question,
				questionReplies: [],
			};

			// add this question to our course content
			courseContent.questions.push(newQuestion);

			// save the updated course
			await course.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Add answer in course question
interface IAddAnswerData {
	answer: string;
	courseId: string;
	contentId: string;
	questionId: string;
}

export const addAnswer = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { answer, courseId, contentId, questionId }: IAddAnswerData =
				req.body;

			const course = await courseModel.findById(courseId);

			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid content id.", 400));
			}

			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);

			if (!courseContent) {
				return next(new ErrorHandler("Invalid content id.", 400));
			}

			const question = courseContent?.questions?.find((item: any) =>
				item._id.equals(questionId)
			);

			if (!question) {
				return next(new ErrorHandler("Invalid content id.", 400));
			}

			// create ans object
			const newAnswer: any = {
				user: req.user,
				answer,
			};

			question.questionReplies.push(newAnswer);

			await course.save();

			if (req.user?._id === question.user._id) {
				// create a notification
			} else {
				const data = {
					name: question.user.name,
					title: courseContent.title,
				};

				const html = await ejs.renderFile(
					path.join(__dirname, "../mails/question-reply.ejs"),
					data
				);

				try {
					await sendMail({
						email: question.user.email,
						subject: "Question Reply",
						template: "question-reply.ejs",
						data,
					});
				} catch (error: any) {
					return next(new ErrorHandler(error.message, 400));
				}
			}
			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// Add review in course
interface IReviewData {
	review: string;
	rating: number;
	userId: string;
}

export const addReview = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;

			// check if courseId is exist in userCourseList based on _id
			const courseExists = userCourseList?.some(
				(course: any) => course._id.toString() === courseId.toString()
			);

			if (!courseExists) {
				return next(
					new ErrorHandler("Your are not eligible to access this course.", 400)
				);
			}

			const course = await courseModel.findById(courseId);

			const { review, rating } = req.body as IReviewData;

			const reviewData: any = {
				user: req.user,
				comment: review,
				rating,
			};

			course.reviews.push(reviewData);

			let average = 0;
			course?.reviews.forEach((rev: any) => {
				average += rev.rating;
			});

			if (course) {
				course.ratings = average / course?.reviews.length;
				course.ratings.toFixed();
			}

			await course.save();

			const notification = {
				title: "New Review Recieved.",
				message: `${req.user.name} has a given review in ${course?.name} `,
			};

			// create notification

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);

// add reply in review

interface IAddReviewData {
	comment: string;
	courseId: string;
	reviewId: string;
}

export const addReplyToReview = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { comment, courseId, reviewId } = req.body as IAddReviewData;

			const course = await courseModel.findById(courseId);

			if (!course) {
				return next(new ErrorHandler("Course not found.", 400));
			}

			const review = course?.reviews?.find(
				(rev: any) => rev._id.toString() === reviewId.toString()
			);

			if (!review) {
				return next(new ErrorHandler("Review not found.", 400));
			}

			const replyData: any = {
				user: req.user,
				comment,
			};

			if (!review.commentReplies) {
				review.commentReplies = [];
			}

			review.commentReplies.push(replyData);

			await course.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
