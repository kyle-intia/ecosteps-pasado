// server/models/Recommendation.js
// MongoDB model for storing AI-generated carbon footprint recommendations

const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  footprintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTracking',
    required: true
  },
  // Summary of the footprint data used for recommendations
  footprintSummary: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    transport: {
      type: Number,
      required: true,
      min: 0
    },
    homeEnergy: {
      type: Number,
      required: true,
      min: 0
    },
    food: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    }
  },
  // Array of generated recommendations
  recommendations: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    category: {
      type: String,
      enum: ['transport', 'home', 'food', 'general'],
      required: true
    },
    estimatedSavings: {
      type: Number,
      required: true,
      min: 0,
      max: 50 // Reasonable upper limit in kg CO2e
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    source: {
      type: String,
      enum: ['ai_generated', 'rule_based', 'hybrid'],
      required: true
    },
    actionable: {
      type: Boolean,
      default: true
    },
    // Track user interactions with recommendations
    userInteraction: {
      viewed: {
        type: Boolean,
        default: false
      },
      viewedAt: Date,
      liked: {
        type: Boolean,
        default: false
      },
      likedAt: Date,
      implemented: {
        type: Boolean,
        default: false
      },
      implementedAt: Date,
      feedback: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: String,
        submittedAt: Date
      }
    }
  }],
  // Metadata about the AI generation process
  aiMetadata: {
    model: {
      type: String,
      default: 'gpt2'
    },
    processingTime: {
      type: Number, // in milliseconds
      required: true
    },
    prompt: String, // The prompt sent to AI
    rawResponse: String, // Raw AI response for debugging
    fallback: {
      type: Boolean,
      default: false
    },
    error: String // Error message if fallback was used
  },
  // Analytics and performance tracking
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalImplemented: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    lastInteractionAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ footprintId: 1 });
recommendationSchema.index({ 'footprintSummary.date': -1 });
recommendationSchema.index({ 'aiMetadata.fallback': 1 });

// Compound index for finding recent recommendations by user
recommendationSchema.index({ userId: 1, footprintId: 1 });

// Pre-save middleware to update timestamps and analytics
recommendationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update analytics when recommendations are modified
  if (this.recommendations && this.recommendations.length > 0) {
    this.analytics.totalViews = this.recommendations.reduce((sum, rec) => 
      sum + (rec.userInteraction.viewed ? 1 : 0), 0);
    
    this.analytics.totalLikes = this.recommendations.reduce((sum, rec) => 
      sum + (rec.userInteraction.liked ? 1 : 0), 0);
    
    this.analytics.totalImplemented = this.recommendations.reduce((sum, rec) => 
      sum + (rec.userInteraction.implemented ? 1 : 0), 0);
    
    // Calculate average rating
    const ratings = this.recommendations
      .map(rec => rec.userInteraction.feedback?.rating)
      .filter(rating => rating !== undefined && rating !== null);
    
    if (ratings.length > 0) {
      this.analytics.averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }
    
    // Update last interaction time
    const lastInteractions = this.recommendations
      .map(rec => [rec.userInteraction.viewedAt, rec.userInteraction.likedAt, rec.userInteraction.implementedAt])
      .flat()
      .filter(date => date)
      .sort((a, b) => b - a);
    
    if (lastInteractions.length > 0) {
      this.analytics.lastInteractionAt = lastInteractions[0];
    }
  }
  
  next();
});

// Instance methods
recommendationSchema.methods.markAsViewed = function(recommendationId) {
  const rec = this.recommendations.find(r => r.id === recommendationId);
  if (rec && !rec.userInteraction.viewed) {
    rec.userInteraction.viewed = true;
    rec.userInteraction.viewedAt = new Date();
  }
  return this.save();
};

recommendationSchema.methods.toggleLike = function(recommendationId) {
  const rec = this.recommendations.find(r => r.id === recommendationId);
  if (rec) {
    rec.userInteraction.liked = !rec.userInteraction.liked;
    rec.userInteraction.likedAt = rec.userInteraction.liked ? new Date() : null;
  }
  return this.save();
};

recommendationSchema.methods.markAsImplemented = function(recommendationId) {
  const rec = this.recommendations.find(r => r.id === recommendationId);
  if (rec) {
    rec.userInteraction.implemented = true;
    rec.userInteraction.implementedAt = new Date();
  }
  return this.save();
};

recommendationSchema.methods.addFeedback = function(recommendationId, rating, comment = null) {
  const rec = this.recommendations.find(r => r.id === recommendationId);
  if (rec) {
    rec.userInteraction.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };
  }
  return this.save();
};

// Static methods for analytics
recommendationSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRecommendations: { $sum: { $size: '$recommendations' } },
        totalViews: { $sum: '$analytics.totalViews' },
        totalLikes: { $sum: '$analytics.totalLikes' },
        totalImplemented: { $sum: '$analytics.totalImplemented' },
        averageRating: { $avg: '$analytics.averageRating' },
        generationCount: { $sum: 1 },
        fallbackCount: { $sum: { $cond: ['$aiMetadata.fallback', 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    totalRecommendations: 0,
    totalViews: 0,
    totalLikes: 0,
    totalImplemented: 0,
    averageRating: 0,
    generationCount: 0,
    fallbackCount: 0
  };
};

recommendationSchema.statics.getSystemStats = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $addToSet: '$userId' },
        totalRecommendations: { $sum: { $size: '$recommendations' } },
        totalViews: { $sum: '$analytics.totalViews' },
        totalLikes: { $sum: '$analytics.totalLikes' },
        totalImplemented: { $sum: '$analytics.totalImplemented' },
        averageProcessingTime: { $avg: '$aiMetadata.processingTime' },
        fallbackRate: { $avg: { $cond: ['$aiMetadata.fallback', 1, 0] } },
        generationCount: { $sum: 1 }
      }
    },
    {
      $project: {
        totalUsers: { $size: '$totalUsers' },
        totalRecommendations: 1,
        totalViews: 1,
        totalLikes: 1,
        totalImplemented: 1,
        averageProcessingTime: 1,
        fallbackRate: { $multiply: ['$fallbackRate', 100] }, // Convert to percentage
        generationCount: 1,
        implementationRate: {
          $cond: [
            { $eq: ['$totalRecommendations', 0] },
            0,
            { $multiply: [{ $divide: ['$totalImplemented', '$totalRecommendations'] }, 100] }
          ]
        }
      }
    }
  ]);
  
  return stats[0] || {};
};

// Virtual for getting formatted creation date
recommendationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for checking if recommendations are recent (within last 24 hours)
recommendationSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

module.exports = mongoose.model('Recommendation', recommendationSchema);