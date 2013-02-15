Router = require('../lib/router')

module.exports =
  topic: ->
    process.nextTick ()=>
      this.callback(null,new Router())

  'basic':
    'should exist': (router)->
      assert.isObject router
