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
  const SERVER_URL = 'https://test-bpa-southlake-server3.onrender.com';
  console.log('server : ' + SERVER_URL);
  let teamName = null;
  let userUid = null;
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const goalSettingBtn = document.getElementById('goalSettingBtn');
  const goalViewingBtn = document.getElementById('goalViewingBtn');
  const goalLogBtn = document.getElementById('goalLogBtn');
  const notificationBtn = document.getElementById('notificationBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const HabitTracker = document.getElementById('HabitTracker');
  const messageInput = document.getElementById('message');
  const sendNotificationBtn = document.getElementById('sendNotificationBtn');

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
  
  
        console.log('User info got');
        userUid = result.user.uid;
        teamName = result.user.team;
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
  
    HabitTracker.addEventListener('click',() => {
    window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
  });
  goalSettingBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/goal_page/Team_leader_goal_index.html';
    });
    goalViewingBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/chart_page/Team_leader_chart_index.html';
    });
    goalLogBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/log_page/Team_leader_log_index.html';
    });
    notificationBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/notification_page/Team_leader_notification_index.html';
    });
    signOutBtn.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        alert('You have been signed out.');
        // Redirect to the login page or any other page
        window.location.href = '/website_screens/login_page/login_index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        alert('An error occurred while signing out.');
      }
    });
});
