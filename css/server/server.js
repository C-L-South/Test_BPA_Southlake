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
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    //create user on auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });
    //add user on firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      role: 'customer',
      status: 'no team',
      team: 'no team'
    });
    //return success
    res.status(201).json({ message: 'Signup successful', userId: userRecord.uid });
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

// Route to login command
app.post('/login', async (req, res) => {
    const { idToken } = req.body;
  
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken); //returns authentication info
      const uid = decodedToken.uid; //gets the uid from it
  
      const userRecord = await admin.auth().getUser(uid); //it gets the full user info
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        res.status(404).json({ message: 'User data not found in Firestore.' });
        return;
     }

  
      res.status(200).json({
        message: 'Login successful',
        user: {
          uid: userRecord.uid, //gets uid
          email: userRecord.email,//gets info
          status: userDoc.data().status //gets status aka no_team, leader, etc
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
      Members: []
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
  const { userId, inviteId, teamName } = req.body;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    if (userData.status !== 'no team') {
      return res.status(400).json({ error: 'You have already joined or created a team.' });
    }

    // Add user to the team
    await db.collection('teams').doc(teamName).update({
      Members: admin.firestore.FieldValue.arrayUnion(userData.email)
    });
    await db.collection('users').doc(userId).update({
      status: 'team member',
      team: teamName
    });
    const invitesSnapshot = await db.collection('invites').where('InviteTo', '==', userData.email).get();

    if (!invitesSnapshot.empty) {
      const batch = db.batch();

      // Delete all invites
      invitesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    return res.status(200).json({ message: `Successfully joined team ${userId}.` });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/declineInvite/:inviteId', async (req, res) => {
  const { inviteId } = req.params;

  try {
    await db.collection('invites').doc(inviteId).delete();
    return res.status(200).json({ message: 'Invite declined.' });
  } catch (error) {
    console.error('Error declining invite:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
