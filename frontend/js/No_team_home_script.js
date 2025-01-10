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

  //html elements
  const createBtn = document.getElementById('createBtn');
  const Team_name = document.getElementById('team_name');
  const invitesContainer = document.getElementById('invites');
  const HabitTracker = document.getElementById('HabitTracker');
  const signOutBtn = document.getElementById('signOutBtn');

  let userUid = null;
  let userEmail = null;

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // gets users id
        const idToken = await user.getIdToken();

        // current user info from the backend
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
        userEmail = result.user.email;

        console.log('user info retrieved');

        //gets the incoming invites
        fetchInvites();
        
      } catch (error) {
        console.error('Error retrieving user info:', error);
        alert('An error occurred while retrieving user info.');
      }
    }
  });


  const fetchInvites = async () => {
    try {
      // send a request to fetchInvites endpoint
      const response = await fetch(`${SERVER_URL}/fetchInvites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch invites.');
      }
      console.log('Fetched Invites');

      // Display the invites
      displayInvites(result.invites);

    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };


  const displayInvites = (invites) => {

    if (invites.length === 0) {
      invitesContainer.innerHTML = '<p>No invites available.</p>';
      return;
    }
    invitesContainer.innerHTML = 'Invites: ';
    invites.forEach(invite => {
      const inviteElement = document.createElement('div');

      //creates two button to give users choice
      inviteElement.innerHTML = `
        <p>Team Name: ${invite.teamName}</p>
        <button onclick="acceptInvite('${invite.id}')" class = "acceptBtn" >Accept</button>
        <button onclick="declineInvite('${invite.id}')" class = "declineBtn" >Decline</button>
      `;
      invitesContainer.appendChild(inviteElement);
    });
  };

  window.acceptInvite = async (inviteId) => {
    try {
      const response = await fetch(`${SERVER_URL}/acceptInvite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: inviteId, userUid: userUid }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      alert('Invite accepted successfully!');
      console.log('Invite accepted successfully!');

      //redirect to member page
      window.location.href = '/website_screens/home_page/Team_member_home_index.html';

    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('Error accepting invite');
    }
  };

  window.declineInvite = async (inviteId) => {
    try {
      const response = await fetch(`${SERVER_URL}/declineInvite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: inviteId}),
      });

      const result = await response.json();
      console.log(result);
      if (!response.ok) {
        throw new Error(result.error);
      }

      alert('Invite declined successfully!');
      console.log('Invite declined successfully!');

      fetchInvites(); // Refresh the invites
    } catch (error) {
      alert('Error declining invite: ' + error.message);
      console.error('Error declining invite:', error);
    }
  };


  // to create a team
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

        //redirect to leader page
        window.location.href = '/website_screens/home_page/Team_leader_home_index.html';
      }
    }catch(error){
      console.error('Error:', error);
      alert('Error creating team');
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
  HabitTracker.addEventListener('click',() => {
    window.location.href = '/website_screens/goal_page/Team_member_home_index.html';
  });
});