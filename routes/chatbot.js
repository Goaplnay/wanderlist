require("dotenv").config();
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get("/", (req, res) => {
  res.render("chatbot.ejs");
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    console.log("Groq API Key:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Missing");
    console.log("User message:", message);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful travel assistant for WanderList, 
          a travel listing platform. Help users with:
          - Travel destinations and tips
          - Best time to visit places
          - Local food, culture, and attractions
          - Packing suggestions
          - Budget travel advice
          Keep responses friendly, concise and helpful.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content;
    console.log("AI Response:", reply);
    res.json({ reply });

  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router.post("/price-suggest", async (req, res) => {
  try {
    const { location, country, description } = req.body;

    if (!location || !country) {
      return res.status(400).json({ error: "Location aur country required hai" });
    }

    const prompt = `You are a real estate and travel pricing expert.
    Suggest a reasonable nightly rental price in Indian Rupees (₹) for a property with these details:
    - Location: ${location}
    - Country: ${country}
    - Description: ${description || "Standard property"}
    
    Give a specific price range like "₹2,000 - ₹3,500 per night" and explain why in 2-3 lines.
    Keep response concise and helpful.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 256,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error("Price suggest error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router.post("/summarize-reviews", async (req, res) => {
  try {
    const { reviews } = req.body;

    if (!reviews || reviews.length === 0) {
      return res.status(400).json({ error: "Koi review nahi hai!" });
    }

    const reviewText = reviews
      .map((r, i) => `Review ${i + 1}: Rating ${r.rating}/5 - "${r.comment}"`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Ye listing ke reviews hain:\n\n${reviewText}\n\nIn reviews ka ek concise summary do in points mein:\n- Overall rating/sentiment\n- Kya accha hai\n- Kya improve ho sakta hai\n- Kya recommend karoge?\nHindi ya English mein short aur helpful rakho.`,
        },
      ],
      max_tokens: 512,
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary });

  } catch (err) {
    console.error("Summarize error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;