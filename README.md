#jquery-toolbar
This is a SVG based jQuery toolbar widget. No CSS is used here!!!

#Configuration
How to include jquery-toolbar inside web application check out demo page.

##Options
* paperWidth: width of the toolbar in px (default: 500),
* paperHeight: height of the toolbar in px (default: 40),
* buttonSpace: space between buttons in px (default: 4),
* menuPadding: padding in menu in px (default: 4),
* iconPadding: padding in button in px (default: 4),
* menu: configuration of buttons.

###Item configuration
* icon: 
* width:
* height:
* click:
* group:
* submenu:
* propagateClickFromSubmenu: 
* copyIconFromSubmenu:
* selected:
* selectable: 
* data:

###Special items
* br:
* col:
* sep:

###Special menu
* color:

##Methods
* getItem(id): gets the item object with specified id.
* clickItem(item): executes click handler on provided item object. If the item 
is string value then getItem is called first.

#References
* jQuery - http://jquery.com/
* jQuery UI - http://jqueryui.com/
* Raphael - http://raphaeljs.com/
* Underscore - http://underscorejs.org/
* Demo page uses icons from http://designmodo.com

