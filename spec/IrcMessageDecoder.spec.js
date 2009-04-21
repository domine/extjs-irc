Ext = Ext || {ux: {}};

Screw.Unit(function() {
  describe("The IrcMessageDecoder", function() {
    var d          = Ext.ux.IRC.MessageDecoder,
        serverName = 'my.irc.server.com',
        hostName   = '82-35-66-18.cable.ubr01.dals.blueyonder.co.uk';
    
    var motdStart     = ':' + serverName + ' 375 nickname :- ' + serverName + ' Message of the Day -',
        motd          = ':' + serverName + ' 372 nickname :- This is the short MOTD. To view the complete MOTD type /motd',
        motdEnd       = ':' + serverName + ' 376 nickname :End of /MOTD command.',
        namReply      = ':' + serverName + ' 353 nickname = #rarrar :rarrarrar edspencer NickP',
        endOfNames    = ':' + serverName + ' 366 nickname #rarrar :End of /NAMES list.',
        topicChange   = ':' + serverName + ' 332 nickname #myChannel :You did it Saul - you brought them back',
        whoisResponse = ':' + serverName + ' 311 nickname edNickname edUsername ' + hostName + ' * :Ed Spencer';
        
    
    it("should decode beginning of MOTD commands", function() {
      var o = d.decode(motdStart);
      
      expect(o.number).to(equal, 375);
      expect(o.name).to(equal, "RPL_MOTDSTART");
      expect(o.server).to(equal, serverName);
      expect(o.message).to(equal, "- my.irc.server.com Message of the Day -");
      expect(o.params).to(equal, "nickname :- my.irc.server.com Message of the Day -");
    });
    
    it("should decode MOTD commands", function() {
      var o = d.decode(motd);
      
      expect(o.number).to(equal, 372);
      expect(o.name).to(equal, "RPL_MOTD");
      expect(o.server).to(equal, serverName);
      expect(o.message).to(equal, "- This is the short MOTD. To view the complete MOTD type /motd");
      expect(o.params).to(equal, "nickname :- This is the short MOTD. To view the complete MOTD type /motd");
    });
    
    it("should decode end of MOTD commands", function() {
      var o = d.decode(motdEnd);
      
      expect(o.number).to(equal, 376);
      expect(o.name).to(equal, "RPL_ENDOFMOTD");
      expect(o.server).to(equal, serverName);
      expect(o.message).to(equal, "End of /MOTD command.");
      expect(o.params).to(equal, "nickname :End of /MOTD command.");
    });
    
    it("should decode topic commands", function() {
      var o = d.decode(topicChange);
      
      expect(o.number).to(equal, 332);
      expect(o.name).to(equal, "RPL_TOPIC");
      expect(o.server).to(equal, serverName);
      expect(o.message).to(equal, "You did it Saul - you brought them back");
      expect(o.params).to(equal, 'nickname #myChannel :You did it Saul - you brought them back');
    });
    
    it("should decode WHOIS responses", function() {
      var o = d.decode(whoisResponse);
      
      expect(o.number).to(equal, 311);
      expect(o.name).to(equal, "RPL_WHOISUSER");
      expect(o.server).to(equal, serverName);
      
      expect(o.hostname).to(equal, hostName);
      expect(o.username).to(equal, 'edUsername');
      expect(o.nickname).to(equal, 'edNickname');
      expect(o.realname).to(equal, 'Ed Spencer');      
    });
  });
});