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
  const createBtn = document.getElementById('createBtn');
  const Team_name = document.getElementById('team_name');

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is logged in, fetch data from Firestore
          db.collection('customers').doc(user.uid).get()
            .then((doc) => {
              if (doc.exists) {
                const userData = doc.data();
                console.log(`Email: ${userData.email}, Role: ${userData.role}`);
              } else {
                console.error("No user data found");
              }
            });
        } else {
          console.error("No user logged in");
        }
      });

      createBtn.addEventListener('click', () => {
        // Get the current user
				const Team_name_value = Team_name.value.trim();
        const user = firebase.auth().currentUser;
				if (!Team_name_value) {
					alert("Please enter a valid team name.");
					return;
				}	

        if (user) {

          db.collection('teams').doc(Team_name_value).get()
  					.then((doc) => {
    					if (doc.exists) {
								alert("team name already exists");
    					} 
							else {
								db.collection('teams').doc(Team_name_value).set({
									Leader: user.email
								})
								.then(() => {
									alert("Team created successfully!");
									console.log(`Team created by: ${user.email} called: ${Team_name_value}`);
									localStorage.setItem("Team Name", Team_name_value);
									window.location.href = '/website_screens/home_page/home_team_leader.html';
								})
								.catch((error) => {
									console.error("Error adding team: ", error);
									alert("Error creating team.");
								});
    					}
  					})
					.catch((error) => {
						console.error("Error checking document existence: ", error);
					});
        } else {
          console.error("No user logged in");
          alert("You need to be logged in to create a team.");
        }
      });
