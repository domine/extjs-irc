/**
 * @class Ext.ux.IRC.ChatPanel
 * @extends Ext.Panel
 * Displays the current chat and a send message form
 */
Ext.ux.IRC.ChatPanel = Ext.extend(Ext.Panel, {
  
  sendMessageInputId: 'irc-message-to-send',

  initComponent: function() {
    this.historyPanel = new Ext.ux.IRC.HistoryPanel({
      region:     'center',
      autoScroll: true
    });
    
    this.sendMessagePanel = new Ext.Panel({
      region:    'south',
      height:    22,
      minHeight: 22,
      split:     true,
      cls:      'irc-chat-message',
      
      html: {
        tag:      'textarea',
        style:    'width: 100%; height: 100%;',
        id:       this.sendMessageInputId,
        tabindex: 1
      }
    });

    Ext.applyIf(this, {
      title:  'Chatting with Yuri Gagarin',
      cls:    'irc-chat',
      layout: 'border',
      items:  [this.historyPanel, this.sendMessagePanel]
    });
    
    Ext.ux.IRC.ChatPanel.superclass.initComponent.apply(this, arguments);
    
    this.on('afterlayout', this.setupTextarea, this);
    
    this.addEvents(
      /**
       * @event send-message
       * Fired when the enter key is pressed inside the textarea
       * @param {String} text The text currently in the textarea
       */
      'send-message'
    );
  },
  
  /**
   * @property sentMessages
   * @type Array
   * Array of messages sent so far this session, with newest messages first
   */
  sentMessages: [],
  
  /**
   * @property sentMessageHistoryIndex
   * @type Number
   * The index of the sentMessages array currently being shown in the textarea
   */
  sentMessageHistoryIndex: -1,
  
  /**
   * Sets up the textarea input behaviour.  Run this after render
   */
  setupTextarea: function() {
    this.msgInput = Ext.get(this.sendMessageInputId);
    
    this.msgInput.dom.onkeydown = this.handleKeyPress.createDelegate(this);
  },
  
  /**
   * Listens for special key presses, fires the appropriate actions
   * @param {Ext.EventObject} event The key event
   */
  handleKeyPress: function(event) {
    var code = event.keyCode, eo = Ext.EventObject;
    
    switch (code) {
      case eo.ENTER : return this.sendMessage();    break;
      case eo.UP    : return this.historyBack();    break;
      case eo.DOWN  : return this.historyForward(); break;
    }
  },
  
  /**
   * Sends the message currently inside the textarea, adds to history
   */
  sendMessage: function() {
    var message = this.msgInput.getValue().replace(/\n/, '');
    
    //don't attempt to send an empty string
    if (!message || message.length == 0) return false;
    
    //reset history to latest message sent
    this.sentMessageHistoryIndex = -1;
    
    this.sentMessages.unshift(message);
    this.fireEvent('send-message', message);
    
    this.msgInput.dom.value = '';
    return false; //stops the enter key creating new line on textarea
  },
  
  /**
   * Shows the previous stored history message if one is present
   */
  historyBack: function() {
    if (this.showHistoryMessage(this.sentMessageHistoryIndex + 1)) {
      this.sentMessageHistoryIndex += 1;
    };
  },
  
  /**
   * Shows the next stored history message if one is present
   */
  historyForward: function() {
    if (this.showHistoryMessage(this.sentMessageHistoryIndex - 1)) {
      this.sentMessageHistoryIndex -= 1;
    };
  },
  
  /**
   * Displays a previously sent message from the message history
   * @param {Number} index The index of the sentMessages history array to display
   * @return {Boolean} True if history message successfully shown, false otherwise
   */
  showHistoryMessage: function(index) {
    var val = this.sentMessages[index];
    
    if (val) {
      this.msgInput.dom.value = val;
      return true;
    };
    
    return false;
  }
});

Ext.reg('chat_panel', Ext.ux.IRC.ChatPanel);