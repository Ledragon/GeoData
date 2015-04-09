/// <reference path="../typings/d3/d3.d.ts" />
/// <reference path="../scripts/topojson.d.ts" />
var app = (function () {
    function app() {
        this.width = 800;
        this.height = 600;
        var svg = d3.select('svg').attr({
            width: this.width,
            height: this.height
        });
        this._zoom = d3.behavior.zoom().translate([0, 0]).scale(1).scaleExtent([0.1, 50]).on('zoom', this.zoomed());
        svg.call(this._zoom);
        //this.drawUk(svg);
        //this.drawWorld(svg, width, height);
        this.loadTopoJson();
        //this._mapGroup = svg.append('g').classed('map-group', true);
        this._svg = svg;
        var self = this;
        d3.json('data/10m/json/states-provinces.topo.json', function (error, data) {
            if (error) {
                console.log(error);
            }
            else {
                self._subUnits = topojson.feature(data, data.objects['states-provinces']);
            }
        });
    }
    app.prototype.drawUk = function (svg, width, height) {
        d3.json('data/uk.json', function (error, uk) {
            if (error) {
                console.error(error);
            }
            else {
                //convert to GeoJSON
                var subUnits = topojson.feature(uk, uk.objects.subunits);
                //var projection = d3.geo.mercator()
                //    .scale(500)
                //    .translate([width / 2, height / 2]);
                var projection = d3.geo.albers().center([0, 55.4]).rotate([4.4, 0]).parallels([50, 60]).scale(4000).translate([width / 2, height / 2]);
                var pathGenerator = d3.geo.path().projection(projection);
                svg.append('path').datum(subUnits).attr('d', pathGenerator);
                svg.selectAll('.subunit').data(topojson.feature(uk, uk.objects.subunits).features).enter().append('path').attr('class', function (d) {
                    return 'subunit ' + d.id;
                }).attr('d', pathGenerator);
            }
        });
    };
    app.prototype.drawWorld = function (svg, width, height) {
        var countriesGroup = svg.append('g').classed('countries', true);
        var projection = d3.geo.albers().center([0, 55.4]).rotate([4.4, 0]).parallels([50, 60]).scale(100).translate([width / 2, height / 2]);
        var mercatorProjection = d3.geo.mercator().center([2, 47]).scale(200);
        var pathGenerator = this.getPathGenerator(mercatorProjection);
        var self = this;
        d3.json('data/json/countries.topo.json', function (error, data) {
            if (error) {
                console.log(error);
            }
            else {
                var countries = topojson.feature(data, data.objects.countries);
                countriesGroup.append('path').datum(countries).attr('d', pathGenerator).style({
                    'fill': '#dedede'
                }).on('click', function (d, i) {
                    console.log(d);
                });
                countriesGroup.append('path').datum(topojson.mesh(data, data.objects.countries, function (a, b) { return a !== b; })).attr('d', pathGenerator).style({
                    'fill': 'none',
                    'stroke': '#777'
                });
                var minLongitude = 2.5454;
                var maxLongitude = 8.2306;
                var deltaLongitude = maxLongitude - minLongitude;
                var minLatitude = 42.3327;
                var maxLatitude = 48.96722;
                var deltaLatitude = maxLatitude - minLatitude;
                //for (var i = 0; i < 500; i++) {
                //    var rand = Math.random() * 20;
                //    self.plot(minLongitude + Math.random() * deltaLongitude, minLatitude + Math.random() * deltaLatitude, mercatorProjection);
                //}
                //self.plot(minLongitude, 51.0891, mercatorProjection, 'red');
                //self.plot(8.2306, maxLatitude, mercatorProjection, 'red');
                //self.plot(2.5328, minLatitude, mercatorProjection, 'red');
                //self.plot(-4.79556, 48.41578, mercatorProjection, 'red');
                d3.json('data/france.topo.json', function (error, citiesFile) {
                    if (error) {
                        console.error(error);
                    }
                    else {
                        var cities = topojson.feature(citiesFile, citiesFile.objects.france);
                        cities.features.forEach(function (c) {
                            var coordinates = c.geometry.coordinates;
                            self.plot(coordinates[0], coordinates[1], mercatorProjection, '#01abcd');
                        });
                    }
                });
            }
        });
    };
    app.prototype.loadTopoJson = function () {
        var _this = this;
        var self = this;
        d3.json('data/110m/json/countries.topo.json', function (error, data) {
            if (error) {
                console.log(error);
            }
            else {
                var countries = topojson.feature(data, data.objects.countries);
                var mercatorProjection = d3.geo.mercator().center([2, 47]).scale(100);
                var pathGenerator = _this.getPathGenerator(mercatorProjection);
                var countriesGroup = d3.select('svg').append('g');
                countriesGroup.selectAll('path').data(countries.features).enter().append('g').append('path').attr('d', function (d, i) { return pathGenerator(d); }).attr('id', function (d, i) { return d.properties.name; }).classed('normal', true).on('click', _this.clicked(pathGenerator));
                self._countriesGroup = countriesGroup;
            }
        });
    };
    app.prototype.clicked = function (pathGenerator) {
        var _this = this;
        var self = this;
        return function (d, i) {
            d3.select('#countryName').text(d.properties.name);
            var bounds = pathGenerator.bounds(d);
            var dx = bounds[1][0] - bounds[0][0];
            var dy = bounds[1][1] - bounds[0][1];
            var x = (bounds[0][0] + bounds[1][0]) / 2;
            var y = (bounds[0][1] + bounds[1][1]) / 2;
            var scale = .9 / Math.max(dx / _this.width, dy / _this.height);
            var translate = [_this.width / 2 - scale * x, _this.height / 2 - scale * y];
            if (self._active) {
                self._active.classed('selected', false);
            }
            self._active = d3.select(d3.event.target).classed('selected', true);
            //TODO redraw using a better resolution
            self.drawSubUnits(self, d, pathGenerator);
            self._svg.transition().duration(500).call(self._zoom.translate(translate).scale(scale).event);
        };
    };
    app.prototype.drawSubUnits = function (self, d, pathGenerator) {
        var subUnits = self._subUnits.features.filter(function (sd, i) {
            return sd.properties.adm0_a3 === d.properties.adm0_a3;
        });
        self._countriesGroup.selectAll('.province').remove();
        self._countriesGroup.selectAll('.province').data(subUnits).enter().append('g').classed('province', true).classed(d.properties.adm0_a3, true).append('path').attr('d', function (sd, i) { return pathGenerator(sd); });
    };
    app.prototype.zoomed = function () {
        var self = this;
        return function () {
            console.log('translate: ' + d3.event.translate);
            console.log('scale: ' + d3.event.scale);
            self._countriesGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
        };
    };
    app.prototype.getPathGenerator = function (projection) {
        var pathGenerator = d3.geo.path().projection(projection);
        return pathGenerator;
    };
    app.prototype.plot = function (longitude, latitude, projection, color) {
        var projected = projection([longitude, latitude]);
        var circle = this._mapGroup.append('circle').attr({
            'cx': projected[0],
            'cy': projected[1],
            'r': 2
        });
        if (color) {
            circle.style('fill', color);
        }
    };
    return app;
})();
new app();
//# sourceMappingURL=app.js.map