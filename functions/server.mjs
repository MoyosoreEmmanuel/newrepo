import { https } from 'firebase-functions';

export const nextServer = https.onRequest((req, res) => {
  console.log('Function triggered!');
  console.log('Request path:', req.path);
  console.log('Request headers:', req.headers);
  res.status(200).send('Hello from Firebase Function! Path: ' + req.path);
});
