import express from "express";
import { authorisedRoles, isAuthenticated } from "../middleware/auth";
import {
	createLayout,
	editLayout,
	getLayoutByType,
} from "../controllers/layoutController";

const layoutRoute = express.Router();

layoutRoute.post(
	"/create-layout",
	isAuthenticated,
	authorisedRoles("admin"),
	createLayout
);
layoutRoute.put(
	"/update-layout",
	isAuthenticated,
	authorisedRoles("admin"),
	editLayout
);
layoutRoute.get(
	"/get-layout",
	isAuthenticated,
	authorisedRoles("admin"),
	getLayoutByType
);

export default layoutRoute;
