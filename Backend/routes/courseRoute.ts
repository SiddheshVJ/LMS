import express from "express";
import {} from "../controllers/courseController";
import { isAuthenticated, authorisedRoles } from "../middleware/auth";

const userRouter = express.Router();
