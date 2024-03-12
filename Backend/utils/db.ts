import mongoose from "mongoose";
require("dotenv").config();

const DB_URI: string = process.env.MONGO_DB_URI || "";

export const connectDB = async () => {
	try {
		await mongoose.connect(DB_URI).then((data: any) => {
			console.log(`Database is connected with ${data.connection.host}`);
		});
	} catch (err: any) {
		console.log(err.message);
		setTimeout(connectDB, 5000);
	}
};
