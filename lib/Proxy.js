Ext.ns('Ext.ux.IRC');

/**
 * @class Ext.ux.IRC.Proxy
 * @extends Ext.util.Observable
 * A simple IRC client proxy.  Uses a flash object to connect to an IRC server
 */
Ext.ux.IRC.Proxy = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property proxyHolderId
   * @type String
   * The ID to use for the <object> tag used to house the flash connector (defaults to 'irc_connect')
   */
  proxyHolderId: 'irc_connect',
  
  /**
   * @property serverHost
   * @type String
   * The hostname of the server to connect to.  This should be considered read-only and be sent in the constructor
   * (defaults to an empty string)
   */
  serverHost: '',
  
  /**
   * @property serverPort
   * @type Number
   * The IRC server's port number (defaults to 6667)
   */
  serverPort: 6667,
  
  /**
   * @property password
   * @type String
   * The password to send to the IRC server when connecting (defaults to an empty string)
   */
  password: '',
  
  /**
   * @property nick
   * @type String
   * The nickname to connect to the server with (defaults to an empty string)
   */
  nick: '',
  
  /**
   * @property realname
   * @type String
   * The Real Name to send to the server in USER command (defaults to an empty string)
   */
  realname: '',

  /**
   * @property proxySwfPath
   * @type String
   * The path to IrcProxy.swf
   */
  proxySwfPath: 'IrcProxy.swf',
 
  constructor: function(config) {
    var config = config || {};
    Ext.apply(this, config);
    
    /**
     * @property flashEl
     * @type Ext.Element
     * A placeholder <object> tag created to house the flash object
     */
    this.flashEl = Ext.getBody().createChild({id: this.proxyHolderId});
    
    //load the flash up
    var cfg = {allownetworking: 'all', allowscriptaccess: 'always'};
    
    swfobject.embedSWF(this.proxySwfPath, this.proxyHolderId, "1", "1", "9.0.0", "expressInstall.swf", cfg, cfg, cfg);
    
    Ext.ux.IRC.Proxy.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event message-received
       * Fired whenever a message is received from the IRC server
       * @param {String} message The message that was received
       */
      'message-received',
      
      /**
       * @event before-message-sent
       * Fires before a message is sent to the server (return false on any listener to cancel)
       * @param {String} message The message about to be sent
       */
      'before-message-sent',
      
      /**
       * @event message-sent
       * Fires whenever a message is sent to the IRC server
       * @param {String} message The message that was sent
       */
      'message-sent',
      
      /**
       * @event privmsg-received
       * Fired when a PRIVMSG is received to one of the channels currently JOINed
       */
      'privmsg-received',
      
      /**
       * @event ping-received
       * Fires whenever a PING is received from the server
       * @param {String} message The full message received
       */
      'ping-received',
      
      /**
       * @event pong-sent
       * Fires whenever a PONG message is sent to the server
       */
      'pong-sent',
      
      /**
       * @event connected
       * Fires when a server connection has been established (at end of MOTD response)
       */
      'connected',
      
      /**
       * @event channel-joined
       * Fired when a new channel is joined by this user
       * @param {String} channel The name of the channel that was just joined
       */
      'channel-joined',
      
      /**
       * @event channel-left
       * Fired when a channel is left by this user
       * @param {String} channel The name of the channel just left
       */
      'channel-left',
      
      /**
       * @event member-joined-channel
       * Fired when a member joins the given channel (not including our member)
       * @param {String} channelName The name of the channel joined
       * @param {String} nickname The nickname of the person who joined the channel
       */
      'member-joined-channel',
      
      /**
       * @event member-left-channel
       * Fired when a member leaves the given channel (not including our member)
       * @param {String} channelName The name of the channel joined
       * @param {String} nickname The nickname of the person who joined the channel
       */
      'member-left-channel',
      
      /**
       * @event name-list
       * Fired when a names list is received from the server
       * @param {String} channelName The channel the list is for
       * @param {String} namesList The string list of names received, space separated
       */
      'name-list',
      
      /**
       * @event privmsg-received
       * Fires when a privage message is received to a channel or user
       * @param {String} channel The channel the message is sent to
       * @param {String} message The message sent
       */
      'privmsg-received',
      
      /**
       * @event privmsg-sent
       * Fires when a privage message is sent to a channel or user.  Useful for displaying messages the user sends
       * @param {String} channel The channel the message was sent to
       * @param {String} message The message sent
       */
      'privmsg-sent',
      
      /**
       * @event flash-ready
       * Fired when the flash component has signalled that it is ready.  Mainly for internal use...
       */
      'flash-ready',
      
      /**
       * @event whois-response-received
       * Fired when a WHOIS response is received after a WHOIS request has been sent
       * @param {Object} params All parameters decoded from the response.  Properties of this object useful here
       * are username, hostname, nickname and realname
       */
      'whois-response-received'
    );
    
    this.on('message-received', this.handleMessage, this);
    
    this.setupHax();
  },
  
  /**
   * A collection of hacks to be used until we don't need the Flash component to query these any more
   */
  setupHax: function() {
    //a method the flash proxy seems to need to ensure everything is ready
    window.isReady = function() {return true;};
    
    //TODO: hax. Flash is replying using some hard-coded callback names at the moment,
    // one of which is window.connected
    window.connected   = this.sendCredentials.createDelegate(this);
    
    window.receiveLine = this.onLineReceived.createDelegate(this);
    window.sendMessage = this.sendMessage.createDelegate(this);
    
    //when this is called by the flash it means everything is ready
    var callReady = function() { this.fireEvent('flash-ready', this); };
    window.setSWFIsReady = callReady.createDelegate(this);
  },
  
  /**
   * @property channelMatcherRegex
   * @type RegExp
   * A regex to parse the channel name from a string
   */
  channelMatcherRegex: new RegExp(/(#[A-Za-z0-9]*)\s/),
  
  /**
   * @property userMatcherRegex
   * @type RegExp
   * A regex to parse the user name from a PRIVMSG sent straight to a user (not to a channel)
   */
  userMatcherRegex: new RegExp(/^([A-Za-z0-9\-]*)\s/),
    
  /**
   * Decodes incoming messages and fires events appropriately
   * @param {String} message The full message received from the server
   */
  handleMessage: function(message) {
    //handle PINGs as a special case
    if (message == "PING :" + this.serverHost) {
      if (this.fireEvent('ping-received', message)) {
        this.pong();
      }
    } else {
      var decoded = Ext.ux.IRC.MessageDecoder.decode(message);
      
      switch (decoded.name) {
        
        case "RPL_ENDOFMOTD" : 
          this.fireEvent('connected');
          break;
          
        case "RPL_ENDOFNAMES" : 
          var channelName = decoded.params.match(this.channelMatcherRegex)[1];
          this.fireEvent('channel-joined', channelName);
          break;
        
        case "RPL_NAMREPLY" :
          var channelName = decoded.params.match(this.channelMatcherRegex)[1];
          this.fireEvent('name-list', channelName, decoded.message);
          break;
          
        case "RPL_WHOISUSER" :
          this.fireEvent('whois-response-received', decoded);
          break;
          
        case "TOPIC" :
        case "RPL_TOPIC" :
          var channelName = decoded.params.match(this.channelMatcherRegex)[1];
          this.fireEvent('topic-changed', channelName, decoded.message);
          break;
          
        case "PRIVMSG" :
          //if a message is sent straight to a user, match on userMatch result (e.g. it won't start with a '#')
          var channelMatch = decoded.params.match(this.channelMatcherRegex);
          var userMatch    = decoded.params.match(this.userMatcherRegex);
          var channelName  = channelMatch ? channelMatch[1] : userMatch[1];
           
          var nickname     = decoded.server.split("@")[0].split("!")[0].replace(":", "");
          this.fireEvent('privmsg-received', channelName, nickname, decoded.message);
          break;
          
        case 'JOIN' :
          var nickname = decoded.server.split("@")[0].split("!")[0].replace(":", "");
          this.fireEvent('member-joined-channel', decoded.message, nickname); //decoded.message is the channel name
          break;
          
        case 'PART' :
          var nickname = decoded.server.split("@")[0].split("!")[0].replace(":", "");
          this.fireEvent('member-left-channel', decoded.message, nickname); //decoded.message is the channel name
          break;
      }
    }
  },
  
  /**
   * Sends a PONG message to the server
   */
  pong: function() {
    var message = "PONG " + this.serverHost;
    
    this.sendMessage(message);
    this.fireEvent('pong-sent', message);
  },
  
  sendMessage: function(message) {
    console.log('sent ' + message);
    if (this.fireEvent('before-message-sent', message)) {
      this.chatServer().sendLine(message);
      
      this.fireEvent('message-sent', message);
    }
  },
  
  /**
   * This is called by flash when a new line is received.
   * DON'T override this unless you know what you're doing, instead use the 'message-received'
   * event which this object fires with the message as the first and only argument
   */
  onLineReceived: function(message) {
    console.log('received ' + message);
    this.fireEvent('message-received', message);
  },
  
  sendCredentials: function(credentials) {
    this.sendMessage("PASS " + this.password);
    this.sendMessage("NICK " + this.nick);
    this.sendMessage("USER rar rar rar :" + this.realname);
  },
  
  /**
   * Sends a PRIVMSG to the specified channel or user
   * @param {String} channelName The name of the channel to send to
   * @param {String} messageText The text of the message to send
   */
  sendPrivMsg: function(channelName, messageText) {
    this.sendMessage("PRIVMSG " + channelName + " :" + messageText);
    this.fireEvent('privmsg-sent', channelName, this.nick, messageText);
  },
  
  /**
   * Sends a WHOIS request to the server for the given username.  Listen to whois-response-received
   * events to receive answer as this should be considered asynchronous
   * @param {String} nickname The nickname of the user to perform a WHOIS on
   */
  whois: function(nickname) {
    this.sendMessage("WHOIS " + nickname);
  },
  
  /**
   * Joins the specified channel
   * @param {String} channel The name of the channel to join
   */
  join: function(channel) {
    this.sendMessage("JOIN " + this.normalizeChannelName(channel));
  },
  
  /**
   * Leaves the specified channel
   * @param {String} channel The name of the channel to leave
   */
  leave: function(channel) {
    this.sendMessage("PART " + this.normalizeChannelName(channel));
    this.fireEvent('channel-left', channel);
  },
  
  /**
   * Connects to the IRC server
   */
  connect: function() {
    var connectTask = new Ext.util.DelayedTask(function() {
      this.chatServer().connect(this.serverHost, 6667, 6689);
    }, this);
    
    connectTask.delay(100);
  },
  
  /**
   * Disconnects an open connection to the IRC server
   */
  disconnect: function() {
    this.sendMessage("QUIT");
  },
  
  chatServer: function() {
    return swfobject.getObjectById(this.proxyHolderId);
  },
  
  /**
   * Normalizes a channel name by ensure it is well formatted (starts with a # or a &)
   * @param {String} channel The name of the channel to normalize
   * @return {String} The normalized channel name
   */
  normalizeChannelName: function(channel) {
    return channel[0] !== '#' ? channel = "#" + channel : channel;
  }

});