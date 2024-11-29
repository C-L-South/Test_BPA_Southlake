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

const auth = firebase.auth();
const db = firebase.firestore();
const sendInviteBtn = document.getElementById('sendInviteBtn');
const inviteEmail = document.getElementById('inviteEmail');
let user= null;
let team_name= null;
const SERVER_URL = 'http://localhost:3000';


firebase.auth().onAuthStateChanged((currentUser) => {
    if (currentUser) { //if user is not null aka logged in
        user = currentUser;

      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            team_name=userData.team;
            console.log(`Email: ${userData.email}, Role: ${userData.role}, Status : ${userData.status}, team: ${userData.team}`);
          } else {
            console.error("No user data found");
          }
        });
    } else {
      console.error("No user logged in");
    }
  });


  sendInviteBtn.addEventListener('click', () => {
    const emailToInvite = inviteEmail.value.trim();

    if (!emailToInvite) {
        alert("Please enter a valid email address.");
        return;
    }

    if (user) {
        fetch(`${SERVER_URL}/sendInvite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inviterId: user.uid,
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
        console.error("No user logged in");
        alert("You need to be logged in to send invites.");
    }
});
