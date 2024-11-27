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

  let team_name=localStorage.getItem("Team Name");
if (team_name) {
    console.log(team_name);
    document.getElementById("team name").textContent = team_name;
} else {
    console.log("No user data found.");
}

sendInviteBtn.addEventListener('click', () => {
    const emailToInvite = inviteEmail.value.trim();
    const user = firebase.auth().currentUser;

    if (!emailToInvite) {
        alert("Please enter a valid email address.");
        return;
    }

    if (user) {
        // check if person they are inviting exists as a customer
        db.collection('customers').where("email", "==", emailToInvite).get()
            .then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    // prevents duplicate invites
                    db.collection('invites')
                        .where("InviteTo", "==", emailToInvite)
                        .where("TeamName", "==", team_name)
                        .get()
                        .then((inviteSnapshot) => {
                            if (!inviteSnapshot.empty) {
                                alert("An invite to this person for this team already exists.");
                            } else {
                                // add the invite if no duplicate is found
                                db.collection('invites').add({
                                    InviteTo: emailToInvite,
                                    TeamName: team_name
                                })
                                .then(() => {
                                    alert("Invite sent successfully!");
                                })
                                .catch((error) => {
                                    console.error("Error sending invite: ", error);
                                    alert("Error sending invite.");
                                });
                            }
                        })
                } else {
                    alert("No user found with that email.");
                }
            })
    } else {
        console.error("No user logged in");
        alert("You need to be logged in to send invites.");
    }
});
