let res = [
  db.test.insert({ test: 'hello', test2: 'testing' }),
  db.test.insert({ test: 'hello2', test2: 'testing' }),
  db.test.insert({ test: 'hello3', test2: 'testing' }),
  db.test.insert({ test: 'hello3', test2: 'testing' })
]

printjson(res)