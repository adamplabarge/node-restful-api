/*
 * These are the request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers 
const handlers = {};

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
    // Check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // Hash the password
                let hashPassword = helpers.hash(password);

                // Create the user object
                if (hashPassword) {
                    let userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashPassword' : hashPassword,
                        'tosAgreement' : true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err)
                            callback(500, {'Error' : 'Could not create new user'});
                        }
                    });
                } else {
                    callback(500, {'Error' : 'Unable to hash password'});
                }
            } else {
                // User with phone number already exit
                callback(400, {'Error' : 'User with that phone number already exist'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO only let authenticated users access their own objects
handlers._users.get = (data, callback) => {
    // Check that the phone number provided is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove hashed password from the user object before returning
                delete data.hashPassword
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - put
// Required data : phone
// Options data : firstName, lastName, password (at least one must be specified)
// @TODO only let an authenticated user update their own object
handlers._users.put = (data, callback) => {
    // check for required filed
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone : false;

    // check for options fields
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

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
                    });
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
};

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their own object.
// @TODO Cleanup any other associated files of user
handlers._users.delete = (data, callback) => {
    // Check that the phone number is valid
    // Check that the phone number provided is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove hashed password from the user object before returning
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete specified user.'});
                    }
                })
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Tokens
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all token methods
handlers._tokens  = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

    if (phone && password) {
        // lookup user who matches the phone number
        _data.read('users', phone, (err, userData) => {
            if (!err) {
                // Hash the sent passoword, and compare it to the password stored in the user object
                let hashPassword = helpers.hash(password);
                if (hashPassword == userData.hashPassword) {
                    // If valid create new token with a random name. Set exp date 1 hour in future
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create new token.'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Password did not match.'});
                }
            } else {
                callback(404, {'Error': 'Not found.'});
            }
        });

    } else {
        callback(400, {'Error': 'Missing required fields.'});
    }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
        // Check that the id is valid
        let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;
        if (id) {
            // Lookup the user
            _data.read('tokens', id, (err, data) => {
                if (!err && data) {
                    callback(200, data);
                } else {
                    callback(404);
                }
            })
        } else {
            callback(400, {'Error' : 'Missing required field'});
        }
}

// Tokens - put
handlers._tokens.put = (data, callback) => {

}

// Tokens - delete
handlers._tokens.delete = (data, callback) => {
    
}
 
handlers.notFound = (data, callback) => {
    callback(404);
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

module.exports = handlers;