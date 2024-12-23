const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');


const serviceAccount = require('./serviceAccountKey.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors()); 

// Route to sign up command
// Route to handle signup via server-side
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Create user on Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // Add user in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      role: 'customer',
      status: 'no team',
      team: 'no team'
    });

    // Return success
    res.status(201).json({ message: 'Signup successful', userId: userRecord.uid });
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});


// Route to handle login via server-side
app.post('/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
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
        status: userData.status,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});


  

// Route to promote a user to admin
app.post('/promote', async (req, res) => {
  const { userId, email } = req.body;

  try {
    const customerRef = db.collection('customers').doc(userId);
    const adminRef = db.collection('administrators').doc(userId);

    await customerRef.delete();
    await adminRef.set({
      email: email,
      role: 'administrator',
    });

    res.status(200).json({ message: `User ${email} promoted to admin` });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Promotion failed', error: error.message });
  }
});

app.post('/createTeam', async (req, res) => {
  const { userId, teamName } = req.body;

  if (!userId || !teamName) {
    return res.status(400).json({ error: 'User ID and Team Name are required.' });
  }

  try {
    // Fetch user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    if (userData.status !== 'no team') {
      return res.status(400).json({ error: 'You have already created or joined a team.' });
    }

    // Check if team already exists
    const teamDoc = await db.collection('teams').doc(teamName).get();
    if (teamDoc.exists) {
      return res.status(400).json({ error: 'Team name already exists.' });
    }

    // Create the team and update user status
    await db.collection('teams').doc(teamName).set({
      Leader: userData.email,
      Members: [],
      Goals: []
    });
    await db.collection('users').doc(userId).update({
      status: 'team leader',
      team: teamName
    });
    
    return res.status(201).json({ message: 'Team created successfully.' });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/getInvites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    const invitesSnapshot = await db.collection('invites').where('InviteTo', '==', userData.email).get();

    const invites = [];
    invitesSnapshot.forEach((doc) => {
      invites.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/sendInvite', async (req, res) => {
  const { inviterId, inviteTo, teamName } = req.body;

  if (!inviterId || !inviteTo || !teamName) {
      return res.status(400).json({ error: 'Inviter ID, Invite Email, and Team Name are required.' });
  }

  try {
      // Check if the invitee exists as a customer
      const userSnapshot = await db.collection('users').where("email", "==", inviteTo).get();
      if (userSnapshot.empty) {
          return res.status(404).json({ error: 'No user found with that email.' });
      }
      const userDoc = userSnapshot.docs[0];
      if(userDoc.data().status !== 'no team'){
        return res.status(400).json({ error: 'invited person has already joined a team' });
      }

      // Check for duplicate invites
      const invitesSnapshot = await db.collection('invites')
          .where("InviteTo", "==", inviteTo)
          .where("TeamName", "==", teamName)
          .get();

      if (!invitesSnapshot.empty) {
          return res.status(400).json({ error: 'An invite to this person for this team already exists.' });
      }

      // Create the invite
      await db.collection('invites').add({
          InviteTo: inviteTo,
          TeamName: teamName,
          InviterId: inviterId,
      });

      return res.status(201).json({ message: 'Invite sent successfully!' });
  } catch (error) {
      console.error('Error sending invite:', error);
      return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/acceptInvite', async (req, res) => {
  const { userId, inviteId } = req.body;

  try {
    // Fetch user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    if (userData.status !== 'no team') {
      return res.status(400).json({ error: 'You have already joined or created a team.' });
    }

    // Fetch invite document
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found.' });
    }

    const inviteData = inviteDoc.data();
    const teamName = inviteData.TeamName;

    // Add user to the team
    const teamRef = db.collection('teams').doc(teamName);
    const teamDoc = await teamRef.get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Update the team with the new member
    await teamRef.update({
      Members: admin.firestore.FieldValue.arrayUnion(userData.email)
    });

    // Update the user's status
    await db.collection('users').doc(userId).update({
      status: 'team member',
      team: teamName
    });

    // Delete all invites for the user (since they've joined a team)
    const invitesSnapshot = await db.collection('invites').where('InviteTo', '==', userData.email).get();
    if (!invitesSnapshot.empty) {
      const batch = db.batch();
      invitesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return res.status(200).json({ message: `Successfully joined team ${teamName}.` });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.delete('/declineInvite/:inviteId', async (req, res) => {
  const { inviteId } = req.params;

  try {
    const inviteRef = db.collection('invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found.' });
    }

    await inviteRef.delete();
    return res.status(200).json({ message: 'Invite declined.' });
  } catch (error) {
    console.error('Error declining invite:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/setGoal', async (req, res) => {
  const { teamName, goalDescription, target, dueDate } = req.body;

  // Check if all required fields are provided
  if (!teamName || !goalDescription || !target || !dueDate) {
    return res.status(400).json({ error: 'Team Name, Goal Description, Target, and Due Date are required.' });
  }

  try {
    // Fetch the team document
    const teamRef = db.collection('teams').doc(teamName);
    const teamDoc = await teamRef.get();

    // Check if the team exists
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Generate a unique goal ID
    const newGoalId = db.collection('teams').doc().id;

    // Create a new goal object without the tags field
    const newGoal = {
      goalId: newGoalId,  // Store the generated goal ID
      description: goalDescription,
      target: target,
      dueDate: dueDate,
      progress: 0,  // Initially, the progress is zero
      remaining: target, // Initially, remaining equals target
    };

    // Update the team document by adding the new goal to the 'Goals' array
    await teamRef.update({
      Goals: admin.firestore.FieldValue.arrayUnion(newGoal)
    });

    res.status(200).json({ message: 'Goal has been added to the team!', goalId: newGoalId });
  } catch (error) {
    console.error('Error adding goal to the team:', error);
    res.status(500).json({ error: 'Error adding goal to the team' });
  }
});



app.post('/addContribution', async (req, res) => {
  const { teamName, goalId, userId, contributionAmount } = req.body;

  // Validate input fields
  if (!teamName || !goalId || !userId || !contributionAmount) {
    return res
      .status(400)
      .json({ error: 'Team Name, Goal ID, User ID, and Contribution Amount are required.' });
  }

  try {
    const teamRef = db.collection('teams').doc(teamName);

    // Fetch the team document
    const teamSnapshot = await teamRef.get();
    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const teamData = teamSnapshot.data();
    const goals = teamData.Goals || [];

    // Find the goal with the matching goalId
    const goalIndex = goals.findIndex(goal => goal.goalId === goalId);

    if (goalIndex === -1) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const goal = goals[goalIndex];

    const currentProgress = goal.progress || 0;
    const currentRemaining = goal.remaining || goal.target;

    // Ensure contribution does not exceed the remaining target
    if (contributionAmount > currentRemaining) {
      return res.status(400).json({ error: 'Contribution amount exceeds the remaining target.' });
    }

    // Update progress and remaining
    const updatedProgress = currentProgress + contributionAmount;
    const updatedRemaining = currentRemaining - contributionAmount;

    // Initialize or update the submissions object
    const submissions = goal.submissions || {};
    submissions[userId] = {
      contribution: (submissions[userId]?.contribution || 0) + contributionAmount,
      timestamp: new Date().toISOString(),
    };

    // Update the goal in the goals array
    goals[goalIndex] = {
      ...goal,
      progress: updatedProgress,
      remaining: updatedRemaining,
      submissions: submissions,
    };

    // Update the team document with the modified goals array
    await teamRef.update({
      Goals: goals,
    });

    res.status(200).json({ message: 'Contribution added successfully!' });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: error.message });
  }
});



app.post('/getGoals', async (req, res) => {
  const { userId } = req.body;

  // Validate input
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    // Fetch user data from Firestore
    const userSnapshot = await db.collection('users').doc(userId).get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'User document does not exist.' });
    }

    const userData = userSnapshot.data();
    const teamName = userData.team;

    console.log(`User is part of team: ${teamName}`);

    // Fetch team goals
    const teamSnapshot = await db.collection('teams').doc(teamName).get();
    if (!teamSnapshot.exists) {
      return res.status(404).json({ error: 'Team document does not exist.' });
    }

    const teamData = teamSnapshot.data();
    const goals = teamData.Goals || [];

    // Format response
    const formattedGoals = goals.map((goal) => ({
      goalId: goal.goalId,
      description: goal.description,
      dueDate: goal.dueDate,
      progress: goal.progress || 0,
      remaining: goal.remaining || 0,
      target: goal.target,
    }));

    res.status(200).json({
      teamName,
      goals: formattedGoals,
    });
  } catch (error) {
    console.error('Error fetching user data and goals:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post("/sendMessage", async (req, res) => {
  const { sender, teamId, recipient, message } = req.body;

  if (!sender || !teamId || !recipient || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists || !teamDoc.data().Members.includes(recipient)) {
      return res.status(400).json({ error: "Recipient is not a member of the team." });
    }

    await db.collection("teams").doc(teamId).collection("messages").add({
      sender: sender,
      recipient: recipient,
      message: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
