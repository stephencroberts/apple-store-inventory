'use strict'

let AWS = require('aws-sdk')
let sns = new AWS.SNS()
let http = require('http')

// Send notification to SNS topic
function notify(store, part, cb) {

  let storeName = store.storeName
  part = store.partsAvailability[part]

  var params = {
    Message: `${part.storePickupProductTitle} ${part.partNumber} is ${part.pickupDisplay} at ${storeName}!`,
    TopicArn: process.env.SERVERLESS_TOPIC_ARN
  }

  sns.publish(params, cb)
}

module.exports.handler = function(event, context, cb) {

  // Parse config
  let stores = process.env.SERVERLESS_STORE.split(',')
  let parts = process.env.SERVERLESS_PART_NUMBER.split(',')
  let location = process.env.SERVERLESS_LOCATION

  // Query for each part
  let cbCount = 0
  parts.map(part => {

    cbCount++

    let url = `http://www.apple.com/shop/retail/pickup-message?parts.0=${part}&location=${location}&little=true`
    
    http.get(url, (res) => {
      
      // Accumulate response
      var body = ''
      res.on('data', chunk => body += chunk )

      // Once response is ready...
      res.on('end', () => {

        // Attempt to parse response as json
        var response
        try {
          response = JSON.parse(body)
        } catch (err) {
          console.error(err)
        }

        // Filter stores by the ones defined in the config
        var queryStores = response.body.stores
        queryStores = queryStores.filter(store => stores.indexOf(store.storeNumber) !== -1)

        // Check each stores' inventory
        queryStores.map(store => {

          // Check each part's availability
          let parts = store.partsAvailability
          for (let part in parts) {

            let status = parts[part].pickupDisplay
            if (status == 'available') {

              // Increase callback count (another async call)
              cbCount++

              // Send notification
              notify(store, part, (err, result) => {
                if (err) console.error(err)

                // Exit after all callbacks have completed
                if (--cbCount == 0) {
                  cb(null)
                }
              })
            }
          }
        })

        // Exit after all callbacks have completed
        if (--cbCount == 0) {
          cb(null)
        }
      })
    }).on('error', function(err){
        console.error(err)

        // Exit after all callbacks have completed
        if (--cbCount == 0) {
          cb(null)
        }
    })
  })
}
