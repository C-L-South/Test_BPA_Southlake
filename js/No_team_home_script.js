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
const db = firebase.firestore();
const SERVER_URL = 'http://localhost:3000';
const createBtn = document.getElementById('createBtn');
const Team_name = document.getElementById('team_name');
const invitesContainer = document.getElementById('div');
let userUid = null;
let userEmail = null;

const fetchInvites = async () => {
  try {
    // Send a request to the fetchInvites endpoint
    const response = await fetch(`${SERVER_URL}/fetchInvites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch invites.');
    }

    // Display the invites
    displayInvites(result.invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    const invitesDiv = document.getElementById('invites');
    invitesDiv.innerHTML = '<p style="color: red;">Error fetching invites. Please try again later.</p>';
  }
};

// Function to display invites
const displayInvites = (invites) => {
  const invitesDiv = document.getElementById('invites');
  invitesDiv.innerHTML = ''; // Clear existing invites

  if (invites.length === 0) {
    invitesDiv.innerHTML = '<p>No invites available.</p>';
    return;
  }

  invites.forEach(invite => {
    const inviteElement = document.createElement('div');
    inviteElement.innerHTML = `
      <p>Team Name: ${invite.teamName}</p>
      <button onclick="acceptInvite('${invite.id}')">Accept</button>
      <button onclick="declineInvite('${invite.id}')">Decline</button>
    `;
    invitesDiv.appendChild(inviteElement);
  });
};

const acceptInvite = async (inviteId) => {
  try {
    const response = await fetch('http://localhost:3000/acceptInvite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId: inviteId, userUid: userUid }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to accept invite.');
    }

    alert('Invite accepted successfully!');
    window.location.href = '/website_screens/home_page/Team_member_home_index.html';
  } catch (error) {
    console.error('Error accepting invite:', error);
    alert('Error accepting invite: ' + error.message);
  }
};

const declineInvite = async (inviteId) => {
  try {
    const response = await fetch(`${SERVER_URL}/declineInvite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId}),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to decline invite.');
    }

    alert('Invite declined successfully!');
    fetchInvites(); // Refresh the invites
  } catch (error) {
    alert('Error declining invite: ' + error.message);
    console.error('Error declining invite:', error);
  }
};

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

      userUid=result.user.uid;
      userEmail = result.user.email;

      fetchInvites();
      
      console.log('userUid: ', userUid);
    } catch (error) {
      console.error('Error retrieving user info:', error);
      alert('An error occurred while retrieving user info.');
    }
  }
});



createBtn.addEventListener('click', async () => {
  const Team_name_text = Team_name.value;
  if (!Team_name_text) {
    alert("No team name.");
    return;
  }
  try{
    if (userUid) {
      console.log('Sending data:', { userId: userUid, teamName: Team_name_text });
      const response = await fetch(`${SERVER_URL}/createTeam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userUid, teamName: Team_name_text })
      })

      const result = await response.json();
      
      if(!response.ok){
        throw new Error(result.message || 'Failed to create team.');
      }
      alert(`Team "${Team_name_text}" created successfully!`);
      window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
    }
  }catch(error){
    console.error('Error:', error);
  }
  
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
