Ext.ns('Ext.ux.IRC');

Ext.ux.IRC.Member = function(config) {
  Ext.apply(this, config, {
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
     * @property username
     * @type String
     * The member's username (defaults to '' and is usually fetched by a WHOIS)
     */
    username: '',

    /**
     * @property realname
     * @type String
     * The member's real name (defaults to '' and is usually fetched by a WHOIS)
     */
    realname: ''
  });
  
  //if we're passed a proxy in the config, set up listeners to act on WHOIS responses etc
  if (this.proxy) {
    this.proxy.on('whois-response-received', this.updateFromWhois, this);
  };
};

Ext.ux.IRC.Member.prototype = {
  
  /**
   * Returns the Real Name if present, if not falls back to nickname
   * @return {String} The name to display for this member
   */
  displayName: function() {
    return this.realname.length > 0 ? this.realname : this.nickname;
  },
  
  /**
   * Updates this Member's data based on new WHOIS data
   * @param {Object} whoisData An object containing whois details (e.g. username, realname, hostname)
   */
  updateFromWhois: function(whoisData) {
    if (whoisData.nickname == this.nickname) {
      Ext.each(['hostname', 'username', 'realname'], function(prop) {
        this.setValue(prop, whoisData[prop], true);
      }, this);
    };
  },
  
  /**
   * Sets a property on this object to a new value.
   * @param {String} property The property to set (e.g. username, hostname etc)
   * @param {Mixed} value The value to set the property to
   * @param {Boolean} ignoreNull If true, does not overwrite a non-null property with a null value
   */
  setValue: function(property, value, ignoreNull) {
    ignoreNull = ignoreNull || false;
    
    if (typeof(value) != 'undefined' && ignoreNull) {
      this[property] = value;
    };
  }
};