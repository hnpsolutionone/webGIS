L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
    mapMarkers: [],
    filterLayer: [],
    onAdd: function (map) {
        // Triggered when the layer is added to a map.
        //   Register a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onAdd.call(this, map);
        console.log(this.mapMarkers);
        map.on('click', this.getFeatureInfo, this);
    },

    onRemove: function (map) {
        // Triggered when the layer is removed from a map.
        //   Unregister a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onRemove.call(this, map);
        map.off('click', this.getFeatureInfo, this);
    },
    
    getFeatureInfo: function (evt) {
        // Make an AJAX request to the server and hope for the best
        var url = this.getFeatureInfoUrl(evt.latlng),
            showResults = L.Util.bind(this.showGetFeatureInfo, this);
        //console.log('Init mapMarkers');
        //console.log(this.mapMarkers);
        var mapMarkers = this.mapMarkers;
        var filterLayer = this.filterLayer;
        jQuery.ajax({
            url: url,
            success: function (data, status, xhr) {
                //console.log('Ajax success mapMarkers');
                //console.log(mapMarkers);
                var content = "<table>";
                content += "<thead><tr><th>Information</th><th>Population</th><th>Pollution</th></tr></thead>";
                content += "<tbody>";
                for (var i = 0; i < data.features.length; i++) {
                    var feature = data.features[i];
                    var featureAttr = feature.properties;
                    var info = jQuery.parseJSON(featureAttr["info"]);

                    var jsonInfo = jsonQ(info);
                    console.log('==========json Info=========');
                    console.log(info);

                    var population = jQuery.parseJSON(featureAttr["detail_population"]);
                    var jsonPopulation = jsonQ(population);
                    console.log('=========json Population==========');
                    console.log(population);

                    var pollution = jQuery.parseJSON(featureAttr["detail_pollution"]);
                    var jsonPollution = jsonQ(pollution);
                    console.log('==========json Pollution==========');
                    console.log(pollution);

                    content += "<tr><td>Area: " + (jQuery.isEmptyObject(info) ? '' : jsonInfo.find('area').value()) + " <br/>Insee code: " + (jQuery.isEmptyObject(info) ? '' : jsonInfo.find('insee_code').value()) + "</td>"
                        + "<td>Title: " + (jQuery.isEmptyObject(population) ? '' : jsonPopulation.find('title').value()) + " <br/>Population: " + (jQuery.isEmptyObject(population) ? '' : jsonPopulation.find('population').value()) + "</td>"
                        + "<td>Title: " + (jQuery.isEmptyObject(pollution) ? '' : jsonPollution.find('title').value()) + " <br/>Agriculture area: " + (jQuery.isEmptyObject(pollution) ? '' : jsonPollution.find('agriculture_area').value()) + "</td></tr>";
                }
                content += "<tbody></table>";
                // $("#info").html(content);
                var err = typeof content === 'string' ? null : content;
                //Fix for blank popup window
                var doc = (new DOMParser()).parseFromString(content, "text/html");
                if (doc.body.innerHTML.trim().length > 0)
                    showResults(err, evt.latlng, content);

                // Call Ajax to get data when user click on commune
                var insee_com = feature.properties.insee_com;
                console.log(insee_com);

                ////////////////////////// HIGHLIGHT SELECTED COMMUNE BY LOAD NEW LAYER WITH CQL_FILTER:'insee_com=insee_com' /////////////////////
                console.log('========== Old Filter WMS layer===========');
                console.log(filterLayer);
                if (!jQuery.isEmptyObject(filterLayer)) {
                    for(var i = 0; i < filterLayer.length; i++){
                        map.removeLayer(filterLayer[i]);
                        filterLayer.pop();
                    }
                    filterLayer.length = 0; // remove all item
                }

                if (insee_com !== null) {
                    var filterWMSLayer = L.tileLayer.wms("http://localhost:8080/geoserver/ign/wms",
                        {
                            layers: 'ign:infos_map_view',
                            format: 'image/png',
                            styles: 'restricted',
                            transparent: true,
                            CQL_FILTER:'insee_com=' + insee_com
                        });
                    map.addLayer(filterWMSLayer);
                    //console.log('==========FilterWMSlayer===========');
                    //console.log(filterWMSLayer);
                    filterLayer.push(filterWMSLayer);
                    //console.log(filterLayer);
                }

                ////////////////////////// CREATE MARKERS (REST API | SQL View by Layer/////////////////////
                /*
                // This is way to show markers with ows of GeoServer
                var geoJsonUrl = "http://localhost:8080/geoserver/ign/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ign:school-sql&maxFeatures=50&outputFormat=application/json&viewparams=param1:" + insee_com;
                jQuery.ajax({
                    url: geoJsonUrl,
                    dataType: 'json',
                    jsonpCallback: 'getJson',
                    success: function (data, status, xhr) {
                        // Way 1: Add map with default feature info
                        console.log(data);
                        geojson = L.geoJson(data, {}).addTo(map);

                        // Way 2: create markers with custom feature info and add into map
                        var myIcon = L.icon({
                            iconUrl: 'images/pin48.png',
                            iconRetinaUrl: 'images/pin48.png',
                            iconSize: [29, 24],
                            iconAnchor: [9, 21],
                            popupAnchor: [0, -14]
                        })
                        for (var i = 0; i < data.features.length; i++) {
                            var feature = data.features[i];
                            var featureAttr = feature.properties;
                            console.log(parseFloat(featureAttr.lat), parseFloat(featureAttr.long));
                            var marker = L.marker([featureAttr.lat, featureAttr.long], {icon: myIcon})
                                .bindPopup('' + (featureAttr.appariement !== null ? featureAttr.appariement : '') + ' ' + (featureAttr.appellation_officielle !== null ? featureAttr.appellation_officielle : ''))
                                .addTo(map);
                            console.log('==========mapMarkers===========');
                            mapMarkers.push(marker);
                            // console.log(mapMarkers);
                        }
                    }, error: function (xhr, status, error) {
                        showResults(error);
                    }
                });*/

                // This is way to show markers with REST API
                jQuery.ajax({
                    method: "GET",
                    url: "php/getrecords_ajax.php",
                    data: {"insee_com": insee_com},
                }).done(function (data) {
                    //console.log(data);
                    var markers = jQuery.parseJSON(data);
                    //console.log(markers);
                    var myIcon = L.icon({
                        iconUrl: 'images/pin24.png',
                        iconRetinaUrl: 'images/pin48.png',
                        iconSize: [29, 24],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    })

                    //console.log('==========clear Markers====================');
                    //console.log(jQuery.isEmptyObject(mapMarkers));
                    //console.log(mapMarkers);
                    if (!jQuery.isEmptyObject(mapMarkers)) {
                        for(var i = 0; i < mapMarkers.length; i++){
                            map.removeLayer(mapMarkers[i]);
                        }
                        mapMarkers.length = 0; // remove all item
                    }

                    if (markers.length) {
                        for (var i = 0; i < markers.length; ++i) {
                            //console.log(parseFloat(markers[i].lat), parseFloat(markers[i].long));
                            var marker = L.marker([parseFloat(markers[i].lat), parseFloat(markers[i].long)], {icon: myIcon})
                                .bindPopup('<strong>School information:</strong> <br />' + (markers[i].appariement !== null ? 'Appariement:' + markers[i].appariement : '') + '<br />' + (markers[i].appellation_officielle !== null ? 'Appellation officielle:' + markers[i].appellation_officielle : ''))
                                .addTo(map);
                            //console.log('==========mapMarkers===========');
                            mapMarkers.push(marker);
                            // console.log(mapMarkers);
                        }
                    }
                });
            },
            error: function (xhr, status, error) {
                showResults(error);
            }
        });
    },

    getFeatureInfoUrl: function (latlng) {
        // Construct a GetFeatureInfo request URL given a point
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
            size = this._map.getSize(),

            params = {
                request: 'GetFeatureInfo',
                service: 'WMS',
                srs: 'EPSG:4326',
                styles: this.wmsParams.styles,
                transparent: this.wmsParams.transparent,
                version: this.wmsParams.version,
                format: this.wmsParams.format,
                bbox: this._map.getBounds().toBBoxString(),
                height: size.y,
                width: size.x,
                layers: this.wmsParams.layers,
                query_layers: this.wmsParams.layers,
                info_format: 'application/json'
            };

        params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
        params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

        return this._url + L.Util.getParamString(params, this._url, true);
    },

    showGetFeatureInfo: function (err, latlng, content) {
        if (err) {
            console.log(err);
            return;
        } // do nothing if there's an error
        // Otherwise show the content in a popup, or something.
        L.popup({maxWidth: 800})
            .setLatLng(latlng)
            .setContent(content)
            .openOn(this._map);
    }
});

L.tileLayer.betterWms = function (url, options) {
    return new L.TileLayer.BetterWMS(url, options);
};