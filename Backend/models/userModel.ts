import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
require("dotenv").config();
import jwt from "jsonwebtoken";
const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	avatar: {
		public_id: string;
		url: string;
	};
	role: string;
	isVerified: Boolean;
	courses: Array<{ courseId: string }>;
	comparePassword: (password: string) => Promise<boolean>;
	SignAccessToken: () => string;
	SignRefreshToken: () => string;
}

const userschema: Schema<IUser> = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: [true, "Please enter your email."],
			validate: {
				validator: function (value: string) {
					return emailRegexPattern.test(value);
				},
				message: "Please enter a valid email.",
			},
			unique: true,
		},
		password: {
			type: String,
			minlength: [8, "Password must be at least 8 charactes."],
			select: false,
		},
		avatar: {
			public_id: String,
			url: String,
		},
		role: {
			type: String,
			default: "user",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		courses: [
			{
				courseId: String,
			},
		],
	},
	{
		timestamps: true,
	}
);

// HashPassword
userschema.pre<IUser>("save", async function (next) {
	if (!this.isModified("password")) {
		next();
	}
	this.password = bcrypt.hashSync(this.password, 10);
	next();
});

// sign access token
userschema.methods.SignAccessToken = function () {
	return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
		expiresIn: "5m",
	});
};

// sign refresh token
userschema.methods.SignRefreshToken = function () {
	return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
		expiresIn: "3d",
	});
};

//Compare Password
userschema.methods.comparePassword = async function (
	this: IUser,
	enteredPassword: string
) {
	return bcrypt.compareSync(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userschema);
export default userModel;
