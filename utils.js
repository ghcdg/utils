const path = require('path');
const fs = require('fs');
const { error } = require('console');

/**
 * sleep function
 * @param {number} [millisecond = 0] - the time in milliseconds that want to sleep
 * @return {Promise} Promise object with the value of the input param
 */
async function sleep(millisecond = 0) {
    return new Promise((rs) => setTimeout(rs, millisecond));
}

/**
 * construct absolute path and return
 * @return {string} absolute path
 */
function resolvePath() {
    return path.resolve.apply(global, arguments).split(path.sep).join('/')
}


/**
 * Asynchronous get the path list in a specified directory
 * @param {string} dirPath - directory path
 * @returns {array} all path in the first layer of the folder
 */
async function readDir(dirPath) {
    let list = [];

    await new Promise((resolve, reject) => {     
        fs.readdir(dirPath, (err, files) => {
            if (err) return reject(err);
            return resolve((list = files));
        });
    })
    .catch(err => console.log(err));

    return list;
}


/**
 *
 *
 * @param {*} [firstArr=[]]
 * @param {*} [lastArr=[]]
 * @param {} caseSensitive boolean type, true or false, default value is false
 * @returns
 */
function arrayDiff(firstArr = [], lastArr = [], caseSensitive = false) {
    let objDiff = {
        share: new Set(),
        firstArrUnique: new Set(),
        lastArrUnique: new Set()
    };

    firstArr = caseSensitive ? firstArr : firstArr.map(ele => ele.toLocaleLowerCase());
    lastArr = caseSensitive ? lastArr : lastArr.map(ele => ele.toLocaleLowerCase());

    firstArr.forEach(ele => {
        lastArr.includes(ele) ? objDiff.share.add(ele) : objDiff.firstArrUnique.add(ele);
    });

    lastArr.forEach(ele => {
        firstArr.includes(ele) ? objDiff.share.add(ele) : objDiff.lastArrUnique.add(ele);
    });

    return objDiff;
}

module.exports = {
    sleep,
    resolvePath,
    readDir,
    arrayDiff,
}