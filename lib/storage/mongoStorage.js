const { MongoClient } = require('mongodb')
const Adapter = require('./adapter')
const env = require('../env')

module.exports = class MongoStorage extends Adapter {
  async init () {
    const opts = { useNewUrlParser: true }
    const client = await MongoClient.connect(
      `mongodb://${env.dbCredentials}@${env.db.url.substring(10)}`
    , opts)

    this.db = client.db(env.dbName)
    this.db.on('close', function (reason) {
      console.error('Mongodb connection closed:', reason)
      process.exit(1)
    })

    this.locations = await this.db.collection('locations')
    this.users = await this.db.collection('users')
    this.schedule = await this.db.collection('schedule')
    this.scheduleHistory = await this.db.collection('schedule_history')
    this.skips = await this.db.collection('skips')
    this.skipHistory = await this.db.collection('skip_history')

    await this.schedule.updateMany(
      {},
      { $pull: { events: {
        $lt: new Date().toISOString()
      } } }
    )
  }

  async has (user) {
    return !!(await this.users.countDocuments({ user }))
  }

  async in (user) {
    const locationData = await this.locations.findOne({ users: user })

    return locationData ? locationData.location : undefined
  }

  async push (location, user) {
    if (await this.in(user)) {
      return false
    }

    await this.locations.updateOne(
      { location },
      { $push: { users: user } },
      { upsert: true }
    )

    await this.users.updateOne(
      { user },
      { $inc: { count: 1 } },
      { upsert: true }
    )

    return true
  }

  async pop (user) {
    await this.locations.updateOne(
      { users: user },
      { $pull: { users: user } }
    )
  }

  async match (locations) {
    const usersPerLocation = await this.locations.find({
      location: { $in: locations }
    }).map((location) => location.users).toArray()

    const matchesPerLocation = usersPerLocation.map((users) => (
      this.chunk(this.shuffle(users))
    ))

    return this.flatten(matchesPerLocation)
  }

  async purge (locations) {
    await Promise.all(locations.map((location) => {
      this.locations.deleteOne({ location })
    }))
  }

  async setSchedule (user, location, datetime, title) {
    const existingEvent = await this.scheduleHistory.findOne({ location, datetime })

    if (existingEvent) {
      return existingEvent
    }

    await this.schedule.updateOne(
      { location },
      { $push: { events: datetime } },
      { upsert: true }
    )

    await this.scheduleHistory.insertOne({
      location,
      datetime,
      user,
      title
    })
  }

  async getSchedule (datetime) {
    const locations = await this.schedule.find({ events: datetime }).toArray()

    await this.schedule.updateMany(
      { events: datetime },
      { $pull: { events: datetime } }
    )

    return locations.map((x) => x.location)
  }

  async nextSchedule (location) {
    const schedule = await this.schedule.findOne({ location })

    if (schedule && schedule.events.length) {
      const time = schedule.events.sort()[0]
      const historyData = await this.scheduleHistory.findOne({ location, datetime: time })

      return {
        title: historyData && historyData.title,
        time
      }
    }

    return {}
  }

  async listSchedule () {
    const schedule = await this.schedule.find().toArray()

    return schedule.reduce((acc, x) => {
      acc[x.location] = x.events
      return acc
    }, {})
  }

  async setSkip (user, datetime) {
    const existingEvent = await this.skipHistory.findOne({ datetime })

    if (existingEvent) {
      return existingEvent
    }

    await this.skips.insertOne(
      { datetime }
    )

    await this.skipHistory.insertOne({
      datetime,
      user
    })
  }

  async listSkips () {
    const skips = await this.skips.find().toArray()

    return (skips || []).map(x => x.datetime)
  }
}
