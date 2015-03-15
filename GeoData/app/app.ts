/// <reference path="../typings/d3/d3.d.ts" />
/// <reference path="../scripts/topojson.d.ts" />
class app {
    private _mapGroup: D3.Selection;

    constructor() {
        var width = 800;
        var height = 600;
        var svg = d3.select('svg').attr({
            width: width,
            height: height
        });
        //this.drawUk(svg);
        this.drawWorld(svg, width, height);
        this._mapGroup = svg.append('g').classed('map-group', true);
    }

    private drawUk(svg, width, height) {
        d3.json('data/uk.json',(error, uk) => {
            if (error) {
                console.error(error);
            }
            else {

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
                    .enter().append('path')
                    .attr('class', function (d) { return 'subunit ' + d.id; })
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
            .scale(2200);

        var pathGenerator = this.getPathGenerator(mercatorProjection);

        var self = this;
        d3.json('data/countries.topo.json',(error, data) => {
            if (error) {
                console.log(error);
            }
            else {
                var countries = topojson.feature(data, data.objects.countries);

                countriesGroup.append('path')
                    .datum(countries)
                    .attr('d', pathGenerator)
                    .style({
                    'fill': '#dedede'
                });

                countriesGroup.append('path')
                    .datum(topojson.mesh(data, data.objects.countries,(a, b) => a !== b))
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

                d3.json('data/france.topo.json',(error, citiesFile) => {
                    if (error) {
                        console.error(error);
                    } else {
                        var cities = topojson.feature(citiesFile, citiesFile.objects.france);

                        cities.features.forEach(c=> {
                            var coordinates = c.geometry.coordinates;
                            self.plot(coordinates[0], coordinates[1], mercatorProjection, '#01abcd');
                        });
                    }
                })
                //svg.selectAll('.subunit')
                //    .data(countries.features)
                //    .enter().append('path')
                //    .attr('class', function (d) { return 'subunit ' + d.id; })
                //    .attr('d', pathGenerator);
                //console.log(data);
            }
        });
    }

    getPathGenerator(projection): D3.Geo.Path {
        var pathGenerator = d3.geo.path().projection(projection);
        return pathGenerator;
    }

    plot(longitude, latitude, projection, color?: string) {
        var projected = projection([longitude, latitude]);
        var circle = this._mapGroup
            .append('circle')
            .attr({
            'cx': projected[0],
            'cy': projected[1],
            'r': 2
        });
        if (color) {
            circle.style('fill', color);
        }
    }

}

new app();