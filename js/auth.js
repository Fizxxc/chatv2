// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  update,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTra71Vq4b0nPZ8hdfgY_Sxxr-REk9-9E",
  authDomain: "https://topup-2c5db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "topup-2c5db",
  storageBucket: "topup-2c5db.firebasestorage.app",
  messagingSenderId: "384342388781",
  appId: "1:384342388781:web:230ec4dc05ede15d7588a4",
  measurementId: "G-QJY9J2Y6QZ"
};

// Initialize Firebase services
let app, auth, database, analytics;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  
  // Initialize Analytics only if measurementId exists
  if (firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  showFatalError('Failed to initialize application services. Please refresh the page.');
}

// Track authentication state
let authInitialized = false;
let currentUser = null;
let loginBtnOriginalText = '';

// Enhanced Auth State Management
const handleAuthState = debounce(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user);
    currentUser = user;
    
    if (!authInitialized) {
      authInitialized = true;
      checkRedirect(user);
      updateUIForAuthState(user);
    }
  });

  // Return unsubscribe function for cleanup
  return unsubscribe;
}, 300);

// Update UI elements based on auth state
function updateUIForAuthState(user) {
  const logoutElements = document.querySelectorAll('.logout-btn');
  const loginElements = document.querySelectorAll('.login-btn');
  
  if (user) {
    logoutElements.forEach(el => el.style.display = 'block');
    loginElements.forEach(el => el.style.display = 'none');
    
    // Update user profile info
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = user.email;
      el.title = user.email;
    });
  } else {
    logoutElements.forEach(el => el.style.display = 'none');
    loginElements.forEach(el => el.style.display = 'block');
  }
}

// Path management and redirection
function checkRedirect(user) {
  const currentPath = normalizePath(window.location.pathname);
  console.log('Current path:', currentPath);
  
  const authPages = ['/', '/index.html', '/register.html'];
  const protectedPages = ['/chat.html'];
  
  if (user && protectedPages.includes(currentPath)) return;
  if (!user && authPages.includes(currentPath)) return;
  
  if (user) {
    if (authPages.includes(currentPath)) {
      console.log('Redirecting to chat...');
      safeRedirect('/chat.html');
    }
  } else {
    if (protectedPages.includes(currentPath)) {
      console.log('Redirecting to login...');
      safeRedirect('/index.html');
    }
  }
}

// Enhanced Login Function
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = sanitizeInput(loginForm.loginEmail.value);
    const password = loginForm.loginPassword.value;
    const loginBtn = loginForm.querySelector('button[type="submit"]');
    
    if (!email || !password) {
      handleAuthError({ message: 'Please fill in all fields' }, 'login');
      return;
    }

    try {
      loginBtnOriginalText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      loginBtn.disabled = true;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login success:', userCredential.user);
      
      // Update last login time
      await update(ref(database, `users/${userCredential.user.uid}`), {
        lastLogin: serverTimestamp()
      });
      
      await showSuccessAlert('Login Successful!', 'Redirecting to chat...');
      safeRedirect('/chat.html');
    } catch (error) {
      console.error('Login error:', error);
      resetButtonState(loginBtn, loginBtnOriginalText);
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
    
    const username = sanitizeInput(registerForm.registerUsername.value.trim());
    const email = sanitizeInput(registerForm.registerEmail.value.trim());
    const password = registerForm.registerPassword.value;
    const confirmPassword = registerForm.registerConfirmPassword.value;
    const registerBtn = registerForm.querySelector('button[type="submit"]');
    let registerBtnOriginalText = '';

    try {
      if (registerBtn) {
        registerBtnOriginalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        registerBtn.disabled = true;
      }

      // Validate inputs
      if (!username || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      currentUser = userCredential.user;
      console.log('Registration success:', currentUser);

      // Save user data
      await set(ref(database, `users/${currentUser.uid}`), {
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'user'
      });

      await showSuccessAlert('Registration Successful!', 'Your account has been created.');
      safeRedirect('/chat.html');
    } catch (error) {
      console.error('Registration error:', error);
      resetButtonState(registerBtn, registerBtnOriginalText);
      handleAuthError(error, 'register');
    }
  });
}

// Secure Logout Function
function logout() {
  showConfirmationDialog(
    'Are you sure?', 
    'You will be logged out from the system.',
    'warning',
    async () => {
      try {
        await signOut(auth);
        currentUser = null;
        safeRedirect('/index.html');
      } catch (error) {
        console.error('Logout error:', error);
        showErrorAlert('Logout Failed', 'An error occurred during logout.');
      }
    }
  );
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function sanitizeInput(input) {
  if (!input) return '';
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function normalizePath(path) {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function safeRedirect(path) {
  try {
    window.location.href = path;
  } catch (error) {
    console.error('Redirect failed:', error);
    window.location.assign(path);
  }
}

function resetButtonState(button, originalHTML) {
  if (button) {
    button.innerHTML = originalHTML;
    button.disabled = false;
  }
}

// UI Helper Functions
function showSuccessAlert(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  });
}

function showErrorAlert(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#7367f0'
  });
}

function showConfirmationDialog(title, text, icon, confirmCallback) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#7367f0',
    cancelButtonColor: '#82868b',
    confirmButtonText: 'Yes, proceed!'
  }).then((result) => {
    if (result.isConfirmed) {
      confirmCallback();
    }
  });
}

function showFatalError(message) {
  const overlay = document.createElement('div');
  overlay.id = 'fatalErrorOverlay';
  overlay.style.cssText = `
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
    text-align: center;
    padding: 20px;
  `;
  overlay.innerHTML = `
    <div style="color: #ff4d4f; font-size: 48px; margin-bottom: 20px;">⚠️</div>
    <h2 style="color: #ff4d4f; margin-bottom: 15px;">Critical Error</h2>
    <p style="margin-bottom: 25px; max-width: 500px;">${message}</p>
    <button onclick="window.location.reload()" style="
      background: #7367f0;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    ">Refresh Page</button>
  `;
  document.body.appendChild(overlay);
}

// Initialize the application
function initAuth() {
  if (!auth || !database) {
    showFatalError('Authentication services failed to initialize.');
    return;
  }

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
    transition: opacity 0.3s ease;
  `;
  loadingOverlay.innerHTML = `
    <div class="spinner"></div>
    <p>Loading application...</p>
  `;
  document.body.appendChild(loadingOverlay);

  // Initialize auth with timeout
  const initTimeout = setTimeout(() => {
    if (!authInitialized) {
      showFatalError('Application initialization timed out. Please refresh.');
    }
  }, 10000);

  try {
    const unsubscribe = handleAuthState();
    setupLoginForm();
    setupRegisterForm();
    
    // Cleanup when auth is initialized
    const checkAuthReady = setInterval(() => {
      if (authInitialized) {
        clearTimeout(initTimeout);
        clearInterval(checkAuthReady);
        fadeOutAndRemove(loadingOverlay);
      }
    }, 100);
    
    // Cleanup function for when the page unloads
    window.addEventListener('beforeunload', () => {
      unsubscribe?.();
    });

    // Expose logout function globally
    window.logout = logout;
  } catch (error) {
    console.error('Initialization error:', error);
    clearTimeout(initTimeout);
    showFatalError('Failed to initialize application. Please refresh.');
  }
}

function fadeOutAndRemove(element) {
  if (element) {
    element.style.opacity = '0';
    setTimeout(() => element.remove(), 500);
  }
}

// Add spinner styles
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

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}