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

// Initialize Firebase in js file
firebase.initializeApp(firebaseConfig);

// constants and variables (no variables yet)
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const auth = firebase.auth();
const db = firebase.database();

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
      db.ref('customers/' + user.uid).set({
        email: user.email,
        role: "customer"
      })
      .then(() => {
        alert(`Signup successful! Welcome, ${user.email}`);
        window.location.href = 'home_page/home.html';
      })
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
      db.ref('administrators/' + user.uid).once('value')
        .then((adminSnapshot) => {
          if (adminSnapshot.exists()) {
            const adminData = adminSnapshot.val();
            alert(`Welcome back, ${adminData.email}! You are an administrator.`);
            window.location.href = 'home_page/home.html';
          } 
          else 
          {
            db.ref('customers/' + user.uid).once('value')
              .then((customerSnapshot) => {
                if (customerSnapshot.exists()) {
                  const customerData = customerSnapshot.val();
                  alert(`Welcome back, ${customerData.email}!`);
                  window.location.href = 'home_page/home.html';
                }
              })
          }
        })
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
    });
});

function promoteToAdmin(userId, email) {
  const customerRef = db.ref('customers/' + userId);
  const adminRef = db.ref('administrators/' + userId);
  customerRef.remove()
    .then(() => {
      return adminRef.set({
        email: email,
        role: "administrator"
      });
    })
}
const admin1userId = "TrcTDmvzEngEtvLEIrskqojI3542";
const admin1email = "testadmin@gmail.com";
promoteToAdmin(admin1userId,admin1email);

