import { Router } from "express";
import { handleChat, handleOnboarding, handleHistory } from "../controllers/chatController.js";
import { handleTrackClick, handleProductModal }        from "../controllers/productController.js";
import { handleSignup, handleLogin, handleLinkSession, handleGetUser } from "../controllers/authController.js";
import { getSupabaseStatus, SCHEMA_SQL }               from "../db.js";
import { MODELS, deadModels }                          from "../llm.js";

const router = Router();

router.post("/chat",               handleChat);
router.post("/onboarding",         handleOnboarding);
router.get("/history",             handleHistory);
router.post("/api/track-click",    handleTrackClick);
router.post("/api/product-modal",  handleProductModal);
router.post("/auth/signup",        handleSignup);
router.post("/auth/login",         handleLogin);
router.post("/auth/link-session",  handleLinkSession);
router.get("/auth/user",           handleGetUser);

router.get("/health", (req, res) => res.json({
  status: "ok",
  version: "4.0.0",
  database: getSupabaseStatus(),
  llm: {
    provider: "OpenRouter",
    models: MODELS.map(m => ({
      id: m,
      status: deadModels.has(m) ? "dead (404 this session)" : "available",
    })),
    tip: "If all models show dead, visit https://openrouter.ai/models?q=free to find current free model IDs",
  },
  agents: ["onboarding","profiling","intent","recommendation","crossSell","marketplace","explanation"],
  timestamp: new Date().toISOString(),
}));

router.get("/schema", (req, res) => res.type("text").send(SCHEMA_SQL));

export default router;
