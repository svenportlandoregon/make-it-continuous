const fs = require('fs');
const path = require('path');
const parser = require('subtitles-parser');
const {
  getDefaultDirPath,
  handleDirOfSubs,
  writeSubToFile,
  getFileName,
  handleFile,
  processFile
} = require('./fs-utils');

/**
 *
 * @param {string} filePath - accepts a string with a path to the subtitle
 * @return {array} - returns an array of objects displaying the subtitle contents
 */
const processSubtitle = processedFile => {
  return new Promise((resolve, reject) => {
    if (processedFile) {
      let sub = parser.fromSrt(processedFile);
      resolve(sub);
    } else {
      reject(Error);
    }
  });
};

/**
 *
 * @param {object} preppedSub - fixed srt object to be turned into a bona-fide SRT file
 */
const convertSubToSrt = async preppedSub => {
  return await parser.toSrt(preppedSub);
};

/**
 *
 * @param {array} sub - Parsed subtitle ready for processing
 */
const normalizeSubtitle = async sub => {
  try {
    for (let i = 0; i < sub.length; i++) {
      for (let j = i + 1; j <= i + 1; j++) {
        if (sub[j] === undefined) break;
        const msCheckAndUpdate = await (() => {
          //save substring of MS for both preceeding start and end times
          let iMS = sub[i].endTime.substr(9, 3);
          let iSS = sub[i].endTime.substr(6, 2);
          let jMS = sub[j].startTime.substr(9, 3);
          let jSS = sub[j].startTime.substr(6, 2);

          if (iMS > jMS && iSS === jSS) {
            console.log(
              `iMS: ${iMS} should be the same as jMS: ${jMS}`
            );
            sub[i].endTime = sub[i].endTime.replace(/\d{3}/g, jMS);
          }
        })();
      }
    }
    const updatedSub = await sub;
    return updatedSub;
  } catch (Error) {
    console.log(Error);
  }
};

/**
 *
 * @param {object} sub - Parsed subtitle ready for processing
 */
const makeContinuous = async sub => {
  try {
    if (sub) {
      for (let i = 0; i < sub.length; i++) {
        for (let j = i + 1; j <= i + 1; j++) {
          if (sub[j] === undefined) break;
          const msCheckAndUpdate = await (() => {
            //save substring of MS for both preceeding start and end times
            let iMS = sub[i].endTime.substr(9, 3);
            let iSS = sub[i].endTime.substr(6, 2);
            let jMS = sub[j].startTime.substr(9, 3);
            let jSS = sub[j].startTime.substr(6, 2);

            //Updates iMS to match jMS if both are on same second
            if (iMS > jMS && iSS === jSS) {
              console.log(
                `iMS: ${iMS} should be the same as jMS: ${jMS}`
              );
              sub[i].startTime = sub[i].startTime.replace(
                /\d{3}/g,
                jMS
              );
            }

            if (iSS === jSS && iMS !== jMS) {
              console.log(
                `MS not equal, must change to be continuous`
              );
              sub[i].endTime = sub[j].startTime;
            }
            if (jSS - iSS <= 2) {
              console.log(`The second difference is <= 2, swap`);
              sub[i].endTime = sub[j].startTime;
            }
          })();
        }
      }
      const updatedSub = await sub;
      return updatedSub;
    }
  } catch (Error) {
    console.log(Error);
  }
};

const main = async subtitle => {
  try {
    const file = await processFile(subtitle);
    const sub = await processSubtitle(file);
    const msFixed = await normalizeSubtitle(sub);
    console.log('msFixed: ', msFixed);
    const madeContinuous = await makeContinuous(msFixed);
    console.log(madeContinuous);
    const srt = await convertSubToSrt(madeContinuous);
    const fileInfo = await handleFile(subtitle);
    console.log('fileInfo', fileInfo);
    const writeIt = await writeSubToFile(fileInfo, srt);
    return `success!`;
  } catch (Error) {
    console.log(Error, 'FUCK');
  }
};

module.exports = {
  processSubtitle,
  normalizeSubtitle,
  makeContinuous,
  convertSubToSrt,
  main
};
