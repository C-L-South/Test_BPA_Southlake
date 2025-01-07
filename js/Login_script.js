document.addEventListener('DOMContentLoaded', () => { 
  const firebaseConfig = {
    apiKey: "AIzaSyCtmIBT--YMJrlXD-de2KqVIwYUtIhbnMg",
    authDomain: "bpa-user-info-web-application.firebaseapp.com",
    databaseURL: "https://bpa-user-info-web-application-default-rtdb.firebaseio.com",
    projectId: "bpa-user-info-web-application",
    storageBucket: "bpa-user-info-web-application.firebasestorage.app",
    messagingSenderId: "374266916055",
    appId: "1:374266916055:web:837b7d9bb130e101a99492",
    measurementId: "G-4V2QYVYVKE"
  };

  firebase.initializeApp(firebaseConfig);

  // html elements
  const signupButton = document.getElementById('signupBtn');
  const loginButton = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const SERVER_URL = 'https://test-bpa-southlake-server3.onrender.com';
  console.log('server : ' + SERVER_URL);

  signupButton.addEventListener('click', async () => {

    //get values
    const email = usernameInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      alert('Please provide both email and password.');
      return;
    }

    try {
      // Send signup data to the backend server
      const response = await fetch(`${SERVER_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed.');
      }

      //if successful
      console.log(result.message);
      alert('Sign up successful! Please now login with the same information.');

    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during signup. Please try again.');
    }
  });
  
  loginButton.addEventListener('click', async () => {
    //get values
    const email = usernameInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      //sign in 
      //only done in frontend
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // send the ID token to the server for verification
      const response = await fetch(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Login failed.');
      } 

      console.log(result.message);
      alert('Login successful');

      //redirect based on role
      if (result.user.role === 'admin') {
        window.location.href = '/website_screens/admin_page/Admin_home_index.html';
      } else if (result.user.status === 'no team') {
        window.location.href = '/website_screens/home_page/No_team_home_index.html';
      } else if (result.user.status === 'team member') {
        window.location.href = '/website_screens/home_page/Team_member_home_index.html';
      } else {
        window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
      }

    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
    }
  });
});
