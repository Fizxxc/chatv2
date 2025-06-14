// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  update,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTra71Vq4b0nPZ8hdfgY_Sxxr-REk9-9E",
  authDomain: "topup-2c5db.firebaseapp.com",
  databaseURL: "https://topup-2c5db-default-rtdb.asia-southeast1.firebasedatabase.app",
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

// Error Handler
function handleAuthError(error, action) {
  const errorMap = {
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-not-found': 'User not found',
    'auth/wrong-password': 'Wrong password'
  };

  const message = errorMap[error.code] || error.message || `${action} failed`;
  
  Swal.fire({
    title: 'Error',
    text: message,
    icon: 'error',
    confirmButtonColor: '#7367f0'
  });
}

// Login Function
export function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.loginEmail.value;
    const password = loginForm.loginPassword.value;
    const button = loginForm.querySelector('button[type="submit"]');
    
    try {
      // Show loading state
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="spinner"></span> Logging in...';
      button.disabled = true;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await update(ref(database, `users/${userCredential.user.uid}`), {
        lastLogin: serverTimestamp()
      });
      
      // Redirect to chat
      window.location.href = 'chat.html';
    } catch (error) {
      handleAuthError(error, 'Login');
    } finally {
      button.disabled = false;
      button.innerHTML = 'Login';
    }
  });
}

// Register Function
export function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = form.registerUsername.value.trim();
    const email = form.registerEmail.value.trim();
    const password = form.registerPassword.value;
    const confirmPassword = form.registerConfirmPassword.value;
    const button = form.querySelector('button[type="submit"]');
    
    // Validate
    if (password !== confirmPassword) {
      return handleAuthError({ message: 'Passwords do not match' }, 'Registration');
    }

    try {
      // Show loading state
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="spinner"></span> Registering...';
      button.disabled = true;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data
      await set(ref(database, `users/${userCredential.user.uid}`), {
        username,
        email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'user'
      });
      
      // Redirect to chat
      window.location.href = 'chat.html';
    } catch (error) {
      handleAuthError(error, 'Registration');
    } finally {
      button.disabled = false;
      button.innerHTML = 'Register';
    }
  });
}

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
  setupLoginForm();
  setupRegisterForm();
});