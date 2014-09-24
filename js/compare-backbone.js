
var TourCollection = Backbone.Collection.extend({
    model: Tour
  }),

 Tour = Backbone.Model.extend({
    initialize: function(options) {
      this.url = 'https://rest.gadventures.com/tour_dossiers/' + options.id;
    },
    detailType: function(object, group, label, key) {
        var result = _.find(this.get(object), function(obj) {

            if(obj[group]){
                return obj[group].label === label;
            }
        });

        if (_.isUndefined(result)) {
          return;
        }
        return result[key];
    },
    detailTypeBody: function(object, group, label, key) {
        return this.detailType(object, group, label, key);
    },
    geography: function() {
        return this.get('geography').visited_countries;
    },
    visitedCountries: function(){
      var geo = this.geography(),
          geoVisted = [];
      _.each(geo, function(country){
          geoVisted.push(country.name);
      });
      return geoVisted.join(', ');
    },
    getObjValFunc: function(group, label) {
        return _.find(this.get(group), function(obj) {
            return obj.type === label;
        });
    },
    getObjVal: function(group, label) {
        return this.getObjValFunc(group, label);
    }
  }),

  tours = new TourCollection(),
  setHeader = function (xhr) {
    xhr.setRequestHeader('X-Application-Key','live_dbff74f738391dbbe887132e95c5cf70f1803b3c');
  },

  compareTableView = Backbone.View.extend({
    el: 'body',
    template: '#compareTableTemplate',
    render: function (num) {
      $('.comparison-prompt').fadeOut();
      console.log(tours);
      this.$el.append(
        _.template($(this.template).html(),{tours: tours, amountSelected: num})
      );
      convertTableRowstoColumns();
      return this;      
    }
  }),

  convertTableRowstoColumns = function(){
    $("table#compareToursTable").each(function() {
        var $this = $(this);
        var newrows = [];
        $this.find("tr").each(function(){
            var i = 0;
            $(this).find("td").each(function(){
                i++;
                if(newrows[i] === undefined) { newrows[i] = $("<tr></tr>"); }
                newrows[i].append($(this));
            });
        });
        $this.find("tr").remove();
        $.each(newrows, function(){
            $this.append(this);
        });
    });
    return false;
  },

  compareButtonView = Backbone.View.extend({
    template: '#comparePromptTemplate',
    className: 'comparison-prompt',
    render: function(options){
      options = (options || {});
        var context = {
          amountSelected : options.amountSelected || 0,
          
        };
        this.$el.html( 
          _.template($(this.template).html(),context)
        );
        return this;
      }
  }),

  compareTrips = {
    compareArray:[],
    compareObj:[],
    comparePromptBlock: '.comparison-prompt',

    buildRequestArray: function(selectedTrip){
      if(_.indexOf(this.compareArray, selectedTrip) >= 0){
        var indexOfTrip = this.compareArray.indexOf(selectedTrip);
        this.compareArray.splice(indexOfTrip, 1);
      } else {
        this.compareArray.push(selectedTrip); 
      }
      console.log(this.compareArray);
      this.comparePrompt(this.compareArray.length);
      if(this.compareArray.length === 1) {
        $('.comparison-prompt').addClass('active');
      } else if (this.compareArray.length === 0) {
        $('.comparison-prompt').removeClass('active');
      }
    },

    comparePrompt: function(n){
      this.compareButtonView.render({amountSelected: n});
      return;
    },

    retrieveTrips: function(tid){
      var self = this;
      var tourObj = new Tour({ id: tid });
      tourObj.fetch({
        beforeSend: setHeader,
        async: false,
        success: function (tour){
          tours.add(tour);
        },
        error: function(model, xhr, options){
          console.log('error'+ model, xhr, options);
        }
      });
      
    }, 

    buildCompare: function(){
      //this.loadingSequence(); 
      obj = this.compareArray;
      var self = this;
      $.each(obj, function(i, value){
          self.retrieveTrips(value);
          if(self.compareArray.length === i+1){
            self.buildCompareOverlay();
          }
      });
    },

    buildCompareOverlay: function(){
      $('body').addClass('fixed');
      this.compareTableView = new compareTableView();
      this.compareTableView.render(this.compareArray.length);
    },

    loadingSequence: function(){
      var loading = '<p>Retreiving tours for comparison</p><div class="loading"></div>';
      $(this.comparePromptBlock).html(loading);
    },

    init: function(options){
      var compareCheckbox = '.comparison-bind input',
          btnCompare = '.btn-compare',
          closeCompare = '.closeCompare',
          selectedTrip;

      var self = this;

      this.compareButtonView = new compareButtonView();
      $('.faceted-results').append(this.compareButtonView.render().el);

      $(document).on('click', compareCheckbox, function(){
        selectedTrip = $(this).data('target').split('.')[2];
        self.buildRequestArray(selectedTrip);

      });
      
      $(document).on('click', btnCompare, function(){
        self.buildCompare();
      });
     
      $(document).on('click', closeCompare, function(){
        $('body').removeClass('fixed');
        tours.reset();
        $('.compare-overlay').remove();
        $('.comparison-prompt').fadeIn();
      });

      $(document).on('click', '.unselectAll', function(){
        $('.comparison-bind input').attr('checked', false);
        self.compareArray = [];
        self.buildRequestArray();
      });
    }
};
