/**
  Opens a HTTP server on TCP port argument 1 
  Listens for UDP packets on port argument 2. 
  Proxys all incoming UDP packets to all open HTTP connections
*/

var httpPort = parseInt(process.argv[2]);
var udpPort = parseInt(process.argv[3]);

if((process.argv.length != 4) || (httpPort <= 0) || (udpPort <= 0)) {
  console.log("Usage: node udp_to_http_proxy.js <http_port> <udp_port>");
  process.exit();
}

var http = require('http');
var httpConnections = [];

var httpServer = http.createServer(function(request, response) {
  var ipAddress = request.socket.remoteAddress;
  request.socket.setTimeout(0);
  console.log("New HTTP connection from: " + ipAddress);
  response.writeHead(200);
  httpConnections.push(response);

  request.on('close', function() {
    console.log("Closed HTTP connection: " + ipAddress);
    var i = httpConnections.indexOf(response);
    httpConnections.splice(i, 1);
  });
});
httpServer.listen(httpPort);

var dgram = require('dgram');
var byteCount = 0;
var udpSocket = dgram.createSocket('udp4', function(msgBuffer) {
  byteCount += msgBuffer.length;
  for (var i = 0; i < httpConnections.length; i++)
  {
    httpConnections[i].write(msgBuffer);
  }
});
udpSocket.bind(udpPort, '0.0.0.0');

setInterval(function() {
  console.log("Data rate: " + (8.0 * byteCount / 1000 / 10) + " kb/s" + " - Active HTTP connections: " + httpConnections.length);
  byteCount = 0;
}, 10000);
