const request = require('request')
const botmaticDatastore = require('./src/datastore')
const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '.env')
})
const settingsPath = '/settings'
const botmatic = require('@botmatic/js-integration')({
  port: 3100,
  auth: async (token) => {
    return new Promise(async (resolve, reject) => {
      const entityData = await botmaticDatastore.getEntityDataByKey(token)

      if (entityData) {
        resolve(entityData)
      } else {
        reject('Unknown token: ' + entityData)
      }
    })
  }
})

botmatic.onAction('parse', ({ data, auth }) => {
  return new Promise((resolve, reject) => {
    queryWolfram(resolve, reject, data.data.last_user_message, auth.client.value)
  })
})

const queryWolfram = (resolve, reject, text, wolframKey) => {
  const query = process.env.WOLFRAM_ENDPOINT +
    '?appid=' + wolframKey +
    '&i=' + encodeURIComponent(text)

  request.get(query, {}, function (err, res, body) {
    if (err) {
      reject(err)
    }
    if (res.statusCode === 200) {
      resolve({ data: JSON.parse(res.body), type: 'data' })
    }
  })
}

botmatic.onSettingsPage(settingsPath, async (token) => {
  // Move in global to do it once.
  // Just here for testing
  const Mustache = require('mustache')
  const fs = require('fs')
  const tplBuffer = fs.readFileSync(path.join(__dirname, '/views/fields.html'))
  const tplStr = tplBuffer.toString('utf8')

  // Find API key by token.
  const entity = await botmaticDatastore.getEntityDataByKey(token)
  let tpl

  // If exists, inject in template.
  if (entity) {
    tpl = Mustache.render(tplStr, { value: entity.value })
  } else {
    tpl = Mustache.render(tplStr, { value: '' })
  }

  return Promise.resolve(tpl)
})

// botmatic.onUpdateSettings(settingsPath, (token, data) => {
//   // Validate data
//   // Store them
//   // Resolve sucess to true or false
//   return Promise.resolve({ success: true })
// })

botmatic.onUpdateSettings(settingsPath, function (token, data) {
  return new Promise(async (resolve) => {
    // Check if API key is given.
    if (data.wolfram_key) {
      // Get entity by token.
      let entity = await botmaticDatastore.getEntityDataByKey(token)
      const res = await botmaticDatastore.save(entity, token, data.wolfram_key)
      resolve(res)
    } else {
      resolve({
        success: false,
        errorFields: {
          wolfram_key: 'You need a valid key to continue'
        }
      })
    }
  })
})
