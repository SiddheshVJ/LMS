import express from "express";
import {
	getUserAnalytics,
	getCourseAnalytics,
	getOrderAnalytics,
} from "../controllers/analyticsController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const analyticRouter = express.Router();
analyticRouter.get(
	"/get-users-analytics",
	isAuthenticated,
	authorisedRoles("admin"),
	getUserAnalytics
);
analyticRouter.get(
	"/get-courses-analytics",
	isAuthenticated,
	authorisedRoles("admin"),
	getCourseAnalytics
);
analyticRouter.get(
	"/get-orders-analytics",
	isAuthenticated,
	authorisedRoles("admin"),
	getOrderAnalytics
);
export default analyticRouter;
