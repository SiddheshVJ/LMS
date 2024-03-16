import express from "express";
import {
	uploadCourse,
	editCourse,
	getSingleCourse,
	getAllCourse,
	getCourseByUser,
	addQuestion,
	addAnswer,
	addReview,
	addReplyToReview,
	getAllCoursesByAdmin,
	deleteCourse,
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
cousetRouter.get("/get-courses", getAllCourse);
cousetRouter.put("/add-question", isAuthenticated, addQuestion);
cousetRouter.put("/add-answer", isAuthenticated, addAnswer);
cousetRouter.put("/add-review/:id", isAuthenticated, addReview);
cousetRouter.put(
	"/add-reply-review",
	isAuthenticated,
	authorisedRoles("admin"),
	addReplyToReview
);
cousetRouter.get(
	"/get-all-courses",
	isAuthenticated,
	authorisedRoles("admin"),
	getAllCoursesByAdmin
);
cousetRouter.delete(
	"/delete-course/:id",
	isAuthenticated,
	authorisedRoles("admin"),
	deleteCourse
);

export default cousetRouter;
