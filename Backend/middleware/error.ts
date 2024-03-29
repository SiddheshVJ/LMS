import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";

export const errorMiddleware = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	err.statusCode = err.statusCode || 500;
	err.message = err.message || "Internaal server error";

	// Wrong mongodb ID
	if (err.name === "CastError") {
		const message = `Resource not found. Invalid:${err.path}`;
		err = new ErrorHandler(message, 400);
	}

	// Duplicate key error authentication
	if (err.code === 11000) {
		const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
		err = new ErrorHandler(message, 400);
	}

	// JSON Web TOken Error
	if (err.name === "JsonWebTokenError") {
		const message = `Json web token is inalid, try again.`;
		err = new ErrorHandler(message, 400);
	}

	// JWT expired error
	if (err.name === "TokenExpiredError") {
		const message = `Json web token is expired, try again.`;
		err = new ErrorHandler(message, 400);
	}

	res.status(err.statusCode).json({
		success: false,
		message: err.message,
	});
};
