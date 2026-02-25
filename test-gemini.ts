import dotenv from 'dotenv'
dotenv.config()

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Hi, I saw your ad for the 2024 BMW X5. Is it still available?' }] }],
            systemInstruction: { parts: [{ text: "You are a helpful and professional dealership sales advisor named Max." }] },
            generationConfig: { maxOutputTokens: 1000 }
        })
    });
    const data = await res.json();
    console.log(JSON.stringify(data.candidates[0].content.parts, null, 2));
}
test();
