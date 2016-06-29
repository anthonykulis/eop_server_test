process.on('message', (m) => {
  m.success = Math.random() > .5;
  process.send(m);
})
