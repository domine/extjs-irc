Screw.Unit(function() {
  describe("A Member", function() {
    //set up a fake proxy
    var proxy    = new Ext.ux.IRC.Proxy();
    //we need to fake swfobject so as not to actually try to connect
    swfobject = {embedSWF: Ext.emptyFn};
    proxy.connect = Ext.emptyFn;
    
    var member = new Ext.ux.IRC.Member({nickname: 'edspencer', proxy: proxy});
    
    describe("when constructing", function() {
      it("should assign config parameters to itself", function() {
        expect(member.nickname).to(equal, 'edspencer');
      });
      
      it("should provide blank values for unspecified parameters", function() {
        expect(member.username).to(equal, '');
        expect(member.realname).to(equal, '');
        expect(member.hostname).to(equal, '');
      });
      
      it("should maintain a reference to its proxy if one is given", function() {
        expect(member.proxy).to(equal, proxy);
      });
    });
    
    describe("listening to proxy events", function() {
      var decoded = {
        nickname: 'edspencer',
        username: 'newUsername',
        hostname: 'newHostname',
        realname: 'Ed Spencer'
      };
      
      var decodedForSomeoneElse = {
        nickname: 'someoneelse',
        username: 'anotherUsername',
        hostname: 'anotherHostname',
        realname: 'William Adama'
      };
      
      it("should update its data when a whois-response-received event is fired by the proxy", function() {
        proxy.fireEvent('whois-response-received', decoded);
        
        expect(member.username).to(equal, 'newUsername');
        expect(member.hostname).to(equal, 'newHostname');
        expect(member.realname).to(equal, 'Ed Spencer');
      });
      
      it("should ignore WHOIS responses not aimed at itself", function() {
        proxy.fireEvent('whois-response-received', decodedForSomeoneElse);
        
        expect(member.username).to_not(equal, 'anotherUsername');
        expect(member.username).to_not(equal, 'anotherHostname');
        expect(member.username).to_not(equal, 'William Adama');
      });
    });
  });
});
