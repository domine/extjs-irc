Ext = Ext || {ux: {}};

Screw.Unit(function() {
  describe("The Irc Manager", function() {
    var serverConfig = {host: 'test.host'};
    var man;
    
    before(function() {
      man = new Ext.ux.IRC.Manager({server: serverConfig});

      //fake the proxy so as not to send any actual requests
      man.proxy.sendMessage = Ext.emptyFn;
      man.proxy.join        = Ext.emptyFn;
      man.proxy.connect     = Ext.emptyFn;
    });
    
    describe("messages", function() {
      describe("(receiving)", function() {
        var channelName = '#rarrar', message = 'This is a test message';
        
        it("should find the relevant channel", function() {
          
        });
        
        it("should add a message to the relevant channel when a PRIVMSG is received", function() {
          var channelNameReceived = '', messageReceived = '';
          
          
          man.proxy.fireEvent('privmsg-received', channelName, message);
        });
      });
    });
    
    describe("channels", function() {
      var chan1, chan2;
      before(function() {
        //add a couple of fake channels
        chan1 = new Ext.ux.IRC.Channel('#channel1', man.proxy);
        chan2 = new Ext.ux.IRC.Channel('#channel2', man.proxy);
        man.channels.add(chan1); man.channels.add(chan2);
      });
      
      describe("finding channels", function() {
        it("should find any channels already joined", function() {
          expect(man.findChannel('#channel1')).to(equal, chan1);
          expect(man.findChannel('#channel2')).to(equal, chan2);
        });

        it("should not find channels not joined already", function() {
          expect(man.findChannel('#noSuchChannel')).to(equal, null);
        });        
      });
      
      describe("joining channels", function() {
        var previousCount;
        
        before(function() {
          previousCount = man.channels.length;
        });
        
        it("should join new channels", function() {
          man.join("#channel3");
          expect(man.channels.length).to(equal, previousCount + 1);
        });
        
        it("should mark a channel as joined when the channel-joined event is received from the proxy", function() {
          var chan3 = man.join('#channel3');
          expect(chan3.joined).to(equal, false);
          
          man.proxy.fireEvent('channel-joined', '#channel3');
          expect(chan3.joined).to(equal, true);
        });
        
        it("should fire its own channel-joined event when a channel is joined", function() {
          var channel;
          man.on('channel-joined', function(c) {channel = c;}, this);
          
          var chan3 = man.join('#channel3');
          expect(chan3.joined).to(equal, false);
          
          man.proxy.fireEvent('channel-joined', '#channel3');
          expect(channel).to(equal, chan3);
        });
        
        it("should add names to a channel from a names list", function() {
          expect(chan1.members.length).to(equal, 0);
          
          man.proxy.fireEvent('name-list', chan1.name, "edspencer NickP rarrar");
          console.log(chan1);
          console.log(chan1.members);
          expect(chan1.members.length).to(equal, 3);
        });
        
        it("should not re-join a channel already joined", function() {
          man.join("#channel1");
          expect(man.channels.length).to(equal, previousCount);
        });
      });
    });
    
  });
});