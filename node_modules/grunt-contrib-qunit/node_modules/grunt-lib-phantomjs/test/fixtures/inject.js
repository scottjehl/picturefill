// Send messages to the parent PhantomJS process via alert! Good times!!
function sendMessage() {
  var args = [].slice.call(arguments);
  alert(JSON.stringify(args));
}

sendMessage('test', 'injected');
sendMessage('done');
