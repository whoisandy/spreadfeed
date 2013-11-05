// Utility function
if( typeof Object.create !== 'function' ) {
  Object.create = function(obj) {
    function F() {};
    F.prototype = obj;
    return new F();
  };
}

// Main plugin here
(function($, window, document, undefined){

  var Spreadfeed = {
    init: function( options, elem ){
      var self = this;

      self.elem = elem;
      self.$elem = $(elem);

      if( typeof options === 'string') {
        self.key = options;
      } else if (typeof options === 'object') {
        if (options.key == null){
          console.log('Please provide a key');
          return;
        } else {
          self.key = options.key;
          self.sheet = options.sheet;
          self.url = 'https://spreadsheets.google.com/feeds/list/'+self.key+'/'+self.sheet+'/public/basic?alt=json&callback=?';
        }
        self.options = $.extend({}, $.fn.spreadfeed.options, options);
      } else {
        console.log('Please provide a key');
        return;
      }

      self.url = ( self.sheet == null ) ? this.buildSingleUrl(self.key) : this.buildMultipleUrl(self.key, self.sheet);

      self.showTable();

    },

    buildSingleUrl: function(key){
      return 'https://spreadsheets.google.com/feeds/list/' + key + '/1/public/basic?alt=json&callback=?';
    },

    buildMultipleUrl: function(key, sheet){
      return 'https://spreadsheets.google.com/feeds/list/' + key + '/' + sheet + '/public/basic?alt=json&callback=?';
    },

    fetch: function(url){
      var self = this;
      return $.getJSON(url);
    },

    format: function(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    sanitize: function(objs){
      var results = $.map(objs.feed.entry, function(result){
        var ta = result.content.$t.toString().trim().split(', ');
        var td = $.map(ta, function(v,i){
          return '"'+v.split(':')[0].trim() + '":"' + v.split(':')[1].trim() + '"';
        });
        td.push('"'+'title'+'":"'+result.title.$t+'"');
        td.join(',');

        return $.parseJSON("{" + td + "}");
      });
      return results;
    },

    getRowCount: function(data){
      var self = this;
      return data.length;
    },

    getColCount: function(data){
      var self = this;
      var c = $.map(data, function(v){
        return Object.keys(v).length;
      });
      return Math.max.apply(Math, c);
    },

    getAllKeys: function(data){
      var self = this;
      var c = $.map(data, function(v){ return Object.keys(v).length });
      var el = data[Math.max.apply(Math, c)];
      var keys = [];

      for(var key in el){
        if(el.hasOwnProperty(key)){
          keys.push(key);
        }
      }
      return keys;
    },

    buildTable: function(data, elem){
      var self = this,
          list = self.getAllKeys(data),
          table = $('<table></table>');

      for(i=0; i < self.getRowCount(data); i++){
        var row = $('<tr></tr>');

        for(j=0; j<self.getColCount(data); j++){
          var col = $('<td></td>');
          data[i][list[j]] == undefined ? col.append('NA') : col.append(data[i][list[j]]);
          row.append(col);
        }

        table.append(row);
      }

      var thead = $('<thead></thead>'), hrow = $('<tr></tr>');
      for(k=0; k<list.length; k++){
        var hcol = $('<th></th>');
        hcol.append(self.format(list[k]));
        hrow.append(hcol);
      }

      table.prepend(thead.append(hrow));

      elem.html(table.addClass('sf-wrap'));
    },

    showTable: function(){
      var self = this;
      self.$elem.css('display', 'none').html('<p>Loading...</p>').fadeIn('slow');
      $.when(self.fetch(self.url)).done(function(results){
        self.buildTable(self.sanitize(results), self.$elem);
      }).fail(function(){
        self.$elem.html('<p>Unable to fetch data. Please try refreshing.</p>');
        console.log('Unable to fetch data');
      });
    },
  };

  $.fn.spreadfeed = function( options ){
    return this.each(function(){
      var gs = Object.create( Spreadfeed );
      gs.init( options, this );
    });
  };

  $.fn.spreadfeed.options = {
    key: '',
    sheet: '1'
  };


})(jQuery, window, document);