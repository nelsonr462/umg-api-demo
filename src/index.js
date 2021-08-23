const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const Spotify = require('./utils/spotify');
const tracks = require('./controllers/tracks');
const validators = require('./utils/validators');

Spotify.initSpotifyApi();
app.use(express.json());

// Write Track Endpoint
app.post('/addTrack', validators.isrc, tracks.writeTrack);

// Read Track Endpoints
app.get('/track/:isrc.json', validators.isrc, tracks.getTrack)
app.get('/tracks', validators.artist, tracks.getTracks);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})




