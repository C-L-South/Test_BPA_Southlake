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
let team_name = null;

// Manage Firebase authentication state change
auth.onAuthStateChanged((currentUser) => {
    if (currentUser) {
        // The user is signed in
        fetchUserData(currentUser.uid);
    } else {
        console.error("No user logged in");
    }
});

// Fetch user data from Firestore
function fetchUserData(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                team_name = userData.team;
                console.log('User data fetched from server:', userData);

                // Ensure team name and leader status are valid
                if (userData.status === 'team leader' && team_name !== 'no team') {
                    console.log("User is a team leader of a valid team.");
                } else {
                    console.error("User is not a team leader or hasn't joined a valid team.");
                    sendInviteBtn.disabled = true; // Disable invite button if not a leader
                }
            } else {
                console.error("No user data found");
            }
        })
        .catch((error) => {
            console.error("Error fetching user data:", error);
        });
}

// Handle sending invites
sendInviteBtn.addEventListener('click', () => {
    const emailToInvite = inviteEmail.value.trim();

    if (!emailToInvite) {
        alert("Please enter a valid email address.");
        return;
    }

    if (team_name && auth.currentUser) {
        fetch(`${SERVER_URL}/sendInvite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inviterId: auth.currentUser.uid,
                inviteTo: emailToInvite,
                teamName: team_name
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Invite sent successfully!");
                }
            })
            .catch((error) => {
                console.error("Error sending invite: ", error);
                alert("Error sending invite.");
            });
    } else {
        console.error("User is not authorized or has no valid team.");
        alert("You need to be logged in as a team leader to send invites.");
    }
});

// Redirect to the goal setting page
goalSettingBtn.addEventListener('click', function () {
    window.location.href = '/website_screens/goal_page/Team_leader_goal_index.html';
});
