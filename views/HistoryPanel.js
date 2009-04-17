/**
 * @class IrcBackend.views.index.HistoryPanel
 * @extends Ext.Component
 * Displays a chat history
 */
IrcBackend.views.index.HistoryPanel = Ext.extend(Ext.Panel, {
  
  ulId: 'irc-chat-history-messages',
  
  /**
   * @property urlRegex
   * @type RegExp
   * A regex to match urls in the text to allow them to be highlighted
   */
  urlRegex: new RegExp("(http:\/\/[www\.]*[a-zA-Z0-9\-\_]*\.[a-z]{2,3}[\.a-z]{3,4}[\-\/\?\=\+\.\_a-zA-Z0-9]*)", 'g'),

  initComponent: function() {
    Ext.applyIf(this, {
      cls:       'irc-chat-history',
      nicknames: [],
      messages:  [],
      html: {
        tag: 'ul',
        id:  this.ulId
      },
      
      /**
       * @property currentChannel
       * @type Ext.ux.IRC.Channel
       * The channel this History panel is currently listening to
       */
      currentChannel: null
    });
    
    IrcBackend.views.index.HistoryPanel.superclass.initComponent.apply(this, arguments);
    
    ExtMVC.OS.getOS().on('channel-changed', this.setCurrentChannel, this);
    
    //Attach click handler to open links in text
    this.on('render', function() {
      this.el.on('click', function(e) {
        var t = e.getTarget('span.link');
        if (t) {
          window.open(Ext.get(t).dom.innerHTML);
        };
      }, this);
    }, this);
  },
  
  /**
   * Updates which channel this listens to, removes all current messages and adds any already in the channel
   * @param {Ext.ux.IRC.Channel} channel The channel to switch to
   */
  setCurrentChannel: function(channel) {
    //listen to any new messages on this channel, remove listener from previous channel
    if (this.currentChannel) this.currentChannel.un('message-received', this.addMessage, this);
    
    this.currentChannel = channel;
    this.currentChannel.on('message-received', this.addMessage, this);
    
    //remove existing history
    var ul = Ext.get(this.ulId);
    ul.dom.innerHTML = '';
    
    //add any messages we know about in this channel
    Ext.each(channel.messages, function(message) {
      this.addMessage(message.member, message);
    }, this);
  },
  
  addMessage: function(member, message) {
    message.created_at = message.created_at || new Date();
    
    this.addNickname(member.nickname);
    
    //match urls
    var messageMarkup = message.text.replace(this.urlRegex, "<span class='link'>$1</span>");
    
    var newLi = Ext.DomHelper.append(this.ulId, {
      tag: 'li', 
      children: [
        {tag: 'span', html: message.created_at.format("H:i"), cls: 'timestamp'},
        {tag: 'span', html: member.nickname + ":", cls: 'nickname nickname-' + this.getNicknameIndex(member.nickname)},
        messageMarkup
      ]
    });
    
    newLi.scrollIntoView(this.el);
    this.fireEvent('historyUpdated', this);
  },
  
  addNickname: function(nickname) {
    if (this.nicknames.indexOf(nickname) == -1) {
      this.nicknames.push(nickname);
    };
  },
  
  getNicknameIndex: function(nickname) {
    return this.nicknames.indexOf(nickname) % 10 + 1;
  }
  
});

Ext.reg('history_panel', IrcBackend.views.index.HistoryPanel);