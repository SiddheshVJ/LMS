import express from "express";
import { authorisedRoles, isAuthenticated } from "../middleware/auth";
import {
	getNotifications,
	updateNotification,
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
	updateNotification
);

export default notificationRoute;
