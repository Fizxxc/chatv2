// Import Firebase modules
import { 
  getAuth, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  orderByChild, 
  update,
  serverTimestamp,
  query,
  get
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { app } from './auth.js';

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const chatElements = {
  list: document.getElementById('chatList'),
  messages: document.getElementById('chatMessages'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendMessage'),
  inputArea: document.getElementById('chatInputArea'),
  partnerName: document.getElementById('partnerName'),
  partnerAvatar: document.getElementById('partnerAvatar'),
  usernameDisplay: document.getElementById('usernameDisplay'),
  userAvatar: document.getElementById('userAvatar'),
  addFriendFab: document.getElementById('addFriendFab'),
  addFriendModal: document.getElementById('addFriendModal'),
  closeModal: document.querySelector('.close-modal'),
  searchInput: document.getElementById('searchUserInput'),
  searchBtn: document.getElementById('searchUserBtn'),
  searchResults: document.getElementById('searchResults')
};

// Chat State
const chatState = {
  currentUser: null,
  currentChat: null,
  chats: [],
  originalBtnText: ''
};

// Initialize Chat
function initChat() {
  onAuthStateChanged(auth, (user) => {
    chatState.currentUser = user;
    
    if (!user) {
      window.location.href = '/index.html';
      return;
    }

    loadUserProfile();
    loadChats();
    setupEventListeners();
  });
}

function loadUserProfile() {
  const userRef = ref(database, 'users/' + chatState.currentUser.uid);
  
  get(userRef).then((snapshot) => {
    const userData = snapshot.val();
    if (userData) {
      chatElements.usernameDisplay.textContent = userData.username;
      chatElements.userAvatar.src = generateAvatarUrl(userData.username);
    }
  }).catch(error => {
    console.error('Profile load error:', error);
  });
}

function generateAvatarUrl(username, size = 128) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7367f0&color=fff&rounded=true&size=${size}`;
}

function loadChats() {
  const userChatsRef = ref(database, 'userChats/' + chatState.currentUser.uid);
  
  onValue(userChatsRef, (snapshot) => {
    chatState.chats = [];
    chatElements.list.innerHTML = '';

    if (!snapshot.exists()) {
      chatElements.list.innerHTML = '<p class="no-chats">No chats yet. Start by adding a friend!</p>';
      return;
    }

    snapshot.forEach((childSnapshot) => {
      const chatId = childSnapshot.key;
      const chatData = childSnapshot.val();
      chatState.chats.push({ id: chatId, ...chatData });

      const otherUserId = Object.keys(chatData.users).find(uid => uid !== chatState.currentUser.uid);
      if (otherUserId) {
        loadChatPartnerInfo(chatId, otherUserId, chatData);
      }
    });
  });
}

function loadChatPartnerInfo(chatId, partnerId, chatData) {
  const partnerRef = ref(database, 'users/' + partnerId);
  
  get(partnerRef).then((snapshot) => {
    const userData = snapshot.val();
    if (userData) {
      addChatToList(chatId, partnerId, userData.username, chatData.lastMessage || 'No messages yet', chatData.updatedAt);
    }
  });
}

function addChatToList(chatId, userId, username, lastMessage, updatedAt) {
  const chatItem = document.createElement('div');
  chatItem.className = 'chat-item';
  chatItem.dataset.chatId = chatId;
  chatItem.dataset.userId = userId;
  
  chatItem.innerHTML = `
    <img src="${generateAvatarUrl(username, 64)}" alt="${username}">
    <div class="chat-info">
      <h4>${username}</h4>
      <p>${lastMessage}</p>
    </div>
    <span class="chat-time">${formatTime(updatedAt)}</span>
  `;
  
  chatItem.addEventListener('click', () => openChat(chatId, userId, username));
  chatElements.list.appendChild(chatItem);
}

function openChat(chatId, partnerId, partnerUsername) {
  chatState.currentChat = chatId;
  
  // Update UI
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.chatId === chatId);
  });
  
  chatElements.partnerName.textContent = partnerUsername;
  chatElements.partnerAvatar.src = generateAvatarUrl(partnerUsername);
  chatElements.inputArea.style.display = 'flex';
  
  loadChatMessages(chatId, partnerUsername);
}

function loadChatMessages(chatId, partnerUsername) {
  chatElements.messages.innerHTML = '';
  
  const messagesRef = query(
    ref(database, 'chats/' + chatId + '/messages'),
    orderByChild('timestamp')
  );
  
  onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      showEmptyChatState(partnerUsername);
      return;
    }
    
    chatElements.messages.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
      displayMessage(childSnapshot.val());
    });
    
    scrollToBottom();
  });
}

function showEmptyChatState(partnerUsername) {
  const emptyChat = document.createElement('div');
  emptyChat.className = 'empty-chat animate__animated animate__fadeIn';
  emptyChat.innerHTML = `
    <i class="fas fa-comments"></i>
    <h3>Start a conversation with ${partnerUsername}</h3>
    <p>Your messages will appear here</p>
  `;
  chatElements.messages.appendChild(emptyChat);
}

function displayMessage(message) {
  const isCurrentUser = message.senderId === chatState.currentUser.uid;
  const messageDiv = document.createElement('div');
  
  messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'} animate__animated animate__fadeIn`;
  messageDiv.innerHTML = `
    <p>${message.text}</p>
    <div class="message-time">${formatTime(message.timestamp)}</div>
  `;
  
  chatElements.messages.appendChild(messageDiv);
}

function sendMessage() {
  const messageText = chatElements.messageInput.value.trim();
  if (!messageText || !chatState.currentChat) return;

  const message = {
    text: messageText,
    senderId: chatState.currentUser.uid,
    timestamp: serverTimestamp()
  };

  const messagesRef = ref(database, 'chats/' + chatState.currentChat + '/messages');
  
  push(messagesRef, message)
    .then(() => {
      updateLastMessage(messageText);
      chatElements.messageInput.value = '';
    })
    .catch(error => {
      console.error('Message send error:', error);
      showErrorAlert('Failed to send message');
    });
}

function updateLastMessage(messageText) {
  const chat = chatState.chats.find(c => c.id === chatState.currentChat);
  if (!chat) return;

  const otherUserId = Object.keys(chat.users).find(uid => uid !== chatState.currentUser.uid);
  if (!otherUserId) return;

  const updates = {};
  const timestamp = serverTimestamp();
  
  updates[`userChats/${chatState.currentUser.uid}/${chatState.currentChat}/lastMessage`] = messageText;
  updates[`userChats/${chatState.currentUser.uid}/${chatState.currentChat}/updatedAt`] = timestamp;
  updates[`userChats/${otherUserId}/${chatState.currentChat}/lastMessage`] = messageText;
  updates[`userChats/${otherUserId}/${chatState.currentChat}/updatedAt`] = timestamp;

  update(ref(database), updates);
}

function scrollToBottom() {
  setTimeout(() => {
    chatElements.messages.scrollTop = chatElements.messages.scrollHeight;
  }, 100);
}

// Friend Management
function showAddFriendModal() {
  chatElements.addFriendModal.style.display = 'flex';
  chatElements.searchInput.value = '';
  chatElements.searchResults.innerHTML = '';
}

function hideAddFriendModal() {
  chatElements.addFriendModal.style.display = 'none';
}

function searchUsers() {
  const searchTerm = chatElements.searchInput.value.trim().toLowerCase();
  
  if (!searchTerm) {
    showInfoAlert('Please enter a search term');
    return;
  }
  
  chatElements.searchResults.innerHTML = '<p class="searching">Searching users...</p>';
  
  const usersRef = ref(database, 'users');
  
  get(usersRef).then((snapshot) => {
    chatElements.searchResults.innerHTML = '';
    let foundUsers = 0;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      const userId = childSnapshot.key;
      
      if (userId !== chatState.currentUser.uid && 
          (user.username.toLowerCase().includes(searchTerm) || 
           user.email.toLowerCase().includes(searchTerm))) {
        foundUsers++;
        addUserToSearchResults(user, userId);
      }
    });
    
    if (!foundUsers) {
      chatElements.searchResults.innerHTML = '<p class="no-results">No users found matching your search.</p>';
    }
  });
}

function addUserToSearchResults(user, userId) {
  const userResult = document.createElement('div');
  userResult.className = 'user-result';
  
  userResult.innerHTML = `
    <img src="${generateAvatarUrl(user.username, 64)}" alt="${user.username}">
    <div>
      <h4>${user.username}</h4>
      <p>${user.email}</p>
    </div>
    <button class="add-user-btn" data-user-id="${userId}">
      <i class="fas fa-comment-dots"></i> Chat
    </button>
  `;
  
  userResult.querySelector('.add-user-btn').addEventListener('click', () => {
    startNewChat(userId);
  });
  
  chatElements.searchResults.appendChild(userResult);
}

function startNewChat(partnerId) {
  const existingChat = chatState.chats.find(chat => 
    chat.users[chatState.currentUser.uid] && chat.users[partnerId]);
  
  if (existingChat) {
    openExistingChat(existingChat.id, partnerId);
    return;
  }
  
  createNewChat(partnerId);
}

function openExistingChat(chatId, partnerId) {
  const partnerRef = ref(database, 'users/' + partnerId);
  
  get(partnerRef).then((snapshot) => {
    const userData = snapshot.val();
    if (userData) {
      openChat(chatId, partnerId, userData.username);
      hideAddFriendModal();
    }
  });
}

function createNewChat(partnerId) {
  const newChatRef = push(ref(database, 'chats'));
  const chatId = newChatRef.key;
  
  const chatData = {
    users: {
      [chatState.currentUser.uid]: true,
      [partnerId]: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  set(newChatRef, chatData)
    .then(() => updateUserChats(chatId, partnerId))
    .then(() => loadPartnerInfo(partnerId))
    .catch(error => {
      console.error('Chat creation error:', error);
      showErrorAlert('Failed to create chat');
    });
}

function updateUserChats(chatId, partnerId) {
  const updates = {};
  const timestamp = serverTimestamp();
  
  updates[`userChats/${chatState.currentUser.uid}/${chatId}`] = {
    users: {
      [chatState.currentUser.uid]: true,
      [partnerId]: true
    },
    updatedAt: timestamp
  };
  
  updates[`userChats/${partnerId}/${chatId}`] = {
    users: {
      [chatState.currentUser.uid]: true,
      [partnerId]: true
    },
    updatedAt: timestamp
  };
  
  return update(ref(database), updates);
}

function loadPartnerInfo(partnerId) {
  const partnerRef = ref(database, 'users/' + partnerId);
  
  return get(partnerRef).then((snapshot) => {
    const userData = snapshot.val();
    if (userData) {
      openChat(chatState.currentChat, partnerId, userData.username);
      hideAddFriendModal();
      showSuccessAlert(`Chat with ${userData.username} created!`);
    }
  });
}

// Utility Functions
function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function setupEventListeners() {
  chatElements.sendBtn.addEventListener('click', sendMessage);
  chatElements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  chatElements.addFriendFab.addEventListener('click', showAddFriendModal);
  chatElements.closeModal.addEventListener('click', hideAddFriendModal);
  chatElements.searchBtn.addEventListener('click', searchUsers);
  chatElements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUsers();
  });
}

// Alert Helpers
function showSuccessAlert(message) {
  Swal.fire({
    title: 'Success',
    text: message,
    icon: 'success',
    confirmButtonColor: '#7367f0'
  });
}

function showErrorAlert(message) {
  Swal.fire({
    title: 'Error',
    text: message,
    icon: 'error',
    confirmButtonColor: '#7367f0'
  });
}

function showInfoAlert(message) {
  Swal.fire({
    title: 'Info',
    text: message,
    icon: 'info',
    confirmButtonColor: '#7367f0'
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);
