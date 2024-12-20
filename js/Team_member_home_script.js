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
let user = null;
firebase.auth().onAuthStateChanged((currentUser) => {
if (currentUser) { 
  
  const user = currentUser;
  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        console.log(`Email: ${userData.email}, Role: ${userData.role}, Status : ${userData.status}, Team:${userData.team}`);
        document.getElementById("team name").textContent = userData.team;
        
      } else {
        console.error("No user data found");
      }
    });
} else {
  console.error("No user logged in");
}
});

document.getElementById('goToTeamGoal').addEventListener('click', () => {
  window.location.href = '/website_screens/goal_page/Team_member_goal_index.html';
});
