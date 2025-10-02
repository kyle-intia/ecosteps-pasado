// server/models/user.model.js
const mongoose = require('mongoose');
const { hashValue, compareValue } = require('../utils/bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    lastActive: { type: Date, default: Date.now },

    // ACHIEVEMENT SYSTEM FIELDS - NEW
    achievements: [{
        achievementId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        isEquipped: { type: Boolean, default: false },
        category: { type: String }
    }],
    
    equippedAchievements: [{
        achievementId: { type: String },
        equippedAt: { type: Date, default: Date.now }
    }],
    
    achievementStats: {
        totalTrackingDays: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        maxStreak: { type: Number, default: 0 },
        totalChallengesCompleted: { type: Number, default: 0 },
        transportChallengesCompleted: { type: Number, default: 0 },
        homeChallengesCompleted: { type: Number, default: 0 },
        foodChallengesCompleted: { type: Number, default: 0 },
        totalCO2Saved: { type: Number, default: 0 },
        carFreeDays: { type: Number, default: 0 },
        publicTransportUses: { type: Number, default: 0 },
        totalWalkingDistance: { type: Number, default: 0 },
        flightFreeDays: { type: Number, default: 0 },
        energySaverDays: { type: Number, default: 0 },
        efficientTempDays: { type: Number, default: 0 },
        unpluggedCompletions: { type: Number, default: 0 },
        plantBasedStreak: { type: Number, default: 0 },
        mealSkipStreak: { type: Number, default: 0 },
        mixedMealStreak: { type: Number, default: 0 },
        dairyBasedStreak: { type: Number, default: 0 },
        leftoverMeals: { type: Number, default: 0 },
        perfectChallengeWeeks: { type: Number, default: 0 },
        lastTrackingDate: { type: Date }
    },
    
    notificationPreferences: {
        achievementUnlocks: { type: Boolean, default: true },
        streakMilestones: { type: Boolean, default: true },
        challengeCompletions: { type: Boolean, default: true },
        soundEnabled: { type: Boolean, default: true }
    }
}, {
    timestamps: true, 
});

// Add indexes for achievement queries
userSchema.index({ 'achievements.achievementId': 1 });
userSchema.index({ 'equippedAchievements.achievementId': 1 });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await hashValue(this.password);
    return next();
});

userSchema.methods.comparePassword = async function (val) {
    return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// ACHIEVEMENT METHODS - NEW
userSchema.methods.hasAchievement = function(achievementId) {
    return this.achievements.some(a => a.achievementId === achievementId);
};

userSchema.methods.equipAchievement = function(achievementId) {
    // Check maximum limit
    if (this.equippedAchievements.length >= 3) {
        throw new Error('Maximum 3 achievements can be equipped');
    }
    
    // Check if achievement is unlocked
    if (!this.hasAchievement(achievementId)) {
        throw new Error('Achievement not unlocked');
    }
    
    // Check if already equipped
    if (!this.equippedAchievements.some(e => e.achievementId === achievementId)) {
        this.equippedAchievements.push({ 
            achievementId, 
            equippedAt: new Date() 
        });
    }
};

userSchema.methods.unequipAchievement = function(achievementId) {
    this.equippedAchievements = this.equippedAchievements.filter(
        e => e.achievementId !== achievementId
    );
};

userSchema.methods.addAchievement = function(achievementId, category) {
    if (!this.hasAchievement(achievementId)) {
        this.achievements.push({
            achievementId,
            unlockedAt: new Date(),
            progress: 100,
            isEquipped: false,
            category
        });
    }
};

userSchema.methods.updateAchievementProgress = function(achievementId, progress) {
    const achievement = this.achievements.find(a => a.achievementId === achievementId);
    if (achievement) {
        achievement.progress = Math.min(100, progress);
    }
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
