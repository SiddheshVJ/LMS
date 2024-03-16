import express from "express";
import {
	registerUser,
	activateUser,
	loginUser,
	logoutUser,
	updateAccessToken,
	getUser,
	socialAuth,
	updateUserInfo,
	updateUserPassword,
	updateProfilePicture,
	getAllUsersServices,
	updateUserRole,
	deleteUser,
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
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put("/update-user-password", isAuthenticated, updateUserPassword);
userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture);
userRouter.get(
	"/all-users",
	isAuthenticated,
	authorisedRoles("admin"),
	getAllUsersServices
);
userRouter.put(
	"/update-user",
	isAuthenticated,
	authorisedRoles("admin"),
	updateUserRole
);
userRouter.delete(
	"/delete-user/:id",
	isAuthenticated,
	authorisedRoles("admin"),
	deleteUser
);

export default userRouter;
