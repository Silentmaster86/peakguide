import { Link } from 'react-router-dom';
import WeatherIcon from './WeatherIcon';
import './WeatherTeaser.css';
const copy = {
  pl: ['Pogoda przed wyjściem','Sprawdź prognozę dla szczytu lub miejscowości. Wybierz zakres 3, 5, 10 lub 15 dni, zależnie od dostępnych danych.','Otwórz prognozę pogody'],
  en: ['Weather before you head out','Check the forecast for a peak or town. Choose 3, 5, 10 or 15 days, depending on available data.','Open weather forecast'],
  ua: ['Погода перед походом','Перевірте прогноз для вершини або населеного пункту. Виберіть 3, 5, 10 або 15 днів залежно від доступних даних.','Відкрити прогноз погоди'],
  zh: ['出发前查看天气','查看山峰或城镇预报，根据可用数据选择3、5、10或15天。','打开天气预报'],
};
export default function WeatherTeaser({lang='pl'}) {
  const t=copy[lang]||copy.pl;
  return <section className="home-weather-teaser catalogue-card"><WeatherIcon kind="sunrise"/><div><h2>{t[0]}</h2><p>{t[1]}</p><Link to="/weather">{t[2]} <span aria-hidden="true">→</span></Link></div></section>;
}
