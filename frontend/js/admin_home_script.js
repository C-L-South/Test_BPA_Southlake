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
  
  // html elements
  const reportsContainer = document.getElementById('reports');
  const deleteUserEmail = document.getElementById('deleteUserEmail');
  const deleteUserBtn = document.getElementById('deleteUserBtn');
  const deleteTeamName = document.getElementById('deleteTeamName');
  const deleteTeamBtn = document.getElementById('deleteTeamBtn');
  const addUserEmail = document.getElementById('addUserEmail');
  const addUserPassword = document.getElementById('addUserPassword');
  const addUserRole = document.getElementById('addUserRole');
  const addUserBtn = document.getElementById('addUserBtn');
  
  firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // get token
          const idToken = await user.getIdToken();
    
          // gets user info
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
          
          //loads database info
          loadReports();

        } catch (error) {
          console.error('Error retrieving user info:', error);
          alert('An error occurred while retrieving user info.');
        }
      }
    });
    

  async function loadReports() {
    try {
      const response = await fetch(`${SERVER_URL}/admin/reports`);
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load reports.');
      }
  
      reportsContainer.innerHTML = '<h3>Users</h3>';
      //display users
      data.users.forEach(user => {
        reportsContainer.innerHTML += `
          <p>
            Email: ${user.email}<br>
            Role: ${user.role}<br>
            Status: ${user.status}<br>
            Team: ${user.team}<br>
          </p>`;
      });
  
      // display team
      reportsContainer.innerHTML += '<h3>Teams</h3>';
      data.teams.forEach(team => {
        reportsContainer.innerHTML += `
          <p>
            Team: ${team.name}<br>
            Leader: ${team.Leader}<br>
          </p>`;
      });

    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }
    
  
  
  deleteUserBtn.addEventListener('click', async () => {
    //get value
    const Email = deleteUserEmail.value;

    if (!Email) {
        alert('Please provide a user Email.');
        return;
    }
    try {
        //call backend
        const response = await fetch(`${SERVER_URL}/admin/deleteUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: Email }),
        });

        const result = await response.json();

        if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user.');
        }

        console.log('User deleted successfully');
        alert('User deleted successfully.');

        //reload reports
        loadReports(); 
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user.');
    }
  });
  

  deleteTeamBtn.addEventListener('click', async () => {
    //get value
      const teamName = deleteTeamName.value.trim();
  
      if (!teamName) {
        alert('Please provide a team Name.');
        return;
      }
  
      try {
        const response = await fetch(`${SERVER_URL}/admin/deleteTeam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName }),
        });

        const result = await response.json();

        if (!response.ok) {
        throw new Error(result.error || 'Failed to delete team.');
        }

        console.log('Team deleted successfully');
        alert('Team deleted successfully.');

        // Reload reports
        loadReports(); 

      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team.');
      } 
  });
  

  addUserBtn.addEventListener('click', async () => {
    //get values
    const email = addUserEmail.value;
    const password = addUserPassword.value;
    const role = addUserRole.value;
    
    if (!email || !password || !role) {
        alert('Please provide all fields: email, password, and role.');
        return;
    }
    
    try {
        //adds user 
        const response = await fetch(`${SERVER_URL}/admin/addUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        });
    
        const result = await response.json();
    
        if (!response.ok) {
        throw new Error(result.error || 'Failed to add user.');
        }
        
        console.log('User added successfully');
        alert('User added successfully.');

        // Reload reports
        loadReports(); 
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Failed to add user.');
    }
  });
    signOutBtn.addEventListener('click', async () => {
    try {
      await firebase.auth().signOut();
      alert('You have been signed out.');
      // Redirect to the login page 
      window.location.href = '/website_screens/login_page/login_index.html';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('An error occurred while signing out.');
    }
  });
  
});

