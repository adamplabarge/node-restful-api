/*
 * These are the request handlers
 */

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')

// Define the handlers 
const handlers = {};

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405)
    }
}

// Container for the users submethods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
    // Check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false

console.log(firstName, lastName, phone, password, tosAgreement)

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // Hash the password
                let hashPassword = helpers.hash(password)

                // Create the user object
                if (hashPassword) {
                    let userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashPassword' : hashPassword,
                        'tosAgreement' : true
                    }

                    // Store the user
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {'Error' : 'Could not create new user'})
                        }
                    })
                } else {
                    callback(500, {'Error' : 'Unable to hash password'})
                }
            } else {
                // User with phone number already exit
                callback(400, {'Error' : 'User with that phone number already exist'})
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'})
    }
}

// Users - get
// Required data: phone
// Optional data: none
// @TODO only let authenticated users access their own objects
handlers._users.get = (data, callback) => {
    // Check that the phone number provided is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone : false
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove hashed password from the user object before returning
                delete data.hashPassword
                callback(200, data)
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'})
    }
}

// Users - put
// Required data : phone
// Options data : firstName, lastName, password (at least one must be specified)
// @TODO only let an authenticated user update their own object
handlers._users.put = (data, callback) => {
    // check for required filed
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone : false

    // check for options fields
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false

    // error if phone is invalid in all cases
    if (phone) {
        if (firstName || lastName || password) {
            // lookup user
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    // update the fields necessary
                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (password) {
                        userData.hashPassword = helpers.hash(password);
                    }
                    // store new updates
                    _data.update('users', phone, userData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.lor(err);
                            callback(500, {'Error': 'Could not update the user.'});
                        }
                    })
                } else {
                    callback(404, {'Error': 'Specified user does not exist.'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field to update.'});
        }
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
}

// Users - delete
handlers._users.delete = (data, callback) => {
    
}

handlers.notFound = (data, callback) => {
    callback(404)
}

// ping handler
handlers.ping = (data, callback) => {
    callback(200)
}

module.exports = handlers;