// OpenAI Shopper Chatbot Integration (Demo)
// ⚠️ Demo only: do NOT ship real keys in frontend. Use a proxy in production.


const OPENAI_API_KEY = "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"; // <-- demo only
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"; // compatible endpoint
const OPENAI_MODEL = "gpt-4o-mini"; // lightweight, multimodal-capable text model


class AIShopper {
constructor() {
this.history = [];
this.brandVoice = {
tone: "friendly, concise, helpful",
disclaimers: [
"Prices and availability can change.",
"For live order data, use the Track Order button or contact support.",
],
};
}


systemPrompt() {
return `You are ShopBot, an expert shopping assistant for an online store.
- Ask targeted questions to clarify budget, use case, constraints.
- Synthesize comparisons with brief spec tables, pros/cons, and who it's for.
- When asked for order status, call the {order_status} function (stub) with the order id if present, otherwise ask.
- When asked about returns/shipping, summarize store policy from provided context, and cite source label like (Store FAQ).
- Respect constraints (budget, size, platform). If not enough info, ask 1-2 smart follow-ups.
- Be concise. Use lists and mini tables (markdown) when helpful.
- Never invent inventory or exact prices—use ranges or say you need to check.
`;
}


async chat(userMessage, context = {}) {
// Compose messages with lightweight memory (last 8 turns)
const recent = this.history.slice(-8);
const messages = [
{ role: "system", content: this.systemPrompt() },
...recent,
{ role: "user", content: userMessage }
];


const body = {
model: OPENAI_MODEL,
messages,
temperature: 0.4,
};


try {
const res = await fetch(OPENAI_URL, {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${OPENAI_API_KEY}`,
},
body: JSON.stringify(body),
});


if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
const data = await res.json();
const reply = data.choices?.[0]?.message?.content?.trim() || "";


this.history.push({ role: "user", content: userMessage });
this.history.push({ role: "assistant", content: reply });
return reply;
} catch (err) {
console.error(err);
return "I had trouble reaching the AI. Please try again in a moment.";
}
}
}


window.shopAI = new AIShopper();
