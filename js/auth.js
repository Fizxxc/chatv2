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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// Auth State Management
function handleAuthState() {
  auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    
    if (user) {
      // User is logged in
      if (currentPath === '/' || currentPath === '/register.html' || currentPath === '/index.html') {
        setTimeout(() => {
          window.location.href = '/chat.html';
        }, 500);
      }
    } else {
      // User is not logged in
      if (currentPath === '/chat.html') {
        window.location.href = '/index.html';
      }
    }
  });
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
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await Swal.fire({
        title: 'Login Successful!',
        text: 'Redirecting to chat...',
        icon: 'success',
        confirmButtonColor: '#7367f0',
        timer: 1500,
        showConfirmButton: false
      });
      
      window.location.href = '/chat.html';
    } catch (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
      }
      
      Swal.fire({
        title: 'Login Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#7367f0'
      });
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

    // Validation
    if (password !== confirmPassword) {
      Swal.fire({
        title: 'Password Mismatch',
        text: 'Passwords do not match.',
        icon: 'error',
        confirmButtonColor: '#7367f0'
      });
      return;
    }

    if (username.length < 3) {
      Swal.fire({
        title: 'Invalid Username',
        text: 'Username must be at least 3 characters.',
        icon: 'error',
        confirmButtonColor: '#7367f0'
      });
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Save additional user data
      await database.ref('users/' + user.uid).set({
        username: username,
        email: email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastLogin: firebase.database.ServerValue.TIMESTAMP
      });

      await Swal.fire({
        title: 'Registration Successful!',
        text: 'Your account has been created.',
        icon: 'success',
        confirmButtonColor: '#7367f0',
        timer: 1500,
        showConfirmButton: false
      });

      window.location.href = '/chat.html';
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
      }

      Swal.fire({
        title: 'Registration Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#7367f0'
      });
    }
  });
}

// Enhanced Logout Function
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
  handleAuthState();
  setupLoginForm();
  setupRegisterForm();
  
  // Expose logout function globally if needed
  window.logout = logout;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
