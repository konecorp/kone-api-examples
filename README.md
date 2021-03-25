# Elevator Call API example code project

## Introduction

The example codes on this document will introduce the main concepts of KONE APIs. By setting up and running this example code project, you can apprehend the main idea and flow of using KONE APIs. It is highly recommended to read [the technical API documentation](https://dev.kone.com/api-portal/dashboard/developer-guide/overview-api) before starting to use this example project.

- With **Authentication API** you can receive the access token that enables you to make an API call
- With **Building API** you can retrieve information about your building, and
- With **Elevator Call WebSocket API** you can execute elevator calls and receive real-time data about the call and the assigned elevators.

## How the project works

To use our APIs, you need an account on [KONE API Portal](https://dev.kone.com/). Once you have registered for an account, create a Sandbox application.

Since the project is a Typescript project, setting it up requires just a little effort. You can find all the necessary code in the [elevator-call-demo.ts](https://github.com/konecorp/kone-api-demo/blob/main/src/elevator-call-demo.ts). Once the file is run, the following is done:

1. Checking that the necessary variables have been defined: `CLIENT_ID` and `CLIENT_SECRET`.
2. Fetching an access token from Authentication API without any scope defined. The returned accessToken will include only `inventory/application` grant.
3. With the access token, making a request towards the resource endpoint to fetch the accessible buildings. The response is an array of building Ids, and the first one is selected for our target building.
4. Calling the Authentication API again, but this time with a scope to request access to the selected building in the body of the request `scope=callgiving/BUILDING_ID`. The successful response will return a token with a scope that allows API authentication in the following steps.
5. Calling Building API to retrieve topology information about the selected building.
6. Setting random sourceId and destinationId based on the previously retrieved building information. These values represent from which area to which the user would like to move using the elevator.
7. Sending Elevator Call or Service Robot Call request (based on the defined scope).

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

3. Open the project in an IDE such as [Visual Studio Code](https://code.visualstudio.com/) and open `src/examples/elevator-call-demo.ts`
4. Set the following variables:
   - **CLIENT_ID**, the clientId generated when creating the application in KONE API Portal
   - **CLIENT_SECRET**, the client secret received when creating the application

![Alt text](./img/variables3.jpg?raw=true 'variables')

5. Run in the terminal while being in the project folder:

`npm run start`

### Running the project with a debugger

To run this project using a debugger, complete the steps in the instructions above without running step 5. Then continue following this example, which uses Visual Studio Code debugger:

1. Click on the debugger icon on the left side.
2. If you want, set breakpoints within the `src/example/elevator-call-demo.ts` file.
3. Run in debugger mode by pressing on the running icon in the debugger tab.

![Full debugger flow](./img/full-debugger-flow.jpg?raw=true 'debugger')

## Running other examples

Other examples can be found in `src/examples` folder. To run any of them, the **CLIENT_ID** and **CLIENT_SECRET** variables need to be defined. Since the same variables are used in each example, you can set them up locally as environmental variables or write a .env file to the root directory. For more information on .env files, please see https://www.npmjs.com/package/dotenv.

Any of the examples can be started with the following syntax:

`npm run start:{example filename}`

Additionally, there will be a debugger configuration available for debugging each example on Visual Studio Code.
