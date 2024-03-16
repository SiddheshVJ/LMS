import express from "express";
import { createOrder } from "../controllers/orderController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

export default orderRouter;
