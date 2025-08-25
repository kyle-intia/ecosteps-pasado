import mongoose from "mongoose";

export interface UserProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  name: string;
  username: string;
  birthday?: Date;
  profilePic?: string;
  location?: string;
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
    name: { type: String, required: true},
    username: { type: String, required: true },
    birthday: { type: Date },
    profilePic: { type: String },
    location: { type: String },
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
