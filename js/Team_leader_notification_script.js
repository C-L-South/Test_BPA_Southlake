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
const SERVER_URL = 'http://localhost:3000';
const auth = firebase.auth();
const db = firebase.firestore();
const messageInput = document.getElementById('message');
const sendNotificationBtn = document.getElementById('sendNotificationBtn');
let teamName = null;
let userUid = null;

firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    try {
      // Get the user's ID token
      const idToken = await user.getIdToken();

      // Fetch current user info from the backend
      const response = await fetch(`${SERVER_URL}/CurrentUser`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch user info.');
      }


      console.log('User info got:', result.user);
      userUid = result.user.uid;
      teamName = result.user.team;
      console.log('userUid: ', userUid);
    } catch (error) {
      console.error('Error retrieving user info:', error);
      alert('An error occurred while retrieving user info.');
    }
  }
});

// Add event listener to the button
sendNotificationBtn.addEventListener('click', async () => {
  const message = messageInput.value.trim();

  // Input validation
  if (!message) {
    alert('Fill out the notification you want to send');
    return;
  }

  try {
    // Send POST request to the backend
    const response = await fetch(`${SERVER_URL}/addNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, message })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send notification.');
    }

    // Success message
    alert('Notification sent successfully!');
  } catch (error) {
    console.error('Error sending notification:', error.message);
    alert('Error sending notification');
  }
});
