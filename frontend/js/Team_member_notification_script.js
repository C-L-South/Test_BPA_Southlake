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

let userUid = null;
let teamName = null;
const signOutBtn = document.getElementById('signOutBtn');
const TeamGoalsBtn = document.getElementById('goToTeamGoal');
const notificationsContainer = document.getElementById('notificationsContainer');
const HabitTracker = document.getElementById('HabitTracker');
const notificationPlaceholder = document.getElementById('notificationPlaceholder');
const notificationBtn = document.getElementById('notificationBtn');
const goalViewingBtn = document.getElementById('goalViewingBtn');
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
        teamName = result.user.team;
        userUid=result.user.uid;
        fetchAndDisplayNotifications();
        console.log('userUid: ', userUid);
      } catch (error) {
        console.error('Error retrieving user info:', error);
        alert('An error occurred while retrieving user info.');
      }
    }
  });
// Fetch notifications for a given team
async function fetchAndDisplayNotifications() {


    try {
      // Send request to the backend
      const response = await fetch(`${SERVER_URL}/getNotifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notifications.');
      }



      const notifications = result.notifications;

      if (notifications.length === 0) {
        notificationPlaceholder.innerHTML = '<p>No notifications</p>';
        return;
      }
      notificationPlaceholder.innerHTML = '';
      notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        const message = document.createElement('p');
        message.textContent = `${notification.message}`;

        const timestamp = document.createElement('p');
        const date = new Date(notification.timestamp._seconds * 1000);
        timestamp.textContent = `${date}`;

        notificationElement.appendChild(message);
        notificationElement.appendChild(timestamp);
        notificationPlaceholder.appendChild(notificationElement);
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      alert('Error fetching notifications')
    }
  }
  HabitTracker.addEventListener('click',() => {
    window.location.href = '/website_screens/home_page/Team_member_home_index.html';
  });
  TeamGoalsBtn.addEventListener('click', () => {
    window.location.href = '/website_screens/goal_page/Team_member_goal_index.html';
  });
  notificationBtn.addEventListener('click', function () {
    window.location.href = '/website_screens/notification_page/Team_member_notification_index.html';
  });
  goalViewingBtn.addEventListener('click', function () {
    window.location.href = '/website_screens/chart_page/Team_member_chart_index.html';
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
