import { HfInference } from "@huggingface/inference";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });

  try {
    const hf = new HfInference(process.env.HF_TOKEN);
    const result = await hf.textClassification({
      model: "cardiffnlp/twitter-roberta-base-sentiment",
      inputs: text,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Analysis failed" });
  }
}
