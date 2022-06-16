<template>
<div>
  <l-map style="height: 750px" :zoom="zoom" :center="center" v-on:click="onclick" ref="map">
    <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
    <l-polyline :lat-lngs="polyline.latlngs" :color="polyline.color" ref="line"></l-polyline>
    <l-polyline :lat-lngs="suggestedLines" :color="'red'" ref="line"></l-polyline>
    <l-marker v-for="marker in polyline.latlngs" :key="marker" :lat-lng="marker">
    <l-icon
          :icon-size="size"
          :icon-anchor="anchor"
          icon-url="https://www.iconpacks.net/icons/2/free-location-icon-2955-thumb.png"
        />
        </l-marker>

    <l-marker v-for="marker1 in suggestedLines" :key="marker1" :lat-lng="marker1">
    <l-icon
          :icon-size="size"
          :icon-anchor="anchor"
          icon-url="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Red_circle.svg/800px-Red_circle.svg.png"
        />
        </l-marker>
    <l-circle
      :lat-lng="baseStation"
      :radius="this.getDistance() * 1000"
      :color="`red`"
    />
      <l-circle
      :lat-lng="baseStation"
      :radius="this.findMaxDistanceAvailable() * 1000"
      :color="`green`"
    />


  </l-map>
  <div class="row justify-content-md-center">
    <div class="col-lg-4 text-center mb-4">
      <b-form-input :value="baseStationInputValue" placeholder="Введите координаты базовой станции" class="d-block text-center"></b-form-input>
      <b-button ref="button" :class="{'bg-success': choosingBaseStation}" class="align-self-center mx-auto w-100" @click="choosingBaseStation = !choosingBaseStation">{{ !choosingBaseStation ? 'Нажмите для выбора базовой станции' : 'Кликните на карту' }}</b-button>
    </div>  
  </div>



  <div class="row justify-content-md-center">
    <div class="col-lg-3">
      <div class="mx-2">
      <button v-on:click="UpdateCenter" class="btn btn-info w-100 mb-1">Отцентровать карту</button>
      <button v-on:click="ClearMap" class="btn w-100 btn-danger mb-1">Очистить карту</button>
      <hr>
      <label class="w-100 text-dark mb-1 text-center">Параметры</label>
      <label class="w-50 ml-1">Рабочая частота</label><b-form-input v-model="frequency" placeholder="Working frequency, MHz" class="w-50 d-inline mb-1"></b-form-input>
      <label class="w-100 text-dark mb-1 text-center">Передатчик</label>
      <label class="w-50">Мощность передатчика</label><b-form-input v-model="TXpower" placeholder="TX power, dBm" class="w-50 d-inline mb-1"></b-form-input>
      <label class="w-50">Усиление передатчика</label><b-form-input v-model="TXAmp" placeholder="TX Amp, dBi" class="w-50 d-inline mb-1"></b-form-input>
      <label class="w-50">Потери в кабеле и разъемах</label><b-form-input v-model="TXlosses" placeholder="TX losses, dB" class="w-50 d-inline mb-1"></b-form-input>

      <label class="w-100 text-dark mb-1 text-center">Приемник</label>
      <label class="w-50">Чувствительность приема</label><b-form-input v-model="RXsens" placeholder="RX sensitivity, dBm" class="w-50 d-inline mb-1"></b-form-input>
      <label class="w-50">Усиление антенны</label><b-form-input v-model="RXAmp" placeholder="RX Amp, dBi" class="w-50 d-inline mb-1"></b-form-input>
      <label class="w-50">Потери в кабеле и разъемах</label><b-form-input v-model="RXlosses" placeholder="RX losses, dB" class="w-50 d-inline mb-1"></b-form-input>
      <hr>
      <b-form-input v-model="baseStationAntennaElevation" placeholder="Base station antenna elevation, m" class="d-block mb-1"></b-form-input>
      <b-form-input v-model="uavElevation" placeholder="UAV elevation, m" class="d-block mb-1"></b-form-input>
      <!-- <b-button ref="button" :class="{'bg-success': 0}" class="align-self-center mx-auto w-100" @click="this.findMaxDistanceAvailable()">Calculate</b-button> -->
      </div>
    </div>
    <div class="col-lg-2">
      <button v-on:click="DeleteLastPoint" class="btn btn-danger w-100 mb-1">Удалить последнюю точку</button>
      <label>Энергозапас: {{energyLeft}}, dB</label>
      <label>Уровень на приемнике: {{recieverLevel}}, dB</label>
    </div>
  </div>


</div>
</template>



<script>
import { LMap, LTileLayer, LPolyline, LCircle, LMarker, LIcon} from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';
import { BootstrapVue } from 'bootstrap-vue'
import Vue from 'vue'
Vue.use(BootstrapVue);
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

export default {
  components: {
    LMap,
    LTileLayer,
    LPolyline,
    LCircle,
    LMarker,
    LIcon
  },
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 13,
      center: [56.74969375630129, 60.685132987781635],
      polyline: {
        latlngs: [],
        color: 'green'
      },
      choosingBaseStation: false,
      baseStation: [0,0],
      baseStationInputValue: "",
      markers: [[56.74469375630129, 60.685132987781635], [47.313220, -1.319482]],
      baseStationAntennaElevation: '',
      uavElevation: '',
      size: [50, 50],
      anchor: [25, 45],
      frequency: 5000,
      TXpower: 17,
      TXAmp: 24,
      TXlosses: 1.5,
      RXlosses: 1.5,
      RXAmp: 24,
      RXsens: -85,
      suggestedLines: [],
      toastsList: [],
      energyLeft: '',
      recieverLevel: '',
      notificationSystem: {
        options: {
          show: {
            theme: "dark",
            timeout: 10000,
            icon: "icon-person",
            position: "topCenter",
            progressBarColor: "rgb(0, 255, 184)",
            buttons: [
              [
                "<button>Применить</button>",
                function (instance) {
                  console.log(`id is `, instance.toast.id);
                },
                true,
              ],
              [
                "<button>Пропустить</button>",
                function (instance, toast) {
                  instance.hide(
                    {
                      transitionOut: "fadeOutUp",
                      onClosing: function (instance, toast, closedBy) {
                        console.info("closedBy: " + closedBy);
                      },
                    },
                    toast,
                    "discardButton"
                  );
                },
              ],
            ],
            onClosing: function (instance, toast, closedBy) {
              console.info("closedBy: " + closedBy);
            },
          },
          error: {
            position: "topCenter"
          },
        },
      },
    };
  },
  mounted: function(){
    console.log(this.$refs.map);
  },
  watch: {
    center: function () {
      console.log(`here`);
      this.$refs.map.mapObject.panTo(this.$refs.map.center);
      //this.zoom = 11;
    },
  },
  methods: {
    UpdateCenter: function(){
      this.$refs.map.center = [56.74969375630129, 60.685132987781635];
      this.$refs.map.mapObject.panTo(this.$refs.map.center);
    },
    onclick: function(event){
      if(this.choosingBaseStation){
        this.baseStation = event.latlng;
        this.baseStationInputValue = `${event.latlng.lat}, ${event.latlng.lng}` ;
        this.choosingBaseStation = !this.choosingBaseStation;
        return;
      }
      console.log(this.polyline.latlngs.push(event.latlng));
      this.calculate(event.latlng);

    },
    ClearMap: function(){
      this.polyline.latlngs = [];
      //this.baseStation = [0,0];
    },
     getDistance: function(){
      let result = 3.57*(Math.sqrt(this.uavElevation) + Math.sqrt(this.baseStationAntennaElevation));
      //console.log(result, "km");
      return result;
    },
    round: function (number , X) 
    { 	
      X = (!X ? 2 : X); 	
      return Math.round(number*Math.pow(10,X))/Math.pow(10,X); 
    },
    Log10: function(x) 
    { 	
      var Number; 	
      Number = Math.log(x) / Math.log(10); 	
      return(Number); 
    },
    findDistance: function(point){
      let baseStation = this.baseStation;
      const R = 6371e3; // metres
      let lat1 = baseStation.lat;
      let lon1 = baseStation.lng;
      let lat2 = point.lat;
      let lon2 = point.lng;

      const φ1 = lat1 * Math.PI/180; // φ, λ in radians
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const d = R * c; // in metres
      console.log(`point is away for ${d} meters`);
      return d;
    },
    calculate: function(pointCoordinates) 
    {    		
      let FreqMHz = this.frequency;
      let DistMi = this.findDistance(pointCoordinates) / 1000;
      let FSL = this.round(20 * this.Log10(FreqMHz) + 20 * this.Log10(DistMi) + 32.4, 1)

      //console.log(this.round(20 * this.Log10(FreqMHz) + 20 * this.Log10(DistMi) + 32.4, 1));
      let TXpwr = Number(this.TXpower);
      let TXcabloss = Number(this.TXlosses);

      let TXantgain = Number(this.TXAmp);

      let RXantgain = Number(this.RXAmp);

      let RXcabloss = Number(this.RXlosses);
      let RXsens = Number(this.RXsens);

      let energyLeft = this.round((TXpwr - TXcabloss + TXantgain - FSL + RXantgain - RXcabloss - RXsens), 1);
      let incomingSignalPower = this.round((TXpwr - TXcabloss + TXantgain - FSL + RXantgain - RXcabloss), 1);
      this.energyLeft = energyLeft;
      this.recieverLevel = incomingSignalPower;

      console.log(`Запас по энергии`, energyLeft, 'dB');
      if(energyLeft < 20){
        let showObject = this.notificationSystem.options.show;
        let id = this.toastsList.length + 1 || 1;
        this.toastsList.push({
          id: id,
          latlng: pointCoordinates
        });
        //console.log(`toast is`, this.toastsList[0]);
        showObject.id = id;
        this.findMaxDistanceAvailable();
        this.$toast.error('Запас энерголинии в этой точке < 20 dB, необходимо изменить местоположение точки пролета','Не подойдет');
        
      }
      console.log(`Уровень на приемнике`, incomingSignalPower, 'dBm');
    },
    findMaxDistanceAvailable: function(){

      let FreqMHz = Number(this.frequency);
      let TXpwr = Number(this.TXpower);
      let TXcabloss = Number(this.TXlosses);

      let TXantgain = Number(this.TXAmp);

      let RXantgain = Number(this.RXAmp);

      let RXcabloss = Number(this.RXlosses);
      let RXsens = Number(this.RXsens);


      let FSLcalc = (TXpwr - TXcabloss + TXantgain + RXantgain - RXcabloss - RXsens) - 20;
      FSLcalc = ((FSLcalc - 32.4) / 20) - this.Log10(FreqMHz);
      let result = Math.pow(10, FSLcalc);
      return result;
    },
    DeleteLastPoint: function(){
      this.polyline.latlngs.pop();
    }
  }
}
</script> 