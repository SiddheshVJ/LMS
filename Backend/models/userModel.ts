import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

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
			required: [true, "Please enter your password."],
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
	if (this.isModified("password")) {
		next();
	}
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

//Compare Password

userschema.methods.comparePassword = async function (
	enteredPassword: string
): Promise<boolean> {
	return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userschema);
export default userModel;
