// =========================================
// FitGen AI • Chat Logic with Backend API
// -----------------------------------------
// Connects to your local backend server
// which securely handles Claude API calls
// =========================================

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Your backend endpoint (change if deployed elsewhere)
const BACKEND_URL = 'https://group-4-assignment-7-r730wfujn-jacky-chens-projects-d8243720.vercel.app/';

// Conversation history for context
let conversationHistory = [];

// System prompt that defines the AI's personality and knowledge
const SYSTEM_PROMPT = `You are FitGen AI, a helpful fashion and sizing assistant chatbot for an e-commerce clothing store. Your expertise includes:

- Providing size recommendations based on user measurements (height, weight, chest, waist)
- Comparing fits across different brands (Nike, Adidas, Uniqlo, H&M, etc.)
- Explaining return and exchange policies
- Helping track orders
- Providing fabric care instructions
- Offering styling advice

Be friendly, concise, and helpful. Use emojis occasionally. When giving size recommendations, always ask for measurements if not provided. Format responses with bullet points when listing multiple items.

Store policies:
- 30-day returns with free shipping
- Size exchanges ship immediately
- Refunds processed in 5-7 business days
- Customer service available Mon-Fri 9AM-8PM EST, Sat-Sun 10AM-6PM EST

Keep responses conversational and under 200 words unless detailed information is requested.`;

// Send message on Enter key
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Main send message function
async function sendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Clear input
  userInput.value = '';
  
  // Disable send button and show loading state
  sendButton.disabled = true;
  sendButton.innerHTML = '<span class="send-icon">⏳</span>';
  
  // Add user message to conversation history
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  try {
    // Call your backend API
    const botResponse = await getClaudeResponse();
    
    // Add bot response to chat
    addMessage(botResponse, 'bot');
    
    // Add bot response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: botResponse
    });
    
  } catch (error) {
    console.error('Backend API Error:', error);
    addMessage('Sorry, I encountered an error connecting to the AI service. Please make sure the backend server is running! 😓', 'bot');
  } finally {
    // Re-enable send button
    sendButton.disabled = false;
    sendButton.innerHTML = '<span class="send-icon">➤</span>';
    userInput.focus();
  }
}

// Quick message buttons
function sendQuickMessage(message) {
  userInput.value = message;
  userInput.focus();
  // Auto-send the quick message
  sendMessage();
}

// Add message to chat container
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'bot' ? '👗' : '👤';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  
  // Convert markdown-style formatting to HTML
  if (sender === 'bot') {
    content.innerHTML = formatBotMessage(text);
  } else {
    content.textContent = text;
  }
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatContainer.appendChild(messageDiv);
  
  // Smooth scroll to bottom
  setTimeout(() => {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }, 50);
}

// Format bot messages (convert markdown-style to HTML)
function formatBotMessage(text) {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert bullet points to proper lists
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  
  lines.forEach(line => {
    line = line.trim();
    
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${line.substring(2)}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line) {
        html += `<p>${line}</p>`;
      }
    }
  });
  
  if (inList) {
    html += '</ul>';
  }
  
  return html;
}

// =========================================
// Backend API Call
// =========================================

async function getClaudeResponse() {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: conversationHistory,
      system: SYSTEM_PROMPT
    })
  });
  
  if (!response.ok) {
    throw new Error('Backend request failed');
  }
  
  const data = await response.json();
  return data.content[0].text;
}

// =========================================
// Optional: Clear conversation history
// =========================================

function resetConversation() {
  conversationHistory = [];
  chatContainer.innerHTML = `
    <div class="message bot-message">
      <div class="message-avatar">👗</div>
      <div class="message-content">
        <p>Hi! I'm your <strong>FitGen AI Stylist</strong>. I can help you with:</p>
        <ul>
          <li><strong>Find My Size:</strong> brand-specific sizing & fit advice</li>
          <li><strong>Compare Fits:</strong> slim vs. regular vs. relaxed</li>
          <li><strong>Returns & Exchanges:</strong> start a return or size swap</li>
          <li><strong>Order Help:</strong> track shipments & update addresses</li>
          <li><strong>Care & Materials:</strong> wash/dry guidance by fabric</li>
        </ul>
        <p>Tell me your height/weight or upload measurements, the brand, and how you like things to fit. I'll recommend a size and confidence score.</p>
      </div>
    </div>
  `;
}

// Add reset button listener if you add one to your HTML
// document.getElementById('resetButton')?.addEventListener('click', resetConversation);
