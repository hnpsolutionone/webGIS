L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({

    onAdd: function (map) {
        // Triggered when the layer is added to a map.
        //   Register a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onAdd.call(this, map);
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
        $.ajax({
            url: url,
            success: function (data, status, xhr) {
                console.log(data);
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

                    content += "<tr><td>Area: " + jsonInfo.find('area').value() + " <br/>Insee code: " + jsonInfo.find('insee_code').value() + "</td>"
                        + "<td>Title: " + jsonPopulation.find('title').value() + " <br/>Population: " + jsonPopulation.find('population').value() + "</td>"
                        + "<td>Title: " + jsonPollution.find('title').value() + " <br/>Agriculture area: " + jsonPollution.find('agriculture_area').value() + "</td></tr>";
                }
                content += "<tbody></table>";
                // $("#info").html(content);
                var err = typeof content === 'string' ? null : content;
                //Fix for blank popup window
                var doc = (new DOMParser()).parseFromString(content, "text/html");
                if (doc.body.innerHTML.trim().length > 0)
                    showResults(err, evt.latlng, content);

                // Call Ajax to get data when user click on commune
                var insee_com = jsonInfo.find('insee_code').value();

                $.ajax({
                    method: "GET",
                    url: "php/getrecords_ajax.php",
                    data: {"insee_com": insee_com},
                }).done(function (data) {
                    console.log(data);
                    var markers = jQuery.parseJSON(data);
                    console.log(markers);
                    var myIcon = L.icon({
                        iconUrl: 'images/pin24.png',
                        iconRetinaUrl: 'images/pin48.png',
                        iconSize: [29, 24],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    })
                    for (var i = 0; i < markers.length; ++i) {
                        L.marker([markers[i].lat, markers[i].lng], {icon: myIcon})
                            .bindPopup('<a href="' + markers[i].url + '" target="_blank">' + markers[i].name + '</a>')
                            .addTo(map);
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