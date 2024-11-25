const firebaseConfig = {
  apiKey: "AIzaSyCtmIBT--YMJrlXD-de2KqVIwYUtIhbnMg",
  authDomain: "bpa-user-info-web-application.firebaseapp.com",
  projectId: "bpa-user-info-web-application",
  storageBucket: "bpa-user-info-web-application.firebasestorage.app",
  messagingSenderId: "374266916055",
  appId: "1:374266916055:web:837b7d9bb130e101a99492",
  measurementId: "G-4V2QYVYVKE"
};

// Initialize Firebase in js file
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
      // Use Firestore to set user data
      db.collection('customers').doc(user.uid).set({
        email: user.email,
        role: "customer"
      })
      .then(() => {
        alert(`Signup successful! Welcome, ${user.email}`);
        window.location.href = '/website_screens/home_page/home.html';
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
      // Check if the user is an administrator
      db.collection('administrators').doc(user.uid).get()
        .then((adminSnapshot) => {
          if (adminSnapshot.exists) {
            const adminData = adminSnapshot.data();
            alert(`Welcome back, ${adminData.email}! You are an administrator.`);
            window.location.href = '/website_screens/home_page/home.html';
          } 
          else {
            // Check if the user is a customer
            db.collection('customers').doc(user.uid).get()
              .then((customerSnapshot) => {
                if (customerSnapshot.exists) {
                  const customerData = customerSnapshot.data();
                  alert(`Welcome back, ${customerData.email}!`);
                  window.location.href = '/website_screens/home_page/home.html';
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

// Promote user to admin
function promoteToAdmin(userId, email) {
  const customerRef = db.collection('customers').doc(userId);
  const adminRef = db.collection('administrators').doc(userId);

  customerRef.delete()
    .then(() => {
      return adminRef.set({
        email: email,
        role: "administrator"
      });
    })
}

// Example: Promote a user to admin
const admin1userId = "TrcTDmvzEngEtvLEIrskqojI3542";
const admin1email = "testadmin@gmail.com";
promoteToAdmin(admin1userId, admin1email);
