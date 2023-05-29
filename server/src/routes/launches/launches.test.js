const request = require('supertest')
const app = require('../../app')
const { mongoConnect, mongoDisconnect } = require('../../services/mongo')

describe('Launches API', () => {
   beforeAll(async () => {
       await mongoConnect()
   })

   afterAll(async () => {
       await mongoDisconnect()
   })

  describe('Test GET /launches', () => {
     const completeLaunchData = {
       mission: 'Mission keypler 1',
       target: 'Kepler-62 f',
       rocket: 'ZTM Rocket',
       launchDate: 'January 7 2030',
     }
     const launchDataWithoutDate = {
       mission: 'Mission keypler 1',
       target: 'Kepler-62 f',
       rocket: 'ZTM Rocket',
     }
     const launchDataWithInvalidDate = {
       mission: 'Mission keypler 1',
       target: 'Kepler-62 f',
       rocket: 'ZTM Rocket',
       launchDate: 'test',
     }

     test('It should respond with 200 success', async () => {
       const response = await request(app)
         .get('/v1/launches')
         .expect('Content-Type', /json/)
         .expect(200)
     })

     test('It should respond with 201 created', async () => {
       const response = await request(app)
         .post('/v1/launches')
         .send(completeLaunchData)
         .expect('Content-Type', /json/)
         .expect(201)

       const requestDate = new Date(completeLaunchData.launchDate).valueOf()
       const responseDate = new Date(response.body.launchDate).valueOf()
       expect(requestDate).toBe(responseDate)
       expect(response.body).toMatchObject(launchDataWithoutDate)
     })

    test('It should catch missing required properties', async () => {
       const response = await request(app)
         .post('/v1/launches')
         .send(launchDataWithoutDate)
         .expect('Content-Type', /json/)
         .expect(400)

       expect(response.body).toStrictEqual({
         error: 'Missing required launch property',
       })
     })

     test('It should catch invalid date', async () => {
       const response = await request(app)
         .post('/v1/launches')
         .send(launchDataWithInvalidDate)
         .expect(400)

       expect(response.body).toStrictEqual({
         error: 'Invalid launch date',
       })
     })
   })
})
