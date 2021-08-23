module.exports.Track = class {
  constructor(data) {
    this.name = data.name;
    this.img = data.img;
    this.spotify_id = data.id;
    this.artists = data.artists;
    this.isrc = data.isrc;
  }
}