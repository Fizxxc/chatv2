// Firebase configuration
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTra71Vq4b0nPZ8hdfgY_Sxxr-REk9-9E",
  authDomain: "https://topup-2c5db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "topup-2c5db",
  storageBucket: "topup-2c5db.firebasestorage.app",
  messagingSenderId: "384342388781",
  appId: "1:384342388781:web:230ec4dc05ede15d7588a4",
  measurementId: "G-QJY9J2Y6QZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const analytics = getAnalytics(app);

// Improved Auth State Management
function handleAuthState() {
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user);
        currentUser = user;
        
        if (!authInitialized) {
            authInitialized = true;
            checkRedirect(user);
        }
    });
}
// Track authentication state
let authInitialized = false;
let currentUser = null;
let loginBtnOriginalText = ''; // Store original button text globally

// Improved Auth State Management
function handleAuthState() {
  auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user); // Debugging
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
  console.log('Current path:', currentPath); // Debugging
  
  const authPages = ['/', '/index.html', '/register.html'];
  const protectedPages = ['/chat.html'];
  
  // Don't redirect if we're already on the correct page
  if (user && protectedPages.some(page => currentPath.endsWith(page))) return;
  if (!user && authPages.some(page => currentPath.endsWith(page))) return;
  
  if (user) {
    // User is logged in - redirect from auth pages to chat
    if (authPages.some(page => currentPath.endsWith(page))) {
      console.log('Redirecting to chat...'); // Debugging
      setTimeout(() => {
        window.location.href = '/chat.html';
      }, 500);
    }
  } else {
    // User is not logged in - redirect from protected pages to login
    if (protectedPages.some(page => currentPath.endsWith(page))) {
      console.log('Redirecting to login...'); // Debugging
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
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
    const loginBtn = loginForm.querySelector('button[type="submit"]');
    
    try {
      // Show loading state
      loginBtnOriginalText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      loginBtn.disabled = true;
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('Login success:', userCredential.user); // Debugging
      
      await Swal.fire({
        title: 'Login Successful!',
        text: 'Redirecting to chat...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      window.location.href = '/chat.html';
    } catch (error) {
      console.error('Login error:', error); // Debugging
      // Reset button state
      if (loginBtn) {
        loginBtn.innerHTML = loginBtnOriginalText;
        loginBtn.disabled = false;
      }
      handleAuthError(error, 'login');
    }
  });
}

// Enhanced Register Function
function setupRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const registerBtn = registerForm.querySelector('button[type="submit"]');
    let registerBtnOriginalText = '';

    try {
      // Show loading state
      if (registerBtn) {
        registerBtnOriginalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        registerBtn.disabled = true;
      }

      // Validation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      currentUser = userCredential.user;
      console.log('Registration success:', currentUser); // Debugging

      // Save additional user data
      await database.ref('users/' + currentUser.uid).set({
        username: username,
        email: email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastLogin: firebase.database.ServerValue.TIMESTAMP
      });

      await Swal.fire({
        title: 'Registration Successful!',
        text: 'Your account has been created.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      window.location.href = '/chat.html';
    } catch (error) {
      console.error('Registration error:', error); // Debugging
      // Reset button state
      if (registerBtn) {
        registerBtn.innerHTML = registerBtnOriginalText;
        registerBtn.disabled = false;
      }
      handleAuthError(error, 'register');
    }
  });
}

// Enhanced Error Handling
function handleAuthError(error, action) {
  let errorMessage = error.message || `${action === 'login' ? 'Login' : 'Registration'} failed. Please try again.`;
  
  const errorMap = {
    'auth/user-not-found': 'No user found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email format.',
    'auth/email-already-in-use': 'Email already in use.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  };
  
  if (error.code && errorMap[error.code]) {
    errorMessage = errorMap[error.code];
  }
  
  Swal.fire({
    title: `${action === 'login' ? 'Login' : 'Registration'} Failed`,
    text: errorMessage,
    icon: 'error',
    confirmButtonColor: '#7367f0'
  });
}

// Logout Function
function logout() {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will be logged out from the system.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#7367f0',
    cancelButtonColor: '#82868b',
    confirmButtonText: 'Yes, logout!'
  }).then((result) => {
    if (result.isConfirmed) {
      auth.signOut()
        .then(() => {
          window.location.href = '/index.html';
        })
        .catch((error) => {
          console.error('Logout error:', error);
          Swal.fire({
            title: 'Logout Failed',
            text: 'An error occurred during logout.',
            icon: 'error',
            confirmButtonColor: '#7367f0'
          });
        });
    }
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
    background: rgba(255,255,255,0.9);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `;
  loadingOverlay.innerHTML = `
    <div class="spinner"></div>
    <p>Loading application...</p>
  `;
  document.body.appendChild(loadingOverlay);

  // Initialize auth with slight delay to ensure Firebase is ready
  setTimeout(() => {
    try {
      handleAuthState();
      setupLoginForm();
      setupRegisterForm();
      
      // Remove loading overlay after auth check
      setTimeout(() => {
        const overlay = document.getElementById('authLoadingOverlay');
        if (overlay) {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 500);
        }
      }, 1000);
      
      // Expose logout function globally
      window.logout = logout;
    } catch (error) {
      console.error('Initialization error:', error);
      document.getElementById('authLoadingOverlay')?.remove();
      Swal.fire({
        title: 'Initialization Error',
        text: 'Failed to initialize application. Please refresh the page.',
        icon: 'error'
      });
    }
  }, 300);
}

// Add spin animation to head
const style = document.createElement('style');
style.textContent = `
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(243, 243, 243, 0.3);
    border-top: 4px solid #7367f0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);