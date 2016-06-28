process.on('message', (m) => {
  console.log('i am validating', m);
  m.success = Math.random() > .5;
  process.send(m);
})
