import mongoose, { Document, Model, Schema } from "mongoose";
import { Interface } from "readline";

interface IComment extends Document {
	user: object;
	comment: string;
	commentReplies?: IComment[];
}

interface IReview extends Document {
	user: object;
	rating: number;
	comment: string;
	commentReplies: IComment[];
}

interface ILink extends Document {
	title: string;
	url: string;
}

interface ICourseData extends Document {
	title: string;
	description: string;
	reviews: IReview[];
	videoUrl: string;
	videoThumbnail: object;
	videoSection: string;
	videoLength: number;
	videoPlayer: string;
	links: ILink[];
	suggestion: string;
	questions: IComment[];
}

interface ICourse extends Document {
	name: string;
	description: string;
	price: number;
	estimatedPrice: number;
	thumbnail: object;
	tax: string;
	level: string;
	demoVideUrl: string;
	benefits: { title: string }[];
	preqesites: string;
	reviews: IReview[];
	courseData: ICourseData[];
	ratings?: number;
	purchased?: number;
}

const reviewSchema = new Schema<IReview>({
	user: Object,
	rating: {
		type: Number,
		default: 0,
	},
	comment: String,
});

const linkSchema = new Schema<ILink>({
	title: String,
	url: String,
});

const commentSchema = new Schema<IComment>({
	user: Object,
	comment: String,
	commentReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
	title: String,
	description: String,
	reviews: [reviewSchema],
	videoUrl: String,
	videoThumbnail: Object,
	videoSection: String,
	videoLength: Number,
	videoPlayer: String,
	links: [linkSchema],
	suggestion: String,
	questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	estimatedPrice: {
		type: Number,
	},
	thumbnail: {
		public_id: {
			required: true,
			type: String,
		},
		required: true,
		url: {
			required: true,
			type: String,
		},
	},
	tax: {
		required: true,
		type: String,
	},
	level: {
		type: String,
		required: true,
	},
	demoVideUrl: {
		type: String,
		required: true,
	},
	benefits: [{ title: String }],
	preqesites: [{ title: String }],
	reviews: [reviewSchema],
	courseData: [courseDataSchema],
	ratings: {
		type: Number,
		default: 0,
	},
	purchased: {
		type: Number,
		default: 0,
	},
});

const courseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
export default courseModel;
