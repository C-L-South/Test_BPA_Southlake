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
  
  const setGoalBtn = document.getElementById('setGoalBtn');
  const goalDescriptionInput = document.getElementById('goalDescription');
  const goalTargetInput = document.getElementById('goalTarget');
  const goalDueDateInput = document.getElementById('goalDueDate');
  const goalTitleInput = document.getElementById('goalTitle');
  const goalUnitsInput = document.getElementById('goalUnits');
  const goalSettingBtn = document.getElementById('goalSettingBtn');
  const goalViewingBtn = document.getElementById('goalViewingBtn');
  const HabitTracker = document.getElementById('HabitTracker');
  const goalLogBtn = document.getElementById('goalLogBtn');
  const notificationBtn = document.getElementById('notificationBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  


  
  
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
          userUid = result.user.uid;
          teamName = result.user.team;
          console.log('User info got:', result.user);
  
          console.log('userUid: ', userUid);
        } catch (error) {
          console.error('Error retrieving user info:', error);
          alert('An error occurred while retrieving user info.');
        }
      }
    });
    
  
  // Add event listener to set a goal
  setGoalBtn.addEventListener('click', async () => {
      // Ensure all fields are filled
      if (!teamName || !goalTitleInput || !goalUnitsInput || !goalDescriptionInput || !goalTargetInput || !goalDueDateInput ) {
          alert("Fill in all fields to set a goal.");
          return;
      }
  
  
      const goalDescription = goalDescriptionInput.value;
      const goalTarget = parseInt(goalTargetInput.value);
      const goalDueDate = goalDueDateInput.value;
      const goalTitle = goalTitleInput.value;
      const goalUnits = goalUnitsInput.value;
  
      if (userUid && teamName) {
          try {
              const response = await fetch(`${SERVER_URL}/setGoal`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      teamName: teamName,
                      goalTitle: goalTitle,
                      goalUnits: goalUnits,
                      goalDescription: goalDescription,
                      goalTarget: goalTarget,
                      goalDueDate: goalDueDate
                  }),
              });
  
              const result = await response.json();
  
              if (!response.ok) {
                  throw new Error(result.error || "Failed to set goal.");
              }
              const logResponse = await fetch(`${SERVER_URL}/updateGoalLog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamName: teamName,
                    Message: goalTitle + ' was created'
                }),
            });
            const logResult = await logResponse.json();
            if(!logResponse.ok){
              throw new Error(logResult.error);
            }
            alert("Goal set successfully!");
          } catch (error) {
              console.error("Error setting goal:", error);
              alert("Error setting goal: " + error.message);
          }
      } else {
          console.error("No user logged in or team not assigned.");
          alert("You need to be logged in as a team leader to set a goal.");
      }
  });
    HabitTracker.addEventListener('click',() => {
    window.location.href = '/website_screens/goal_page/Team_leader_home_index.html';
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
