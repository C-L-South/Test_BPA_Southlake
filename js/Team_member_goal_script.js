const firebaseConfig = {
    apiKey: "AIzaSyCtmIBT--YMJrlXD-de2KqVIwYUtIhbnMg",
    authDomain: "bpa-user-info-web-application.firebaseapp.com",
    projectId: "bpa-user-info-web-application",
    storageBucket: "bpa-user-info-web-application.firebasestorage.app",
    messagingSenderId: "374266916055",
    appId: "1:374266916055:web:837b7d9bb130e101a99492",
    measurementId: "G-4V2QYVYVKE"
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const db = firebase.firestore();
  const selectTaskDropdown = document.getElementById('goalSelect');
  const ContributionBtn = document.getElementById("addContributionButton");
  const ContributionAmount = document.getElementById("contributionAmount");
  let user = null;
  let team_name = null;
  const SERVER_URL = 'http://localhost:3000';
  firebase.auth().onAuthStateChanged((currentUser) => {
    if (currentUser) { 
      user= currentUser;
  
      fetch(`${SERVER_URL}/getGoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      })

        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json(); // Parse the JSON response
        })

        .then((data) => {
          console.log('Backend Response:', data);

          const teamName = data.teamName;
          const goals = data.goals;
  
          console.log(`Team Name: ${teamName}`);
          console.log('Goals:', goals);

          selectTaskDropdown.innerHTML = ''; 
  
          if (goals.length > 0) {
            goals.forEach((goal) => {
              const option = document.createElement('option');
              option.value = goal.goalId;
              option.textContent = `${goal.description} (Due: ${goal.dueDate})`;
              selectTaskDropdown.appendChild(option);
            });
          } else {
            const noGoalsOption = document.createElement('option');
            noGoalsOption.value = '';
            noGoalsOption.textContent = 'No goals available';
            selectTaskDropdown.appendChild(noGoalsOption);
          }
          team_name = data.teamName;
        })
        .catch((error) => {
          console.error('Error fetching user data and goals:', error);
        });
    } else {
      console.error('No user logged in');
    }
  });
  
  
  ContributionBtn.addEventListener("click", async () => {
    const goalId = selectTaskDropdown.value; // Selected goal ID
    const userId = user.uid; // Authenticated user's ID
    const contributionAmount = ContributionAmount.value; // Amount to contribute, replace with dynamic value if needed
    try {
      const response = await fetch(`${SERVER_URL}/addContribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({ teamName: team_name, goalId: goalId, userId: userId, contributionAmount: contributionAmount })
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log('Contribution added:', result.message);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Error sending contribution:', error);
    }
  });









