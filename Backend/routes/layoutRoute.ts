import express from "express";
import { authorisedRoles, isAuthenticated } from "../middleware/auth";
import { createLayout } from "../controllers/layoutController";

const layoutRoute = express.Router();

layoutRoute.post(
	"/create-layout",
	isAuthenticated,
	authorisedRoles("admin"),
	createLayout
);

export default layoutRoute;
