import "dotenv/config";
import cors from 'cors';
import cookieParser from "cookie-parser";
import express from 'express';
import connectToDatabase from "./config/db";
import authRoutes from "./routes/auth.route";
import { OK } from "./constants/http";
import errorHandler from "./middleware/errorHandler";
import userRoutes from "./routes/user.route";
import { APP_ORIGIN, PORT, NODE_ENV } from "./constants/env";
import authenticate from "./middleware/authenticate";
import sessionRoutes from "./routes/session.route";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.APP_ORIGIN,
        credentials: true,
    })
);

app.use(cookieParser());

app.get("/", (_, res) => {
    return res.status(OK).json({
        status: "healthy",
    });
});
  
app.use("/auth", authRoutes);

app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);


app.use(errorHandler);

const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT} in ${NODE_ENV} mode`);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});