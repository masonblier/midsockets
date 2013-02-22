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

test_seperator = (title)->
  process.stdout.write '#######################################################\n\n'
  process.stdout.write title+'\n\n'
  process.stdout.write '#######################################################\n\n'

test_promisesA = (callback)->
  test_seperator('promises/a+ tests')
  run_proc './node_modules/.bin/promises-aplus-tests', ['./lib/promises/test_adapter.js'], callback

test_spec = (callback) ->
  test_seperator('spec tests')
  run_proc './node_modules/.bin/vows', ['--spec','spec/spec-runner.js'], callback

test = () ->
  test_spec test_promisesA

task 'build', "Build all js files", -> build()
task 'spec', "Run spec tests", -> test_spec()
task 'test', "Run all tests", -> test()