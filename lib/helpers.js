/*
 * Helpers for various task
 */

// Dependencies
const crypto = require('crypto')
const config = require('./config')

// Container for all the helpers
const helpers = {};

// Create a SHA256 has
helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
        return hash
    } else {
        return false
    }
}

// Parse a JSON string to an object in all cases w/o throwing error
helpers.parseJsonToObject = (str) => {
    try{
        let obj = JSON.parse(str)
        return obj
    } catch (e) {
        return {}
    }
}

// Export the module
module.exports = helpers