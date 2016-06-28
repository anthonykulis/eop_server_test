// simple will handle types of "path" events

module.exports = {
  onCreate: function(status){
    console.log('i am validating save event');
    return true;
  },

  onUpdate: function(status){
    console.log('i am validating update event');
    return true;
  },

  onFail: function(status){
    console.log('i am an automatic fail event');
    status.onFail = {status: 422, message: 'I automatically failed. You are screwed and cannot fix this.'};
    return false;
  },

  onUser: function(status){
    console.log('i am validating user');
    return true;
  }
}
