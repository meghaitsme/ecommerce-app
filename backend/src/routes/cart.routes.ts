import { Router } from "express";
import * as cartController from "../controllers/cart.controller";

const router = Router();

// Removed router.use(authenticate) so guests can access it
router.get("/", cartController.getCart);
router.post("/add", cartController.add);
router.put("/item/:productId", cartController.update);
router.delete("/item/:productId", cartController.remove);

export default router;