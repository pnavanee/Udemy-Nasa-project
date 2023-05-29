const { default: axios } = require('axios')
const launchesModel = require('./launches.mongo')
const planets = require('./planets.mongo')

// const launches = new Map()

// let latestFlightNumber = 100;

const DEFAULT_FLIGHT_NUMBER = 100

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function getLatestFlightNumber() {
   const launch = await launchesModel
                       .findOne()
                       .sort('-flightNumber')
   if(!launch){
     return DEFAULT_FLIGHT_NUMBER
   }
   return launch.flightNumber;
}

async function getAllLaunches(limit, skip) {
  return await launchesModel.find({}, {
    _id: 0,
    __v: 0
  })
  .sort({flightNumber: 1})
  .skip(skip)
  .limit(limit)
}

async function saveLaunch(launch){
  await launchesModel.findOneAndUpdate({
    flightNumber: launch.flightNumber
  },
   launch,
  { upsert: true })
}

async function scheduleNewLaunch(launch){
   const planet = await planets.findOne({
     keplerName: launch.target,
   })
   if (!planet) {
     throw new Error('No planet found')
   }
   const newFlightNumber = await getLatestFlightNumber() + 1
   const newLaunch = Object.assign(launch, {
     upcoming: true,
     success: true,
     customer: ['ZTM', 'NASA'],
     flightNumber: newFlightNumber
   })
   await saveLaunch(newLaunch)
}


async function existsLaunchWithId(launchId) {
   return await launchesModel.findOne({
    flightNumber: launchId
   })
}

async function abortByLaunchId(launchId) {
  const aborted =  await launchesModel.updateOne({
    flightNumber: launchId
   }, {
    upcoming: false,
    success: false
   })

   return aborted.modifiedCount === 1;
}

async function populateLaunchData(){
   const response = await axios.post(SPACEX_API_URL, {
     query: {},
     options: {
       pagination: false,
       populate: [
         {
           path: 'rocket',
           select: {
             name: 1,
           },
         },
         {
           path: 'payloads',
           select: {
             customers: 1,
           },
         },
       ],
     },
   })

   if(response.status !== 200){
      console.log('Problem downloading launches data')
      throw new Error('Launch data download failed')
   }

   const launchDocs = response.data.docs
   for (let launchDoc of launchDocs) {
     const payloads = launchDoc['payloads']
     const customers = payloads.flatMap((obj) => obj['customers'])

     const launch = {
       flightNumber: launchDoc['flight_number'],
       mission: launchDoc['name'],
       rocket: launchDoc['rocket']['name'],
       launchDate: launchDoc['date_local'],
       customers,
       upcoming: launchDoc['upcoming'],
       success: launchDoc['success'],
     }
    //  console.log(launch.flightNumber, launch.mission)
      await saveLaunch(launch)

   }
}

async function loadLaunchesData(){
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    mission: 'FalconSat',
    rocket: 'Falcon 1',
  })

  if(firstLaunch){
    console.log('rocket details already exists')
  }
  else{
    await populateLaunchData()
    console.log("completed loading data")
  }
}

async function findLaunch(filter) {
   return await launchesModel.findOne(filter)
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortByLaunchId,
  loadLaunchesData,
}