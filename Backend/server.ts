import { app } from "./app";
require("dotenv").config();
import { connectDB } from "./utils/db";
import { v2 as cloudinary } from "cloudinary";

// cloudinary config
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// create server
app.listen(process.env.PORT, () => {
	console.log(`Server is connectd with ${process.env.PORT}`);
	connectDB();
});
