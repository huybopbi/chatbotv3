
const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const fs = require('fs')

module.exports = {

 auth : function (account,password,steamcode) {
   
var responded = [];

var playme = '730';
var templay = parseInt(playme.length)
if (config.donotsort === false) {
  playme = uniq(playme)
};

var client = new SteamUser()

// functions

function uniq (a) {
  return a.sort().filter(function (item, pos, ary) {
    return !pos || item !== ary[pos - 1]
  })
}

function compareKeys(a, b) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

// endfunc

function shutdown (code) {
  process.exit(code)
  setTimeout(function () {
    process.exit(code)
  }, 500)
}

// methods

client.logOn({
  'accountName': `${account}`,
  'password': `${password}`,
  'promptSteamGuardCode': false,
  'twoFactorCode': `${steamcode}`,
  'rememberPassword': true
})

client.on('loggedOn', function (details) {
  client.requestFreeLicense(playme)
  client.gamesPlayed(playme)
  if (config.silent === false) {
    client.setPersona(1)
  };
})

client.on('error', function (e) {
  shutdown(1)
})

client.on('friendMessage', function (steamid, message) {
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(steamid.getSteamID64())
    client.chatMessage(steamid, 'Tôi đang bận, vui lòng nhắn tin lại sau!')
  };
})

client.on('lobbyInvite', function(inviterID, lobbyID){
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(inviterID.getSteamID64())
    client.chatMessage(steamid, 'Tôi đang bận, vui lòng nhắn tin lại sau!')
  };
})

process.on('SIGINT', function () {
  shutdown(0)
})
}
noauth : function (account,password) {
   
var responded = [];

var playme = '730';
var templay = parseInt(playme.length)
if (config.donotsort === false) {
  playme = uniq(playme)
};

var client = new SteamUser()

// functions

function uniq (a) {
  return a.sort().filter(function (item, pos, ary) {
    return !pos || item !== ary[pos - 1]
  })
}

function compareKeys(a, b) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

// endfunc

function shutdown (code) {
  process.exit(code)
  setTimeout(function () {
    process.exit(code)
  }, 500)
}

// methods

client.logOn({
  'accountName': `${account}`,
  'password': `${password}`,
  'promptSteamGuardCode': false,
  'rememberPassword': true
})

client.on('loggedOn', function (details) {
  client.requestFreeLicense(playme)
  client.gamesPlayed(playme)
  if (config.silent === false) {
    client.setPersona(1)
  };
})

client.on('error', function (e) {
  shutdown(1)
})

client.on('friendMessage', function (steamid, message) {
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(steamid.getSteamID64())
    client.chatMessage(steamid, 'Tôi đang bận, vui lòng nhắn tin lại sau!')
  };
})

client.on('lobbyInvite', function(inviterID, lobbyID){
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(inviterID.getSteamID64())
    client.chatMessage(steamid, 'Tôi đang bận, vui lòng nhắn tin lại sau!')
  };
})

process.on('SIGINT', function () {
  shutdown(0)
})
}
}