import express from "express";
import {
	uploadCourse,
	editCourse,
	getSingleCourse,
	getAllCourse,
	getCourseByUser,
	addQuestion,
	addAnswer,
} from "../controllers/courseController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const cousetRouter = express.Router();

cousetRouter.post(
	"/create-course",
	isAuthenticated,
	authorisedRoles("admin"),
	uploadCourse
);
cousetRouter.put(
	"/edit-course/:id",
	isAuthenticated,
	authorisedRoles("admin"),
	editCourse
);
cousetRouter.get("/get-course/:id", getSingleCourse);
cousetRouter.get("/get-all-courses", getAllCourse);
cousetRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);
cousetRouter.put("/add-question", isAuthenticated, addQuestion);
cousetRouter.put("/add-answer", isAuthenticated, addAnswer);

export default cousetRouter;
