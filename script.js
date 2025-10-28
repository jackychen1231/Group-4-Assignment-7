// ==============================
// FitGen AI Chat – Frontend JS
// Using OpenAI Chat Completions
// ==============================

// Global elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// OpenAI API config (for demo only — use a server-side proxy in production)
const OPENAI_API_KEY = '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';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Conversation history for context
let conversationHistory = [];

// Init
document.addEventListener('DOMContentLoaded', () => {
  // Enter to send
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  userInput.focus();
  console.log('FitGen AI Stylist initialized');
});

// Send message
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Disable input while processing
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message
  addMessage(message, 'user');
  userInput.value = '';

  // Typing indicator
  showTypingIndicator();

  try {
    // Call OpenAI with conversation context
    const response = await callOpenAI(message);

    hideTypingIndicator();

    // Add bot response
    addMessage(response, 'bot');

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    // Keep last 20 turns
    if (conversationHistory.length > 40) {
      conversationHistory = conversationHistory.slice(-40);
    }
  } catch (error) {
    hideTypingIndicator();
    addMessage(
      "I’m having trouble reaching the sizing engine right now. I can connect you to a human stylist or try again—what would you prefer?",
      'bot'
    );
    console.error('OpenAI API Error:', error);
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// Quick actions
function sendQuickMessage(message) {
  userInput.value = message;
  sendMessage();
}

// Render a chat bubble
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.textContent = sender === 'user' ? '👤' : '👗';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // Allow simple HTML (e.g., bold, lists) from the assistant
  if (sender === 'bot' && /<\w+/.test(text)) {
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

// Typing indicator
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
    <span>Stylist is thinking</span>
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

// ==============================
// OpenAI integration (FitGen AI)
// ==============================
async function callOpenAI(userMessage) {
  // System prompt tailored to FitGen AI
  const systemPrompt = `
You are the FitGen AI Stylist. Your goal is to deliver accurate, brand-aware sizing
and shopper support. Be concise, friendly, and specific. Prefer bullet points for
steps and include confidence where appropriate.

CAPABILITIES:
- Size & Fit: Recommend sizes based on height, weight, measurements, and fit
  preference (slim/regular/relaxed). Mention any brand-specific tendencies
  (e.g., "Brand X tops run small in shoulders").
- Comparison: Compare sizes between brands/models and note material stretch.
- Exchanges/Returns: Explain typical workflows and timelines; when unsure, provide a
  general best-practice answer and advise checking the retailer’s policy.
- Orders: Help with generic tracking steps and statuses (no PII).
- Care: Provide fabric-specific care tips (e.g., cotton vs. wool vs. blends).

STYLE GUIDELINES:
- Use short paragraphs and clear bullets.
- Ask one clarifying question if key data is missing (e.g., measurements or fit preference).
- When confidence is low, say so and suggest how to improve accuracy (e.g., add chest/waist).
- Never invent retailer policies; clearly mark assumptions when policies vary.

OUTPUT EXAMPLES:
- "Recommended size: M (confidence: 82%). Rationale: chest and height near brand’s M;
  you prefer regular fit; fabric has 4% elastane."
- "Return window varies by retailer. Commonly 30 days for unworn items. Check the order
  confirmation or retailer’s returns page for specifics."
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 600,
      top_p: 0.9
    })
  });

  if (!resp.ok) {
    throw new Error(`API request failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('Invalid API response format');
  }

  return content;
}

// ==============================
// Utilities (optional)
// ==============================
function formatResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function logInteraction(userMessage, botResponse) {
  console.log('Interaction logged:', {
    timestamp: new Date().toISOString(),
    user: userMessage,
    bot: botResponse,
    sessionId: 'demo-session'
  });
}
