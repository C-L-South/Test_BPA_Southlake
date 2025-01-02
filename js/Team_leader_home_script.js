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

// Firebase references
const auth = firebase.auth();
const db = firebase.firestore();
const SERVER_URL = 'http://localhost:3000';

// HTML elements
const sendInviteBtn = document.getElementById('sendInviteBtn');
const inviteEmail = document.getElementById('inviteEmail');
const goalSettingBtn = document.getElementById('goalSettingBtn');
const goalViewingBtn = document.getElementById('goalViewingBtn');
const goalLogBtn = document.getElementById('goalLogBtn');
const notificationBtn = document.getElementById('notificationBtn');
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
      updateExpiredGoals(teamName);
      console.log('userUid: ', userUid);
    } catch (error) {
      console.error('Error retrieving user info:', error);
      alert('An error occurred while retrieving user info.');
    }
  }
});

// Handle sending invites
sendInviteBtn.addEventListener('click', async () => {
  const emailToInvite = inviteEmail.value.trim();

  if (!emailToInvite) {
      alert("Please enter a valid email address.");
      return;
  }
  try {
    if(userUid){
      const response = await fetch('http://localhost:3000/sendInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName, invitedTo: emailToInvite, invitedBy:userUid }),
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invite.');
      }
  
      alert('Invite sent successfully!');
    }

  } catch (error) {
    console.error('Error sending invite:', error);
    alert('Error sending invite: ' + error.message);
  }
});

// Redirect to the goal setting page
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
document.getElementById('signOutBtn').addEventListener('click', async () => {
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

async function updateExpiredGoals(teamName) {
  try {

    // Fetch all goals for the team
    const goalsResponse = await fetch(`${SERVER_URL}/getGoals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUid : userUid }),
    });

    const goalsData = await goalsResponse.json();

    if (!goalsResponse.ok) {
      throw new Error(goalsData.error || 'Failed to fetch goals.');
    }
    const goalTitles = goalsData.goalTitles; // Array of goal titles
    //get new date
    const currentDate = new Date();



    for (const goalTitle of goalTitles) { //loop over all goals
      // Fetch goal details
      const goalInfoResponse = await fetch(`${SERVER_URL}/GoalInfo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName, goalName: goalTitle }),
      });

      const goalInfo = await goalInfoResponse.json();

      if (!goalInfoResponse.ok) {
        throw new Error(`Failed to fetch info for goal "${goalTitle}". `);
      }



      //turn due date into a Date object
      const goalDueDate = new Date(goalInfo.goalInfo.dueDate);
      if (goalDueDate < currentDate) {
        // Delete the expired goal
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



        // Log the deletion
        const logResponse = await fetch(`${SERVER_URL}/updateGoalLog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName,
            Message: `Goal "${goalTitle}" was deleted due to expiration.`,
          }),
        });

        const logResult = await logResponse.json();

        if (!logResponse.ok) {
          throw new Error(`Failed to log deletion of goal "${goalTitle}": ${logResult.error}`);
        }

        console.log(`Deletion of goal "${goalTitle}" logged successfully.`);
      }
    }
    console.log('goal checked successfully');
  } catch (error) {
    console.error('Error updating expired goals:', error.message);
  }
}
