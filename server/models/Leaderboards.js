// server/models/Leaderboards.js
// Leaderboard entry schema used for ranking community members

const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
	{
		_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
		},
		fullName: {
			type: String,
			required: true,
			trim: true,
		},
		avatarUrl: {
			type: String,
			default: null,
		},
		score: {
			type: Number,
			default: 0,
			min: 0,
		},
		badges: {
			type: [String],
			default: [],
		},
		activity: {
			type: Number,
			default: 0,
			min: 0,
		},
		posts: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: (_, ret) => {
				ret.user = ret._id;
				return ret;
			},
		},
		toObject: {
			transform: (_, ret) => {
				ret.user = ret._id;
				return ret;
			},
		},
	}
);

leaderboardEntrySchema.index({ score: -1, activity: -1, posts: -1 });
leaderboardEntrySchema.index({ username: 1 });

const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);

module.exports = LeaderboardEntry;
