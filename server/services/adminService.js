const UserModel = require("../models/user.model");
const DailyTracking = require("../models/DailyTracking");
const Assessment = require("../models/AssessmentModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class AdminService {
  static async listUsers({ page = 1, limit = 10, search = "", status }) {
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: new RegExp(search, "i") },
        { username: new RegExp(search, "i") },
      ];
    }

    const skip = (page - 1) * limit;

    const matchStage = { $match: query };

    const aggregation = [
      matchStage,

      {
        $lookup: {
          from: "dailytrackings",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
              },
            },
            {
              $count: "totalLogs",
            },
          ],
          as: "dailyLogs",
        },
      },

      {
        $addFields: {
          totalLogs: {
            $ifNull: [{ $arrayElemAt: ["$dailyLogs.totalLogs", 0] }, 0],
          },
        },
      },

      {
        $project: {
          password: 0,
          dailyLogs: 0,
          __v: 0,
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const [users, total] = await Promise.all([
      UserModel.aggregate(aggregation),
      UserModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUserById(userId) {
    return UserModel.findById(userId).lean();
  }

  static async getUserAdmin() {
    return UserModel.find({ role: "admin" }).lean();
  }

  static async createUser(data) {
    const user = new UserModel(data);
    return user.save();
  }

  static async updateUser(userId, data) {
    delete data.password;
    return UserModel.findByIdAndUpdate(userId, data, { new: true, lean: true });
  }

  static async deleteUser(userId) {
    return UserModel.findByIdAndDelete(userId);
  }

  static async updateStatus(userId, status) {
    return UserModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true, lean: true },
    );
  }

  static async changeRole(userId, role) {
    return UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true, lean: true },
    );
  }

  static async getUserGrowthStats() {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const totalUser = await UserModel.countDocuments();

    const currentTotal = await UserModel.countDocuments({
      createdAt: { $gte: oneWeekAgo, $lte: now },
    });

    const previousTotal = await UserModel.countDocuments({
      createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
    });

    const increase = currentTotal - previousTotal;
    const percentageIncrease =
      previousTotal === 0 ? 100 : ((increase / previousTotal) * 100).toFixed(2);

    return {
      totalUser,
      currentTotal,
      previousTotal,
      percentageIncrease: parseFloat(percentageIncrease),
    };
  }

  static async getActivityLogGrowth() {
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const currentTotal = await DailyTracking.countDocuments({
      createdAt: { $gte: currentMonthStart },
    });

    const previousTotal = await DailyTracking.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    let percentageIncrease = 0;

    if (previousTotal === 0 && currentTotal > 0) {
      percentageIncrease = 100;
    } else if (previousTotal === 0 && currentTotal === 0) {
      percentageIncrease = 0;
    } else {
      percentageIncrease =
        ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return {
      currentTotal,
      previousTotal,
      percentageIncrease: Math.round(percentageIncrease),
    };
  }

  static async getAvgFootprintGrowth() {
    const now = new Date();

    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrevMonth = new Date(startCurrentMonth.getTime() - 1);

    const currentResult = await DailyTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: startCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          avgFootprint: { $avg: "$calculatedFootprint.total" },
        },
      },
    ]);

    const prevResult = await DailyTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: startPrevMonth, $lte: endPrevMonth },
        },
      },
      {
        $group: {
          _id: null,
          avgFootprint: { $avg: "$calculatedFootprint.total" },
        },
      },
    ]);

    const currentAvg =
      currentResult.length > 0 ? currentResult[0].avgFootprint : 0;
    const prevAvg = prevResult.length > 0 ? prevResult[0].avgFootprint : 0;

    let percentageIncrease = 0;

    if (prevAvg === 0 && currentAvg > 0) {
      percentageIncrease = 100;
    } else if (prevAvg === 0 && currentAvg === 0) {
      percentageIncrease = 0;
    } else {
      percentageIncrease = ((currentAvg - prevAvg) / prevAvg) * 100;
    }

    return {
      currentAvg: currentAvg,
      previousAvg: Math.round(prevAvg),
      percentageIncrease: Math.round(percentageIncrease),
    };
  }

  static async listDailyTrackings({
    page = 1,
    limit = 10,
    search = "",
    userId,
  }) {
    page = Math.max(parseInt(page), 1);
    limit = Math.max(parseInt(limit), 1);

    const query = {};

    let searchUserIds = [];

    if (search) {
      const users = await UserModel.find({
        email: new RegExp(search, "i"),
      }).select("_id");
      searchUserIds = users.map((u) => u._id);
    }

    if (userId) {
      const userObjectId = new ObjectId(userId);
      if (search) {
        if (searchUserIds.some((id) => id.equals(userObjectId))) {
          query.userId = userObjectId;
        } else {
          return {
            data: [],
            total: 0,
            page,
            totalPages: 0,
          };
        }
      } else {
        query.userId = userObjectId;
      }
    } else if (searchUserIds.length) {
      query.userId = { $in: searchUserIds };
    }

    const skip = (page - 1) * limit;

    const aggregation = [
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          userId: 1,
          email: "$user.email",
          transport: "$calculatedFootprint.transport",
          homeEnergy: "$calculatedFootprint.homeEnergy",
          food: "$calculatedFootprint.food",
          total: "$calculatedFootprint.total",
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [data, total] = await Promise.all([
      DailyTracking.aggregate(aggregation),
      DailyTracking.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getDailyTrackingByUserId(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    return DailyTracking.find({ userId: new ObjectId(userId) }).lean();
  }

  static async patchDailyTracking(id, partialData) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ID");
    }

    const allowedFields = ["transport", "homeEnergy", "food", "total"];
    const setData = {};

    for (const key of allowedFields) {
      if (key in partialData) {
        setData[`calculatedFootprint.${key}`] = partialData[key];
      }
    }

    if (Object.keys(setData).length === 0) {
      throw new Error("No valid fields to update");
    }

    const updated = await DailyTracking.findByIdAndUpdate(
      id,
      { $set: setData },
      { new: true },
    );

    if (!updated) {
      throw new Error("DailyTracking not found");
    }

    return updated;
  }

  static async deleteDailyTracking(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ID");
    }

    const deleted = await DailyTracking.findByIdAndDelete(id);

    if (!deleted) {
      throw new Error("DailyTracking not found");
    }

    return { success: true, id };
  }

  static async getDailyFootprintByCategory(date) {
    try {
      const inputDate = new Date(date);

      const startOfDay = new Date(inputDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(inputDate.setUTCHours(23, 59, 59, 999));

      const records = await DailyTracking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              createdAt: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
            users: {
              $push: {
                email: "$userDetails.email",
                total: "$calculatedFootprint.total",
              },
            },
            totalSum: { $sum: "$calculatedFootprint.total" },
            userCount: { $sum: 1 },
          },
        },
        {
          $project: {
            date: "$_id.createdAt",
            users: 1,
            totalSum: 1,
            userCount: 1,
            _id: 0,
            totalAvg: {
              $cond: {
                if: { $gt: ["$userCount", 0] },
                then: { $divide: ["$totalSum", "$userCount"] },
                else: 0,
              },
            },
          },
        },
      ]).exec();

      if (records.length === 0) {
        return [];
      }

      const formattedResults = records.map((record) => {
        const result = { date: record.date, totalAvg: record.totalAvg };

        record.users.forEach((user) => {
          result[user.email] = user.total;
        });

        return result;
      });

      return formattedResults;
    } catch (err) {
      console.error("Error in getDailyFootprintByCategory:", err);
      throw err;
    }
  }

  static async getMonthlyFootprintByCategory(monthStr) {
    try {
      const [year, month] = monthStr.split("-").map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new Error("Invalid month format. Use YYYY-MM");
      }

      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const result = await DailyTracking.aggregate([
        {
          $match: {
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            transport: { $sum: "$calculatedFootprint.transport" },
            homeEnergy: { $sum: "$calculatedFootprint.homeEnergy" },
            food: { $sum: "$calculatedFootprint.food" },
            total: { $sum: "$calculatedFootprint.total" },
          },
        },
      ]);

      if (result.length === 0) {
        return {
          transport: 0,
          homeEnergy: 0,
          food: 0,
          total: 0,
        };
      }

      const { transport, homeEnergy, food, total } = result[0];
      return {
        transport,
        homeEnergy,
        food,
        total,
      };
    } catch (err) {
      console.error("Error in getMonthlyFootprintByCategory:", err);
      throw err;
    }
  }

  static async getYearlyFootprintByCategory(yearStr) {
    try {
      const year = Number(yearStr);
      if (!year || year < 1000 || year > 9999) {
        throw new Error("Invalid year format. Use YYYY");
      }

      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      const result = await DailyTracking.aggregate([
        {
          $match: {
            date: {
              $gte: startOfYear,
              $lte: endOfYear,
            },
          },
        },
        {
          $group: {
            _id: null,
            transport: { $sum: "$calculatedFootprint.transport" },
            homeEnergy: { $sum: "$calculatedFootprint.homeEnergy" },
            food: { $sum: "$calculatedFootprint.food" },
            total: { $sum: "$calculatedFootprint.total" },
          },
        },
      ]);

      if (result.length === 0) {
        return {
          transport: 0,
          homeEnergy: 0,
          food: 0,
          total: 0,
        };
      }

      const { transport, homeEnergy, food, total } = result[0];
      return {
        transport,
        homeEnergy,
        food,
        total,
      };
    } catch (err) {
      console.error("Error in getYearlyFootprintByCategory:", err);
      throw err;
    }
  }

  static maintenanceMode = false;

  static async getMaintenanceMode() {
    return this.maintenanceMode;
  }

  static async setMaintenanceMode(value) {
    if (typeof value !== "boolean") {
      throw new Error("maintenanceMode must be a boolean");
    }
    this.maintenanceMode = value;

    return this.maintenanceMode;
  }

  static average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  static classifyChange(change) {
    if (change > 0.5) return "Significant Improvement";
    if (change > 0.1) return "Moderate Improvement";
    if (change >= -0.1) return "No Significant Change";
    return "Decline";
  }

  static async getAggregatedResults() {
    const users = await Assessment.distinct("userId");
    const aggregated = [];

    for (const userId of users) {
      const assessments = await Assessment.find({ userId }).sort({
        createdAt: 1,
      });
      const pre = assessments.find((a) => a.type === "pre");
      const post = assessments.find((a) => a.type === "post");

      if (!pre || !post) continue;

      const preAwareness = this.average(pre.awarenessAnswers);
      const postAwareness = this.average(post.awarenessAnswers);
      const awarenessChange = postAwareness - preAwareness;

      const preBehavior = this.average(pre.behaviorAnswers);
      const postBehavior = this.average(post.behaviorAnswers);
      const behaviorChange = postBehavior - preBehavior;

      const emissionChange = pre.monthlyEmissions - post.monthlyEmissions;
      const emissionReductionPercent =
        (emissionChange / pre.monthlyEmissions) * 100;

      const awarenessImproved = awarenessChange > 0;
      const behaviorImproved = behaviorChange > 0;
      const emissionsImproved = emissionChange > 0;

      const improvementScore = [
        awarenessImproved,
        behaviorImproved,
        emissionsImproved,
      ].filter(Boolean).length;

      aggregated.push({
        awarenessChange,
        behaviorChange,
        emissionChange,
        emissionReductionPercent,
        overallImproved: improvementScore >= 2,
      });
    }

    if (!aggregated.length) return null;

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      totalUsers: aggregated.length,
      awareness: {
        avgChange: avg(aggregated.map((a) => a.awarenessChange)),
      },
      behavior: {
        avgChange: avg(aggregated.map((a) => a.behaviorChange)),
      },
      emissions: {
        avgReductionKg: avg(aggregated.map((a) => a.emissionChange)),
        avgReductionPercent: avg(
          aggregated.map((a) => a.emissionReductionPercent),
        ),
      },
      overall: {
        improvedCount: aggregated.filter((a) => a.overallImproved).length,
        improvedPercent:
          (aggregated.filter((a) => a.overallImproved).length /
            aggregated.length) *
          100,
      },
    };
  }
}

module.exports = AdminService;
