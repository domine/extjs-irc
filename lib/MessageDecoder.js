Ext.ns('Ext.ux.IRC');

Ext.ux.IRC.MessageDecoder = {
  
  withoutPrefixRegex: new RegExp(/([0-9A-Z]*)\s:(.*)/),
  
  withPrefixRegex:    new RegExp(/^([\:\_\.\-\!\@a-zA-Z0-9\.]*)\s([0-9A-Z]*)\s(.*)/),
  
  /**
   * @property whoisRegex
   * @type RegExp
   * A Regex to parse nickname, username, hostname and realname from a WHOIS response
   */
  whoisRegex: new RegExp(/([\-\_A-Za-z0-9]*)\s([\-\_A-Za-z0-9]*)\s([\-\_\.A-Za-z0-9]*)\s\*\s:([\s\-\_A-Za-z0-9]*)/),
  
  /**
   * @property commandNames
   * @type Object
   * Mapping from numeric command codes to string codes
   */
  commandNames: {
    311: 'RPL_WHOISUSER',
    332: 'RPL_TOPIC',
    353: 'RPL_NAMREPLY',
    366: 'RPL_ENDOFNAMES',
    372: 'RPL_MOTD',
    375: 'RPL_MOTDSTART',
    376: 'RPL_ENDOFMOTD'
  },
  
  decode: function(message) {
    var d = Ext.ux.IRC.MessageDecoder;
    
    var decoded = {original: message};
    
    //determine whether we're dealing with a server prefix or not
    //FIXME: Removed this because Domine IRC server isn't sending leading colons
    var hasPrefix = true; //message[0] == ':';
    
    if (hasPrefix) {
      var matches = message.match(d.withPrefixRegex);
      
      if (matches) {
        decoded['server'] = matches[1].replace(":", "");;
        decoded['params'] = matches[3];
        decoded['number'] = parseInt(matches[2], 10);
        decoded['name']   = d.commandNames[decoded['number']] || matches[2];
        
        decoded['message'] = decoded['params'].substring(decoded['params'].indexOf(':') + 1);
        
        //decode additional parameters if we're dealing with a WHOIS response
        if (decoded['name'] == 'RPL_WHOISUSER') {
          var whoisMatches = decoded['params'].match(this.whoisRegex);
          if (whoisMatches) {
            decoded['nickname'] = whoisMatches[1];
            decoded['username'] = whoisMatches[2];
            decoded['hostname'] = whoisMatches[3];
            decoded['realname'] = whoisMatches[4];
          }
        };
      }
    };
    
    return decoded;
  }
};