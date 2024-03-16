import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
require("dotenv").config();
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error";

// import all routers
import userRouter from "./routes/userRoute";
import cousetRouter from "./routes/courseRoute";
import orderRouter from "./routes/orderRoute";
import notificationRouter from "./routes/notificationRoute";
import analyticRouter from "./routes/analyticRoute";
import layoutRouter from "./routes/layoutRoute";

// bodyparser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

//CORS
app.use(
	cors({
		origin: process.env.ORIGIN,
	})
);

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", cousetRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", analyticRouter);
app.use("/api/v1", layoutRouter);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({
		success: true,
		message: "API is working.",
	});
});

// unkonwn api
app.get("*", (req: Request, res: Response, next: NextFunction) => {
	const err = new Error(`Route ${req.originalUrl} NOT FOUND`) as any;
	err.statusCode = 404;
	next(err);
});

app.use(errorMiddleware);
