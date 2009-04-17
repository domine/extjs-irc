Ext = Ext || {ux: {}};

Screw.Unit(function() {
  describe("The IrcMessageDecoder", function() {
    var d = Ext.ux.IRC.MessageDecoder;
    
    var motdStart  = ':serverus.webserverdns.com 375 nickname :- serverus.webserverdns.com Message of the Day -',
        motd       = ':serverus.webserverdns.com 372 nickname :- This is the short MOTD. To view the complete MOTD type /motd',
        motdEnd    = ":serverus.webserverdns.com 376 nickname :End of /MOTD command.",
        namReply   = ':serverus.webserverdns.com 353 nickname = #rarrar :rarrarrar edspencer NickP',
        endOfNames = ':serverus.webserverdns.com 366 nickname #rarrar :End of /NAMES list.';
        
    
    it("should decode beginning of MOTD commands", function() {
      var o = d.decode(motdStart);
      
      expect(o.number).to(equal, 375);
      expect(o.name).to(equal, "RPL_MOTDSTART");
      expect(o.server).to(equal, "serverus.webserverdns.com");
      expect(o.message).to(equal, "- serverus.webserverdns.com Message of the Day -");
      expect(o.params).to(equal, "nickname :- serverus.webserverdns.com Message of the Day -");
    });
    
    it("should decode MOTD commands", function() {
      var o = d.decode(motd);
      
      expect(o.number).to(equal, 372);
      expect(o.name).to(equal, "RPL_MOTD");
      expect(o.server).to(equal, "serverus.webserverdns.com");
      expect(o.message).to(equal, "- This is the short MOTD. To view the complete MOTD type /motd");
      expect(o.params).to(equal, "nickname :- This is the short MOTD. To view the complete MOTD type /motd");
    });
    
    it("should decode end of MOTD commands", function() {
      var o = d.decode(motdEnd);
      
      expect(o.number).to(equal, 376);
      expect(o.name).to(equal, "RPL_ENDOFMOTD");
      expect(o.server).to(equal, "serverus.webserverdns.com");
      expect(o.message).to(equal, "End of /MOTD command.");
      expect(o.params).to(equal, "nickname :End of /MOTD command.");
    });
  });
});