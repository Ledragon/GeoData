﻿/// <reference path="../typings/geojson/geojson.d.ts" />
/// <reference path="../typings/d3/d3.d.ts" />
/// <reference path="../scripts/topojson.d.ts" />
class app {
    private _mapGroup: D3.Selection;
    private _countriesGroup: D3.Selection;
    private _svg: D3.Selection;
    private _zoom: D3.Behavior.Zoom;

    private width;
    private height;

    private _active: D3.Selection;

    private _subUnits: any;
    private _populatedPlaces: any;

    constructor() {
        this.width = 800;
        this.height = 3 / 4 * this.width;
        var svg = d3.select('svg').attr({
            width: this.width,
            height: this.height
        });

        this._zoom = d3.behavior.zoom()
            .translate([0, 0])
            .scale(1)
            .scaleExtent([0.1, 50])
            .on('zoom', this.zoomed());
        svg.call(this._zoom);

        //this.drawUk(svg);
        //this.drawWorld(svg, width, height);
        this.loadTopoJson();
        //this._mapGroup = svg.append('g').classed('map-group', true);
        this._svg = svg;
        var self = this;
        d3.json('data/10m/json/states-provinces.topo.json', (error, data) => {
            if (error) {
                console.log(error);
            } else {
                self._subUnits = topojson.feature(data, data.objects['states-provinces']);
            }
        });
        d3.json('data/10m/json/populated-places.topo.json', (error, data) => {
            if (error) {
                console.log(error);
            } else {
                self._populatedPlaces = topojson.feature(data, data.objects['populated-places.geo']);
            }
        });
    }

    private drawUk(svg, width, height) {
        d3.json('data/uk.json', (error, uk) => {
            if (error) {
                console.error(error);
            } else {

                //convert to GeoJSON
                var subUnits = topojson.feature(uk, uk.objects.subunits);

                //var projection = d3.geo.mercator()
                //    .scale(500)
                //    .translate([width / 2, height / 2]);

                var projection = d3.geo.albers()
                    .center([0, 55.4])
                    .rotate([4.4, 0])
                    .parallels([50, 60])
                    .scale(4000)
                    .translate([width / 2, height / 2]);

                var pathGenerator = d3.geo.path().projection(projection);
                svg.append('path')
                    .datum(subUnits)
                    .attr('d', pathGenerator);

                svg.selectAll('.subunit')
                    .data(topojson.feature(uk, uk.objects.subunits).features)
                    .enter()
                    .append('path')
                    .attr('class', d => (`subunit ${d.id}`))
                    .attr('d', pathGenerator);
            }
        });
    }

    private drawWorld(svg: D3.Selection, width: number, height: number): void {
        var countriesGroup = svg.append('g').classed('countries', true);
        var projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(100)
            .translate([width / 2, height / 2]);

        var mercatorProjection = d3.geo.mercator()
            .center([2, 47])
            .scale(200);

        var pathGenerator = this.getPathGenerator(mercatorProjection);

        var self = this;
        d3.json('data/json/countries.topo.json', (error, data) => {
            if (error) {
                console.log(error);
            } else {
                var countries = topojson.feature(data, data.objects.countries);

                countriesGroup.append('path')
                    .datum(countries)
                    .attr('d', pathGenerator)
                    .style({
                        'fill': '#dedede'
                    }).on('click', (d, i) => {
                        console.log(d);
                    });

                countriesGroup.append('path')
                    .datum(topojson.mesh(data, data.objects.countries, (a, b) => a !== b))
                    .attr('d', pathGenerator)
                    .style({
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

                d3.json('data/france.topo.json', (error, citiesFile) => {
                    if (error) {
                        console.error(error);
                    } else {
                        var cities = topojson.feature(citiesFile, citiesFile.objects.france);

                        cities.features.forEach(c => {
                            var coordinates = c.geometry.coordinates;
                            self.plot(coordinates[0], coordinates[1], mercatorProjection, '#01abcd');
                        });
                    }
                });
                //svg.selectAll('.subunit')
                //    .data(countries.features)
                //    .enter().append('path')
                //    .attr('class', function (d) { return 'subunit ' + d.id; })
                //    .attr('d', pathGenerator);
                //console.log(data);
            }
        });
    }

    private loadTopoJson() {
        var self = this;
        d3.json('data/110m/json/countries.topo.json', (error, data) => {
            if (error) {
                console.log(error);
            } else {
                var countries = topojson.feature(data, data.objects.countries);

                var mercatorProjection = d3.geo.mercator()
                    .center([0, 0])
                    .translate([this.width/2, this.height/2])
                    .scale(this.width/8);

                var pathGenerator = this.getPathGenerator(mercatorProjection);
                var countriesGroup = d3.select('svg').append('g');
                countriesGroup.selectAll('path')
                    .data(countries.features)
                    .enter()
                    .append('g')
                    .attr('id', (d, i) => d.properties.adm0_a3)
                    .append('path')
                    .attr('d', (d, i) => pathGenerator(d))
                    .classed('normal', true)
                    .on('click', this.clicked(pathGenerator));
                self._countriesGroup = countriesGroup;
                self._countriesGroup.append('g').classed('subUnits', true);
                self._countriesGroup.append('g').classed('subUnitsNames', true);
                self._countriesGroup.append('g').classed('places', true);
            }
        });
    }

    private clicked(pathGenerator): any {
        var self = this;
        return (d, i) => {
            d3.select('#countryName').text(d.properties.name);
            var centering = self.getCentering(d, pathGenerator);
            if (self._active) {
                self._active.classed('selected', false);
            }
            self._active = d3.select(d3.event.target).classed('selected', true);
            //TODO redraw using a better resolution

            self.drawSubUnits(self, d, pathGenerator);
            self.plotCities(self, pathGenerator, d);
            self._svg
                .transition()
                .duration(500)
                .call((<any>self._zoom.translate(centering.translate).scale(centering.scale)).event);

        };
    }

    private getCentering(d, pathGenerator) {
        var bounds = pathGenerator.bounds(d);
        var dx = bounds[1][0] - bounds[0][0];
        var dy = bounds[1][1] - bounds[0][1];
        var x = (bounds[0][0] + bounds[1][0]) / 2;
        var y = (bounds[0][1] + bounds[1][1]) / 2;
        var scale = .9 / Math.max(dx / this.width, dy / this.height);
        var translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];
        return {
            scale: scale,
            translate: translate
        };
    }

    private plotCities(self:app, pathGenerator, d) {

        self._countriesGroup
            .select('.places')
            .selectAll('circle')
            .remove();
        var countryPlaces = self._populatedPlaces.features.filter(pp => pp.properties.ADM0_A3 === d.properties.adm0_a3);
        countryPlaces.forEach(p => {
            self.plot(p.properties.LONGITUDE, p.properties.LATITUDE, pathGenerator.projection(), '#39c');
        });

    }

    private drawSubUnits(self: app, d, pathGenerator: D3.Geo.Path) {
        var subUnits = self._subUnits.features.filter((sd, i) => {
            return sd.properties.adm0_a3 === d.properties.adm0_a3;
        });

        var data = self._countriesGroup
            .select('.subUnits')
            .selectAll('.subUnit')
            .data(subUnits);
        data.enter()
            .append('path')
            .classed('subUnit', true)
            .on('click',(sd, i) => {

                var centering = self.getCentering(sd, pathGenerator);

                self._svg
                    .transition()
                    .duration(500)
                    .call((<any>self._zoom.translate(centering.translate).scale(centering.scale)).event);
            });

        data.attr('d', (sd, i) => {
            return pathGenerator(sd);
        });
        data.exit().remove();

        //var textData = self._countriesGroup
        //    .select('.subUnitsNames')
        //    .selectAll('text')
        //    .data(subUnits);
        //textData.enter()
        //    .append('text')
        //    .attr('dy', '.35em');
        //textData.attr({
        //    'x': (sd, i) => pathGenerator.centroid(sd)[0],
        //    'y': (sd, i) => pathGenerator.centroid(sd)[1]
        //})
        //    .text((sd, i) => {
        //    return sd.properties.name;
        //});
        //textData.exit().remove();
    }

    private zoomed(): any {
        var self = this;
        return () => {
            self._countriesGroup.attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`);
            //self._countriesGroup.selectAll('text').attr('transform', 'scale(' + 1 / d3.event.scale + ')');
        };
    }

    public getPathGenerator(projection): D3.Geo.Path {
        var pathGenerator = d3.geo.path().projection(projection);
        return pathGenerator;
    }

    public plot(longitude, latitude, projection, color?: string) {
        var projected = projection([longitude, latitude]);
        var circle = this._countriesGroup
            .select('.places')
            .append('circle')
            .attr({
                'cx': projected[0],
                'cy': projected[1],
                'r': 0.5
            });
        if (color) {
            circle.style('fill', color);
        }
    }

}

new app();