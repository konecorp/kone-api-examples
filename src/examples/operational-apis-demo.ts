import _ from 'lodash'
import { fetchAccessToken } from '../common/koneapi'
import { fetchEquipmentBasicInformation, fetchEquipmentStatus, fetchServiceOrdersList, fetchSingleServiceOrder } from '../common/operationalapi'

/**
 * Update these three variables with your own credentials and equipment identifier or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'
const EQUIPMENT_ID_WITH_PREFIX: string = process.env.EQUIPMENT_ID_WITH_PREFIX || 'YOUR_EQUIPMENT_ID_WITH_KEN_PREFIX' // eg. sanbox equipment ken:9999999999

/**
 * Check if the needed variables have been defined
 */
const checkRequiredVariables = () => {
  if (
    _.isEmpty(CLIENT_ID) ||
    _.isEmpty(CLIENT_SECRET) ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET' ||
    EQUIPMENT_ID_WITH_PREFIX === 'YOUR_EQUIPMENT_ID_WITH_KEN_PREFIX'
  )
  throw Error('CLIENT_ID, CLIENT_SECRET, and EQUIPMENT_ID_WITH_PREFIX need to be defined')
}

const start = async () => {
  try {
    checkRequiredVariables()
  } catch (error) {
    console.error(error.message)
    return
  }

  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, ['equipmentstatus/*', 'serviceinfo/*'])
  console.log('AccessToken successfully fetched')

  // Fetch basic information of equipment
  try {
    console.log(`Fetch basic information of the equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
    const equipmentInfo = await fetchEquipmentBasicInformation(accessToken, EQUIPMENT_ID_WITH_PREFIX)
    console.log(equipmentInfo)
  } catch (error) {
    console.error('Failed to fetch information of the equipment')
  }

  // Fetch maintenance status of equipment
  try {
    console.log(`Fetch maintenance status of the equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
    const equipmentStatus = await fetchEquipmentStatus(accessToken, EQUIPMENT_ID_WITH_PREFIX)
    console.log(equipmentStatus)
  } catch (error) {
    console.error('Failed to fetch maintenance status')
  }
  
  // Fetch list of all service orders
  let serviceOrdersList
  try {
    console.log(`Fetch list of service orders for the equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
    serviceOrdersList = await fetchServiceOrdersList(accessToken, EQUIPMENT_ID_WITH_PREFIX)
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
    console.log(`Fetch details of service order id ${serviceOrderId} for equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
    const singleServiceOrder = await fetchSingleServiceOrder(accessToken, EQUIPMENT_ID_WITH_PREFIX, serviceOrderId)
    console.log(singleServiceOrder)
  } catch (error) {
    console.error('Failed to fetch details of the service order')
  }
}

start()
