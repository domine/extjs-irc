/**
 * @class Ext.ux.IRC.ChannelPanel
 * @extends Ext.Component
 * Represents the channels and their members managed by an Ext.ux.IRC.Manager
 */
Ext.ux.IRC.ChannelPanel = Ext.extend(Ext.Panel, {
  
  /**
   * @property baseCls
   * @type String
   * The CSS class to add to the wrapper element (defaults to 'irc-channel-panel')
   */
  baseCls: 'irc-channel-panel',
  
  /**
   * @property channelsUlCls
   * @type String
   * The CSS class to add to the <ul> element which holds the channels
   */
  channelsUlCls: 'irc-channels',
  
  /**
   * @property channelLiCls
   * @type String
   * The CSS class added to each Channel <li>.  READ-ONLY
   */
  channelLiCls: 'irc-channel',
  
  /**
   * @property membersUlCls
   * @type String
   * The CSS class to add to the <ul> elements which hold members in a given channel
   */
  membersUlCls: 'irc-members',
  
  /**
   * @property channelActiveCls
   * @type String
   * The CSS class to add to a channel <li> element when it is the active channel
   */
  channelActiveCls: 'irc-channel-active',
  
  /**
   * @property activeChannel
   * @type Ext.ux.IRC.Channel
   * The name of the currently active channel
   */
  activeChannel: '',
  
  /**
   * @property rebuildEvents
   * @type Array
   * An array of events fired by the Ext.ux.IRC.Manager that will trigger an HTML rebuild of the channels <ul>
   */
  rebuildEvents:  ['channel-joined', 'channel-left'],
  
  /**
   * @property lastSeenMessageId
   * @type Object
   * An object of channelname : numberOfMessagesSeen items.  Used to store the index of the last
   * message the user could have read in each channel based on whether the channel is active or not
   */
  lastSeenMessageId: {},

 
  initComponent: function() {
    Ext.applyIf(this, {
      html: {tag: 'ul', cls: this.channelsUlCls},
      
      /**
       * @property contextChannelName
       * @type String
       * The name of the most recently right-clicked channel - used when firing the leave-channel event
       */
      contextChannelName: ''
    });
    
    Ext.ux.IRC.ChannelPanel.superclass.initComponent.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event channel-clicked
       * Fires when a channel is clicked
       * @param {String} channelName The name of the channel that was clicked
       */
      'channel-clicked',
      
      /**
       * @event leave-channel
       * Fired when the user has indicated via the interface that they would like to leave a channel
       * Does not actually cause the channel to be left, your app needs to do that
       * @param {String} channelName The name of the channel the user would like to leave
       */
      'leave-channel'
    );
    
    ExtMVC.OS.getOS().on('channel-changed', this.setActiveChannel, this);
    
    //set up the context menu
    this.contextMenu = new Ext.menu.Menu({
      items: [
        {
          text:  'Leave this channel',
          scope: this,
          handler: function() {
            this.fireEvent('leave-channel', this.contextChannelName);
          }
        }
      ]
    });
    
    //set up click listeners once everything has been rendered
    this.on('render', function() {
      this.el.on('click',       this.handleElementClick, this);
      this.el.on('contextmenu', this.handleContextMenu,  this);
    }, this);
    
    this.addRebuildListeners();
  },
  
  /**
   * Marks the requested channel name as the active channel, and all others as inactive
   * @param {Ext.ux.IRC.Channel/String} channelName The channel to set active, or its string name
   */
  setActiveChannel: function(channelName) {
    //normalise inputs to an Ext.ux.IRC.Channel object
    if (typeof channelName == 'string') channelName = this.manager.channels.get('#' + channelName);
    
    //record the newly active channel
    this.activeChannel = channelName;
    
    //mark all messages on new channel as read
    this.setUnread(this.activeChannel, this.activeChannel.messages.length);
    
    //Rebuild the HTML and add the 'active' CSS class to the appropriate channel
    this.buildElements();
  },
  
  /**
   * Responds appropriately to clicks inside this panel
   * @param {Ext.EventObject} event The click event object
   */
  handleElementClick: function(event) {
    var name = this.getChannelFromClick(event);
    
    if (name) this.fireEvent('channel-clicked', name);
  },
  
  /**
   * Displays a context menu when a channel is right-clicked on
   * @param {Ext.EventObject} event The right-click event that was fired
   */
  handleContextMenu: function(event) {
    var name = this.getChannelFromClick(event);
    
    if (name) {
      this.contextChannelName = name;
      event.stopEvent();
      this.contextMenu.showAt(event.getXY());
    }
  },
  
  /**
   * Returns the name of the channel that was clicked on from a click event on the Element
   * @param {Ext.EventObject} event The click event
   * @return {String} The name of the channel, or null
   */
  getChannelFromClick: function(event) {
    var channel = event.getTarget('li.' + this.channelLiCls);
    if (channel) {
      return "#" + channel.id.split('-')[1];
    } else {
      return null;
    }
  },
  
  /**
   * Displays an alert showing the number of unread messages pending
   * @param {Number} number The number of messages waiting
   */
  setUnread: function(channel, number) {
    this.lastSeenMessageId[channel.name] = number;
  },
  
  /**
   * Increments the last seen count on a channel by the given number
   * @param {Number} by The number to increment by (defaults to 1)
   */
  incrementLastSeen: function(channel, by) {
    by = by || 1;
    
    this.setUnread(channel, this.lastSeenMessageId[channel.name] + by);
  },
  
  /**
   * Adds listeners to Manager events which trigger a rebuild
   */
  addRebuildListeners: function() {
    //listen to Manager events which require a rebuild
    if (this.manager) {
      Ext.each(this.rebuildEvents, function(eventName) {
        this.manager.on(eventName, this.buildElements, this);
      }, this);
      
      this.manager.channels.on('message-received', function(channel, member, message) {
        if (channel.name == this.activeChannel.name) {
          this.incrementLastSeen(channel);
        } else {
          this.buildElements();
        }
      }, this);
      
      this.manager.channels.on('member-joined', this.buildElements, this);
      this.manager.channels.on('member-left',   this.buildElements, this);
    };
  },
  
  /**
   * Builds the channel and member listings based this.manager.  Removes any existing elements
   */
  buildElements: function() {
    console.log('building');
    console.log(this);
    console.log(this.el);
    
    //clear out existing elements
    var u = this.el.child('ul.' + this.channelsUlCls);
    u.dom.innerHTML = '';
    
    this.manager.channels.each(function(channel) {
      //make sure we have a lastSeenMessageId for this channel
      this.lastSeenMessageId[channel.name] = this.lastSeenMessageId[channel.name] || 0;
      
      //calculate the number of messages not yet seen in this channel
      var unseenMessages = channel.messages.length - this.lastSeenMessageId[channel.name];
      
      //create a channel <li> element
      var chanEl = u.createChild({
        tag:      'li',
        cls:      this.channelLiCls + (channel.name == this.activeChannel.name ? ' ' + this.channelActiveCls : ''),
        id:       'channel-' + channel.name.replace('#', ''),
        children: [
          {
            tag: 'span',
            html: unseenMessages,
            cls: 'alert' + (unseenMessages == 0 ? ' hidden' : '')
          },
          {
            tag: 'h2',
            html: channel.name.replace('#', '')
          }
        ]
      });
      
      //build an array of member elements to add to this channel
      var memberEls = [];
      channel.members.each(function(member) {
        memberEls.push({tag: 'li', html: member.displayName()});
      }, this);
      
      //add the members <ul>
      var memUl = chanEl.createChild({
        tag:      'ul',
        cls:      this.membersUlCls,
        children: memberEls
      });
    }, this);
  }
});

Ext.reg('channel-panel', Ext.ux.IRC.ChannelPanel);