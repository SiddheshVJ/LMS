import { Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import orderModel from "../models/orderModel";

// create new order

export const newOrder = catchAsyncError(async (data: any, res: Response) => {
	const order = await orderModel.create(data);

	res.status(201).json({
		success: true,
		order,
	});
});

// Get all orders
export const getAllOrdersService = async (res: Response) => {
	const orders = await orderModel.find().sort({ createdAt: -1 });
	res.status(201).json({
		success: true,
		orders,
	});
};
