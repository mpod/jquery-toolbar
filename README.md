#jquery-toolbar
This is a SVG based jQuery toolbar widget. No CSS is used here!!!

##Options
* paperWidth: width of the toolbar in px (default: 500),
* paperHeight: height of the toolbar in px (default: 40),
* buttonSpace: space between buttons in px (default: 4),
* menuPadding: padding inside menu in px (default: 4),
* iconPadding: padding inside button in px (default: 4),
* menu: array of menu item configurations,
* colors: object of three colors; background, mouseover, and selected. 

###Menu item configuration
* icon: URI of the image, or function(paper, item) that returns Raphael 
object,
* width: width of the menu item in px,
* height: height of the menu item in px,
* click: click event handler. First parameter of event handler function is item.
* id: id of the item,
* group: id of the group. Only one item in the group can be selected.
* submenu: array of submenu items, or string value 'color' which causes a color
picker submenu to be generated.
* propagateClickFromSubmenu: click events on submenu items are propagated 
to this parent item. Second parameter of event handler function is submenu item 
on which click event was triggered.
* copyIconFromSubmenu: automatically takes over a icon from first selected item 
in submenu. 
* selected: item is selected,
* selectable: item can be selected. Items with group property set are 
automatically selectable.
* data: container of user-defined data.

###Special menu items
* br: 
* col:
* sep:

##Methods
* getItem(id): gets the item object with specified id.
* clickItem(item): executes click handler on provided item object.

#References
* jQuery - http://jquery.com/
* jQuery UI - http://jqueryui.com/
* Raphael - http://raphaeljs.com/
* Underscore - http://underscorejs.org/
* Demo page uses icons from http://designmodo.com/

