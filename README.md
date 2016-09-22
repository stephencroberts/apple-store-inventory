Apple Store Inventory
=====================

Get notifications when Apple products become available in your local store(s).

# Overview
Waiting impatiently for that new iPhone? You can use this script to get notified the minute it comes in stock and avoid the wait! This script is written using [serverless](http://serverless.com) and deploys to AWS Lambda and SNS. A scheduled event fires the Lambda function every minute to check the stock of your local store(s) for the products you're interested in and publishes a notification to an SNS topic when one becomes available. 

# Prerequisites
- AWS Account
- npm

# Usage

1. Clone this repo
2. Run `npm install` to install dependencies
3. Run `serverless project install` to set up the project
4. Configure `_meta/variables/s-variables-common.json` (see [Configuration](#configuration))
5. Run `serverless dash deploy` to deploy all of the resources

# Configuration

Here's a sample `s-variables-common.json` file:

```
{
  "project": "apple-inventory",
  "store": [
    "R235"
  ],
  "partNumber": [
    "MN5L2LL/A",
    "MN5R2LL/A",
    "MN5G2LL/A",
    "MN5M2LL/A",
    "MN572LL/A",
    "MN5F2LL/A",
    "MN522LL/A",
    "MN592LL/A"
  ],
  "location": "70119",
  "topicArn": "arn:aws:sns:us-east-1:xxxxxxxxxxxx:apple-inventory-prod"
}
```

## Options

Option | Type | Description
--- | --- | ---
store | String, Array | List of stores to check
partNumber | String, Array | List of product part numbers
location | String | Zip or City/State
topicArn | String | AWS ARN of the SNS topic

The only way I know to get the store number is by looking at the API call on Apple's website when you check product availability. Part numbers for new iPhone's can be found at https://www.techwalls.com/iphone-7-plus-model-differences/. The `topicArn` can be found in the AWS Console. 
