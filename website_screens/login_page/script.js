// constants and variables (no variables yet)
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');

// Signup 
signupBtn.addEventListener('click', () => {
  const email = usernameField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert(`Signup successful! Welcome, ${user.email}`);
      window.location.href = 'home_page/home.html';
    })
    .catch((error) => {
      alert(`Signup failed: ${error.message}`);
    });
});

// Login
loginBtn.addEventListener('click', () => {
  const email = usernameField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert(`Login successful! Welcome back, ${user.email}`);
      window.location.href = 'home_page/home.html';
    })
    .catch((error) => {
      alert(`Login failed: ${error.message}`);
    });
});
