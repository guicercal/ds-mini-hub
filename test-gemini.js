const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'Hi, I saw your ad for the 2024 BMW X5. Is it still available?' }] }],
    systemInstruction: { parts: [{ text: "You are a helpful and professional dealership sales advisor named Max at DealSmart Motors." }] },
    generationConfig: { maxOutputTokens: 1000 }
  })
}).then(res => res.json()).then(o => console.log(JSON.stringify(o.candidates[0], null, 2))).catch(console.error);
