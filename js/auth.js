// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in
        if (window.location.pathname === '/index.html' || window.location.pathname === '/register.html') {
            window.location.href = 'chat.html';
        }
    } else {
        // User is not logged in
        if (window.location.pathname === '/chat.html') {
            window.location.href = 'index.html';
        }
    }
});

// Login Function
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            Swal.fire({
                title: 'Login Successful!',
                text: 'You are now logged in.',
                icon: 'success',
                confirmButtonColor: '#7367f0'
            }).then(() => {
                window.location.href = 'chat.html';
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            Swal.fire({
                title: 'Login Failed',
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#7367f0'
            });
        });
});

// Register Function
document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Password Mismatch',
            text: 'Passwords do not match.',
            icon: 'error',
            confirmButtonColor: '#7367f0'
        });
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            
            // Save additional user data to database
            database.ref('users/' + user.uid).set({
                username: username,
                email: email,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            Swal.fire({
                title: 'Registration Successful!',
                text: 'Your account has been created.',
                icon: 'success',
                confirmButtonColor: '#7367f0'
            }).then(() => {
                window.location.href = 'chat.html';
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            Swal.fire({
                title: 'Registration Failed',
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#7367f0'
            });
        });
});

// Logout Function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}