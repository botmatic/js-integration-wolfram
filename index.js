const request = require('request')
const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '/.env')
})
const botmatic = require('@botmatic/js-integration')({
  port: 3100
})

const settingsPath = '/settings'

botmatic.onAction('parse', ({ client, data }) => {
  console.log(data)
  return new Promise((resolve, reject) => {
    console.log(data.data.last_user_message)
    queryWolfram(resolve, reject, data.data.last_user_message)
    // resolve({ data: { key: 'value' }, type: 'data' })
  })
})

const queryWolfram = (resolve, reject, text) => {
  const query = process.env.WOLFRAM_ENDPOINT +
        '?appid=' + process.env.WOLFRAM_KEY +
        '&i=' + encodeURIComponent(text)

  console.log(query)
  request.get(query, {}, function (err, res, body) {
    if (err) {
      reject(err)
    }
    if (res.statusCode === 200) {
      console.log(JSON.parse(res.body))
      resolve({ data: JSON.parse(res.body), type: 'data' })
    }
  })
}

botmatic.onSettingsPage(settingsPath, async (token) => {
  // Move in global to do it once.
  // Just here for testing
  const Mustache = require('mustache')
  const fs = require('fs')
  const resBuf = fs.readFileSync(path.join(__dirname, '/views/fields.html'))
  const resStr = resBuf.toString('utf8')

  var tpl = Mustache.render(resStr, { value: '' })
  return Promise.resolve(tpl)
})

// botmatic.onUpdateSettings(settingsPath, (token, data) => {
//   // Validate data
//   // Store them
//   // Resolve sucess to true or false
//   return Promise.resolve({ success: true })
// })

botmatic.onUpdateSettings(settingsPath, function (token, data) {
  return Promise.resolve({
    success: false,
    errorFields: {
      wolfram_key: 'Field required'
    }
  })
})
