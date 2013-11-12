/**
 * Utility function
 */
if( typeof Object.create !== 'function' ) {
  Object.create = function(obj) {
    function F() {};
    F.prototype = obj;
    return new F();
  };
}

/**
 * jQuery SpreadFeed
 * Version: 0.0.0
 * Author: whoisandie
 *
 *
 */
(function($, window, document, undefined){

  var Spreadfeed = {
    init: function( options, elem ){
      var self = this;

      self.elem = elem;
      self.$elem = $(elem);

      if( typeof options === 'string') {
        if(/^https:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(options)){
          // self.url = options;
          self.options = $.extend({}, $.fn.spreadfeed.options, {url: options});
        } else {
          // self.key = options;
          self.options = $.extend({}, $.fn.spreadfeed.options, {key: options});
        }
      } else if (typeof options === 'object') {
        if (options.url === undefined && options.key === undefined){
          self.$elem.html('<p>Please provide a spreadsheet url or key.</p>');
          console.log('Please provide a spreadsheet url or key.');
          return;
        } else {
          self.url = options.url;
          self.key = options.key;
          self.sheet = options.sheet;
        }
        self.options = $.extend({}, $.fn.spreadfeed.options, options);
      } else {
        console.log('Please provide a valid spreadsheet key or url');
        return;
      }

      self.url = self.options.url ===  undefined ? this.buildFromKeySheet(self.options.key, self.options.sheet) : this.buildFromUrl(self.options.url);

      self.showTable();
    },

    buildFromKeySheet: function(key, sheet){
      return "https://spreadsheets.google.com/feeds/list/" + key + "/" + sheet +
             "/public/basic?alt=json";
    },

    buildFromUrl: function(url){
      var keyReg = /(.*key=)(.*)(&output.*)/;
          key = url.match(keyReg);

      if(key === undefined || key === null){
        return false;
      }

      return this.buildFromKeySheet(key[2], this.options.sheet);
    },

    fetch: function(url){
      return $.getJSON(url);
    },

    format: function(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    isvalid: function(order){
      if(typeof(order) !== 'string' && typeof(order) !== 'undefined' && order.length > 0){
          return true;
      }
      return false;
    },

    sanitize: function(objs){
      var results = $.map(objs.feed.entry, function(result){
        var ta = result.content.$t.toString().trim().split(", ");
        var td = $.map(ta, function(v,i){
          if( v.split(':')[0] === undefined || v.split(':')[1] === undefined ){
            console.log('Cell values cannot have comma separated values. Please read the docs for more information');
            return;
          }
          return '"'+v.split(':')[0].trim() + '":"' + v.split(':')[1].trim() + '"';
        });
        td.push('"'+'title'+'":"'+result.title.$t+'"');
        td.join(',');

        return $.parseJSON("{" + td + "}");
      });
      return results;
    },

    getRowCount: function(data){
      return data.length;
    },

    getColCount: function(data){
      var self = this;
          count = $.map(data, function(v){ return Object.keys(v).length });
      return self.isvalid(self.options.order) ? self.options.order.length : Math.max.apply(Math, count);
      // return this.getAllKeys(data).length;
    },

    getAllKeys: function(data){
      var self = this,
          count = $.map(data, function(v){ return Object.keys(v).length }),
          el = data[Math.max.apply(Math, count)],
          keys = [];

      for(var key in el){
        if(el.hasOwnProperty(key)){
          keys.push(key);
        }
      }

      return keys;
    },

    buildTable: function(data, elem){
      var self = this,
          table = $('<table></table>'),
          list;

      if(self.isvalid(self.options.order)){
        list = self.options.order;
      } else {
        list = self.getAllKeys(data);
      }

      for(i=0; i < self.getRowCount(data); i++){
        var row = $('<tr></tr>');

        for(j=0; j < self.getColCount(data); j++){
          var col = $('<td></td>');
          data[i][list[j]] == undefined ? col.append('NA') : col.append(data[i][list[j]]);
          row.append(col);
        }

        table.append(row);
      }

      var thead = $('<thead></thead>'), hrow = $('<tr></tr>');
      for(k=0; k<list.length; k++){
        var hcol = $('<th></th>');
        if(list[k] === 'title' && self.options.title !== undefined){
          hcol.append(self.format(self.options.title));
        } else {
          hcol.append(self.format(list[k]));
        }
        hrow.append(hcol);
      }

      table.prepend(thead.append(hrow));

      elem.css('display', 'none').html(table.addClass('sf-wrap')).fadeIn('slow');
    },

    showTable: function(){
      var self = this;
      self.$elem.html('<p>Loading...</p>');
      $.when(self.fetch(self.url)).done(function(results){
        self.buildTable(self.sanitize(results), self.$elem);
      }).fail(function(){
        self.$elem.html('<p>Unable to fetch data. Please try refreshing.</p>');
        console.log('Unable to fetch data. Please try refreshing.');
      });
    }
  };

  $.fn.spreadfeed = function( options ){
    return this.each(function(){
      var spreadfeed = Object.create( Spreadfeed );
      spreadfeed.init( options, this );
    });
  };

  $.fn.spreadfeed.options = {
    url: null,
    key: null,
    sheet: '1'
  };


})(jQuery, window, document);