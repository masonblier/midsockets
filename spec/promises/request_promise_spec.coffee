App = require('../../lib/app')
RequestPromise = require('../../lib/promises/request_promise')

module.exports =
  topic: ->
    process.nextTick ()=>
      ctx = {app:new App()}
      ctx.rp = new RequestPromise({app: ctx.app})
      this.callback(null,ctx)

  'basic':
    'should exist': (ctx)->
      assert.isObject ctx.rp

  'local events':

    '#on':
      topic: (ctx)->
        ctx.rp.on "evennt", ()=>
          process.nextTick ()=>
            this.callback(null,ctx)
        ctx.rp.emit "evennt"
      'should exist': (ctx)->
        assert.isObject ctx.rp

    '#on with params': 'pending'
    #   topic: (ctx)->
    #     process.nextTick ()=>
    #       ctx.rp.on "evennt", (a,b)=>
    #         this.callback(null,[a,b])
    #       ctx.rp.emit "evennt", 5, 2
    #   'should have the params': (p)->
    #     assert.equal p[0]-1, p[1]*2

  'remote events':

    '#on': 'pending'
  #     topic: (ctx)->
  #       process.nextTick ()=>
  #         ctx.rp.on "remote_evennt", (data)=>
  #           this.callback(null,{ctx:ctx,data:data})
  #         ctx.app._in({route:'/remote_evennt',data:"test"},{})
  #     'should have the correct data': (p)->
  #       assert.isObject p.ctx.rp
  #       assert.equal "test", p.data

  'promise':

    '#done': 'pending'
  #     topic: (ctx)->
  #       process.nextTick ()=>
  #         ctx.rp.done (data)=>
  #           this.callback(null,{ctx:ctx,data:data})
  #         ctx.app._in({route:'/',data:"test2"},{})
  #     'should have the correct data': (p)->
  #       assert.isObject p.ctx.rp
  #       assert.equal "test2", p.data