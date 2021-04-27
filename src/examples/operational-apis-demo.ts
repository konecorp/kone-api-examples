import { isEmpty } from 'lodash'
import { fetchAccessToken, fetchResources } from '../common/koneapi'
import { fetchEquipmentBasicInformation, fetchEquipmentStatus, fetchServiceOrdersList, fetchSingleServiceOrder } from '../common/operational-api-supporting-functions'

/**
 * Update these two variables with your own credentials and equipment identifier or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

/**
 * Check if the needed variables have been defined
 */
const checkRequiredVariables = () => {
  if (
    isEmpty(CLIENT_ID) ||
    isEmpty(CLIENT_SECRET) ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET'
  )
  throw Error('CLIENT_ID and CLIENT_SECRET need to be defined')
}

/**
 * Demo equipment status api by fetching basic information of the equipment and its maintenance status
 */
const demoEquipmentStatusApi = async (accessToken: string, targetEquipmentId: string) => {
  // Acquire access token with needed scope to fetch equipment information
  const scopes = [`equipmentstatus/${targetEquipmentId}`]
  accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)

  // Fetch basic information of equipment
  console.log(`Fetch basic information of the equipment ${targetEquipmentId}`)
  const equipmentInfo = await fetchEquipmentBasicInformation(accessToken, targetEquipmentId)
  console.log(equipmentInfo)

  // Fetch maintenance status of equipment
  console.log(`Fetch maintenance status of the equipment ${targetEquipmentId}`)
  const equipmentStatus = await fetchEquipmentStatus(accessToken, targetEquipmentId)
  console.log(equipmentStatus)
}

/**
 * Demo service info api by fetching list of service orders and detail of a order for the equipment
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
  const { serviceOrderId } = serviceOrdersList[0]
  console.log(`Fetch details of service order id ${serviceOrderId} for equipment ${targetEquipmentId}`)
  const singleServiceOrder = await fetchSingleServiceOrder(accessToken, targetEquipmentId, serviceOrderId)
  console.log(singleServiceOrder)
}

const start = async () => {
  checkRequiredVariables()

  // Fetch the first token which will by default contain application/inventory scope for our use in the next request
  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET)
  console.log('AccessToken successfully fetched')
  
  // Fetch equipment ids to which user has access to 
  const equipments = await fetchResources(accessToken, 'ken')
  console.log('List of accessible equipments:', equipments)
  
  const targetEquipmentId = equipments[0]

  await demoEquipmentStatusApi(accessToken, targetEquipmentId)
  await demoServiceInfoApi(accessToken, targetEquipmentId)
  
}

start()
