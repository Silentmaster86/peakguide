import {useState} from 'react';
import AdminCatalogueSection from '../features/adminCatalogue/AdminCatalogueSection';
import {catalogueLabels} from '../features/adminCatalogue/labels';

export default function AdminTools({lang='pl'}) {
 const [kind,setKind]=useState('trail');
 const t=catalogueLabels(lang);
 return <section>
  <div className="catalogue-editor-actions">
   <button type="button" aria-pressed={kind==='trail'} onClick={()=>setKind('trail')}>{t.trails}</button>
   <button type="button" aria-pressed={kind==='poi'} onClick={()=>setKind('poi')}>{t.pois}</button>
  </div>
  <AdminCatalogueSection key={kind} kind={kind} lang={lang}/>
 </section>;
}
