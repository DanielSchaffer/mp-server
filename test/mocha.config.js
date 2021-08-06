const chai = require('chai')
chai.use(require('sinon-chai'))

// eslint-disable-next-line import/order
const { chaiMarbles, config } = require('@rxjs-stuff/marbles/chai')
chai.use(chaiMarbles)
require('@rxjs-stuff/marbles/mocha/node').mochaMarbles(config)
