import {divIcon} from 'leaflet';

const icons={
 peak:'<path d="m3 20 8-15 4 7 2-3 5 11H3Z"/><path d="m8 11 3 2 2-2"/>',
 parking:'<path d="M8 21V4h6a5 5 0 0 1 0 10H8"/>',
 shelter:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
 trailhead:'<path d="M12 3v19M5 5h12l4 3-4 3H5V5Zm14 8H7l-4 3 4 3h12v-6Z"/>',
 viewpoint:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 poi:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 route:'<path d="m3 18 6-12 6 12 6-12"/>',
};
export const poiKind=poi=>{
 const slug=poi.poi_types?.slug||poi.type_slug;
 return ['parking','shelter','trailhead','viewpoint'].includes(slug)?slug:'poi';
};
export function symbol(kind){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]||icons.poi}</svg>`;}
const cache=new Map();
export function mapIcon(kind='peak'){
 if(!cache.has(kind))cache.set(kind,divIcon({className:`pg-map-marker pg-map-marker--${kind}`,html:`<span class="pg-map-pin">${symbol(kind)}</span>`,iconSize:[26,34],iconAnchor:[13,32],popupAnchor:[0,-31],tooltipAnchor:[0,-30]}));
 return cache.get(kind);
}
export function clusterIcon(count){return divIcon({className:'pg-map-group',html:`<span>${count}</span>`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-17]});}

const labels={
 pl:{peaks:'Szczyty',layers:'Warstwy mapy',fit:'Pokaż wszystkie wyniki',expand:'Powiększ mapę',collapse:'Zamknij powiększoną mapę',legend:'Legenda mapy',peak:'Szczyt',parking:'Parking',shelter:'Schronisko',trailhead:'Początek szlaku',viewpoint:'Punkt widokowy',poi:'Inny punkt POI',route:'Trasa',details:'Zobacz szczegóły'},
 en:{peaks:'Peaks',layers:'Map layers',fit:'Show all results',expand:'Expand map',collapse:'Close expanded map',legend:'Map legend',peak:'Peak',parking:'Parking',shelter:'Mountain hut',trailhead:'Trailhead',viewpoint:'Viewpoint',poi:'Other point of interest',route:'Route',details:'View details'},
 ua:{peaks:'Вершини',layers:'Шари мапи',fit:'Показати всі результати',expand:'Розгорнути мапу',collapse:'Закрити розгорнуту мапу',legend:'Умовні позначення',peak:'Вершина',parking:'Паркінг',shelter:'Притулок',trailhead:'Початок стежки',viewpoint:'Оглядовий майданчик',poi:'Інша цікава точка',route:'Маршрут',details:'Докладніше'},
 zh:{peaks:'山峰',layers:'地图图层',fit:'显示所有结果',expand:'展开地图',collapse:'关闭展开的地图',legend:'地图图例',peak:'山峰',parking:'停车场',shelter:'山间小屋',trailhead:'步道起点',viewpoint:'观景点',poi:'其他兴趣点',route:'路线',details:'查看详情'},
};
export const mapLabels=lang=>labels[lang]||labels.pl;
