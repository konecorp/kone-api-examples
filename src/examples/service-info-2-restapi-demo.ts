import * as dotenv from 'dotenv'
dotenv.config()
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { fetchAccessToken, fetchResources, validateClientIdAndClientSecret } from '../common/koneapi'
import { fetchServiceOrdersList, fetchSingleServiceOrder } from '../common/service-info-2-functions'

/**
 * Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

/**
 * Demo the Service Info API by fetching list of service orders and detail of a order for the equipment
 */
const demoServiceInfoApi = async (accessToken: string, targetEquipmentId: string) => {
  // Acquire access token with needed scope to fetch service order information
  const scopes = [`serviceinfo/${targetEquipmentId}`]
  accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)
 
  // Fetch list of all service orders
  let serviceOrdersList
  console.log(`Fetch list of service orders for the equipment ${targetEquipmentId}`)
  serviceOrdersList = await fetchServiceOrdersList(accessToken, targetEquipmentId)
  console.log(serviceOrdersList)

  // Fetch detail of the first service order from the list
  if (!serviceOrdersList) {
    console.log('There is nothing in the service orders list, stop fetching details of a service order')
    return
  }
  const { workOrderNumber } = serviceOrdersList[0]
  console.log(`Fetch details of the service order id ${workOrderNumber} for the equipment ${targetEquipmentId}`)
  const singleServiceOrder = await fetchSingleServiceOrder(accessToken, targetEquipmentId, workOrderNumber)
  console.log(singleServiceOrder)
}

/**
 * Main function to start the script execution
 */
const start = async () => {
  validateClientIdAndClientSecret(CLIENT_ID, CLIENT_SECRET)

  // Fetch the first token which will by default contain application/inventory scope for our use in the next request
  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET)
  console.log('AccessToken successfully fetched')
  
  // Fetch equipments to which the user has access to 
  const equipments = await fetchResources(accessToken, 'ken')
  console.log('List of accessible equipments:', equipments)
  
  const targetEquipmentId = equipments[0]
  await demoServiceInfoApi(accessToken, targetEquipmentId)
  
}

start()
