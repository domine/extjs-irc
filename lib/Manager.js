Ext.ns('Ext.ux.IRC');

/**
 * @class Ext.ux.IRC.Manager
 * @extends Ext.util.Observable
 * Manages a set of channels connected to via an Ext.ux.IRC.Proxy
 */
Ext.ux.IRC.Manager = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property autoConnect
   * @type Boolean
   * True to attempt connection to the IRC server immediately (defaults to true)
   */
  autoConnect: true,

  constructor: function(config) {
    /**
     * @property channels
     * @type Ext.util.MixedCollection
     * A MixedCollection of the Channels this Manager is currently JOINed to
     * relays 'message-received' events from each Channel
     */
    this.channels = new Ext.ux.IRC.ChannelsCollection();
    
    /**
     * @property proxy
     * @type Ext.ux.IRC.Proxy
     * The IRC Proxy this manager uses for its connection to the IRC server
     */
    this.proxy = new Ext.ux.IRC.Proxy(config.server);
    if (this.autoConnect) {
      this.proxy.on('flash-ready', this.proxy.connect, this.proxy);
    };
    
    Ext.ux.IRC.Manager.superclass.constructor.call(this, config);
    
    this.addEvents(
      /**
       * @event channel-joined
       * Fires when a channel is joined
       * @param {Ext.ux.IRC.Channel} channel The channel object
       */
      'channel-joined'
    );
    
    this.relayEvents(this.proxy, ['connected', 'channel-left']);
    
    this.proxy.on('channel-joined', function(channelName) {
      var chan = this.findChannel(channelName);
      
      if (chan) {
        chan.joined = true;
        this.fireEvent('channel-joined', chan);
      }
    }, this);

  },
  
  /**
   * Sends a message to the specified channel
   * @param {Ext.ux.IRC.Channel} channel The Ext.ux.IRC.Channel object to send the message to
   * @param {String} messageText The text of the message to send
   */
  sendPrivMsg: function(channel, messageText) {
    this.proxy.sendPrivMsg(channel.name, messageText);
  },
  
  /**
   * Joins a new channel
   * @param {String} channel The name of the channel to join
   * @return {Ext.ux.IRC.Channel} An object representing the channel that was just joined
   */
  join: function(channel) {
    var existingChannel = this.findChannel(channel);
    
    if (existingChannel) {
      return existingChannel;
    } else {
      //join the new channel
      var newChannel = new Ext.ux.IRC.Channel(channel, this.proxy);
      this.channels.add(newChannel);
      this.proxy.join(channel);
      
      return newChannel;
    }
  },
  
  /**
   * Leaves the specified channel
   * @param {String} channelName The name of the channel to leave
   */
  leave: function(channelName) {
    var channel = this.findChannel(channelName);
    
    if (channel) {
      this.channels.remove(channel);
      this.proxy.leave(channelName);
    }
  },
  
  /**
   * Finds a channel already connected to by name
   * @param {String} channelName The name of the channel to find
   * @return {Ext.ux.IRC.Channel/Null} The Channel object for the found channel, or null
   */
  findChannel: function(channelName) {
    return this.channels.get(channelName);
  }
});