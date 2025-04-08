// chatbot.js - Handles the chatbot functionality

// Global variables
let chatSessionId = null;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Generate a unique session ID for this chat
    chatSessionId = generateSessionId();
    
    // Set up event listeners
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('chatClose').addEventListener('click', toggleChat);
    document.getElementById('chatSend').addEventListener('click', sendMessage);
    
    // Enable pressing Enter to send messages
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea as user types
    document.getElementById('chatInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});

// Toggle chat panel visibility
function toggleChat() {
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.classList.toggle('active');
    
    // Scroll to bottom when opening
    if (chatPanel.classList.contains('active')) {
        scrollChatToBottom();
        document.getElementById('chatInput').focus();
    }
}

// Send a message to the chatbot
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add message to chat
    addMessage(message, 'user');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Send to API
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            session_id: chatSessionId
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add response to chat
        addMessage(data.response, 'assistant');
    })
    .catch(error => {
        console.error('Error sending message:', error);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add error message
        addMessage('I apologize, but I encountered an error processing your request. Please try again later.', 'assistant');
    });
}

// Add a message to the chat
function addMessage(message, role) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    
    messageElement.className = `message ${role}`;
    messageElement.textContent = message;
    
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollChatToBottom();
}

// Add typing indicator
function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = document.createElement('div');
    
    typingIndicator.className = 'message assistant typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    typingIndicator.id = 'typingIndicator';
    
    messagesContainer.appendChild(typingIndicator);
    
    // Scroll to bottom
    scrollChatToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Generate a unique session ID
function generateSessionId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
