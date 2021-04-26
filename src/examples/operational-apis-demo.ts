import _ from 'lodash'
import { fetchAccessToken, fetchResources } from '../common/koneapi'
import { fetchEquipmentBasicInformation, fetchEquipmentStatus, fetchServiceOrdersList, fetchSingleServiceOrder } from '../common/operationalapi'

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
    _.isEmpty(CLIENT_ID) ||
    _.isEmpty(CLIENT_SECRET) ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET'
  )
  throw Error('CLIENT_ID and CLIENT_SECRET need to be defined')
}

/**
 * Demo equipment status api by fetching basic information of the equipment and its maintenance status
 */
const demoEquipmentStatusApi = async (accessToken: string, targetEquipmentId: string) => {
  const scopes = [`equipmentstatus/${targetEquipmentId}`]
  accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)

  // Fetch basic information of equipment
  try {
    console.log(`Fetch basic information of the equipment ${targetEquipmentId}`)
    const equipmentInfo = await fetchEquipmentBasicInformation(accessToken, targetEquipmentId)
    console.log(equipmentInfo)
  } catch (error) {
    console.error('Failed to fetch information of the equipment')
  }

  // Fetch maintenance status of equipment
  try {
    console.log(`Fetch maintenance status of the equipment ${targetEquipmentId}`)
    const equipmentStatus = await fetchEquipmentStatus(accessToken, targetEquipmentId)
    console.log(equipmentStatus)
  } catch (error) {
    console.error('Failed to fetch maintenance status')
  }
}

/**
 * Demo service info api by fetching list of service orders and detail of a order for the equipment
 */
const demoServiceInfoApi = async (accessToken: string, targetEquipmentId: string) => {
  const scopes = [`serviceinfo/${targetEquipmentId}`]
  accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)
 
  // Fetch list of all service orders
  let serviceOrdersList
  try {
    console.log(`Fetch list of service orders for the equipment ${targetEquipmentId}`)
    serviceOrdersList = await fetchServiceOrdersList(accessToken, targetEquipmentId)
    console.log(serviceOrdersList)
  } catch (error) {
    console.error('Failed to fetch list of service orders')
  }

  // Fetch detail of a service order
  try {
    if (!serviceOrdersList) {
      return
    }
    const { serviceOrderId } = serviceOrdersList[0]
    console.log(`Fetch details of service order id ${serviceOrderId} for equipment ${targetEquipmentId}`)
    const singleServiceOrder = await fetchSingleServiceOrder(accessToken, targetEquipmentId, serviceOrderId)
    console.log(singleServiceOrder)
  } catch (error) {
    console.error('Failed to fetch details of the service order')
  }
}

const start = async () => {
  try {
    checkRequiredVariables()
  } catch (error) {
    console.error(error.message)
    return
  }

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
