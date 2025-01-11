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
    let userEmail = null;
    let goalUnits = null;
    
    const db = firebase.firestore();
    const goalSelect = document.getElementById('goalSelect');
    const ContributionBtn = document.getElementById('addContributionButton');
    const ContributionAmount = document.getElementById('contributionAmount');
    const goalDescription = document.getElementById('goalDescription');
    const goalDueDate = document.getElementById('goalDueDate');
    const goalTarget = document.getElementById('goalTarget');
    const signOutBtn = document.getElementById('signOutBtn');
    const TeamGoalsBtn = document.getElementById('goToTeamGoal');
    const notificationBtn = document.getElementById('notificationBtn');
    const goalViewingBtn = document.getElementById('goalViewingBtn');
    const HabitTracker = document.getElementById('HabitTracker');  

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
          userEmail = result.user.email;
          console.log('User info got');
          fetchGoals();
        } catch (error) {
          console.error('Error retrieving user info:', error);
          alert('An error occurred while retrieving user info.');
        }
      }
    });

  
    const fetchGoals = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/getGoals`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userUid: userUid }),
        });
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.error || 'Failed to retrieve goals.');
        }
  
        goalSelect.innerHTML = '<option value="" disabled selected>Please select a goal</option>';
        result.goalTitles.forEach((title) => {
          const option = document.createElement('option');
          option.value = title;
          option.textContent = title;
          goalSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error fetching goals:', error);
        alert('Error fetching goals');
      }
    };

    goalSelect.addEventListener('change', async () => {
      // Get the selected value
      const selectedGoal = goalSelect.value;
      const response = await fetch(`${SERVER_URL}/GoalInfo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName, goalName: selectedGoal }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve goal information.');
      }
      goalDescription.textContent = 'Description: ' + result.goalInfo.description;
      goalDueDate.textContent = 'Due date: ' + result.goalInfo.dueDate;
      goalTarget.textContent = 'Target: ' + result.goalInfo.target + ' ' + result.goalInfo.units;
      goalUnits = result.goalInfo.units;
      ContributionAmount.placeholder = result.goalInfo.units;
      console.log(result.goalInfo.description);
    });
  
    
    ContributionBtn.addEventListener("click", async () => {
      const goalTitle = goalSelect.value; // Selected goal ID
      try {
  
  
        //add the Contribution to the goal
        const response = await fetch(`${SERVER_URL}/addContribution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }, 
          body: JSON.stringify({ teamName: teamName, goalTitle: goalTitle, userUid: userUid, ContributionAmount: ContributionAmount.value })
        });
    
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result);
        }
        console.log('Contribution added:', result.message);
  
  
  
        //adds it to the Goal Log
        const responseLog = await fetch(`${SERVER_URL}/updateGoalLog` , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }, 
          body: JSON.stringify({ teamName: teamName, Message: userEmail + ' has added ' + ContributionAmount.value + ' '+ goalUnits + ' to ' + goalTitle })
        });
        const resultLog = await responseLog.json();
        if(!responseLog.ok){
          throw new Error(resultLog);
        }
        console.log('Log: ' + resultLog.message);
  
  
  
        //add user contribution score, for rank  
        const responseContributions = await fetch(`${SERVER_URL}/updateUserContributions` , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }, 
          body: JSON.stringify({ userUid : userUid, ContributionAmount : ContributionAmount.value })
        });
        const resultContributions = await responseContributions.json();
        if(!responseContributions.ok){
          throw new Error(resultContributions);
        }
        console.log('User Contributions Update: ' + resultContributions.message);
  
        alert('Contribution Added!');
  
  
  
        //check if the goal target is met
        const responseGoalInfo = await fetch(`${SERVER_URL}/GoalInfo` , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }, 
          body: JSON.stringify({ teamName : teamName, goalName : goalTitle})
        });
        const resultGoalInfo = await responseGoalInfo.json();
        const GoalInfo = resultGoalInfo.goalInfo;
        const submissions = GoalInfo.submissions || {};
  
        //calucate total
        let totalContributions = 0;
        for (const key in submissions) {
          totalContributions += submissions[key];
        }
  
  
  
        // Check if the target is met or exceeded
        if (totalContributions >= GoalInfo.target) {
          console.log(`Goal "${goalTitle}" target met. Deleting goal.`);
  
          // Delete the goal
          const deleteResponse = await fetch(`${SERVER_URL}/goalDelete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamName: teamName, goalTitle: goalTitle }),
          });
  
          const deleteResult = await deleteResponse.json();
  
          if (!deleteResponse.ok) {
            throw new Error(deleteResult.error || `Failed to delete goal "${goalTitle}".`);
          }
  
          console.log(`Goal "${goalTitle}" deleted successfully.`);
  
  
          // Log the deletion
          const logResponse = await fetch(`${SERVER_URL}/updateGoalLog`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              teamName: teamName,
              Message: `Goal "${goalTitle}" was deleted as its target was met.`,
            }),
          });
  
          const logResult = await logResponse.json();
  
          if (!logResponse.ok) {
            throw new Error(logResult.error || `Failed to log deletion of goal "${goalTitle}".`);
          }
  
          console.log(`Deletion of goal "${goalTitle}" logged successfully.`);
        }
  
      } catch (error) {
        console.error('Error sending contribution:', error);
        alert('Error sending contribution');
      }
    });
  
  
  
  
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
  
  
