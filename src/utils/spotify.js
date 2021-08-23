require('dotenv').config('../../.env');
const fetch = require('node-fetch');
const SpotifyWebApi = require('spotify-web-api-node');
const MAX_RETRIES = 3;
let SpotifyApi;
let retries = MAX_RETRIES;

module.exports.initSpotifyApi = async () => {
  SpotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  
  this.refreshToken();
}

module.exports.refreshToken = async () => {
  let headerCredentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  
  try {
    // Get Access Token
    let getToken = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${headerCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    let response = await getToken.json();
    if(!response.access_token) throw new Error("Spotify Authorization Failed");
    
    return SpotifyApi.setAccessToken(response.access_token);
  } catch (error) {
    console.log(error);
    return false;  
  }
}

module.exports.searchByISRC = async(isrc) => {
  try {
    let queryString = `isrc:${isrc}`;
    const songSearch = await SpotifyApi.searchTracks(queryString);
    
    if(songSearch.body.tracks.items.length < 1) {throw new Error("Song not found")};

    resetRetries();
    
    return songSearch.body.tracks.items;
  } catch (error) {
    if(error.statusCode === 401) {
      await this.refreshToken();
      if(getRetries > 0) {
        useRetry();
        console.log(`Retrying request with refreshed token.. (Attempt ${3 - getRetries()}/${MAX_RETRIES})`);
        return await this.searchByISRC(isrc);
      }
    }
  }
}

getRetries = () => {
  return retries;
}

resetRetries = () => {
  retries = MAX_RETRIES;
}

useRetry = () => {
  retries -= 1;
}