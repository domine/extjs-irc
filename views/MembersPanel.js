/**
 * @class IrcBackend.views.index.MembersPanel
 * @extends Ext.Panel
 * Displays all chatters currently in the room
 */
IrcBackend.views.index.MembersPanel = Ext.extend(Ext.Container, {
  
  /**
   * Adds a new Section to the members panel
   * @param {Object} config The section config
   */
  addSection: function(config) {
    var section = new IrcBackend.views.index.Section(config);
    this.sections.push(section);
    this.items.add(section);
    
    return section;
  },
  
  /**
   * @property defaultSection
   * @type String
   * The string name of the default section to add a Member to
   */
  defaultSection: 'Staff',
  
  members:  [],
  sections: [],
  defaultType: 'member',
  
  /**
   * Adds a member to the specified section
   * @param {Object} config The member object
   * @param {String} sectionName The string name of the section to add to (defaults to this.defaultSection)
   */
  addMember: function(config, sectionName) {
    sectionName = sectionName || this.defaultSection;
    
    var section = this.getSection(sectionName);
    
    var member = new IrcBackend.views.index.Member(config);
    this.members.push(member);
    section.add(member);
    
    return member;
  },
  
  /**
   * Returns a Section by name
   * @param {String} sectionName The name of the section to return
   * @return {IrcBackend.views.index.Session} The Section found
   */
  getSection: function(sectionName) {
    var section;
    
    Ext.each(this.sections, function(s) {
      if (s.name == sectionName) {section = s;}
    }, this);
    
    return section;
  },
  
  /**
   * Returns the item index of a particular section
   * @param {String} sectionName the name of the section whose index to return
   * @return {Number} The index of the section
   */
  getSectionIndex: function(sectionName) {
    var index;
    
    Ext.each(this.sections, function(s, i) {
      if (s.name == sectionName) {index = i;}
    }, this);
    
    return index;
  },
  
  /**
   * Sets the given Member view object to active and all others to inactive
   * @param {IrcBacked.views.index.Member} member The member view object to set active
   */
  setActive: function(member) {
    Ext.each(this.members, function(member) {
      member.el.removeClass('active');
    }, this);
    
    member.el.addClass('active');
  },

  initComponent: function() {
    //FIXME: this is shit
    this.sections.push(new IrcBackend.views.index.Section({name: 'Staff'}));
    this.sections.push(new IrcBackend.views.index.Section({name: 'You are helping'}));
    this.sections.push(new IrcBackend.views.index.Section({name: 'Awaiting help'}));
    this.sections.push(new IrcBackend.views.index.Section({name: 'Others are helping'}));
    
    Ext.apply(this, {
      items: this.sections,
      autoEl: {
        tag: 'ul',
        cls: 'irc-members'
      }
    });
    
    IrcBackend.views.index.MembersPanel.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('members_panel', IrcBackend.views.index.MembersPanel);