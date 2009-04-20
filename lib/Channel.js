Ext.ns('Ext.ux.IRC');

/**
 * @class Ext.ux.IRC.Channel
 * @extends Ext.util.Observable
 * Represents a channel connected to
 */
Ext.ux.IRC.Channel = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property joined
   * @type Boolean
   * True if this channel is currently JOINed
   */
  joined: false,
  
  /**
   * Constructor function, initializes the object
   * @param {String} name The name of the channel (e.g. #extjs)
   * @param {Ext.ux.IRC.Proxy} proxy The Ext.ux.IRC.Proxy this channel should communicate through
   */
  constructor: function(name, proxy) {
    /**
     * @property name
     * @type String
     * The name of this channel (should be set with first argument to constructor)
     */
    this.name = name;
    
    /**
     * @property proxy
     * @type Ext.ux.IRC.Proxy
     * The IRC Proxy this channel can communicate through
     */
    this.proxy = proxy;
    
    /**
     * @property messages
     * @type Array
     * An array of Ext.ux.IRC.Message objects received on this channel
     */
    this.messages = [];
    
    /**
     * @property members
     * @type Ext.util.MixedCollection
     * An array of all current members of this channel
     */
    this.members = new Ext.util.MixedCollection(false, function(item) {return item.nickname;});
    
    /**
     * @property topic
     * @type String
     * The topic assigned to this channel (defaults to an empty string until set)
     */
    this.topic = '';
    
    /**
     * Listen to events pertaining to this channel
     */
    this.onIfThisChannel(this.proxy, {
      'privmsg-received':      this.addMessage,
      'privmsg-sent':          this.addMessage,
      'name-list':             this.addMembers,
      'member-joined-channel': this.addMember,
      'member-left-channel':   this.removeMember,
      'topic-changed':         this.changeTopic
    }, this);
     
    Ext.ux.IRC.Channel.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event message-received
       * Fired whenever a message is received into this channel
       * @param {Ext.ux.IRC.Member} member The member who sent the message
       * @param {Ext.ux.IRC.Message} message The message that was sent
       */
      'message-received',
      
      /**
       * @event member-joined
       * Fired whenever a member joins this channel
       * @param {Ext.ux.IRC.Member} member The Member who just joined
       */
      'member-joined',
      
      /**
       * @event member-left
       * Fired whenever a members leaves this channel
       * @param {Ext.ux.IRC.Member} member The member who just left the channel
       */
      'member-left',
      
      /**
       * @event topic-changed
       * Fired when the topic has been changed
       * @param {String} topic The new topic name
       */
      'topic-changed'
    );
  },
  
  /**
   * Sends a message to this channel via the proxy
   * @param {String} message The message to send
   */
  sendMessage: function(message) {
    this.proxy.sendPrivMsg(this.name, message);
  },
  
  /**
   * Handles events from the given Observable if this is the correct channel
   * @param {Ext.util.Observable} firingObject The event firing object to act on if this is the correct channel
   * @param {Object} listeners An object of listeners, e.g.: {'click': function() {... do something ...}}
   * @param {Object} scope The scope to call each listener in (defaults to this)
   */
  onIfThisChannel: function(firingObject, listeners, scope) {
    var scope = scope || this;
    
    for (eventName in listeners) {
      firingObject.on(eventName, function() {
        var listenerFunc = listeners[eventName];
        
        return function() {
          //the first argument is always a channel name in these events
          var channelName  = arguments[0];
          var listenerArgs = Array.prototype.slice.call(arguments, 1);
          
          this.ifThisChannel(channelName, function() {
            listenerFunc.apply(this, listenerArgs);
          });
        };
      }(), scope);
    }
  },
  
  /**
   * Calls a function if the channel name argument matches this channel's name
   * @param {String} channelName The name of the channel the message was intended for
   * @param {Function} lambda The function to run if this is the right channel
   */
  ifThisChannel: function(channelName, lambda) {
    if (channelName == this.name) {
      lambda.call(this);
    };
  },
  
  /**
   * Updates this channel's topic
   * @param {String} topic The new topic name
   */
  changeTopic: function(topic) {
    this.topic = topic;
    this.fireEvent('topic-changed', topic);
  },
  
  /**
   * Creates a new Message object and adds it to the channel's messages array
   * @param {String} nickname The nickname the message came from
   * @param {String} messageText The message sent by the user
   * @return {Ext.ux.IRC.Message|null} The created message object or null if the nickname isn't found on this channel
   */
  addMessage: function(nickname, messageText) {
    var mem = this.findMember(nickname);
    if (mem) {
      var message = new Ext.ux.IRC.Message({member: mem, text: messageText});
      this.messages.push(message);
      
      this.fireEvent('message-received', mem, message);
    } else {
      return null;
    };
  },
  
  /**
   * Adds a member to the channel's list
   * @param {String} nickname The member's nickname
   */
  addMember: function(nickname) {
    if (!this.findMember(nickname) && nickname.length > 0) {
      var mem = new Ext.ux.IRC.Member({nickname: nickname});
      this.members.add(mem);
      
      this.fireEvent('member-joined', mem);
      
      return mem;
    };
  },
  
  /**
   * Batch-adds members
   * @param {String} memberList A list of space-separated member nicknames to add
   */
  addMembers: function(memberList) {
    Ext.each(memberList.split(" "), function(name) {
      this.addMember(name);
    }, this);
  },
  
  /**
   * Removes the given member from this channel's member listing
   * @param {String} nickname The nickname of the member to remove
   */
  removeMember: function(nickname) {
    var member = this.findMember(nickname);
    
    if (member) {
      this.members.remove(member);
      this.fireEvent('member-left', member);
    };
  },
  
  /**
   * Finds a member of this channel by nickname
   * @param {String} nickname The member's nickname
   * @return {Ext.ux.IRC.Member|Null} The Member object or null
   */
  findMember: function(nickname) {
    return this.members.get(nickname);
  }
});