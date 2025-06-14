// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlNHkA1f-1GwBN0nBchMtIwEYUNLlq8FQ",
  authDomain: "e-commerce-a6fe2.firebaseapp.com",
  databaseURL: "https://e-commerce-a6fe2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "e-commerce-a6fe2",
  storageBucket: "e-commerce-a6fe2.firebasestorage.app",
  messagingSenderId: "169688929056",
  appId: "1:169688929056:web:8d04f0b02c98fa77d1bd45",
  measurementId: "G-Q8FP7FQQHV"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// Track authentication state
let authInitialized = false;
let currentUser = null;

// Improved Auth State Management
function handleAuthState() {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    
    if (!authInitialized) {
      authInitialized = true;
      checkRedirect(user);
    }
  });
}

// Smart Redirect Logic
function checkRedirect(user) {
  const currentPath = window.location.pathname;
  const authPages = ['/', '/index.html', '/register.html'];
  const protectedPages = ['/chat.html'];
  
  // Don't redirect if we're already on the correct page
  if (user && protectedPages.includes(currentPath)) return;
  if (!user && authPages.includes(currentPath)) return;
  
  if (user) {
    // User is logged in - redirect from auth pages to chat
    if (authPages.some(page => currentPath.endsWith(page))) {
      setTimeout(() => {
        window.location.href = '/chat.html';
      }, 300);
    }
  } else {
    // User is not logged in - redirect from protected pages to login
    if (protectedPages.some(page => currentPath.endsWith(page))) {
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 300);
    }
  }
}

// Enhanced Login Function
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      // Show loading state
      const loginBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      loginBtn.disabled = true;
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      await Swal.fire({
        title: 'Login Successful!',
        text: 'Redirecting to chat...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      window.location.href = '/chat.html';
    } catch (error) {
      // Reset button state
      const loginBtn = loginForm.querySelector('button[type="submit"]');
      loginBtn.innerHTML = originalText;
      loginBtn.disabled = false;
      
      handleAuthError(error, 'login');
    }
  });
}

// Enhanced Error Handling
function handleAuthError(error, action) {
  let errorMessage = `${action === 'login' ? 'Login' : 'Registration'} failed. Please try again.`;
  
  const errorMap = {
    'auth/user-not-found': 'No user found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email format.',
    'auth/email-already-in-use': 'Email already in use.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  };
  
  if (errorMap[error.code]) {
    errorMessage = errorMap[error.code];
  }
  
  Swal.fire({
    title: `${action === 'login' ? 'Login' : 'Registration'} Failed`,
    text: errorMessage,
    icon: 'error',
    confirmButtonColor: '#7367f0'
  });
}

// Initialize all auth functionality
function initAuth() {
  // Add loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'authLoadingOverlay';
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.8);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  loadingOverlay.innerHTML = `
    <div class="spinner" style="
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #7367f0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
  `;
  document.body.appendChild(loadingOverlay);

  // Initialize auth with slight delay to ensure Firebase is ready
  setTimeout(() => {
    handleAuthState();
    setupLoginForm();
    setupRegisterForm();
    
    // Remove loading overlay after auth check
    setTimeout(() => {
      document.getElementById('authLoadingOverlay')?.remove();
    }, 1000);
    
    // Expose logout function
    window.logout = logout;
  }, 300);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// Add spin animation to head
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
