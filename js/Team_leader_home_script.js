// Firebase config setup
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
  
  // Firebase references
  const auth = firebase.auth();
  const db = firebase.firestore();
  const SERVER_URL = 'http://localhost:3000';
  
  // HTML elements
  const sendInviteBtn = document.getElementById('sendInviteBtn');
  const inviteEmail = document.getElementById('inviteEmail');
  const goalSettingBtn = document.getElementById('goalSettingBtn');
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const recipientEmailInput = document.getElementById("recipientEmail");
  const teamMessageInput = document.getElementById("teamMessage");
  let team_name = null;
  let user = null;
// Global variable to store user data
let userData = null;

firebase.auth().onAuthStateChanged((currentUser) => {
  if (currentUser) {
    user = currentUser;

    // Fetch user data
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          userData = doc.data(); // Assign globally
          console.log(`Email: ${userData.email}, Role: ${userData.role}, Status : ${userData.status}, Team: ${userData.team}`);

          // Update the team name in the DOM
          const teamNameElement = document.getElementById("team name");
          if (teamNameElement) {
            teamNameElement.textContent = userData.team || "No Team Assigned";
          }
        } else {
          console.error("No user data found");
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  } else {
    console.error("No user logged in");
  }
});

// Handle sending invites
sendInviteBtn.addEventListener('click', () => {
  const emailToInvite = inviteEmail.value.trim();

  if (!emailToInvite) {
    alert("Please enter a valid email address.");
    return;
  }

  if (userData && userData.team) {
    team_name = userData.team;
    console.log("Assigned team_name:", team_name);

    fetch(`${SERVER_URL}/sendInvite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviterId: auth.currentUser.uid,
        inviteTo: emailToInvite,
        teamName: team_name,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "An error occurred.");
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message);
      })
      .catch((error) => {
        console.error("Error sending invite:", error.message);
        alert(error.message);
      });
  } else {
    console.error("User is not authorized or has no valid team.");
    alert("You need to be logged in as a team leader to send invites.");
  }
});

sendMessageBtn.addEventListener("click", () => {
  const recipientEmail = recipientEmailInput.value.trim();
  const messageContent = teamMessageInput.value.trim();

  if (!recipientEmail || !messageContent) {
    alert("Recipient email and message content cannot be empty.");
    return;
  }

  fetch("http://localhost:3000/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: auth.currentUser.email, 
      teamId: team_name,             
      recipient: recipientEmail,     
      message: messageContent,       
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.error || "An error occurred.");
        });
      }
      return response.json();
    })
    .then((data) => {
      alert("Message sent successfully!");
      recipientEmailInput.value = ""; 
      teamMessageInput.value = "";    
    })
    .catch((error) => {
      alert(error.message);
    });
});

  
  // Redirect to the goal setting page
  goalSettingBtn.addEventListener('click', function () {
    window.location.href = '/website_screens/goal_page/Team_leader_goal_index.html';
  });
