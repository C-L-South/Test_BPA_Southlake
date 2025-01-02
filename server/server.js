const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Firebase Admin Initialization
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());


app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Create user in Firebase Authentication
    // returns details about newly created user
    const userRecord = await admin.auth().createUser({ email, password });

    // Add user data to Firestore
    await db.collection('Users').doc(userRecord.uid).set({
      email: userRecord.email,
      role: 'customer',
      status: 'no team',
      team: 'no team',
      totalContributions: 0
    });

    // 201 means successfully created something
    res.status(201).json({ message: 'Signup successful.', userId: userRecord.uid });
  } catch (error) {
    //internal server error
    console.error('Error creating user:', error);
    res.status(500).json({ message: error });
  }
});
app.post('/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('Users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User data not found in Firestore.' });
    }

    const userData = userDoc.data();
    
    // Return the necessary user details
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: uid,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        team: userData.team,
        totalContributions: userData.totalContributions
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});
app.get('/currentUser', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ message: 'Unauthorized. No token provided.' });
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch additional user details from Firestore
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found in the database.' });
    }

    const userData = userDoc.data();

    // Respond with detailed user info
    res.status(200).json({
      message: 'User info retrieved successfully.',
      user: {
        uid: userId ,
        email: decodedToken.email ,
        team: userData.team ,
        status: userData.status ,
        role: userData.role ,
        totalContributions: userData.totalContributions
      },
    });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(403).json({ message: 'Failed to retrieve user info. Invalid or expired token.' });
  }
});
app.post('/createTeam', async (req, res) => {
  const { userId, teamName } = req.body;

  try {
    // Fetch user data
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    if (userData.status !== 'no team') {
      return res.status(400).json({ error: 'You have already created or joined a team.' });
    }

    // Check if team already exists
    const teamDoc = await db.collection('Teams').doc(teamName).get();
    if (teamDoc.exists) {
      return res.status(400).json({ error: 'Team name already exists.' });
    }

    // Create the team and update user status
    await db.collection('Teams').doc(teamName).set({
      Leader: userData.email,
      Members: [],
      Goals: {},
      goalLog: [],
      notifications: []
    });
    await db.collection('Users').doc(userId).update({
      status: 'team leader',
      team: teamName
    });
    
    return res.status(201).json({ message: 'Team created successfully.' });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/sendInvite', async (req, res) => {
  const { teamName, invitedTo, invitedBy } = req.body;
  try {
    // Add invite to Firestore
    const inviteRef = await db.collection('Invites').add({
      teamName,
      invitedBy,
      invitedTo,
    });

    res.status(201).json({ message: 'Invite sent successfully.', inviteId: inviteRef.id });
  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/fetchInvites', async (req, res) => {
  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ error: 'User email is required.' });
  }

  try {
    const invitesRef = db.collection('Invites').where('invitedTo', '==', userEmail);
    const snapshot = await invitesRef.get();

    if (snapshot.empty) {
      return res.status(200).json({ invites: [] }); // No invites found
    }

    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/acceptInvite', async (req, res) => {
  const { inviteId, userUid } = req.body;

  if (!inviteId || !userUid) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {

    const inviteRef = db.collection('Invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();
    const inviteData = inviteDoc.data();

    // Add the user to the team
    const teamRef = db.collection('Teams').doc(inviteData.teamName);
    await teamRef.update({
      Members: admin.firestore.FieldValue.arrayUnion(userUid),
    });
    //update user 
    const userRef = db.collection('Users').doc(userUid);
    await userRef.update({
      status: 'team member',
      team: inviteData.teamName,
    });

    // Delete the invite
    await inviteRef.delete();

    res.status(200).json({ message: 'Invite accepted successfully.' });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/declineInvite', async (req, res) => {
  const { inviteId } = req.params;

  try {
    const inviteRef = db.collection('invites').doc(inviteId);
    // Delete the invite
    await inviteRef.delete();

    return res.status(200).json({ message: 'Invite successfully declined.' });
  } catch (error) {
    console.error('Error declining invite:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/setGoal', async (req, res) => {
  const { teamName, goalTitle, goalUnits, goalDescription, goalTarget, goalDueDate } = req.body;

  // Validate input fields
  if (!teamName || !goalTitle || !goalUnits || !goalDescription || !goalTarget || !goalDueDate) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check if the due date is not in the past
  const dueDate = new Date(goalDueDate);
  if (dueDate < new Date()) {
    return res.status(400).json({ error: 'Due date cannot be in the past.' });
  }

  try {
    // Reference to the team's document
    const teamRef = db.collection('Teams').doc(teamName);
    const teamDoc = await teamRef.get();

    // Check if the team exists
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Get current goals
    const teamData = teamDoc.data();
    const Goals = teamData.Goals || {};

    // Check if a goal with the same title already exists
    if (Goals[goalTitle]) {
      return res.status(400).json({ error: 'A goal with this title already exists.' });
    }

    // Add the new goal
    Goals[goalTitle] = {
      description: goalDescription,
      units: goalUnits,
      target: goalTarget,
      dueDate: goalDueDate,
      submissions: {}, // Initialize an empty map for submissions
    };

    // Update the team's document with the new goals object its a map
    await teamRef.update({ Goals });

    res.status(201).json({
      message: 'Goal created successfully.',
      goalData: Goals[goalTitle],
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/getGoals', async (req, res) => {
  const { userUid } = req.body;

  // Validate input
  if (!userUid) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    // Fetch user data from Firestore
    const userSnapshot = await db.collection('Users').doc(userUid).get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'User document does not exist.' });
    }

    const userData = userSnapshot.data();
    const teamName = userData.team;

    const teamRef = db.collection('Teams').doc(teamName);
    const teamDoc = await teamRef.get();
    // Check if the team exists
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Retrieve the Goals map
    const teamData = teamDoc.data();
    const Goals = teamData.Goals || {};

    // Extract the titles (keys) from the Goals map
    const goalTitles = Object.keys(Goals);

    res.status(200).json({ goalTitles });
  } catch (error) {
    console.error('Error fetching user data and goals:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/GoalInfo', async (req, res) => {
  const { teamName, goalName } = req.body;

  try {
    // Fetch the team's document
    const teamRef = db.collection('Teams').doc(teamName);
    const teamDoc = await teamRef.get();
    const teamData = teamDoc.data();
    const Goals = teamData.Goals || {};

    // Retrieve the goal's information
    const goalInfo = Goals[goalName];

    // Respond with the goal's information
    res.status(200).json({ goalName, goalInfo });
  } catch (error) {
    console.error('Error retrieving goal info:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/addContribution', async (req, res) => {
  //made let so we can change it
  let { teamName, goalTitle, userUid, ContributionAmount } = req.body;
  //was a string before
  ContributionAmount = Number(ContributionAmount);
  // Validate input
  if (!teamName || !goalTitle || !userUid || !ContributionAmount) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const teamRef = db.collection('Teams').doc(teamName);

    // Fetch the team document
    const teamSnapshot = await teamRef.get();
    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }
    const teamData = teamSnapshot.data();
    const goals = teamData.Goals || {};
    if (!goals[goalTitle]) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const goal = goals[goalTitle];

    if (goal.submissions[userUid]) {
      // Add to the existing contribution
      goal.submissions[userUid] += ContributionAmount;
    } else {
      // Create a new contribution entry
      goal.submissions[userUid] = ContributionAmount;
    }


    // Update the goals map
    goals[goalTitle] = goal;

    // Save the updated team document
    await teamRef.update({ Goals: goals });

    res.status(200).json({ message: 'Contribution added successfully!' });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/getContributions', async (req, res) => {
  const { teamName, goalTitle } = req.body;
  console.log('Team Name:', teamName);
  console.log('Goal Title:', goalTitle);
  try {
 
    const teamRef = db.collection('Teams').doc(teamName);
    const teamSnapshot = await teamRef.get();


    const teamData = teamSnapshot.data();
    const goals = teamData.Goals || {};

    const goal = goals[goalTitle];
    const submissions = goal.submissions || {};

    const userContributions = [];
    //get all the users
    const userUids = Object.keys(submissions);

    for (const userUid of userUids) {
        // Get the user document from Firestore
        const userRef = db.collection('Users').doc(userUid);
        const userSnapshot = await userRef.get();
        const userData = userSnapshot.data();
        
        const userEmail = userData.email;
    
        // Add the user contribution to the array
        userContributions.push({
          email: userEmail,
          contribution: submissions[userUid], // Get the contribution amount from the submissions map
        });
    }

    return res.status(200).json({ userContributions });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return res.status(500).json({ error: 'An error occurred while fetching contributions.' });
  }
});
app.post('/updateGoalLog', async (req, res) => {
  const { teamName, Message } = req.body;

  try {
    // Reference the team document
    const teamRef = db.collection('Teams').doc(teamName);

    // Fetch the team document
    const teamSnapshot = await teamRef.get();
    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Append the message to the goalLog array
    await teamRef.update({
      goalLog: admin.firestore.FieldValue.arrayUnion({
        message: Message,
        timestamp: new Date(), // Use the current timestamp here
      }),
    });

    res.status(200).json({ message: 'Goal log updated successfully.' });
  } catch (error) {
    console.error('Error updating goal log:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/updateUserContributions', async (req, res) => {
  const { userUid, ContributionAmount } = req.body;
  const ContributionAmountNumber = Number(ContributionAmount);
  try {
    // Reference the team document
    const userRef = db.collection('Users').doc(userUid);

    // Fetch the team document
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userData = userSnapshot.data();
    const currentTotal = userData.totalContributions;

    // Update total contributions
    await userRef.update({
      totalContributions: currentTotal + ContributionAmountNumber,
    });


    res.status(200).json({ message: 'User log updated successfully.' });
  } catch (error) {
    console.error('Error updating user log:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/goalDelete', async (req, res) => {
  const { teamName, goalTitle } = req.body;

  try {
    const teamRef = db.collection('Teams').doc(teamName);

    // Fetch the team document
    const teamSnapshot = await teamRef.get();
    const teamData = teamSnapshot.data();
    const goals = teamData.Goals || {};

    if (!goals[goalTitle]) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    delete goals[goalTitle];
    await teamRef.update({ Goals: goals });

    res.status(200).json({ message: `Goal "${goalTitle}" deleted successfully.` });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/getGoalLog', async (req, res) => {
  const { teamName } = req.body;

  try {
    // Reference the team's document
    const teamRef = db.collection('Teams').doc(teamName);
    const teamSnapshot = await teamRef.get();

    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const teamData = teamSnapshot.data();
    const goalLog = teamData.goalLog;

    res.status(200).json({ goalLog });
  } catch (error) {
    console.error('Error fetching goal log:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/addNotification', async (req, res) => {
  const { teamName, message } = req.body;

  try {
    // Reference the team document
    const teamRef = db.collection('Teams').doc(teamName);

    // Fetch the team document
    const teamSnapshot = await teamRef.get();
    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const timestamp = new Date();

    // Create the notification object
    const notification = {
      message: message,
      timestamp: timestamp, 
    };

    // Update the notifications array
    const teamData = teamSnapshot.data();
    const updatedNotifications = teamData.notifications;
    updatedNotifications.push(notification);

    await teamRef.update({
      notifications: updatedNotifications,
    });

    res.status(200).json({ message: 'Notification added successfully.' });
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/getNotifications', async (req, res) => {
  const { teamName } = req.body;

  if (!teamName) {
    return res.status(400).json({ error: 'Team name is required.' });
  }

  try {
    const teamRef = db.collection('Teams').doc(teamName);
    const teamSnapshot = await teamRef.get();

    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const teamData = teamSnapshot.data();
    const notifications = teamData.notifications;

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
