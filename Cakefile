fs = require 'fs'

{print} = require 'sys'
{spawn} = require 'child_process'

run_proc = (command, args, callback) ->
  child = spawn command, args
  child.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  child.stdout.on 'data', (data) ->
    process.stdout.write data.toString()
  child.on 'exit', (code) ->
    callback() if code is 0 and callback?

browserify = (callback) ->
  run_proc './node_modules/.bin/browserify', ['-o','dist/midsockets-client.js','lib/midsockets-client.js'], callback

build = () ->
  browserify()

task 'build', "Build all js files", -> build()
