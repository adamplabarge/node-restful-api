/*
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

// Container for the module
const lib = {}

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // try to open the file
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data)

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing new file')
                        }
                    })
                } else {
                    callback('Error writing to new file')
                }
            })
        } else {
            callback('Could not create new file, it may aleady exist')
        }
    })
}

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data) =>{
        if (!err && data) {
            let parsedData = helpers.parseJsonToObject(data)
            callback(false, parsedData)
        } else {
            callback(err, data)
        }
    })
}

// Update data
lib.update = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data)

            // Truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if (!err) {
                    // Write to file and close it
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false)
                                } else {
                                    callback('Error closing the file')
                                }
                            })
                        } else [
                            callback('Error writing to file')
                        ]
                    })
                } else {
                    callback('Error truncating data')
                }
            })
        } else {
            callback('Could not open the file for update.')
        }
    })
}

// Delete the file
lib.delete = (dir, file, callback) => {
    // Unlink
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false)
        } else {
            callback('Error deleting the file')
        }
    })
}

// Export
module.exports = lib