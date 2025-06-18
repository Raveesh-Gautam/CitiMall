const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

const geminiPrompt = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "YOLO to the moon!"
    );
  } catch (error) {
    console.error("Gemini API error:", error);
    return "YOLO to the moon!";
  }
};

export default geminiPrompt;
