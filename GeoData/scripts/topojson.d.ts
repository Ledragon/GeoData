// Type definitions for TopoJSON
// Project: https://github.com/mbostock/topojson
// Definitions by: Hugues Stefanski <https://github.com/Ledragon/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped 
declare module TopoJSON {
    export interface TopoJSON {
        feature(topology, object);
        merge(topology, objects);
        mesh(topology, object, filter?);
        meshArcs(topology, objects?, filter?);
        neighbors(objects);
    }

}

declare var topojson: TopoJSON.TopoJSON;