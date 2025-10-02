const UserModel = require("../models/user.model").default;
const DailyTracking = require("../models/DailyTracking");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class AdminService {
  /**
   * List users with optional filtering, search, pagination
   */


static async listUsers({ page = 1, limit = 10, search = '', status }) {
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { email: new RegExp(search, 'i') },
      { username: new RegExp(search, 'i') }
    ];
  }

  const skip = (page - 1) * limit;

  const matchStage = { $match: query };

  const aggregation = [
    matchStage,

    // Lookup total dailytrackings logs
    {
      $lookup: {
        from: "dailytrackings",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userId", "$$userId"] }
            }
          },
          {
            $count: "totalLogs"
          }
        ],
        as: "dailyLogs"
      }
    },

    // Add totalDailyLogs field
    {
      $addFields: {
        totalLogs: {
          $ifNull: [{ $arrayElemAt: ["$dailyLogs.totalLogs", 0] }, 0]
        }
      }
    },

    // Final projection
    {
      $project: {
        password: 0,
        dailyLogs: 0,
        __v: 0
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) }
  ];

  const [users, total] = await Promise.all([
    UserModel.aggregate(aggregation),
    UserModel.countDocuments(query)
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

  /**
   * Get a single user by ID
   */
  static async getUserById(userId) {
    return UserModel.findById(userId).lean();
  }

  static async getUserAdmin() {
    return UserModel.find({ role: 'admin' }).lean();
  }

  /**
   * Create a new user (admin-only action)
   */
  static async createUser(data) {
    const user = new UserModel(data);
    return user.save();
  }

  /**
   * Update an existing user's basic info (not password)
   */
  static async updateUser(userId, data) {
    delete data.password; // ensure password not updated here
    return UserModel.findByIdAndUpdate(userId, data, { new: true, lean: true });
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId) {
    return UserModel.findByIdAndDelete(userId);
  }

  /**
   * Update status: 'active', 'inactive', 'suspend'
   */
  static async updateStatus(userId, status) {
    return UserModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true, lean: true }
    );
  }

  /**
   * Change user role
   */
  static async changeRole(userId, role) {
    return UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true, lean: true }
    );
  }

  /**
 * Get user growth stats (weekly comparison)
 */
static async getUserGrowthStats() {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  // Count new users in the last 7 days
  const currentTotal = await UserModel.countDocuments({
    createdAt: { $gte: oneWeekAgo, $lte: now }
  });

  // Count new users in the previous 7-day period
  const previousTotal = await UserModel.countDocuments({
    createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
  });

  // Calculate percentage increase
  const increase = currentTotal - previousTotal;
  const percentageIncrease = previousTotal === 0
    ? 100
    : ((increase / previousTotal) * 100).toFixed(2);

  return {
    currentTotal,
    previousTotal,
    percentageIncrease: parseFloat(percentageIncrease)
  };
}



/**
   * Get activity log stats: total logs in current vs previous month + % increase
   */
  static async getActivityLogGrowth() {
  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // end of last month

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
    percentageIncrease = ((currentTotal - previousTotal) / previousTotal) * 100;
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

  // Aggregate average footprint for current month
  const currentResult = await DailyTracking.aggregate([
    {
      $match: {
        createdAt: { $gte: startCurrentMonth }
      }
    },
    {
      $group: {
        _id: null,
        avgFootprint: { $avg: "$calculatedFootprint.total" } // assuming `calculatedFootprint.total` is the footprint number
      }
    }
  ]);

  // Aggregate average footprint for previous month
  const prevResult = await DailyTracking.aggregate([
    {
      $match: {
        createdAt: { $gte: startPrevMonth, $lte: endPrevMonth }
      }
    },
    {
      $group: {
        _id: null,
        avgFootprint: { $avg: "$calculatedFootprint.total" }
      }
    }
  ]);

  const currentAvg = currentResult.length > 0 ? currentResult[0].avgFootprint : 0;
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
    currentAvg: currentAvg, // round if you want cleaner numbers
    previousAvg: Math.round(prevAvg),
    percentageIncrease: Math.round(percentageIncrease),
  };
}

static async listDailyTrackings({ page = 1, limit = 10, search = "", userId }) {
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
      // Filter the userId against search results
      if (searchUserIds.some((id) => id.equals(userObjectId))) {
        query.userId = userObjectId;
      } else {
        // No match found
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

  // Build only allowed/calculated fields
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
    { new: true }
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

    // Set the start and end of the day for the `createdAt` field
    const startOfDay = new Date(inputDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(inputDate.setUTCHours(23, 59, 59, 999));

    // Aggregate to match `createdAt` and perform a lookup to get email from `Users`
    const records = await DailyTracking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $lookup: {
          from: "users", // This is the name of the collection where user data is stored
          localField: "userId", // Field from `DailyTracking` that will match with `userId`
          foreignField: "_id", // Field in `Users` collection to match with `userId`
          as: "userDetails" // Alias for the user details from `Users`
        }
      },
      {
        $unwind: {
          path: "$userDetails", // Unwind the `userDetails` array to flatten the data
          preserveNullAndEmptyArrays: true // Optional: if no user is found, keep the document
        }
      },
      {
        $group: {
          _id: {
            createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } // Group by the createdAt date
          },
          users: {
            $push: {
              email: "$userDetails.email", // Get user email
              total: "$calculatedFootprint.total" // Get the total footprint
            }
          },
          totalSum: { $sum: "$calculatedFootprint.total" }, // Sum of all users' total footprints
          userCount: { $sum: 1 } // Count of users for the day
        }
      },
      {
        $project: {
          date: "$_id.createdAt", // Use the createdAt date as the final output date
          users: 1,
          totalSum: 1,
          userCount: 1,
          _id: 0,
          totalAvg: {
            $cond: {
              if: { $gt: ["$userCount", 0] }, // Only calculate if there are users
              then: { $divide: ["$totalSum", "$userCount"] }, // Calculate average
              else: 0 // If no users, set average to 0
            }
          }
        }
      }
    ]).exec();

    // If no records found, return an empty array
    if (records.length === 0) {
      return [];
    }

    // Reformat the result to have emails as keys with their respective total footprints
    const formattedResults = records.map(record => {
      const result = { date: record.date, totalAvg: record.totalAvg }; // Initialize the result object with the date and totalAvg

      // Iterate over the users and add each email with its total footprint
      record.users.forEach(user => {
        result[user.email] = user.total; // Add email as key and total as value
      });

      return result;
    });

    return formattedResults;

  } catch (err) {
    console.error("Error in getDailyFootprintByCategory:", err);
    throw err;
  }
}



  // Get monthly footprint by category
 static async getMonthlyFootprintByCategory(monthStr) {
    try {
      // Ensure the input is in format: YYYY-MM
      const [year, month] = monthStr.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new Error('Invalid month format. Use YYYY-MM');
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
        throw new Error('Invalid year format. Use YYYY');
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
    if (typeof value !== 'boolean') {
      throw new Error('maintenanceMode must be a boolean');
    }
    this.maintenanceMode = value;

    return this.maintenanceMode;
  }


}


module.exports = AdminService;
