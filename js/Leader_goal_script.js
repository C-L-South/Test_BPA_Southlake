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
const auth = firebase.auth();
const setGoalBtn = document.getElementById('setGoalBtn');
const goalDescriptionInput = document.getElementById('goalDescription');
const goalTargetInput = document.getElementById('goalTarget');
const goalDueDateInput = document.getElementById('goalDueDate');
let user = null;
let team_name = null;
const SERVER_URL = 'http://localhost:3000';

// Ensure elements are loaded before using them
document.addEventListener("DOMContentLoaded", () => {
    firebase.auth().onAuthStateChanged((currentUser) => {
        if (currentUser) {
            user = currentUser;

            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        team_name = userData.team;
                        console.log(`User data:`, userData);

                        // Enable the set goal button if the user is a leader and team name is available
                        if (userData.status === 'team leader' && team_name !== 'no team') {
                            setGoalBtn.disabled = false;
                        } else {
                            setGoalBtn.disabled = true;
                            console.error("User is not a team leader or no valid team found.");
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

    // Add event listener to set a goal
    setGoalBtn.addEventListener('click', () => {
        if (!goalDescriptionInput || !goalTargetInput || !goalDueDateInput) {
            console.error("One or more input elements are not found in the DOM.");
            alert("An error occurred. Please refresh the page and try again.");
            return;
        }

        const goalDescription = goalDescriptionInput.value.trim();
        const goalTarget = parseInt(goalTargetInput.value);
        const goalDueDate = goalDueDateInput.value;

        if (!goalDescription || isNaN(goalTarget) || !goalDueDate) {
            alert("Please fill out all fields correctly.");
            return;
        }

        if (user && team_name) {
            fetch(`${SERVER_URL}/setGoal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamName: team_name,
                    goalDescription: goalDescription,
                    target: goalTarget,
                    dueDate: goalDueDate
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Goal set successfully!");
                }
            })
            .catch((error) => {
                console.error("Error setting goal: ", error);
                alert("Error setting goal.");
            });
        } else {
            console.error("No user logged in or team not assigned.");
            alert("You need to be logged in as a team leader to set a goal.");
        }
    });
});
