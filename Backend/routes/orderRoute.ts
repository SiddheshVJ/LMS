import express from "express";
import { createOrder, getAllOrders } from "../controllers/orderController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);
orderRouter.get(
	"/get-all-orders",
	isAuthenticated,
	authorisedRoles("admin"),
	getAllOrders
);

export default orderRouter;
