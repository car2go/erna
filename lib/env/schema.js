const { URL } = require('url')

module.exports = {
  SECRET: {
    name: 'secret',
    required: true,
    desc: 'the Slack Signing Secret'
  },

  TOKEN: {
    name: 'token',
    required: true,
    desc: 'the Slack Bot Token'
  },

  PORT: {
    name: 'port',
    default: '3000',
    transform (x) {
      return parseInt(x, 10)
    }
  },

  MATCH_SIZE: {
    name: 'matchSize',
    default: '2',
    transform (x) {
      return parseInt(x, 10)
    }
  },

  MATCH_TIME: {
    name: 'matchTime',
    default: '11:30',
    pattern: /^([01]?[0-9]|2[0-3]|\*):([0-5][0-9]|\*)$/ig,
    props: {
      cron (x) {
        return x.split(':').reverse().join(' ')
      },
      pretty (x) {
        if (x === '*:*') {
          return x
        }

        let [hours, minutes] = x.split(':')
        let modifier = 'am'

        hours = parseInt(hours, 10)

        if (hours > 12) {
          modifier = 'pm'
          hours -= 12
        }

        if (hours === 0) {
          hours = 12
        }

        return `${hours < 10 ? `0${hours}` : hours}:${minutes}${modifier}`
      }
    }
  },

  LOCATIONS: {
    name: 'locations',
    required: true,
    desc: 'a comma-separated list of locations',
    pattern: /^(#[a-z_-]*\/[a-z_-]*:[a-z_-\s0-9]*(,[a-z_-\s0-9]*)*)+$/ig,
    props: {
      tzs (x) {
        const timezones = x.split('#')
        timezones.shift()

        const mapping = {}

        timezones.forEach(x => {
          const [tz, cities] = x.split(':')
          mapping[tz] = cities.split(',')
        })

        return mapping
      },

      list (x) {
        const timezones = x.split('#')
        timezones.shift()

        return [].concat(...timezones.map(x => x.split(':')[1]))
          .join(',')
          .split(',')
      }
    }
  },

  DB: {
    name: 'db',
    default: undefined,
    props: {
      url (x) {
        return x
      },

      type (x) {
        if (!x) {
          return x
        }

        const url = new URL(x.split(',')[0])

        return url.protocol.slice(0, -1)
      }
    }
  }
}