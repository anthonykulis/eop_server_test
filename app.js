let tv = require('./validators/test_validators');
let _ = require('lodash');
let express = require('express');
let bodyParser = require('body-parser')
let app = express();
app.use(bodyParser.json());

let dispatcher = require('./dispatchers/ServerDispatcher');
let EventEmitter = require('events').EventEmitter;
let assign = require('object-assign');

// just a dumb store for now
let store_data = {
  pending: [],
  processed: [],
  rejected: []
};

// set some events
let PROCESSED = 'pushed_new_processed';
let CHANGE_EVENT = 'change';
let PENDING = 'pushed_new_pending';
let REJECTED = 'pushed_new_rejected';

// create my store. not sure how to "break" apart yet so
// validators can work seemlessly. so bypassing for now.
// these methods will just push into processed and trigger event
let store = assign({}, EventEmitter.prototype, {
  create: function(req, res){
    store_data.pending.push({req: req, res: res});
    this.emit(PENDING);
  },
  change: function(req, res){
    store_data.pending.push({req: req, res: res});
    this.emit(PENDING);
  },
  accept: function(req, res){
    store_data.pending.push({req: req, res: res});
    this.emit(PENDING);
  },
  cancel: function(req, res){
    store_data.pending.push({req: req, res: res});
    this.emit(PENDING);
  },


  addPendingListener: function(callback){
    this.on(PENDING, callback);
  },

  addProcessedListener: function(callback){
    this.on(PROCESSED, callback);
  },

  addRejectedListener: function(callback){
    this.on(REJECTED, callback);
  }

});

// bind events
store.addPendingListener(function(){
  let next = store_data.pending.shift();
  store_data.processed.push(next);
  this.emit(PROCESSED);
});

store.addProcessedListener(function(){
  let next = store_data.processed.shift();
  return next.res.status(200).json(next.req.body);
});

store.addRejectedListener(function(){
  let next = store_data.rejected.shift();
  return next.res.status(422).json({messasge: 'i am an error'});
});

// note that these are actually routes (/request/bid/for/property).
// i am not saying this is the best, but boy is it readable. I need
// to figure out how handle the server methods still
let action_types = {
  create: 'REQUEST_BID_FOR_PROPERTY',
  update: 'CHANGE_BID_ON_PROPERTY',
  accept: 'ACCEPT_BID_FOR_PROPERTY',
  cancel: 'CANCEL_BID_ON_PROPERTY',
};

// basic dispatch for our routes
dispatcher.register(function(action){
  switch(action.type){
    case action_types.create:
      store.create(action.req, action.res);
      break;
    case action_types.update:
      store.change(action.req, action.res);
      break;
    case action_types.accept:
      store.accept(action.req, action.res);
      break;
    case action_types.cancel:
      store.cancel(action.req, action.res);
      break;
    default: return action.res.send(`no idea what ${action.type} is`);
  };

});


function dispatchRequest(req, res){
  let named_event = _.compact(req.url.split('/')).join('_').toUpperCase();
  dispatcher.dispatch({
    type: named_event,
    req: req,
    res: res
  });

}

app.get('*', function(req, res){
  res.send('I dont do gets');
});


// events on client side - I really wish to be able to drop this and handle
// programatically
app.post('/request/bid/for/property', dispatchRequest);
app.put('/change/bid/on/property', dispatchRequest);
app.delete('/cancel/bid/on/property', dispatchRequest);


app.listen(1337, function(){
});
