import _ from 'lodash'
import { fetchAccessToken, fetchEquipmentBasicInformation, fetchEquipmentStatus, fetchServiceOrdersList, fetchSingleServiceOrder } from '../common/koneapi'

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
  checkRequiredVariables()

  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, ['equipmentstatus/*', 'serviceinfo/*'])
  console.log('AccessToken successfully fetched')

  // Fetch basic information of equipment
  console.log(`Fetch basic information of equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
  const equipmentInfo = await fetchEquipmentBasicInformation(accessToken, EQUIPMENT_ID_WITH_PREFIX)
  console.log(equipmentInfo)

  // Fetch maintenance status of equipment
  console.log(`Fetch maintenance status of equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
  const equipmentStatus = await fetchEquipmentStatus(accessToken, EQUIPMENT_ID_WITH_PREFIX)
  console.log(equipmentStatus)

  // Fetch list of all service orders
  console.log(`Fetch list of service orders for equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
  const serviceOrdersList = await fetchServiceOrdersList(accessToken, EQUIPMENT_ID_WITH_PREFIX)
  console.log(serviceOrdersList)

  // Fetch detail of a service order
  const serviceOrderId = serviceOrdersList[0].serviceOrderId
  console.log(`Fetch details of service order id ${serviceOrderId} for equipment ${EQUIPMENT_ID_WITH_PREFIX}`)
  const singleServiceOrder = await fetchSingleServiceOrder(accessToken, EQUIPMENT_ID_WITH_PREFIX, serviceOrderId)
  console.log(singleServiceOrder)
}

start()
