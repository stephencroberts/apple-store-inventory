'use strict'

let AWS = require('aws-sdk')
let http = require('http')
let sns = new AWS.SNS()

/**
 * Send notification to the SNS topic
 *
 * @param {String} storeName Store name
 * @param {String} productName Product name
 * @param {String} partNumber Part number
 * @param {String} Status Availability status
 * @returns {Promise} Promise, fulfilled after SNS publish
 */
function notify(storeName, productName, partNumber, status) {

  // Create SNS params
  var params = {
    Message: `${productName} ${partNumber} is ${status} at ${storeName}!`,
    TopicArn: process.env.SERVERLESS_TOPIC_ARN
  }
  
  // Return a promise
  return new Promise((resolve, reject) => {

    // Publish message to the SNS topic
    sns.publish(params, (result, err) => {
      if (err) {
        reject(err)
      } else {
        console.log(params)
        resolve(result)
      }
    })
  })
}

/**
 * Lambda handler
 */
module.exports.handler = (event, context, cb) => {

  // Parse config
  let stores = process.env.SERVERLESS_STORE.split(',')
  let parts = process.env.SERVERLESS_PART_NUMBER.split(',')
  let location = process.env.SERVERLESS_LOCATION

  // Query for each part in the config
  let promises = []
  for (let part of parts) {

    // Construct query with desired part and location
    let url = `http://www.apple.com/shop/retail/pickup-message?parts.0=${part}&location=${location}&little=true`

    promises.push(new Promise((resolve, reject) => {

      http.get(url, (res) => {

        // Accumulate response
        let responseData = ''
        res.on('data', chunk => responseData += chunk )

        // Once response is ready...
        res.on('end', () => {

          let response
          try {
            response = JSON.parse(responseData)
          } catch (err) {
            return reject(err)
          }
          
          // Filter stores by the ones defined in the config
          var queryStores = response.body.stores
          queryStores = queryStores.filter(store => stores.indexOf(store.storeNumber) !== -1)

          // Check each stores' inventory
          let promises = []
          for (let store of queryStores) {
            
            // Check part availability and send notification
            let partDetails = store.partsAvailability[part]
            if (partDetails && partDetails.pickupDisplay == 'available') {
              promises.push(notify(store.storeName, partDetails.storePickupProductTitle, partDetails.partNumber, partDetails.pickupDisplay))
            }
          }

          // After all notifications have sent, fulfill this request
          Promise.all(promises).then((result) => {
            resolve(result)
          }).catch((err) => {
            reject(err)
          })
        })
      }).on('error', function(err){
        reject(err)
      })
    }))
  }

  // After all requests have been fulfilled
  Promise.all(promises).then((result) => {
    cb(null, "Done!")
  }).catch((err) => {
    console.log("TEST")
    console.error(err, err.stack)
    cb(err)
  })
}
