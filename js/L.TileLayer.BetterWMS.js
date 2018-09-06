L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
    mapMarkers: [],
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
        console.log('aaaaaaaaaaaaaaaaaaaaaa');
        console.log(this.mapMarkers);
        var mapMarkers = this.mapMarkers;
        jQuery.ajax({
            url: url,
            success: function (data, status, xhr) {
                console.log('11111');
                console.log(mapMarkers);
                var content = "<table>";
                content += "<thead><tr><th>Information</th><th>Population</th><th>Pollution</th></tr></thead>";
                content += "<tbody>";
                for (var i = 0; i < data.features.length; i++) {
                    var feature = data.features[i];
                    var featureAttr = feature.properties;
                    var info = jQuery.parseJSON(featureAttr["info"]);

                    var jsonInfo = jsonQ(info);
                    console.log('==========json Info=========');
                    console.log(jsonInfo);

                    var population = jQuery.parseJSON(featureAttr["detail_population"]);
                    var jsonPopulation = jsonQ(population);
                    console.log('=========json Population==========');
                    console.log(jsonPopulation);

                    var pollution = jQuery.parseJSON(featureAttr["detail_pollution"]);
                    var jsonPollution = jsonQ(pollution);
                    console.log('==========json Pollution==========');
                    console.log(jsonPollution);
                    content += "<tr><td>Area: " + (jQuery.isEmptyObject(jsonInfo) ? jsonInfo.find('area').value() : '') + " <br/>Insee code: " + (jQuery.isEmptyObject(jsonInfo) ? jsonInfo.find('insee_code').value() : '') + "</td>"
                        + "<td>Title: " + (jQuery.isEmptyObject(jsonPopulation) ? jsonPopulation.find('title').value() : '') + " <br/>Population: " + (jQuery.isEmptyObject(jsonPopulation) ? jsonPopulation.find('population').value() : '') + "</td>"
                        + "<td>Title: " + (jQuery.isEmptyObject(jsonPollution) ? jsonPollution.find('title').value() : '') + " <br/>Agriculture area: " + (jQuery.isEmptyObject(jsonPollution) ? jsonPollution.find('agriculture_area').value() : '') + "</td></tr>";
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

                jQuery.ajax({
                    method: "GET",
                    url: "php/getrecords_ajax.php",
                    data: {"insee_com": insee_com},
                }).done(function (data) {
                    //console.log(data);
                    var markers = jQuery.parseJSON(data);
                    console.log(markers);
                    var myIcon = L.icon({
                        iconUrl: 'images/pin24.png',
                        iconRetinaUrl: 'images/pin48.png',
                        iconSize: [29, 24],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    })

                    console.log('==========clear Markers====================');
                    console.log(jQuery.isEmptyObject(mapMarkers));
                    console.log(mapMarkers);
                    if (!jQuery.isEmptyObject(mapMarkers)) {
                        for(var i = 0; i < mapMarkers.length; i++){
                            map.removeLayer(mapMarkers[i]);
                        }
                    }

                    if (markers.length) {
                        for (var i = 0; i < markers.length; ++i) {
                            console.log(parseFloat(markers[i].lat), parseFloat(markers[i].long));
                            var marker = L.marker([parseFloat(markers[i].lat), parseFloat(markers[i].long)], {icon: myIcon})
                                .bindPopup('' + (markers[i].appariement !== null ? markers[i].appariement : '') + ' ' + (markers[i].appellation_officielle !== null ? markers[i].appellation_officielle : ''))
                                .addTo(map);
                            console.log('==========mapMarkers===========');
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