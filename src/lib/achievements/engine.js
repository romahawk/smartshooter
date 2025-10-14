/**
 * @typedef {"accuracy"|"streak"|"volume"|"type"} BadgeCategory
 *
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {BadgeCategory} category
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {number} unlockedAt
 * @property {Object<string, any>=} details
 *
 * @typedef {Object} SessionLite
 * @property {string} date          // YYYY-MM-DD or ISO
 * @property {number} shotsMade
 * @property {number} shotsAttempted
 * @property {"catch_and_shoot"|"off_the_dribble"|"spot_shooting"|"other"=} type
 */
