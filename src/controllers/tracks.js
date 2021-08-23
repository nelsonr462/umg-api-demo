require('dotenv').config('../../.env');
const Spotify = require('../utils/spotify');
const { validationResult } = require('express-validator');
const { Track } = require('../models/Track');
const artist = require('./artists');
const { Client, Function: Fn, Call, Create, Collection } = require('faunadb');
const db = new Client({secret: process.env.FAUNA_SECRET});

// To catch/print validation errors
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
}
/**
 * Write Track
 * @param {Request} req // Express Request Object 
 * @param {Response} res // Express Response Object
 */
module.exports.writeTrack = async ( req, res, next ) => {
  const result = validationResult(req).formatWith(errorFormatter);
  if(!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }

  // Fetch Spotify Data
  let tracks = await Spotify.searchByISRC(req.body.isrc);

  // Sort tracks by popularity (highest to lowest)
  tracks.sort((a, b) => { return b.popularity - a.popularity });

  // Get Artists
  let artistRefs = await artist.getArtistRefs(tracks[0].artists);

  // Organize Data
  let data = {
    name: tracks[0].name,
    artists: artistRefs,
    img: tracks[0].album.images[0],
    spotify_id: tracks[0].id,
    isrc: tracks[0].external_ids.isrc
  }

  let newTrack = new Track(data);
  
  // Write to DB
  res.send(await saveTrack(newTrack));
};

/**
 * Get Track By ISRC
 * @param {Request} req // Express Request Object
 * @param {Response} res // Express Response Object
 */
module.exports.getTrack = async (req, res) => {
  const result = validationResult(req).formatWith(errorFormatter);
  if(!result.isEmpty()) {
    return res.status(400).json({errors: result.array()});
  }

  let doc = await getTrackByISRC(req.params.isrc);

  return res.json(doc) || res.json({ message: `Track ${req.params.isrc} not found.` }) 
};

/**
 * Get Tracks By Artist
 * @param {Request} req // Express Request Object
 * @param {Response} res // Express Response Object
 */
module.exports.getTracks = async (req, res) => {
  const result = validationResult(req).formatWith(errorFormatter);
  if(!result.isEmpty()) {
    return res.status(400).json({errors: result.array()});
  }

  let results = await db.query(
    Call(Fn("getTracksByArtistName"), req.query.artist)
  ).catch(printErrors);

  return res.json(results) || res.json({ message: `No results found for artist "${req.body.artist}".` }) 

};

/**
 * Fetches track document by ISRC
 * @param {String} isrc 
 * @returns FaunaDB Ref for matching document or errors
 */
async function getTrackByISRC (isrc) {
  let doc = await db.query(
    Call(Fn("getTrackByISRC"), isrc)
  ).catch(printErrors);
  
  return doc;
}
/**
 * Saves a new Track document
 * @param {Track} track 
 * @returns {*} New Ref for Track document in FaunaDB or error message
 */
async function saveTrack(track) {
  // Check if track document already exists
  let doc = await getTrackByISRC(track.isrc);

  if(!doc) {
    // Track doesn't exist, proceed with new document save
    let data = {
      spotify_id: track.spotify_id,
      name: track.name,
      artists: track.artists,
      img: track.img,
      isrc: track.isrc
    }
    
    return db.query(
      Create(Collection('tracks'), { data })
    ).catch(printErrors);
  } else {
    // Track exists, skip save
    return { message: `Track for ISRC already exists.` };
  }
}

/**
 * Formats and prints top-level error from FaunaDB.
 * @param {*} response Error response from FaunaDB 
 */
function printErrors(response) {
  let errors = JSON.parse(response.requestResult.responseRaw).errors;
  if(errors[0].cause[0].code !== 'instance not found') {
    console.log(errors[0].cause);
  }
}