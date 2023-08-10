# KONE APIs example code project

## Introduction

The example codes on this document will introduce the main concepts of KONE APIs. By setting up and running this example code project, you can apprehend the main idea and flow of using KONE APIs. It is highly recommended to read [the technical API documentation](https://dev.kone.com/api-portal/dashboard/developer-guide/overview-api) before starting to use this example project.

- With **Authentication API 2.0** you can receive the access token that enables you to make an API call, and
- With **Elevator Call WebSocket API 2.0** you can execute elevator calls and receive real-time data about the call and the assigned elevators or cancel the elevator call made earlier, and
- With **Common APIs** you can list down building configuration, actions supported by group controller and check the responsiveness of an API, and
- With **Site Monitoring API** you can fetch the real time information about the lift status, call state, deck position, door state etc., and
- With **Operational APIs** you can retrieve information about your accessible equipment, maintenance status, list of service orders, and details and
- With **Equipment Status API 2.0** you can retrieve information about your accessible equipment regarding availability, entrapment, and movement.

### Examples

| Example name                  | Source file                                                                                                                           | Description                                                                                                                                                                                                                                                                         |
| ----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Elevator Call 2.0             | [elevator-call-2-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/elevator-call-2-demo.ts)                   | Simple elevator call demo about acquiring needed access token, fetching building topology and making or cancelling the elevator call within the WebSocket connection. [Technical documentation in the portal](https://dev.kone.com/api-portal/dashboard/api-documentation/elevator-websocket-api-v2) |
| Ping                          | [ping-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/ping-demo.ts)                                      | An API call to check if an API is still alive and responsive. It does not affect the system in any way. [Technical documentation in the portal](https://dev.kone.com/api-portal/dashboard/api-documentation/elevator-websocket-api-v2)
| Config                        | [config-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/config-demo.ts)                                      | An API call to fetch the building configuration such as floors, areas etc. [Technical documentation in the portal](https://dev.kone.com/api-portal/dashboard/api-documentation/elevator-websocket-api-v2)
| Actions                       | [actions-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/actions-demo.ts)                         | An API call to list down the actions supported by the group controller. [Technical documentation in the portal](https://dev.kone.com/api-portal/dashboard/api-documentation/elevator-websocket-api-v2)
| Site Monitoring               | [monitoring-siteapi-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/monitoring-siteapi-demo.ts)                 | Simple demo to fetch the real time information about the lift status, call state, deck position, door state etc. [Technical documentation in the portal](https://dev.kone.com/api-portal/dashboard/api-documentation/elevator-websocket-api-v2)
| Call and Monitoring           | [call-and-monitoring-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examplescall-and-monitoring-demo.ts)                 | Simple demo to make an elevator call and monitor the next events related to changed states for the previously called elevator. 
| WebSocket sessions - Basic    | [websocket-sessions-basic.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/websocket-sessions-basic.ts)    | Introduction to the WebSocket sessions within the Elevator WebSocket API.                                                                                                                                                                                                           |
| WebSocket sessions - Advanced | [websocket-sessions-advanced.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/websocket-sessions-advanced.ts) | Advanced demo about the WebSocket session handling. Includes proper error handling and interaction with the API in cases like timeouts.                                                                                                                                             |
| Operational APIs              | [operational-apis-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/operational-apis-demo.ts)             | Simple demo about acquiring needed access token, fetching basic information of an equipment and its maintenance status, get list of all service orders, and detailed information of a service order.                                                                                                                                             |
| Equipment Status API 2.0              | [equipment-status-2-restapi-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/equipment-status-2-restapi-demo.ts)             | Simple demo about acquiring needed access token, fetching information of equipment about availability, entrapment and movement.                |

## How the project works

To use our APIs, you need an account on [KONE API Portal](https://dev.kone.com/). Once you have registered for an account, create a Sandbox application.

Since the project is a Typescript project, setting it up requires just a little effort. You can find all the necessary code in the [elevator-call-2-demo.ts](https://github.com/konecorp/kone-api-examples/blob/main/src/examples/elevator-call-2-demo.ts). Once the file is run, the following is done:

1. Checking that the necessary variables have been defined: `CLIENT_ID`, `CLIENT_SECRET` and `BUILDING_ID` in `.env` file.
2. Fetching an access token from Authentication API without any scope defined. The returned accessToken will include only `inventory/application` grant.
3. With the access token, making a request towards the resource endpoint to fetch the accessible buildings. The response is an array of building Ids, and the first one is selected for our target building.
4. Calling the Authentication API again, but this time with a scope to request access to the selected building in the body of the request `callgiving/group:BUILDING_ID:GROUP_ID`. The successful response will return a token with a scope that allows API authentication in the following steps.
5. Calling Building API to retrieve topology information about the selected building.
6. For destination call, setting sourceId (`payload.area`) and destinationId (`payload.call.destination`) based on the previously retrieved building information. These values represent from which area between which the user would like to move using the elevator.
7. For landing call, setting sourceId (`payload.area`) and direction (`TBD`) based on the previously retrieved building information. These values order the elevator to move to a specific floor.
8. Sending Elevator Call or Service Robot Call request (based on the defined scope).

## Requirements

To run this project, check that you have:

- Node.js, version >= 14
- npm, version >= 6

## Starting off

Follow the instructions to start using this project

1. Clone this Git repository and navigate into the project folder

`git clone https://github.com/konecorp/kone-api-examples.git && cd kone-api-examples`

2. Run in the terminal while being in the project folder:

`npm ci`

3. Open the project in an IDE such as [Visual Studio Code](https://code.visualstudio.com/) and open `.env` file
4. Set the following variables:
   - **CLIENT_ID**, the clientId generated when creating the application in KONE API Portal
   - **CLIENT_SECRET**, the client secret received when creating the application
   - **BUILDING_ID**, the building Id for which you want to perform API calls

![Alt text](./img/variables4.jpg?raw=true 'Environment variables')

5. Run in the terminal while being in the project folder:

`npm run start`

### Running the project with a debugger

To run this project using a debugger, complete the steps in the instructions above without running step 5. Then continue following this example, which uses Visual Studio Code debugger:

1. Click on the debugger icon on the left side.
2. If you want, set breakpoints within the `src/examples/elevator-call-2-demo.ts` file.
3. Run in debugger mode by pressing on the running icon in the debugger tab.

![Full debugger flow](./img/full-debugger-flow.jpg?raw=true 'debugger')

## Running other examples

Other examples can be found in `src/examples` folder. To run any of them, the **CLIENT_ID**, **CLIENT_SECRET** and **BUILDING_ID** variables need to be defined. Since the same variables are used in each example, you can set them up locally as environmental variables or in a .env file to the root directory. For more information on .env files, please see https://www.npmjs.com/package/dotenv.

Any of the examples can be started with the following syntax:

`npm run start:{example filename}`

Additionally, there will be a debugger configuration available for debugging each example on Visual Studio Code.
