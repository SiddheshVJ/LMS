import { Request, Response, NextFunction } from "express";
import courseModel from "../models/courseModel";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import cloudinary from "cloudinary";

import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";

require("dotenv").config();
