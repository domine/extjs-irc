Screw.Unit(function() {
  describe("A Channel", function() {
    var proxy    = new Ext.ux.IRC.Proxy();
    //we need to fake swfobject so as not to actually try to connect
    swfobject = {embedSWF: Ext.emptyFn};
    proxy.connect = Ext.emptyFn;
    
    var chanName = '#myChannel';
    var channel  = new Ext.ux.IRC.Channel(chanName, proxy);

    describe("when creating", function() {
      it("should store the channel name", function() {
        expect(channel.name).to(equal, chanName);
      });

      it("should store the proxy reference", function() {
        expect(channel.proxy).to(equal, proxy);
      });
      
      it("should set a blank topic", function() {
        expect(channel.topic).to(equal, '');
      });
    });
    
    describe("responding to proxy events", function() {
      it("should not respond to proxy events not aimed at it", function() {
        
      });
      
      /**
       * This can't currently be done because the functions attached (e.g. addMessage)
       * are attached inside a closure in Channel.ifOnThisChannel
       */
      
      // it("should add a message on privmsg-received", function() {
      //   var messageAdded = false;
      //   console.log(channel);
      //   channel.addMessage = function() {console.log('g,');messageAdded = true;};
      //   
      //   channel.addMessage('hm', 'asdf');
      //   
      //   proxy.fireEvent('privmsg-received', chanName, 'nickname', 'Message text');
      //   expect(messageAdded).to(equal, true);
      // });
    });
    
    describe("sending messages", function() {
      it("should send a message via the proxy", function() {
        var channelName = '', messageSent = '';
        proxy.sendPrivMsg = function(c, m) {channelName = c; messageSent = m;};
        
        channel.sendMessage("Test Message");
        
        expect(channelName).to(equal, chanName);
        expect(messageSent).to(equal, "Test Message");
      });
    });
    
    describe("changing topic", function() {
      var newTopic = 'My new topic';
      
      it("should update the topic", function() {
        expect(channel.topic).to(equal, '');
        
        channel.setTopic(newTopic);
        expect(channel.topic).to(equal, newTopic);
      });
      
      it("should fire a topic-changed event", function() {
        var eventTopic = '';
        channel.on('topic-changed', function(t) {eventTopic = t;}, this);
        channel.setTopic(newTopic);
        
        expect(eventTopic).to(equal, newTopic);
      });
    });
  });
});
