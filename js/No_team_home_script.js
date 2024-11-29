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
const SERVER_URL = 'http://localhost:3000';
let user= null;
const createBtn = document.getElementById('createBtn');
const Team_name = document.getElementById('team_name');
const invitesContainer = document.getElementById('div');

function acceptInvite(userId, inviteId, teamName) {
  console.log(`Sending accept request for Invite ID: ${inviteId}, Team: ${teamName}`);

  // Send HTTPS POST request to the server
  fetch(`${SERVER_URL}/acceptInvite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      inviteId: inviteId,
      teamName: teamName
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Directly check if there's a 'message' in the response
      if (data.message) {
        // Display the success message
        alert(data.message);
      } else {
        alert(`Failed to accept invite: Unknown error`);
      }
    })
    .catch((error) => {
      console.error('Error while accepting invite:', error);
      alert('An error occurred while accepting the invite.');
    });
}
function declineInvite(inviteId) {
  console.log(`Sending decline request for Invite ID: ${inviteId}`);
  
  // Send HTTPS POST request to the server
  fetch(`${SERVER_URL}/declineInvite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inviteId: inviteId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert('Invite declined successfully!');
      } else {
        alert(`Failed to decline invite: ${data.message}`);
      }
    })
    .catch((error) => {
      console.error('Error while declining invite:', error);
      alert('An error occurred while declining the invite.');
    });
}


function loadInvites(userId) {
  fetch(`${SERVER_URL}/getInvites/${userId}`)
    .then(response => response.json())
    .then(data => {
      if (data.invites && data.invites.length > 0) {
        invitesContainer.innerHTML = '';  // Clear any previous invites
        data.invites.forEach(invite => {
          const inviteDiv = document.createElement('div');
          console.log(user.uid);
          console.log(invite.TeamName);
          inviteDiv.innerHTML = `
            <p>Invite to join team: ${invite.TeamName}</p>
            <button onclick="acceptInvite('${user.uid}','${invite.id}', '${invite.TeamName}')">Accept</button>
            <button onclick="declineInvite('${invite.id}')">Decline</button>
          `;
          invitesContainer.appendChild(inviteDiv);
        });
      } else {
        invitesContainer.innerHTML = '<p>No invites at the moment.</p>';
      }
    })
    .catch((error) => {
      console.error('Error fetching invites:', error);
      invitesContainer.innerHTML = '<p>Error loading invites.</p>';
    });
}



  firebase.auth().onAuthStateChanged((currentUser) => {
      if (currentUser) { //if user is not null aka logged in
        // User is logged in, fetch data from Firestore
        
        user = currentUser;
        loadInvites(user.uid);
        db.collection('users').doc(user.uid).get()
          .then((doc) => {
            if (doc.exists) {
              const userData = doc.data();
              console.log(`Email: ${userData.email}, Role: ${userData.role}, Status : ${userData.status}`);
            } else {
              console.error("No user data found");
            }
          });
      } else {
        console.error("No user logged in");
      }
    });
    

    createBtn.addEventListener('click', () => {
      

      const Team_name_text = Team_name.value.trim();

    
      if (!Team_name_text) {
        alert("No team name.");
        return;
      }

      if (user) {
        fetch(`${SERVER_URL}/createTeam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, teamName: Team_name_text })
        })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert(data.error);
            } else {
              alert("Team created successfully!");
              console.log(`Team created by: ${user.email} called: ${Team_name_text}`);
              window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
            }
          })
          .catch((error) => {
            console.error('Error:', error);
            alert("Error creating team.");
          });
          
      }
    });
    
      
