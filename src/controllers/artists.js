const { Client, Function: Fn, Call, Create, Collection } = require('faunadb');
const { Artist } = require('../models/Artist');
const db = new Client({secret: process.env.FAUNA_SECRET});

module.exports.getArtistById = async (id) => {
  let doc = db.query(
    Call(Fn("getArtistBySpotifyId"), id)
  ).catch(printErrors);

  return doc;
}

/**
 * Fetch Artist Document References
 * @param {Artist[]} artists 
 * @returns {Refs[]} Array of Artist document References
 */
module.exports.getArtistRefs = async (artists) => {
  let refs = [];
  for(let artist of artists) {
    let doc;
    doc = await this.getArtistById(artist.id);

    if(!doc) {
      let newArtist = new Artist(
        artist.id,
        artist.name,
        artist.external_urls.spotify,
      );
      
      let newDoc = await this.saveArtist(newArtist);
      doc = newDoc.ref;
    }

    refs.push(doc);
  }

  return refs;
}


/**
 * Saves a new Artist in FaunaDB.
 */
module.exports.saveArtist = async (artist) => {
  let data = {
    spotify_id: artist.id,
    name: artist.name,
    url: artist.url,
  }

  return db.query(
    Create(Collection('artists'), { data })
  ).catch(printErrors);
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