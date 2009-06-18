/**
 * @class Ext.ux.IRC.ChannelsCollection
 * @extends Ext.util.MixedCollection
 * An extended version of Ext.util.MixedCollection specialised in looking after a collection of
 * Ext.ux.IRC.Channel objects
 */
Ext.ux.IRC.ChannelsCollection = Ext.extend(Ext.util.MixedCollection, {
  
  getKey: function(item) {
    return item.name;
  },

  constructor: function() {
    
    Ext.ux.IRC.ChannelsCollection.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event message-received
       * Fires when a message is received into any of the channels in this collection
       * @param {Ext.ux.IRC.Channel} channel The channel which received the message
       * @param {Ext.ux.IRC.Member} member The Member who sent the message
       * @param {Ext.ux.IRC.Message} message The message that was received
       */
      'message-received',

      /**
       * @event member-joined
       * Fires when a member joins any of the channels in this collection
       * @param {Ext.ux.IRC.Channel} channel The channel the member just joined
       * @param {Ext.ux.IRC.Member} member The member who just joined the channel
       */
      'member-joined',

      /**
       * @event member-left
       * Fires when a member leaves any of the channels in this collection
       * @param {Ext.ux.IRC.Channel} channel The channel the member just left
       * @param {Ext.ux.IRC.Member} member The member who just left the channel
       */
      'member-left'
    );
    
    this.on('add', function(index, channel, key) {
      //re-fire the channel's message-received event, adding a reference to the channel itself
      channel.on('message-received', function(member, message) {
        this.fireEvent('message-received', channel, member, message);
      }, this);

      channel.on('member-joined', function(member) {
        this.fireEvent('member-joined', channel, member);
      }, this);

      channel.on('member-left', function(member) {
        this.fireEvent('member-left', channel, member);
      }, this);
    });
  }
});