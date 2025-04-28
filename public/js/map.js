Radar.initialize(mapToken);
console.log("MAP TOKEN:", mapToken);
console.log("COORDINATES:", [mapLng, mapLat]);

const map = Radar.ui.map({
  container: 'map',
  style: 'radar-default-v1',
  center: [mapLng, mapLat], // lng, lat format
  zoom: 9,
});

const marker = Radar.ui.marker({
  color: '#000257',
  width: 40,
  height: 80,
  popup: {
    text: popUp,
  },
})
.setLngLat([mapLng, mapLat])
.addTo(map);
