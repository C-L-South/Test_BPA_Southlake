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
    
    // Firebase references
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    google.charts.load('current', { packages: ['corechart'] });
    //calls function so that it will only be run after it is initalized
    google.charts.setOnLoadCallback(initialize());

    const goalSelect = document.getElementById('goalSelect');
    const chartContainer = document.getElementById('chartContainer');
    const signOutBtn = document.getElementById('signOutBtn');
    const TeamGoalsBtn = document.getElementById('goToTeamGoal');
    const HabitTracker = document.getElementById('HabitTracker');
    const notificationBtn = document.getElementById('notificationBtn');
    const goalViewingBtn = document.getElementById('goalViewingBtn');
    
    async function initialize() {
      try {
        const userDetails = await new Promise((resolve, reject) => {
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
    
                console.log('User info retrieved:', result.user);
    
                // Resolve the user details
                resolve({
                  userUid: result.user.uid,
                  teamName: result.user.team,
                });
              } catch (error) {
                console.error('Error retrieving user info:', error);
                reject(error);
              }
            } else {
              console.warn('No authenticated user found.');
              reject(new Error('No authenticated user found.'));
            }
          });
        });
    
        // Assign global variables
        userUid = userDetails.userUid;
        teamName = userDetails.teamName;
    
    
    
        //sets the goals in the dropdown
        const response = await fetch(`${SERVER_URL}/getGoals`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userUid: userUid }),
        });
        const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'Failed to retrieve goals.');
          }
    
          const goals = result.goalTitles;
    
        // Populate dropdown
        goalSelect.innerHTML = '<option value="" disabled selected>Please select a goal</option>';
        goals.forEach((goal) => {
          const option = document.createElement('option');
          option.value = goal;
          option.textContent = goal;
          goalSelect.appendChild(option);
        });
    
    
      } catch (error) {
        console.error('Error initializing:', error);
      }
    }
    
    goalSelect.addEventListener('change', async () => {
      const selectedGoal = goalSelect.value;
    
      try{
    
    
        const response = await fetch(`${SERVER_URL}/getContributions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName: teamName, goalTitle: selectedGoal }),
        });
    
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch contributions.');
        }
    
        const contributions = result.userContributions; 
        console.log(contributions);
        // Prepare data for the chart
        let chartData = [['Email', 'Contributions']];
        contributions.forEach(({ email, contribution }) => {
          chartData.push([email, contribution]);
        });
        // PLEASE TAKE A LOOK AT
        const data = google.visualization.arrayToDataTable(chartData);
        const options = {
          title: 'Contributions by User',
          hAxis: { title: 'Contributions' },
          vAxis: { title: 'Users', minValue: 0 },
          chartArea: { width: '70%', height: '70%' },
          bars: 'horizontal',
        };
      
        const chart = new google.visualization.BarChart(chartContainer);
        chart.draw(data, options);
    
      } catch(error){
        console.error('Error drawing chart:', error);
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
    
