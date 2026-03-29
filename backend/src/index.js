import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";
import { getSupabaseStatus } from "./db.js";
import { MODELS } from "./llm.js";

dotenv.config();
const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173", process.env.FRONTEND_URL, "https://et-ai-concierge-team-codex.vercel.app"].filter(Boolean),
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use((req, _, next) => { if (req.path !== "/health") console.log(`${req.method} ${req.path}`); next(); });
app.get("/", (req, res) => {
  res.send("ET AI Concierge Backend Running 🚀");
});
app.use("/", chatRoutes);
app.use((_, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _, res, __) => { console.error(err.message); res.status(500).json({ error: "Internal error" }); });

app.listen(PORT, () => {
  const db = getSupabaseStatus();
  console.log(`\n ET AI Concierge v4.0 → http://localhost:${PORT}`);
  console.log(` OpenRouter: ${process.env.OPENROUTER_API_KEY ? "✓" : "✗ MISSING — add OPENROUTER_API_KEY to backend/.env"}`);
  console.log(` Supabase:   ${db.connected ? `✓ ${db.url}` : "⚠ not configured (optional)"}`);
  console.log(` Models (${MODELS.length} free):`);
  MODELS.forEach(m => console.log(`   · ${m}`));
  console.log(` Tip: If models 404, check https://openrouter.ai/models?q=free\n`);
});
