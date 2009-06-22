/**
 * @class Ext.ux.IRC.ChatPanel
 * @extends Ext.Panel
 * Displays the current chat and a send message form
 */
Ext.ux.IRC.ChatPanel = Ext.extend(Ext.Panel, {
  
  constructor: function(config) {
    config = config || {};
    
    Ext.applyIf(config, {
      historyPanelConfig    : {},
      sendMessagePanelConfig: {}
    });
    
    Ext.apply(this, {
      sendMessageInputId : 'irc-message-to-send-' + new Date().format('is'),

      sendMessageSubmitId: 'irc-message-send-button-' + new Date().format('is'),
      
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
      sentMessageHistoryIndex: -1
    });
    
    this.historyPanelConfig = Ext.applyIf(config.historyPanelConfig, {
      region:     'center',
      autoScroll: true
    });
    
    this.sendMessagePanelConfig = Ext.applyIf(config.sendMessagePanelConfig, {
      region:    'south',
      height:    50,
      minHeight: 50,
      split:     true,
      
      html: {
        cls: 'irc-chat-message',
        children: [
          {
            tag:      'input',
            type:     'submit',
            value:    'Send',
            style:    'width: 20%; float: right;',
            id:       this.sendMessageSubmitId,
            tabindex: 2
          },
          {
            tag:      'textarea',
            style:    'width: 75%; height: 100%;',
            id:       this.sendMessageInputId,
            tabindex: 1   
          }
        ]
      }
    });
    
    Ext.ux.IRC.ChatPanel.superclass.constructor.apply(this, arguments);
  },

  initComponent: function() {
    /**
     * @property historyPanel
     * @type Ext.ux.IRC.HistoryPanel
     * The panel used to display chat history. Supply config options in historyPanelConfig
     */
    this.historyPanel = new Ext.ux.IRC.HistoryPanel(this.historyPanelConfig);
    
    /**
     * @property sendMessagePanel
     * @type Ext.Panel
     * The panel used to allow the user to send a message. Supply config options in sendMessagePanelConfig
     */
    this.sendMessagePanel = new Ext.Panel(this.sendMessagePanelConfig);

    Ext.applyIf(this, {
      title:  'Connecting...',
      cls:    'irc-chat',
      layout: 'border',
      items:  [this.historyPanel, this.sendMessagePanel]
    });
    
    Ext.ux.IRC.ChatPanel.superclass.initComponent.apply(this, arguments);
    
    this.on('afterlayout', this.setupTextarea, this);
    this.on('afterlayout', this.setupSendButton, this);
    
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
   * Sets up the textarea input behaviour.  Run this after render
   */
  setupTextarea: function() {
    this.msgInput = Ext.get(this.sendMessageInputId);
    
    this.msgInput.dom.onkeydown = this.handleKeyPress.createDelegate(this);
  },
  
  /**
   * Listens to clicks and keypresses on the send button
   */
  setupSendButton: function() {
    var s = Ext.get(this.sendMessageSubmitId);
    
    s.on('click', this.sendMessage, this);
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