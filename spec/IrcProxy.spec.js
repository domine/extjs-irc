Ext = Ext || {ux: {}};

Screw.Unit(function() {
  describe("The IrcProxy library", function() {
    var irc = new Ext.ux.IRC.Proxy({serverHost: 'test.host'});
    
    //fake the sending interface so as not to actually send any messages
    irc.chatServer = function() {
      return {sendLine: Ext.emptyFn};
    };
    
    var msgPing = "PING :test.host", messageSent = '';
    
    describe("when sending outgoing messages to the server", function() {
      var msgToSend = 'some message', sentMessage = '', messageWasCancelled = false;
      
      before(function() {
        irc.on('message-sent', function(msg) {messageSent = msg;}, this);
      });
      
      it("should fire the message-sent event with the full message", function() {
        irc.on('message-sent', function(msg) {sentMessage = msg;}, this);
        
        irc.sendMessage(msgToSend);
        expect(sentMessage).to(equal, msgToSend);
      });
      
      it("should not send the message if a before-message-sent listener returns false", function() {
        irc2 = new Ext.ux.IRC.Proxy({serverHost: 'test.host'});
        irc2.on('before-message-sent', function(msg) {messageWasCancelled = true; return false;}, this);
        
        irc2.sendMessage(msgToSend);
        expect(messageWasCancelled).to(equal, true);
      });
      
      describe("when sending a WHOIS", function() {
        it("format the message correctly", function() {
          irc.whois('edspencer');
          expect(messageSent).to(equal, "WHOIS edspencer");
        });
      });
      
      describe("when JOINing a channel", function() {
        it("should send the correct JOIN message", function() {
          irc.join('#myChannel');
          expect(messageSent).to(equal, "JOIN #myChannel");
        });
      });
      
      describe("when leaving a channel", function() {
        it("should send the correct JOIN message", function() {
          irc.leave('#myChannel');
          expect(messageSent).to(equal, "PART #myChannel");
        });
        
        it("remove ensure a trailing hash is present", function() {
          irc.leave('myChannel');
          expect(messageSent).to(equal, "PART #myChannel");
        });
      });
    });
    
    describe("when connecting to the server", function() {
      var motdEnd      = ":test.host 376 nickname :End of /MOTD command.",
          wasConnected = false;
      
      it("should fire the connected event when MOTD has been completely received", function() {
        irc.on('connected', function() {wasConnected = true;}, this);
        
        //fake the reception of the end of the MOTD
        irc.onLineReceived(motdEnd);
        expect(wasConnected).to(equal, true);
      });
    });
  
    describe("when decoding incoming messages", function() {
      
      describe("regarding channel JOINs", function() {
        var namReply   = ':test.host 353 nickname = #rarrar :rarrarrar edspencer NickP',
            endOfNames = ':test.host 366 nickname #rarrar :End of /NAMES list.',
            memberJoin = 'edspencer!edspencer@82.35.66.18 JOIN :#rarrar',
            memberLeft = 'edspencer!edspencer@82.35.66.18 PART :#rarrar',
            eventSent  = false, channelName = '', nameList = '', nickname = '';
            
        before(function() {
          channelName = ''; nickname = '';
        });
        
        it("should fire a channel-joined event event at end of names", function() {
          irc.on('channel-joined', function(name) {channelName = name; eventSent = true;}, this);
          irc.onLineReceived(endOfNames);
          
          expect(eventSent).to(equal, true);
          expect(channelName).to(equal, '#rarrar');
        });
        
        it("should fire a name-list event after receiving a list of names", function() {
          irc.on('name-list', function(c, n) {channelName = c; nameList = n;}, this);
          irc.onLineReceived(namReply);
          
          expect(channelName).to(equal, '#rarrar');
          expect(nameList).to(equal, "rarrarrar edspencer NickP");
        });
        
        it("should fire a member-joined-channel event when another member joins the channel", function() {
          irc.on('member-joined-channel', function(c, n) {channelName = c; nickname = n;}, this);
          irc.onLineReceived(memberJoin);
          
          expect(channelName).to(equal, '#rarrar');
          expect(nickname).to(equal, 'edspencer');
        });
        
        it("should fire a member-left-channel event when another member leaves the channel", function() {
          irc.on('member-left-channel', function(c, n) {channelName = c; nickname = n;}, this);
          irc.onLineReceived(memberLeft);
          
          expect(channelName).to(equal, '#rarrar');
          expect(nickname).to(equal, 'edspencer');
        });
      });
      
      describe("a PRIVMSG", function() {
        var privMsg     = ":edspencer!edspencer@leakster-4AF24986.cable.ubr01.dals.blueyonder.co.uk PRIVMSG #rarrar :this is a test";
        
        //simulates a message sent straight to our user, who in this case is funkybob
        var userPrivMsg = ":edspencer!edspencer@leakster-4AF24986.cable.ubr01.dals.blueyonder.co.uk PRIVMSG funkybob :this is a test";
        
        it("should fire a privmsg-received event with the correct channel and message", function() {
          var channel = '', nickname = '', message = '';
          
          irc.on('privmsg-received', function(c, n, m) {channel = c; nickname = n; message = m;}, this);
          irc.onLineReceived(privMsg);
          
          expect(channel).to(equal, "#rarrar");
          expect(nickname).to(equal, "edspencer");
          expect(message).to(equal, "this is a test");
        });
        
        it("should correctly parse messages sent straight to a user (not via a channel)", function() {
          var channel = '', nickname = '', message = '';
          
          irc.on('privmsg-received', function(c, n, m) {channel = c; nickname = n; message = m;}, this);
          irc.onLineReceived(userPrivMsg);
          
          expect(channel).to(equal, "funkybob");
          expect(nickname).to(equal, "edspencer");
          expect(message).to(equal, "this is a test");
        });
      });
      
      describe("A Topic message", function() {
        var topicMsg = ":my.irc.server.com 332 client2 #myChannel :You did it Saul - you brought them back";
        
        it("should fire a topic-changed event with the correct channel and topic", function() {
          var channel = '', topic = '';
          
          irc.on('topic-changed', function(c, t) {channel = c; topic = t;}, this);
          irc.onLineReceived(topicMsg);
          
          expect(channel).to(equal, '#myChannel');
          expect(topic).to(equal, "You did it Saul - you brought them back");
        });
      });
      
      describe("A WHOIS response", function() {
        var hostName   = '82-35-66-18.cable.ubr01.dals.blueyonder.co.uk',
            serverName = 'my.irc.server.com';
        var whoisResponseMsg = ':' + serverName + ' 311 nickname edNickname edUsername ' + hostName + ' * :Ed Spencer';
        
        it("should fire a whois-response-received event", function() {
          var fired = false;
          
          irc.on('whois-response-received', function(o) {fired = true;}, this);
          irc.onLineReceived(whoisResponseMsg);
          
          expect(fired).to(equal, true);
        });
      });
      
      describe("A ping message", function() {
        var pingReceived = false, pongSent = false, pongMessage = '';
      
        it("should fire the ping-received event", function() {
          irc.on('ping-received', function() {pingReceived = true;}, this);
          irc.onLineReceived(msgPing);
        
          expect(pingReceived).to(equal, true);
        });
        
        it("should reply with the correct PONG message", function() {
          irc.on('pong-sent', function(msg) {pongMessage = msg; pongSent = true;}, this);
          
          irc.onLineReceived(msgPing);
          expect(pongSent).to(equal, true);
          expect(pongMessage).to(equal, "PONG test.host");
        });
      });
    });
  });
});