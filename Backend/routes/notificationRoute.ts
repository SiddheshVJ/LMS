import express from "express";
import { authorisedRoles, isAuthenticated } from "../middleware/auth";
import {
	getNotifications,
	updateNotifications,
} from "../controllers/notificationcontroller";

const notificationRoute = express.Router();

notificationRoute.get(
	"/get-all-notifications",
	isAuthenticated,
	authorisedRoles("admin"),
	getNotifications
);
notificationRoute.put(
	"/update-notification-status/:id",
	isAuthenticated,
	authorisedRoles("admin"),
	updateNotifications
);

export default notificationRoute;
