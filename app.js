let tv = require('./validators/test_validators');
let _ = require('lodash');
let express = require('express');
let bodyParser = require('body-parser')
let app = express();
app.use(bodyParser.json());

let dispatcher = require('./lib/dispatchers/ServerDispatcher');
let EventEmitter = require('events').EventEmitter;
let assign = require('object-assign');
let policies = require('./config/policies');

// will be consumed
let _policies = _.map(policies, _.clone);

// process and process pool
let Process = require('./lib/mp/Process');
let pool = {};

// quickly finds out how many policies of types to put into pool
let min = _.reduce(_policies, function(memo, next){
  let v = next.shift();
  while(v){
    if(memo[v] === undefined){
      memo[v] = 1;
    }
    else {
      memo[v]++;
    }
    v = next.shift();
  }

  return memo;
}, {});


// put into pool
let tick = 0;
_.each(min, function(v,k){
  if(pool[k] === undefined) pool[k] = [];
  while(v--){
    let p = new Process(`${k}_${tick}`);
    pool[k].push(p);
    p.start(k);
    tick++;
  }
});

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
// ideally, I want to go multi-processed on this. So i think it will
// be pretty tricky to get the flux events tied into proceess events.
// i know i cannot send instantied objects across processes, so it
// will have to be data only, then on the return, recombine data with
// request and respone objects.
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

  // i dont think i need removale of listeners. maybe if I
  // make a process pool that bind (eg when there are too many processes needed)
  // so for now, no detaching.

});

// bind events
store.addPendingListener(function(){
  let _this = this;
  let grabbed = {};
  let next = store_data.pending.shift();
  let validators = policies.REQUEST_BID_FOR_PROPERTY;
  let callback = function(message){

    if(message.success){
      store_data.processed.push(next);
      _this.emit(PROCESSED);
    }
    else {
      store_data.rejected.push(next);
      _this.emit(REJECTED);
    }
    pool[message.name].push(grabbed[message.name]);
    delete grabbed[message.name];
  }

  let done = _.after(validators.length, callback);

  _.each(validators, (function(name){
    grabbed[name] = pool[name].shift();
    grabbed[name].validate(next.req.body, done);
  }));
});

store.addProcessedListener(function(){
  let next = store_data.processed.shift();
  return next.res.status(200).json(next.req.body);
  // this is where to queue the job for persistency.
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

// cluster? i like clust
app.listen(1337, function(){
});
