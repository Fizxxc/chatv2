// DOM Elements
const chatList = document.getElementById('chatList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatInputArea = document.getElementById('chatInputArea');
const partnerName = document.getElementById('partnerName');
const partnerAvatar = document.getElementById('partnerAvatar');
const usernameDisplay = document.getElementById('usernameDisplay');
const userAvatar = document.getElementById('userAvatar');
const addFriendFab = document.getElementById('addFriendFab');
const addFriendModal = document.getElementById('addFriendModal');
const closeModal = document.querySelector('.close-modal');
const searchUserInput = document.getElementById('searchUserInput');
const searchUserBtn = document.getElementById('searchUserBtn');
const searchResults = document.getElementById('searchResults');

// Variables
let currentUser = null;
let currentChat = null;
let chats = [];

// Initialize Chat
function initChat() {
    currentUser = auth.currentUser;

    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    // Load user profile
    database.ref('users/' + currentUser.uid).once('value').then((snapshot) => {
        const userData = snapshot.val();
        usernameDisplay.textContent = userData.username;
        // Set default avatar using UI Avatars API
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=7367f0&color=fff&rounded=true&size=128`;
    });

    // Load chats
    loadChats();

    // Event listeners
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    addFriendFab.addEventListener('click', showAddFriendModal);
    closeModal.addEventListener('click', hideAddFriendModal);
    searchUserBtn.addEventListener('click', searchUsers);
    searchUserInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });
}

// Load User Chats
function loadChats() {
    database.ref('userChats/' + currentUser.uid).on('value', (snapshot) => {
        chats = [];
        chatList.innerHTML = '';

        if (!snapshot.exists()) {
            chatList.innerHTML = '<p class="no-chats">No chats yet. Start by adding a friend!</p>';
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const chatId = childSnapshot.key;
            const chatData = childSnapshot.val();

            chats.push({
                id: chatId,
                ...chatData
            });

            // Get the other user's info
            const otherUserId = Object.keys(chatData.users).find(userId => userId !== currentUser.uid);
            if (!otherUserId) return;

            database.ref('users/' + otherUserId).once('value').then((userSnapshot) => {
                const userData = userSnapshot.val();
                if (!userData) return;
                
                addChatToList(chatId, otherUserId, userData.username, chatData.lastMessage || 'No messages yet', chatData.updatedAt);
            });
        });
    });
}

function addChatToList(chatId, userId, username, lastMessage, updatedAt) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.chatId = chatId;
    chatItem.dataset.userId = userId;
    
    // Set default avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7367f0&color=fff&rounded=true&size=64`;
    
    chatItem.innerHTML = `
        <img src="${avatarUrl}" alt="${username}">
        <div class="chat-info">
            <h4>${username}</h4>
            <p>${lastMessage}</p>
        </div>
        <span class="chat-time">${formatTime(updatedAt)}</span>
    `;
    
    chatItem.addEventListener('click', () => openChat(chatId, userId, username));
    chatList.appendChild(chatItem);
}

// Open Chat
function openChat(chatId, partnerId, partnerUsername) {
    currentChat = chatId;
    
    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });
    
    partnerName.textContent = partnerUsername;
    partnerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUsername)}&background=7367f0&color=fff&rounded=true&size=128`;
    chatInputArea.style.display = 'flex';
    
    // Clear messages
    chatMessages.innerHTML = '';
    
    // Load messages
    database.ref('chats/' + chatId + '/messages').orderByChild('timestamp').on('value', (snapshot) => {
        chatMessages.innerHTML = '';
        
        if (!snapshot.exists()) {
            const emptyChat = document.createElement('div');
            emptyChat.className = 'empty-chat animate__animated animate__fadeIn';
            emptyChat.innerHTML = `
                <i class="fas fa-comments"></i>
                <h3>Start a conversation with ${partnerUsername}</h3>
                <p>Your messages will appear here</p>
            `;
            chatMessages.appendChild(emptyChat);
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            displayMessage(message);
        });
        
        // Scroll to bottom
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    });
}

// Display Message
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    const isCurrentUser = message.senderId === currentUser.uid;
    
    messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'} animate__animated animate__fadeIn`;
    messageDiv.innerHTML = `
        <p>${message.text}</p>
        <div class="message-time">${formatTime(message.timestamp)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Send Message
function sendMessage() {
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChat) return;
    
    const message = {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Add message to chat
    const newMessageRef = database.ref('chats/' + currentChat + '/messages').push();
    newMessageRef.set(message);
    
    // Update last message in userChats
    const updates = {};
    updates['userChats/' + currentUser.uid + '/' + currentChat + '/lastMessage'] = messageText;
    updates['userChats/' + currentUser.uid + '/' + currentChat + '/updatedAt'] = firebase.database.ServerValue.TIMESTAMP;
    
    // Find the other user ID
    const chat = chats.find(c => c.id === currentChat);
    if (!chat) return;
    
    const otherUserId = Object.keys(chat.users).find(userId => userId !== currentUser.uid);
    if (!otherUserId) return;
    
    updates['userChats/' + otherUserId + '/' + currentChat + '/lastMessage'] = messageText;
    updates['userChats/' + otherUserId + '/' + currentChat + '/updatedAt'] = firebase.database.ServerValue.TIMESTAMP;
    
    database.ref().update(updates);
    
    // Clear input
    messageInput.value = '';
}

// Add Friend Modal Functions
function showAddFriendModal() {
    addFriendModal.style.display = 'flex';
    searchUserInput.value = '';
    searchResults.innerHTML = '';
}

function hideAddFriendModal() {
    addFriendModal.style.display = 'none';
}

// Search Users
function searchUsers() {
    const searchTerm = searchUserInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        Swal.fire({
            title: 'Empty Search',
            text: 'Please enter a username or email to search',
            icon: 'warning',
            confirmButtonColor: '#7367f0'
        });
        return;
    }
    
    searchResults.innerHTML = '<p class="searching">Searching users...</p>';
    
    database.ref('users').once('value').then((snapshot) => {
        searchResults.innerHTML = '';
        let foundUsers = 0;
        
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const userId = childSnapshot.key;
            
            if (userId !== currentUser.uid && 
                (user.username.toLowerCase().includes(searchTerm) || 
                 user.email.toLowerCase().includes(searchTerm))) {
                
                foundUsers++;
                addUserToSearchResults(user, userId);
            }
        });
        
        if (foundUsers === 0) {
            searchResults.innerHTML = '<p class="no-results">No users found matching your search.</p>';
        }
    });
}

function addUserToSearchResults(user, userId) {
    const userResult = document.createElement('div');
    userResult.className = 'user-result';
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=7367f0&color=fff&rounded=true&size=64`;
    
    userResult.innerHTML = `
        <img src="${avatarUrl}" alt="${user.username}">
        <div>
            <h4>${user.username}</h4>
            <p>${user.email}</p>
        </div>
        <button class="add-user-btn" data-user-id="${userId}">
            <i class="fas fa-comment-dots"></i> Chat
        </button>
    `;
    
    searchResults.appendChild(userResult);
    
    // Add event listener to the new button
    userResult.querySelector('.add-user-btn').addEventListener('click', () => {
        startNewChat(userId);
    });
}

// Start New Chat
function startNewChat(partnerId) {
    // Check if chat already exists
    const existingChat = chats.find(chat => 
        Object.keys(chat.users).includes(currentUser.uid) && 
        Object.keys(chat.users).includes(partnerId));
    
    if (existingChat) {
        database.ref('users/' + partnerId).once('value').then((snapshot) => {
            const userData = snapshot.val();
            openChat(existingChat.id, partnerId, userData.username);
            hideAddFriendModal();
        });
        return;
    }
    
    // Create new chat
    const newChatRef = database.ref('chats').push();
    const chatId = newChatRef.key;
    
    const chatData = {
        users: {
            [currentUser.uid]: true,
            [partnerId]: true
        },
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    newChatRef.set(chatData).then(() => {
        // Add to userChats for both users
        const updates = {};
        updates[`userChats/${currentUser.uid}/${chatId}`] = {
            users: {
                [currentUser.uid]: true,
                [partnerId]: true
            },
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`userChats/${partnerId}/${chatId}`] = {
            users: {
                [currentUser.uid]: true,
                [partnerId]: true
            },
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        return database.ref().update(updates);
    }).then(() => {
        return database.ref('users/' + partnerId).once('value');
    }).then((snapshot) => {
        const userData = snapshot.val();
        openChat(chatId, partnerId, userData.username);
        hideAddFriendModal();
        
        Swal.fire({
            title: 'Chat Started!',
            text: `You can now chat with ${userData.username}`,
            icon: 'success',
            confirmButtonColor: '#7367f0'
        });
    }).catch((error) => {
        console.error('Error creating chat:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to start chat. Please try again.',
            icon: 'error',
            confirmButtonColor: '#7367f0'
        });
    });
}

// Format Time
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);