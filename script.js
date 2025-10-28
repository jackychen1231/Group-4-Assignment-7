// =========================================
// FitGen AI • Chat Logic with OpenAI API
// -----------------------------------------
// Handles user input, message display,
// and real OpenAI API integration
// =========================================

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// ⚠️ IMPORTANT: Replace with your actual OpenAI API key
// For production, store this securely on your backend, NOT in frontend code
const OPENAI_API_KEY = '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';

// Conversation history for context
let conversationHistory = [
  {
    role: 'system',
    content: `You are FitGen AI, a helpful fashion and sizing assistant chatbot for an e-commerce clothing store. Your expertise includes:

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
- Customer service available Mon-Fri 9AM-8PM EST, Sat-Sun 10AM-6PM EST`
  }
];

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
    // Call OpenAI API
    const botResponse = await getOpenAIResponse();
    
    // Add bot response to chat
    addMessage(botResponse, 'bot');
    
    // Add bot response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: botResponse
    });
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    addMessage('Sorry, I encountered an error connecting to the AI service. Please try again! 😓', 'bot');
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
// OpenAI API Integration
// =========================================

async function getOpenAIResponse() {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Use gpt-4o, gpt-4-turbo, or gpt-3.5-turbo based on your needs
      messages: conversationHistory,
      max_tokens: 500,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// =========================================
// Optional: Clear conversation history
// =========================================

function resetConversation() {
  conversationHistory = conversationHistory.slice(0, 1); // Keep only system message
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
// document.getElementById('resetButton')?.addEventListener('click', resetConversati
