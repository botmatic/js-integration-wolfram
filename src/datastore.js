const debug = require('debug')('botmatic:datastore')
const Datastore = require('@google-cloud/datastore')
const fs = require('fs')
const googleKeyFile = '/tmp/google-account.json'
const keyname = 'Wolfram'

const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '../.env')
})

fs.writeFileSync('/tmp/google-account.json', process.env.GOOGLE_APPLICATION_CREDENTIALS)

const datastore = new Datastore({
  projectId: process.env.GOOGLE_PROJECT_ID,
  namespace: process.env.GOOGLE_DATASTORE_NS,
  keyFilename: googleKeyFile
})

const taskKey = datastore.key([keyname])

let botmaticDatastore = {}

/**
 * Find Wolfram row in datastore by Botmatic token
 * @param  {String} token Botmatic integration token
 * @return {Promise} resolve object or null
 */
botmaticDatastore.getEntityDataByKey = (token) => {
  return new Promise((resolve) => {
    const query = datastore.createQuery(keyname)
      .filter('token', '=', token)
      .limit(1)

    datastore
      .runQuery(query)
      .then(results => {
        if (results && results.length > 0 && results[0].length > 0) {
          resolve(results[0][0])
        } else {
          resolve(null)
        }
      })
      .catch(err => {
        console.error(`ERROR retrieving key ${keyname} from datastore: `, err)
        resolve(null)
      })
  })
}

botmaticDatastore.save = (entityData, token, value) => {
  return new Promise((resolve) => {
    var entity = {
      key: taskKey
    }

    // Construct data to save in datastore
    if (entityData) {
      entityData.value = value
      entity.data = entityData
    } else {
      entity.data = {
        token,
        value
      }
    }

    // Saves the entity
    datastore
      .save(entity)
      .then(() => {
        debug(`Saved ${JSON.stringify(entity.key)}: ${JSON.stringify(entity.data)}`)
        resolve({ success: true })
      })
      .catch(err => {
        console.error('ERROR:', err)
        resolve({ success: false, error: err })
      })
  })
}

module.exports = botmaticDatastore
