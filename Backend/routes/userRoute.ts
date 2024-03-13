import express from "express";
import {
	registerUser,
	activateUser,
	loginUser,
	logoutUser,
	updateAccessToken,
	getUser,
	socialAuth,
} from "../controllers/userController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/register-user", registerUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/me", isAuthenticated, getUser);
userRouter.get("/refreshtoken", updateAccessToken);
userRouter.post("/socialAuth", socialAuth);

export default userRouter;
