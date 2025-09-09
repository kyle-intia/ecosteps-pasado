import mongoose from "mongoose";

export interface UserProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  birthday?: Date;
  profilePic?: string;
  address?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new mongoose.Schema<UserProfileDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    username: { type: String, required: true },
    birthday: { type: Date },
    profilePic: { type: String },
    address: { type: String },
    bio: { type: String }
  },
  {
    timestamps: true,
  }
);

const UserProfileModel = mongoose.model<UserProfileDocument>(
  "users_profile",
  userProfileSchema
);

export default UserProfileModel;




