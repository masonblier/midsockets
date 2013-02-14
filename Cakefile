fs = require 'fs'

{print} = require 'sys'
{spawn} = require 'child_process'

run_proc = (command, args, callback) ->
  spawn(command, args, {stdio: "inherit"}).on 'exit', (code) ->
    callback() if code is 0 and callback?

browserify = (callback) ->
  run_proc './node_modules/.bin/browserify', ['-o','dist/midsockets-client.js','lib/midsockets-client.js'], callback

build = () ->
  browserify()

test = (callback) ->
  run_proc './node_modules/.bin/vows', ['--spec','spec/spec-runner.js'], callback

task 'build', "Build all js files", -> build()
task 'test', "Run all tests", -> test()