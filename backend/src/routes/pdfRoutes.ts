import { Router } from "express";
import path from "path";

const router = Router();

router.get("/pdfs/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "..", "..", "public", "pdfs", filename);
  res.download(filePath);
});

export default router;
