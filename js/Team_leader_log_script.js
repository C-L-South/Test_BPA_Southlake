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
    
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const SERVER_URL = 'http://localhost:3000';
  let userUid = null;
  let allLogs = [];
  let teamName = null;

  const db = firebase.firestore();
  const goalLogsContainer = document.getElementById('goalLogs');
  const searchBar = document.getElementById('searchBar');

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
          console.log('userUid: ', userUid);
          fetchGoalLogs();
        } catch (error) {
          console.error('Error retrieving user info:', error);
          alert('An error occurred while retrieving user info.');
        }
      }
    });
  
  
  
  
    async function fetchGoalLogs() {
      try {
          console
        const response = await fetch(`${SERVER_URL}/getGoalLog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName: teamName }),
        });
    
        const result = await response.json();
    
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch goal logs.');
        } 
        allLogs = result.goalLog;
        displayGoalLogs(allLogs); 
      } catch (error) {
        console.error('Error fetching goal logs:', error.message);
        alert('Failed to fetch goal logs.');
      }
    }
    
    // Display goal logs in the HTML
    function displayGoalLogs(logs) {
  
      goalLogsContainer.innerHTML = ''; 
    
      if (logs.length === 0) {
        goalLogsContainer.innerHTML = '<p>No logs available.</p>';
        return;
      }
    
      logs.forEach(log => {
          const logEntry = document.createElement('div');
          logEntry.classList.add('log-entry');
        
          const message = document.createElement('p');
          message.textContent = log.message;
        
          const timestamp = document.createElement('p');
          timestamp.classList.add('timestamp');
        
            // Convert Firestore timestamp to JavaScript Date
            const date = new Date(log.timestamp._seconds * 1000);
            timestamp.textContent = `${date}`;
        
          logEntry.appendChild(message);
          logEntry.appendChild(timestamp);
          goalLogsContainer.appendChild(logEntry);
        });
        
    }
  
  
    
    searchBar.addEventListener('input', () => {
  
      const searchText = searchBar.value.toLowerCase();
    
  
      const matchingLogs = [];
    
      // Loop through each log in the list of all logs
      for (const log of allLogs) {
  
        const logMessage = log.message.toLowerCase();
    
        // Convert the timestamp to a readable string and lowercase it
        const logTime = new Date(log.timestamp._seconds * 1000)
          .toLocaleString()
          .toLowerCase();
    
        if (logMessage.includes(searchText) || logTime.includes(searchText)) {
          matchingLogs.push(log); 
        }
      }
    
      // Display the filtered logs
      displayGoalLogs(matchingLogs);
    });
  
    goalSettingBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/goal_page/Team_leader_goal_index.html';
    });
    goalViewingBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/chart_page/Team_leader_chart_index.html';
    });
    notificationBtn.addEventListener('click', function () {
      window.location.href = '/website_screens/notification_page/Team_leader_notification_index.html';
    });
    document.getElementById('signOutBtn').addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        alert('You have been signed out.');
        window.location.href = '/website_screens/login_page/login_index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        alert('An error occurred while signing out.');
      }
    });
  });
