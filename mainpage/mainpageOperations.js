/**
 * @deprecated Legacy module.
 * This file is outside the canonical MVP runtime path.
 * Canonical runtime is app.js.
 */

/* Main Page Controllers */
const { getListings } = require('./getListings.js');
const { getPreferences } = require('./getPreferences.js');
const { searchListings } = require('./searchListings.js');
const { getSavedListings } = require('./getSavedListings.js');
/* UC-03 */
/* Query 1: Gets the input `userid`'s preference value, `user_preference_value` */
/* Query 2: Gets listings with the input `preferenceid` set from `preferenceids`
    This will be done by 
        1) Get the `userid` and `preferenceids` from all of the listings from the created listings
        2) Check if `preferenceid` is within each listing's `preferenceids`
        3) Count the listings that has the comparison successful, and return the array
    */
/* Query 3: From the array of listings from Query 2, use each of their `userid` to get from
    their preferences with the input `preferenceid` to get a list of `listing_preference_value`s */
/* Count the listings of `listing_preference_value` with the same as `user_preference_value` */
/* Return JSON of listings that hold these comparisons. */

module.exports = {
    getListings,
    getPreferences,
    searchListings,
    getSavedListings
};