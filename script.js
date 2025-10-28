// =====================================================
// FitGen AI • Chatbot (OpenAI)
// Mirrors your Groq-style structure, but uses OpenAI
// IDs referenced in your HTML: chatContainer, userInput, sendButton
// =====================================================

// ---------- Global variables ----------
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// ---------- OpenAI API configuration ----------
// ⚠️ For production, DO NOT expose your key in the browser.
// Instead, set OPENAI_PROXY_URL = '/api/chat' and handle the key server-side.
const OPENAI_API_KEY = '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'; // <- replace for quick local demo only
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'; // or your '/api/chat' proxy

// Conversation history for context
let conversationHistory = [];

// ---------- Initialize chat functionality ----------
document.addEventListener('DOMContentLoaded', function () {
  // Enter key to send message
  userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-focus input
  userInput.focus();
  console.log('FitGen AI Stylist initialized');
});

// ---------- Send message function ----------
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Disable input while processing
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat
  addMessage(message, 'user');
  userInput.value = '';

  // Show typing indicator
  showTypingIndicator();

  try {
    // Call OpenAI API with conversation context
    const response = await callOpenAIAPI(message);

    hideTypingIndicator();

    // Add bot response to chat
    const formatted = formatResponse(response);
    addMessage(formatted, 'bot');

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    // Limit history to last 20 messages for performance
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    // Optional analytics log
    logInteraction(message, response);
  } catch (error) {
    hideTypingIndicator();
    addMessage(
      'I’m sorry—I hit a snag. I can connect you to a human stylist right away. Would you like me to do that?',
      'bot'
    );
    console.error('OpenAI API Error:', error);
  } finally {
    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// ---------- Quick message function for buttons ----------
function sendQuickMessage(message) {
  userInput.value = message;
  sendMessage();
}

// ---------- Add message to chat interface ----------
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.textContent = sender === 'user' ? '👤' : '👗';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // Allow basic HTML (already sanitized/created by formatResponse)
  if (/<[a-z][\s\S]*>/i.test(text)) {
    contentDiv.innerHTML = text;
  } else {
    contentDiv.textContent = text;
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ---------- Typing indicator ----------
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typingIndicator';

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.textContent = '👗';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'typing-content';
  contentDiv.innerHTML = `
    <span>AI is thinking</span>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;

  typingDiv.appendChild(avatarDiv);
  typingDiv.appendChild(contentDiv);
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) typingIndicator.remove();
}

// ---------- OpenAI API integration ----------
async function callOpenAIAPI(message) {
  const systemPrompt = `
You are FitGen AI, a friendly, precise sizing and customer-support stylist for fashion/e-commerce.
Ask brief clarifying questions if brand/product or key measurements are missing.
When recommending a size, include confidence % and a one-line rationale.
Consider fabric behavior: cotton may shrink 3–5%; blends hold shape; knits have ease; denim relaxes.
For returns/exchanges, collect order #, email, item/SKU; outline steps briefly.
Keep responses concise and actionable. Avoid medical claims.
`;

  const headers = {
    'Content-Type': 'application/json',
    // ⚠️ For quick local testing ONLY. In production, proxy this server-side.
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  };

  const body = {
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 600,
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]
  };

  // Make sure OPENAI_URL is EXACTLY this when calling OpenAI directly:
  // const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  const res = await fetch(OPENAI_URL, { method: 'POST', headers, body: JSON.stringify(body) });

  // Helpful error surfacing to avoid silent fallback
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status} – ${txt}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Malformed OpenAI response');
  return content;
}

// ---------- Utility: basic formatting & linkify ----------
function formatResponse(text) {
  // Bold/italic + simple URL linkify + line breaks
  const escaped = escapeHTML(text);
  const withMarkdown =
    escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

  return linkify(withMarkdown);
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

// ---------- Utility: fallback responses (when API fails) ----------
function fallbackFor(message) {
  const lower = message.toLowerCase();
  const map = {
    size: `To recommend a size, please share:
• Brand & product (e.g., Nike Club Fleece Hoodie)
• Height & weight
• Chest/Bust, Waist, Hips
• Fit preference (slim/regular/relaxed)
I’ll give you a size + confidence and a short rationale.`,
    return: `You can start a return or size exchange in a few steps:
• Order # and email
• Item condition (unused/with tags)
• Reason (size/fit/etc.)
Would you like me to begin the return with your order details?`,
    exchange: `Happy to help with a size swap:
• Order # and email
• New size you’d like
I’ll create the exchange label and next steps.`,
    ship: `Shipping basics:
• Standard: 2–4 business days
• Expedited options at checkout
• Free standard over \$100 (varies by promo)
Want me to check your specific order status?`,
    track: `I can track your order—please share:
• Order #
• Email or shipping zip code`
  };
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return `I’m having trouble reaching the AI right now. Do you want me to hand this off to a human stylist, or try again in a minute?`;
}

// ---------- Optional analytics ----------
function logInteraction(userMessage, botResponse) {
  console.log('Interaction logged:', {
    timestamp: new Date().toISOString(),
    user: userMessage,
    bot: botResponse,
    sessionId: 'fitgen-demo'
  });
}
