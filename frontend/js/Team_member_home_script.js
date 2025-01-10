document.addEventListener('DOMContentLoaded', () => {
  // Firebase configuration and initialization
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

  // DOM Elements
  const Rank = document.getElementById('rank');
  const TeamGoalsBtn = document.getElementById('goToTeamGoal');
  const HabitTracker = document.getElementById('HabitTracker');
  const notificationBtn = document.getElementById('notificationBtn');
  const goalViewingBtn = document.getElementById('goalViewingBtn');
  const signOutBtn = document.getElementById('signOutBtn');



  // Event Listeners
  HabitTracker.addEventListener('click', () => {
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

  // Firebase Authentication Logic
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
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

        const userUid = result.user.uid;
        const teamName = result.user.team;

        console.log('User info:', result.user);

        // Gamification logic
        if (result.user.totalContributions >= 50) {

          Rank.textContent = 'Your rank is Gold Rank';
        } else if (result.user.totalContributions >= 10) {
          Rank.textContent = 'Your rank is Silver Rank';

        } else if (result.user.totalContributions >= 0) {
          Rank.textContent = 'Your rank is Bronze Rank';

        }

        updateExpiredGoals(userUid, teamName);
      } catch (error) {
        console.error('Error retrieving user info:', error);
        alert('An error occurred while retrieving user info.');
      }
    }
  });

  async function updateExpiredGoals(userUid, teamName) {
    try {
      const goalsResponse = await fetch(`${SERVER_URL}/getGoals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUid }),
      });

      const goalsData = await goalsResponse.json();

      if (!goalsResponse.ok) {
        throw new Error(goalsData.error || 'Failed to fetch goals.');
      }

      const goalTitles = goalsData.goalTitles;
      const currentDate = new Date();

      for (const goalTitle of goalTitles) {
        const goalInfoResponse = await fetch(`${SERVER_URL}/GoalInfo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName, goalName: goalTitle }),
        });

        const goalInfo = await goalInfoResponse.json();

        if (!goalInfoResponse.ok) {
          throw new Error(`Failed to fetch info for goal "${goalTitle}".`);
        }

        const goalDueDate = new Date(goalInfo.goalInfo.dueDate);

        if (goalDueDate < currentDate) {
          const deleteResponse = await fetch(`${SERVER_URL}/goalDelete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamName, goalTitle }),
          });

          const deleteResult = await deleteResponse.json();

          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete goal "${goalTitle}": ${deleteResult.error}`);
          }

          console.log(`Goal "${goalTitle}" deleted successfully.`);
        }
      }

      console.log('Goal check completed successfully.');
    } catch (error) {
      console.error('Error updating expired goals:', error.message);
    }
  }
});
