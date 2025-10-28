// Main Shopper Chatbot App
class ShopApp {
constructor() {
this.isProcessing = false;
this.sessionStart = Date.now();
this.sampleCatalog = this.loadSampleCatalog();
this.stats = { suggestions: 0, compared: 0, messages: 0 };
this.init();
}


init() {
this.bindUI();
this.renderInsights();
this.log("Shopper Chatbot initialized");
}


bindUI() {
const input = document.getElementById("chatInput");
const send = document.getElementById("sendButton");
const chips = document.querySelectorAll(".quick-action-btn");
const refresh = document.getElementById("refreshInsights");


send.addEventListener("click", () => this.handleMessage());
input.addEventListener("keypress", (e) => {
if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.handleMessage(); }
});


chips.forEach((b) => b.addEventListener("click", (e) => {
input.value = e.currentTarget.dataset.fill;
this.handleMessage();
}));


refresh.addEventListener("click", () => this.renderInsights(true));
}


// -------- Chat Flow --------
async handleMessage() {
if (this.isProcessing) return;
const input = document.getElementById("chatInput");
const msg = (input.value || "").trim();
if (!msg) return this.toast("Type something to begin", "warning");


this.isProcessing = true;
this.toggleLoading(true, "Finding great matches…");
this.addMessage(msg, "user");
input.value = "";
this.bumpStat("messages");


// Lightweight intent router for demos
const lower = msg.toLowerCase();
if (lower.startsWith("track my order") || lower.includes("order #") || lower.includes("order status")) {
const id = (msg.match(/[A-Z0-9]{6,}/) || [null])[0];
this.addMessage(this.fakeOrderLookup(id), "ai");
this.finish();
return;
}


if (lower.startsWith("compare ") || lower.includes(" vs ")) {
const table = this.demoCompare(msg);
this.addMessage(table, "ai");
this.bumpStat("compared");
this.finish();
return;
}


// Fallback to AI
window.addEventListener("DOMContentLoaded", () => { window.app = new ShopApp(); });
