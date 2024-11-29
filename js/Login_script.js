const firebaseConfig = {
  apiKey: "AIzaSyCtmIBT--YMJrlXD-de2KqVIwYUtIhbnMg",
  authDomain: "bpa-user-info-web-application.firebaseapp.com",
  projectId: "bpa-user-info-web-application",
  storageBucket: "bpa-user-info-web-application.firebasestorage.app",
  messagingSenderId: "374266916055",
  appId: "1:374266916055:web:837b7d9bb130e101a99492",
  measurementId: "G-4V2QYVYVKE"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');

// Replace with your backend server URL
const SERVER_URL = 'http://localhost:3000';




// Signup
signupBtn.addEventListener('click', async () => {
const email = usernameField.value.trim();
const password = passwordField.value.trim();

if (!email || !password) {
  alert('Please fill in both fields.');
  return;
}

try {

  const response = await fetch(`${SERVER_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  if (response.ok) {
    alert(result.message);
    await firebase.auth().signInWithEmailAndPassword(email, password);
    window.location.href = '/website_screens/home_page/No_team_home_index.html';
  } else {
    alert(`Signup failed: ${result.message}`);
  }
} catch (error) {
  console.error('Error during signup:', error);
  alert('An error occurred during signup.');
}
});






// Login
// Frontend (e.g., HTML or JavaScript)
loginBtn.addEventListener('click', async () => {
  const email = usernameField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  try {
    // Use Firebase Authentication to log in
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Get the Firebase ID token
    const idToken = await user.getIdToken();

    // Send the ID token to the server for verification
    const response = await fetch(`${SERVER_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();
    if (response.ok) {
      if (result.user.status === 'no team') {
        alert(result.message);
        window.location.href = '/website_screens/home_page/No_team_home_index.html';
      } else if(result.user.status === 'team member'){
        alert(result.message);
        window.location.href = '/website_screens/home_page/Team_member_home_index.html';
      }
      else{
        alert(result.message);
        window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
      }
    } else {
      alert(`Login failed: ${result.message}`);
    }
  } catch (error) {
    console.error("Login error:", error);
    alert(`Login failed: ${error.message}`);
  }
});


