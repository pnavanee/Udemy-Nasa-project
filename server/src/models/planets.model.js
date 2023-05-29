const { parse } = require('csv-parse')
const path = require('path')
const fs = require('fs')

const planets = require('../models/planets.mongo')

const isHabitablePlanet = (planet) =>
  planet['koi_disposition'] === 'CONFIRMED' &&
  planet['koi_insol'] > 0.36 &&
  planet['koi_insol'] < 1.11 &&
  planet['koi_prad'] < 1.6

function loadPlanetsData() {
return new Promise((resolve, reject) => {
fs.createReadStream(path.join(__dirname, '..' , '..', 'data' ,'kepler_data.csv'))
  .pipe(
    parse({
      comment: '#',
      columns: true,
    })
  )
  .on('data', async (data) => {
    if (isHabitablePlanet(data)) {
      // habitablePlanets.push(data)
     savePlanets(data)
    }
  })
  .on('error', (err) => {
    console.log(err)
    reject(err)
  })
  .on('end', async() => {
    const countOfPlanetsFound = (await getAllPlanets()).length
    console.log(`${countOfPlanetsFound} habitale planets found`)
    resolve()
  })
})
}

 async function getAllPlanets() {
     return await planets.find({}, {
      __v : 0, _id : 0
     })
 }

 async function savePlanets(planet){
    try {
      await planets.updateOne({
        keplerName: planet.kepler_name
      }, {
        keplerName: planet.kepler_name
      },{
        upsert: true
      })
    }
    catch(err){
      console.log(`Error ${err}`)
    }
 }

  module.exports = {
     loadPlanetsData,
     getAllPlanets,
  }
