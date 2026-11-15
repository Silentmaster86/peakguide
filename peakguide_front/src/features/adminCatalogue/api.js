import {supabase} from '../../lib/supabaseClient';
import {invalidatePeakGuideCache} from '../../api/peakguide';
const tables={trail:'trails',poi:'pois'};
export async function loadCatalogue(kind){
 const table=tables[kind];if(!table)throw new Error('Invalid kind');
 const responses=await Promise.all([
  supabase.from(table).select(`*,${table}_i18n(*)`).order('id'),
  supabase.from('peaks').select('id,slug,peaks_i18n(lang,name)').order('slug'),
  supabase.from('poi_types').select('id,slug,poi_types_i18n(lang,name)').order('id'),
  supabase.from('trails').select('id,peak_id,slug,trails_i18n(lang,name)').order('id'),
 ]);
 for(const response of responses)if(response.error)throw response.error;
 return {items:responses[0].data||[],peaks:responses[1].data||[],types:responses[2].data||[],trails:responses[3].data||[]};
}
export async function saveCatalogue(kind,id,body,revision){
 if(!tables[kind])throw new Error('Invalid kind');
 const {data,error}=await supabase.rpc(`admin_save_${kind}`,{p_id:id,p_body:body,p_expected_updated_at:revision||null});
 if(error)throw error;
 invalidatePeakGuideCache();return data;
}
