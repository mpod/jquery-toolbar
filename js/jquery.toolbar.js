// jquery-toolbar 1.0
// 2014, Matija Podravec
// Licensed under the MIT (https://raw.github.com/mpod/jquery-toolbar/master/LICENSE) license.

(function($) {
  var cnt = 0;

  $.widget("ts.toolbar", {

    options: { 
      paperWidth: 500,
      paperHeight: 40,
      buttonSpace: 4,
      menuPadding: 4,
      iconPadding: 6, 
      colors: {
        background: '#D1D9EF',
        mouseover: '#5F8AFF',
        selected: '#2C61EF'
      }  
    },

    cnt: 0,
    containerEl: null,
    toolbar: {},

    getItem: function(id) {
      var checkSubmenu = function(submenu) {
        for (var i = 0; i < submenu.items.length; i++) {
          var item = submenu.items[i];
          if (item.id === id)
            return item;
          else if (item.submenu) {
            var subItem = checkSubmenu(item.submenu);
            if (subItem) return subItem;
          }
        }
        return null;
      }
      return checkSubmenu(this.toolbar);
    },

    clickItem: function(item) {
      if (_.isString(item))
        item = this.getItem(item);

      if (item)
        this._mainButtonClicked(item);
    },

    _create: function() {
      cnt++;
      this.cnt = cnt;
      this.containerEl = this.element;    
      var self = this;
      $('body').click(function(evt) {
        self.containerEl.trigger('refresh');
      });

      this.toolbar = this._createMenu(this.options.menu, null, this.options.paperWidth, this.options.paperHeight);
    },

    _createMenu: function(attributes, parentItem, paperWidth, paperHeight) {
      if (!attributes) return;
      var menu = {};
      menu.menuElId = _.uniqueId();
      menu.menuEl = $('<div id="ts-menu-' + menu.menuElId + '" class="ts-menu"></div>').appendTo(this.containerEl); 
      menu.menuEl.bind('dragstart', function() {
        return false;
      });
      menu.menuEl.css('background-color', this.options.colors.background);
      menu.menuEl.css('z-index', 1000);
      //menu.menuEl.css('border', '1px solid ' + this.options.colors.mouseover);
      menu.menuEl.find('svg').css('left', 0).css('top', 0);
      menu.parentItem = parentItem;
      menu.isSubmenu = parentItem !== null;
      menu.items = [];
      menu.layout = {
        width: 0,
        height: 0,
        nextX: 0,
        nextY: 0,
        columnX: 0,
        rowHeight: 0,
        nextColumnX: 0
      };

      for (var i = 0; i < attributes.length; i++) {
        var item;
        if (_.isString(attributes[i])) {
          item = this._prepareSpecial(attributes[i]);
        } else {
          item = _.extend({width: 32, height: 32, selected: false, expanded: false, selectable: false} ,
            _.pick(attributes[i], 'icon', 'tooltip', 'type', 'click', 'width', 'height', 'group',
              'selectable', 'selected', 'data', 'doNotRefresh', 'copyIconFromSubmenu', 
              'propagateClickFromSubmenu', 'unclickable', 'getSubmenuAttributes', 'label',
              'fontSize', 'textAnchor', 'id'
            )
          );
          item.selectable = item.selectable || (item.group !== void 0);
          if (attributes[i].submenu || attributes[i].getSubmenuAttributes) {
            var attr = attributes[i].submenu || attributes[i].getSubmenuAttributes();
            if (_.isString(attr)) {
              item.submenu = this._prepareSpecial(attr, item);
            } else {
              item.submenu = this._createMenu(attr, item);
            }
          }
        }
        item.containerMenu = menu;
        menu.items.push(item);
        this._updateDimensions(item);
      }

      var paper = Raphael(menu.menuEl.get(0), paperWidth || menu.layout.width, paperHeight || menu.layout.height);
      paper.canvas.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      menu.paper = paper;
      menu.menuEl.css({
        width: (paperWidth || menu.layout.width) + 'px',
        height: (paperHeight || menu.layout.height) + 'px',
      });
      if (menu.isSubmenu) {
        menu.menuEl.css({ position: 'absolute' }).hide();
      }

      menu.layout.nextX = menu.layout.nextY = menu.layout.columnX = 0;
      menu.layout.rowHeight = menu.layout.nextColumnX = 0;
      for (var i = 0; i < menu.items.length; i++) {
        var item = menu.items[i];
        var button = this._createButton(item, paper);
        button.transform(this._getTransformation(item));
        this._highlightItem(item);
        this._updateNextPosition(item);
      }

      return menu;
    },

    _prepareSpecial: function(type) {
      var item;
      var c = this.options.colors;
      var space = this.options.buttonSpace;
      var iconPadding = this.options.iconPadding;
      var menuPadding = this.options.menuPadding;
      switch (type) {
        case 'br':
          item = {
            type: 'br',
            icon: function(paper, item) {
              return paper.rect(0, 0, 0, 0);
            },
            width: 2 * space,
            height: 0,
            unclickable: true
          };
          break;
        case 'sep':
          item = {
            type: 'sep',
            icon: function(paper, item) {
              if (item.height == 0) {
                item.height = item.containerMenu.layout.rowHeight;
              }
              var icon = paper.path([['M', space, iconPadding], ['L', space, item.height - iconPadding]]);
              return icon;
            },
            width: 2 * space,
            height: 0,
            unclickable: true
          };
          break;
        case 'col':
          item = {
            type: 'col',
            icon: function(paper, item) {
              if (item.height == 0) {
                item.height = item.containerMenu.layout.height - 2 * this.options.menuPadding;
              }
              var icon = paper.path([['M', space, iconPadding], ['L', space, item.height - iconPadding]]);
              return icon;
            },
            width: 2 * space,
            height: 0,
            unclickable: true
          };
          break;
        case 'color':
          // Returns submenu
          var colors = [
            '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FFCCCC', '#CC9999', '#996666', '#FF9999', '#663333', '#CC6666', '#FF6666', '#993333', '#CC3333', '#FF3333', 'br',
            '#330000', '#660000', '#990000', '#CC0000', '#FF0000', '#FF3300', '#FF6633', '#CC3300', '#FF9966', '#CC6633', '#993300', '#FF6600', '#FFCC99', '#CC9966', '#996633', '#FF9933', 'br',
            '#663300', '#CC6600', '#FF9900', '#FFCC66', '#CC9933', '#996600', '#FFCC33', '#CC9900', '#FFCC00', '#FFFFCC', '#CCCC99', '#999966', '#FFFF99', '#666633', '#CCCC66', '#FFFF66', 'br',
            '#999933', '#CCCC33', '#FFFF33', '#333300', '#666600', '#999900', '#CCCC00', '#FFFF00', '#CCFF00', '#CCFF33', '#99CC00', '#CCFF66', '#99CC33', '#669900', '#99FF00', '#CCFF99', 'br',
            '#99CC66', '#669933', '#99FF33', '#336600', '#66CC00', '#66FF00', '#99FF66', '#66CC33', '#339900', '#66FF33', '#33CC00', '#33FF00', '#CCFFCC', '#99CC99', '#669966', '#99FF99', 'br',
            '#336633', '#66CC66', '#66FF66', '#339933', '#33CC33', '#33FF33', '#003300', '#006600', '#009900', '#00CC00', '#00FF00', '#00FF33', '#33FF66', '#00CC33', '#66FF99', '#33CC66', 'br',
            '#009933', '#00FF66', '#99FFCC', '#66CC99', '#339966', '#33FF99', '#006633', '#00CC66', '#00FF99', '#66FFCC', '#33CC99', '#009966', '#33FFCC', '#00CC99', '#00FFCC', '#CCFFFF', 'br',
            '#99CCCC', '#669999', '#99FFFF', '#336666', '#66CCCC', '#66FFFF', '#339999', '#33CCCC', '#33FFFF', '#003333', '#006666', '#009999', '#00CCCC', '#00FFFF', '#00CCFF', '#33CCFF', 'br',
            '#0099CC', '#66CCFF', '#3399CC', '#006699', '#0099FF', '#99CCFF', '#6699CC', '#336699', '#3399FF', '#003366', '#0066CC', '#0066FF', '#6699FF', '#3366CC', '#003399', '#3366FF', 'br',
            '#0033CC', '#0033FF', '#CCCCFF', '#9999CC', '#666699', '#9999FF', '#333366', '#6666CC', '#6666FF', '#333399', '#3333CC', '#3333FF', '#000033', '#000066', '#000099', '#0000CC', 'br',
            '#0000FF', '#3300FF', '#6633FF', '#3300CC', '#9966FF', '#6633CC', '#330099', '#6600FF', '#CC99FF', '#9966CC', '#663399', '#9933FF', '#330066', '#6600CC', '#9900FF', '#CC66FF', 'br',
            '#9933CC', '#660099', '#CC33FF', '#9900CC', '#CC00FF', '#FFCCFF', '#CC99CC', '#996699', '#FF99FF', '#663366', '#CC66CC', '#FF66FF', '#993399', '#CC33CC', '#FF33FF', '#330033', 'br',
            '#660066', '#990099', '#CC00CC', '#FF00FF', '#FF00CC', '#FF33CC', '#CC0099', '#FF66CC', '#CC3399', '#990066', '#FF0099', '#FF99CC', '#CC6699', '#993366', '#FF3399', '#660033', 'br',
            '#CC0066', '#FF0066', '#FF6699', '#CC3366', '#990033', '#FF3366', '#CC0033', '#FF0033'
          ];
          var self = this;
          var colorsMenu = [];
          _.each(colors, function(c) {
            if (c === 'br') {
              colorsMenu.push(self._prepareSpecial('br'));
            } else {
              colorsMenu.push({
                icon: function(paper, item) {
                  var r = paper.rect(-menuPadding, -menuPadding, 16 + space, 16 + space);
                  r.attr({fill: c, 'stroke-width': 0});
                  return r;
                }, width: 16, height: 16, doNotRefresh: true, data: c, group: 'colors'
              });
            }
          });
          var cols = _.indexOf(colors, 'br');
          var rows = _.countBy(colors, function(c) { return c === 'br'; }).true + 1;
          colorsMenu = this._createMenu(colorsMenu, item, cols * (16 + space), rows * (16 + space));
          _.each(colorsMenu.items, function(i) {
            self._detachListeners(i);
            i.handlers = [{
              target: 'button',
              event: 'click',
              handler: _.bind(self._mainButtonClicked, self, i)
            }];
            var mainBtnRect = self._getRaphaelObject(i, 'mainButtonRect');
            i.button.exclude(mainBtnRect);
            i.mainButton.exclude(mainBtnRect);
            mainBtnRect.remove();
            self._attachListeners(i);
          });
          return colorsMenu;
          break;
        default:
          throw new Error('Invalid item type: ' + type);
          break;
      }
      return item;
    },

    _createButton: function(item, paper) {
      var x, y, w, h, p;
      w = item.width;
      h = item.height;

      var c = this.options.colors;
      var button = paper.set();
      var mainButton = paper.set();
      var self = this;
      item.button = button;
      item.mainButton = mainButton;
      item.data = item.data || {};

      item.handlers = [
        {
          target: 'mainButton',
          event: 'mouseover',
          handler: _.bind(this._highlightItem, this, item, mainButton)
        }, {
          target: 'button',
          event: 'mouseout',
          handler: _.bind(this._highlightItem, this, item)
        }, {
          target: 'mainButton',
          event: 'click',
          handler: _.bind(this._mainButtonClicked, this, item)
        }
      ];

      if (item.containerMenu.isSubmenu) {
        // Close open submenus
        item.handlers.push({
          target: 'button',
          event: 'mouseover',
          handler: _.bind(function(item) {
            var self = this;
            _.each(item.containerMenu.items, function(i) {
              if (item !== i && i.expanded) {
                self._hideSubmenu(i);
                self._highlightItem(i);
              }
            });
          }, this, item)
        });
      }

      var mainButtonRect = paper.rect(0, 0, w, h);
      mainButtonRect.attr({fill: c.background, stroke: c.background});
      button.push(mainButtonRect);
      mainButton.push(mainButtonRect);

      if (item.copyIconFromSubmenu) {
        item.icon = this._copyIconFromSubmenu;
      }

      this._drawIcon(item);
      if (item.submenu) this._createSubButton(paper, item);
      this._attachListeners(item);
      $(this.containerEl).bind('refresh', _.bind(this._refreshButton, this, item));

      return button;
    },

    _copyIconFromSubmenu: function(paper, item) {
      var tmpItem = _.find(item.submenu.items, function(i) {
        return i.selected;
      });
      var icon;
      if (tmpItem) {
        var padding = this.options.iconPadding;
        icon = paper.image(tmpItem.icon, padding, padding, item.width - 2 * padding, item.height - 2 * padding);
      } else {
        var icon = paper.rect(0, 0, item.width, item.height);
        icon.attr('stroke', 'none');
      }
      return icon;
    },

    _detachListeners: function(item) {
      if (item.unclickable) return;
      _.each(item.handlers, function(h) {
        var target;
        switch (h.target) {
          case 'mainButton':
            target = item.mainButton;
            break;
          case 'subButton':
            target = item.subButton;
            break;
          case 'button':
            target = item.button;
            break;
          default:
            throw new Error('Invalid listener target: ' + h.target);
            break;
        }
        switch (h.event) {
          case 'mouseover':
            target.unmouseover(h.handler);
            break;
          case 'mouseout':
            target.unmouseout(h.handler);
            break;
          case 'click':
            target.unclick(h.handler);
            break;
          default:
            throw new Error('Invalid event type: ' + h.event);
            break;
        }
      });
    },

    _attachListeners: function(item) {
      if (item.unclickable) return;
      _.each(item.handlers, function(h) {
        var target;
        switch (h.target) {
          case 'mainButton':
            target = item.mainButton;
            break;
          case 'subButton':
            target = item.subButton;
            break;
          case 'button':
            target = item.button;
            break;
          default:
            throw new Error('Invalid listener target: ' + h.target);
            break;
        }
        switch (h.event) {
          case 'mouseover':
            target.mouseover(h.handler);
            break;
          case 'mouseout':
            target.mouseout(h.handler);
            break;
          case 'click':
            target.click(h.handler);
            break;
          default:
            throw new Error('Invalid event type: ' + h.event);
            break;
        }
      });
    },

    _getRaphaelObject: function(item, key) {
      switch (key) {
        case 'icon':
          return item.mainButton[1];
        case 'mainButtonRect':
          return item.mainButton[0];
        case 'subButtonRect':
          if (item.subButton)
            return item.subButton[0];
          else 
            return null;
        default:
          return void 0;
      } 
    },

    _drawIcon: function(item) {
      var paper = item.containerMenu.paper;
      var icon = this._getRaphaelObject(item, 'icon');

      if (icon) {
        item.mainButton.exclude(icon);
        item.button.exclude(icon);
        icon.remove();
      }
      
      if (_.isFunction(item.icon)) {
        icon = item.icon.call(this, paper, item);    
      } else if (item.label) {
        item.fontSize = item.fontSize || 12;
        item.textAnchor = item.textAnchor || 'start';
        var x, y;
        switch (item.textAnchor) {
          case 'start':
            x = this.options.buttonSpace;
            break;
          case 'middle':
            x = item.width / 2;
            break;
          case 'end':
            x = item.width;
            break;
          default:
            item.textAnchor = 'middle';
            x = item.width / 2;
            break;
        }
        y = item.height / 2;
        icon = paper.text(x, 17, item.label);
        icon.attr({
          'font-family': 'sans-serif', 
          'font-weight': 'normal',
          'font-size': item.fontSize,
          'fill': '#000000',
          'text-anchor': item.textAnchor
        });
      } else {
        var padding = this.options.iconPadding;
        icon = paper.image(item.icon, padding, padding, item.width - 2 * padding, item.height - 2 * padding);
      }
      if (item.transformation) icon.transform(item.transformation);
      item.mainButton.push(icon);
      item.button.push(icon);
      return icon;
    },

    _refreshButton: function(item) {
      if (item.doNotRefresh) return;
      if (_.isFunction(item.icon)) {
        this._detachListeners(item);
        this._drawIcon(item);
        this._attachListeners(item);
      }
      this._hideSubmenu(item);
      this._highlightItem(item);
    },

    _selectItemInGroup: function(item) {
      if (!item.selectable) return;

      var self = this;
      item.selected = true;
      _.each(item.containerMenu.items, function(i) {
        if (item.group === i.group && item !== i) {
          i.selected = false;
        }
      });
    },

    _mainButtonClicked: function(item, evt) {
      if (evt) evt.stopPropagation();
      this._selectItemInGroup(item);
      if (item.click) item.click(item);
      var parentItem = item.containerMenu.parentItem;
      if (parentItem && parentItem.propagateClickFromSubmenu) {
        this._selectItemInGroup(parentItem);
        parentItem.click(parentItem, item);
      }
      this.containerEl.trigger('refresh');
    },

    _createSubButton: function(paper, item) {
      var subButton = paper.set();
      var subButtonRect, triangle;
      var c = this.options.colors;
      var self = this;
      var w, h, p;
      w = item.width;
      h = item.height;

      if (item.containerMenu.isSubmenu) {
        var menuWidth = item.containerMenu.layout.width - 2 * this.options.menuPadding;
        subButtonRect = paper.rect(w, 0, menuWidth - item.width, h);
        subButtonRect.attr({fill: c.background, stroke: c.background});
        p = [['M', menuWidth - 10 - 3, (h - 8) / 2], ['L', menuWidth - 3, (h - 8) / 2 + 4], 
          ['L', menuWidth - 10 - 3, (h - 8) / 2 + 8], ['Z']];
        triangle = paper.path(p);
        triangle.attr({fill: '#000000', stroke: '#000000'});
      } else {
        subButtonRect = paper.rect(w, 0, 14, h);
        subButtonRect.attr({fill: c.background, stroke: c.background});
        p = [['M', 10 + w + 2, (h - 8) / 2], ['L', w + 2, (h - 8) / 2], ['L', 5 + w + 2, (h - 8) / 2 + 8], ['Z']];
        triangle = paper.path(p);
        triangle.attr({fill: '#000000', stroke: '#000000'});
      }
      item.subButton = subButton;
      item.button.push(subButtonRect);
      item.button.push(triangle);
      subButton.push(subButtonRect);
      subButton.push(triangle);
      item.handlers.push({
        target: 'subButton',
        event: 'mouseover',
        handler: _.bind(this._highlightItem, this, item, subButton)
      });

      var toggleSubmenu = _.bind(function(item, evt) {
        var self = this;
        _.each(item.containerMenu.items, function(i) {
          if (i !== item) self._refreshButton(i);
        });
        this._toggleSubmenu(item, evt);
      }, this, item);
      if (item.containerMenu.isSubmenu) {
        item.handlers.push({
          target: 'button',
          event: 'mouseover',
          handler: _.bind(function(item) {
            if (item.timeoutId) clearTimeout(item.timeoutId);
            item.timeoutId = setTimeout(toggleSubmenu, 500);  
          }, this, item)
        });
        item.handlers.push({
          target: 'button',
          event: 'mouseout',
          handler: _.bind(function(item) {
            if (item.timeoutId) {
              clearTimeout(item.timeoutId);
              delete item.timeoutId;
            }
          }, this, item)
        });
        item.handlers.push({
          target: 'button',
          event: 'click',
          handler: _.bind(function(item) {
            if (item.timeoutId) {
              clearTimeout(item.timeoutId);
              delete item.timeoutId;
            }
          }, this, item)
        });
      } else {
        item.handlers.push({
          target: 'subButton',
          event: 'click',
          handler: toggleSubmenu
        });
      }
    },

    _highlightItem: function(item, button) {
      var c = this.options.colors;
      var borderColor, mainBtnColor, subBtnColor;

      if (button !== void 0 && button.type === 'set' && item.containerMenu.isSubmenu) {
        // Submenu button with submenu
        borderColor = item.selected ? c.selected : c.mouseover;
        mainBtnColor = c.mouseover;
        subBtnColor = c.mouseover;
      } else if (item.containerMenu.isSubmenu && item.submenu && item.expanded) {
        // Expanded submenu button with submenu
        borderColor = item.selected ? c.selected : c.mouseover;
        mainBtnColor = c.mouseover;
        subBtnColor = c.mouseover;
      } else if (button === item.mainButton) {
        borderColor = item.selected ? c.selected : c.mouseover;
        mainBtnColor = c.mouseover;
        subBtnColor = item.selected ? c.selected : c.background;
      } else if (item.submenu && (button === item.subButton || item.expanded)) {
        borderColor = item.selected ? c.selected : c.mouseover;
        mainBtnColor = item.selected ? c.selected : c.background;
        subBtnColor = c.mouseover;
      } else {
        borderColor = mainBtnColor = subBtnColor = (item.selected ? c.selected : c.background);
      }
      var obj = this._getRaphaelObject(item, 'mainButtonRect');
      obj.attr({fill: mainBtnColor, stroke: borderColor});
      obj = this._getRaphaelObject(item, 'subButtonRect');
      if (obj)
        obj.attr({fill: subBtnColor, stroke: borderColor});
    },

    _toggleSubmenu: function(item, evt) {
      if (item.submenu === void 0) return;
      if (evt) evt.stopPropagation();
      if (item.expanded) {
        this._hideSubmenu(item);
      } else {
        this._showSubmenu(item);
      }
    },

    _showSubmenu: function(item) {
      if (item.submenu === void 0 || item.expanded === true) return;
      if (item.getSubmenuAttributes) {
        item.submenu.menuEl.remove();
        var attributes = item.getSubmenuAttributes();
        if (_.isString(attributes)) {
          item.submenu = this._prepareSpecial(attributes, item);
        } else {
          item.submenu = this._createMenu(attributes, item);
        }
      }
      var menuOffset = item.containerMenu.menuEl.offset();
      var buttonBBox = item.button.getBBox();
      var x, y;
      if (item.containerMenu.isSubmenu) {
        x = menuOffset.left + buttonBBox.width + 2 * this.options.menuPadding;
        y = menuOffset.top + buttonBBox.y - this.options.menuPadding;
      } else {
        x = menuOffset.left + buttonBBox.x - 1;
        y = menuOffset.top + buttonBBox.y + buttonBBox.height + 1;
      }
      item.submenu.menuEl.css('left', x).css('top', y).show();
      // For color submenu
      item.submenu.parentItem = item;
      item.expanded = true;
    },

    _hideSubmenu: function(item) {
      if (item.submenu === void 0 || item.expanded === false) return;
      item.submenu.menuEl.hide();
      item.expanded = false;
      var self = this;
      _.each(item.submenu.items, function(i) {
        if (i.expanded) self._toggleSubmenu(i);
      });
    },

    _updateDimensions: function(item) {
      var space = this.options.buttonSpace;
      var menu = item.containerMenu;
      this._updateNextPosition(item);

      menu.layout.width = Math.max(
        2 * this.options.menuPadding + menu.layout.nextX - space, 
        menu.layout.width
      );
      menu.layout.height = Math.max(
        2 * this.options.menuPadding + menu.layout.nextY + menu.layout.rowHeight, 
        menu.layout.height
      );
    },

    _updateNextPosition: function(item) {
      var space = this.options.buttonSpace;
      var menu = item.containerMenu;
      switch (item.type) {
        case 'br':
          menu.layout.nextX = menu.layout.columnX;
          menu.layout.nextY += menu.layout.rowHeight + space;
          menu.layout.rowHeight = 0;
          break;
        case 'sep':
          menu.layout.nextX += 3 * space;
          break;
        case 'col':
          menu.layout.nextX = menu.layout.nextColumnX + 3 * space;
          menu.layout.columnX = menu.layout.nextX;
          menu.layout.rowHeight = 0;
          menu.layout.nextY = 0;
          break;
        default:
          if (menu.isSubmenu && item.submenu) {
            menu.layout.nextX = 0;
            menu.layout.nextY += menu.layout.rowHeight + item.height + space;
            menu.layout.rowHeight = 0;
            menu.layout.width = Math.max(menu.layout.width, item.width + 14 + 2 * this.options.menuPadding);
          } else {
            menu.layout.nextX += item.width + space;
            menu.layout.rowHeight = Math.max(menu.layout.rowHeight, item.height);
            if (item.submenu) 
              menu.layout.nextX += 14;
            menu.layout.nextColumnX = Math.max(menu.layout.nextColumnX, menu.layout.nextX);
          }
          break;
      }
    },

    _getTransformation: function(item) {
      if (item.transformation) return item.transformation;
      var menu = item.containerMenu;
      
      if (item.type === 'col') {
        item.transformation = ['t', menu.layout.nextColumnX, 0];
      } else if (menu.isSubmenu && item.submenu) {
        item.transformation = ['t', 0, menu.layout.nextY + menu.layout.rowHeight];
      } else {
        item.transformation = ['t', menu.layout.nextX, menu.layout.nextY];
      }

      item.transformation[1] += this.options.menuPadding;
      item.transformation[2] += this.options.menuPadding;
      return item.transformation;
    },

    _setOption: function(key, value) {
      $.Widget.prototype._setOption.apply(this, arguments);
    },

    destroy: function() {
      $.Widget.prototype.destroy.call(this);
    }
  });
})(jQuery);
