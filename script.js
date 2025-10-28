// Global variables
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
// Groq API configuration (will be provided by instructor)
const GROQ_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with provided key
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Conversation history for context
let conversationHistory = [];
// Initialize chat functionality
document.addEventListener('DOMContentLoaded', function() {
// Enter key to send message
userInput.addEventListener('keypress', function(e) {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
sendMessage();
}
});
// Auto-focus input
userInput.focus();
console.log('Customer Service Chatbot initialized');
});
// Send message function
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
// Call Groq API with conversation context
const response = await callGroqAPI(message);
hideTypingIndicator();
// Add bot response to chat
addMessage(response, 'bot');
// Update conversation history
conversationHistory.push(
{ role: 'user', content: message },
{ role: 'assistant', content: response }
);
// Limit history to last 20 messages for performance
if (conversationHistory.length > 20) {
conversationHistory = conversationHistory.slice(-20);
}
} catch (error) {
hideTypingIndicator();
addMessage('I apologize, but I\'m experiencing technical difficulties right now.
Let me connect you with a human agent who can assist you immediately.', 'bot');
console.error('Groq API Error:', error);
} finally {
// Re-enable input
userInput.disabled = false;
sendButton.disabled = false;
userInput.focus();
}
}
// Quick message function for buttons
function sendQuickMessage(message) {
userInput.value = message;
sendMessage();
}
// Add message to chat interface
function addMessage(text, sender) {
const messageDiv = document.createElement('div');
messageDiv.className = `message ${sender}-message`;
const avatarDiv = document.createElement('div');
avatarDiv.className = 'message-avatar';
avatarDiv.textContent = sender === 'user' ? '👤' : '🤖';
const contentDiv = document.createElement('div');
contentDiv.className = 'message-content';
// Handle both plain text and HTML content
if (text.includes('<')) {
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
// Show typing indicator
function showTypingIndicator() {
const typingDiv = document.createElement('div');
typingDiv.className = 'typing-indicator';
typingDiv.id = 'typingIndicator';
const avatarDiv = document.createElement('div');
avatarDiv.className = 'message-avatar';
avatarDiv.textContent = '🤖';
const contentDiv = document.createElement('div');
contentDiv.className = 'typing-content';
contentDiv.innerHTML = `
<span>AI is thinking</span>
<div class="typing-dots">
<span></span>
<span></span>
<span></span>
</div>
`;
typingDiv.appendChild(avatarDiv);
typingDiv.appendChild(contentDiv);
chatContainer.appendChild(typingDiv);
chatContainer.scrollTop = chatContainer.scrollHeight;
}
// Hide typing indicator
function hideTypingIndicator() {
const typingIndicator = document.getElementById('typingIndicator');
if (typingIndicator) {
typingIndicator.remove();
}
}
// Groq API integration
async function callGroqAPI(message) {
const systemPrompt = `You are a professional customer service representative for
TechCorp, a technology company specializing in software solutions, cloud services,
and mobile applications.
COMPANY INFORMATION:
- Products: Business software, cloud platforms, mobile apps, API services
- Return Policy: 30-day money-back guarantee with original receipt
- Shipping: 2-3 business days standard (free over $100), next-day available ($25)
- Support Hours: 24/7 for premium customers, 9 AM - 6 PM EST for standard
customers
- Technical Support: Free for all products with active licenses
- Billing: Monthly and annual plans available, enterprise pricing on request
RESPONSE GUIDELINES:
- Be friendly, professional, and empathetic
- Provide specific, actionable solutions
- If you cannot resolve an issue, offer to escalate to a human specialist
- Always ask if there's anything else you can help with
- Keep responses helpful but concise
- Use positive language even when delivering difficult news
- Include relevant policy information when appropriate
- Offer alternatives when the primary solution isn't available
COMMON SCENARIOS:
- Product inquiries: Provide features, pricing, compatibility info
- Order issues: Check status, modify orders, process returns
- Technical problems: Basic troubleshooting, escalation procedures
- Billing questions: Explain charges, update payment methods, refund policies
- Account management: Password resets, profile updates, subscription changes
Remember: You represent TechCorp's commitment to excellent customer service.`;
const messages = [
{ role: 'system', content: systemPrompt },
...conversationHistory,
{ role: 'user', content: message }
];
try {
const response = await fetch(GROQ_URL, {
method: 'POST',
headers: {
'Authorization': `Bearer ${GROQ_API_KEY}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
model: 'mixtral-8x7b-32768',
messages: messages,
temperature: 0.7,
max_tokens: 500,
top_p: 0.9
})
});
if (!response.ok) {
throw new Error(`API request failed with status ${response.status}`);
}
const data = await response.json();
if (!data.choices || !data.choices[0] || !data.choices[0].message) {
throw new Error('Invalid API response format');
}
return data.choices[0].message.content.trim();
} catch (error) {
console.error('Groq API Error Details:', error);
// Provide helpful fallback responses
const fallbackResponses = {
'return': 'You can return any product within 30 days with your original receipt.
Would you like me to start a return request for you?',
'shipping': 'We offer free standard shipping (2-3 days) on orders over $100, or
next-day shipping for $25. What would work best for you?',
'support': 'I\'d be happy to help with technical support. Can you tell me more
about the specific issue you\'re experiencing?',
'billing': 'For billing questions, I can help explain charges or connect you with
our billing specialist. What specific billing question do you have?'
};
const lowerMessage = message.toLowerCase();
for (const [key, response] of Object.entries(fallbackResponses)) {
if (lowerMessage.includes(key)) {
return response;
}
}
return 'I apologize, but I\'m having trouble accessing our AI system right now. Let
me connect you with one of our human specialists who can help you immediately. Is
this urgent, or can someone follow up with you within an hour?';
}
}
// Utility functions for enhanced functionality
function formatResponse(text) {
// Add basic formatting for better readability
return text
.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
.replace(/\*(.*?)\*/g, '<em>$1</em>')
.replace(/\n/g, '<br>');
}
function logInteraction(userMessage, botResponse) {
// Log for analytics (in real implementation, send to analytics service)
console.log('Interaction logged:', {
timestamp: new Date().toISOString(),
user: userMessage,
bot: botResponse,
sessionId: 'demo-session'
});
}
