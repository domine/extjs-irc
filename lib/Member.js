Ext.ns('Ext.ux.IRC');

Ext.ux.IRC.Member = function(config) {
  Ext.apply(this, config || {});
};

Ext.ux.IRC.Member.prototype = {
  /**
   * @property nickname
   * @type String
   * The member's nickname (defaults to '' and should be set in constructor)
   */
  nickname: '',
  
  /**
   * @property hostname
   * @type String
   * The member's hostname (defaults to '' and is usually fetched by a WHOIS)
   */
  hostname: '',
  
  /**
   * @property servername
   * @type String
   * The member's servername (defaults to '' and is usually fetched by a WHOIS)
   */
  servername: '',
  
  /**
   * @property realName
   * @type String
   * The member's real name (defaults to '' and is usually fetched by a WHOIS)
   */
  realName: '',
  
  /**
   * Returns the Real Name if present, if not falls back to nickname
   * @return {String} The name to display for this member
   */
  displayName: function() {
    return this.realName.length > 0 ? this.realName : this.nickname;
  }
};