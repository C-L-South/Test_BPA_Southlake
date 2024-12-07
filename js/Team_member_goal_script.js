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
const selectTaskDropdown = document.getElementById('selectTaskDropdown');
let user = null;


// Ensure that Firebase Authentication state is ready before accessing currentUser
firebase.auth().onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
      user = currentUser;

      try {
          console.log(`User is part of team: ${user.uid}`);

          // Fetch the user data from Firestore
          let userSnapshot = await db.collection('users').doc(user.uid).get();

          if (userSnapshot.exists) {
              const userData = userSnapshot.data();
              const teamName = userData.team;

              console.log(`User is part of team: ${teamName}`);

              // Fetch goals for the user's team
              let teamSnapshot = await db.collection('teams').doc(teamName).get();
              if (teamSnapshot.exists) {
                  const teamData = teamSnapshot.data();
                  const goals = teamData.Goals || [];

                  // Populate the select dropdown
                  selectTaskDropdown.innerHTML = ''; // Clear any existing options

                  if (goals.length > 0) {
                      goals.forEach((goal) => {
                          const option = document.createElement('option');
                          option.value = goal;
                          option.textContent = goal;
                          selectTaskDropdown.appendChild(option);
                      });
                  } else {
                      // Handle case when no goals are found
                      const noGoalsOption = document.createElement('option');
                      noGoalsOption.value = '';
                      noGoalsOption.textContent = 'No goals available';
                      selectTaskDropdown.appendChild(noGoalsOption);
                  }
              } else {
                  console.error("Team document does not exist.");
              }
          } else {
              console.error("User document does not exist.");
          }
      } catch (error) {
          console.error("Error while processing user data:", error);
      }
  } else {
      console.error("No user logged in");
  }
});

