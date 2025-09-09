import { Router } from "express";
import {
  deleteSessionHandler,
  getSessionsHandler,
} from "../controllers/session.controller";

const sessionRoutes = Router();

<<<<<<< HEAD
=======
// prefix: /sessions
>>>>>>> c6059f8e8fe8634fc8af4f54f89449f8e645847e
sessionRoutes.get("/", getSessionsHandler);
sessionRoutes.delete("/:id", deleteSessionHandler);

export default sessionRoutes;