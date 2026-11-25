import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import * as profileApi from './profile';
import TrailElevationProfile from './TrailElevationProfile';
import {profileText} from './text';
import data from './data/lysina-pcim-kudlacze-wejscie.json';
import {localeFor} from '../../utils/format';
const trail={slug:data.trail_slug,name:'Łysina: Pcim → Kudłacze',peak_id:data.peak_id,gpx_url:data.gpx_url,geometry_source_url:data.geometry_source_url,route_geometry:{type:'MultiLineString',coordinates:data.segments.map(s=>s.map(p=>p.slice(0,2)))}};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it.each(['pl','en','ua','zh'])('loads source heights on demand and exposes an accessible chart in %s',async lang=>{
 const t=profileText[lang],user=userEvent.setup();render(<TrailElevationProfile trail={trail} lang={lang}/>);
 expect(screen.queryByRole('img')).toBeNull();await user.click(screen.getByText(t.title,{selector:'summary'}));
 expect(await screen.findByRole('img')).toHaveAccessibleName(new RegExp(t.title));
 const slider=screen.getByRole('slider',{name:t.point});expect(slider).toHaveAttribute('max',String(data.point_count-1));
 fireEvent.change(slider,{target:{value:String(data.point_count-1)}});expect(slider).toHaveValue(String(data.point_count-1));
 expect(slider.getAttribute('aria-valuetext')).toContain(new Intl.NumberFormat(localeFor(lang),{maximumFractionDigits:1}).format(data.segments.at(-1).at(-1)[2]));
 expect(screen.getByRole('link')).toHaveAttribute('href',data.source_url);
 if(lang==='en'){await user.click(screen.getByText(t.table,{selector:'summary'}));expect(await screen.findByRole('table')).toBeVisible();expect(screen.getAllByRole('row')).toHaveLength(data.point_count+1);}
});
it('does not display a chart for unreviewed routes or changed geometry',async()=>{
 const user=userEvent.setup();const view=render(<TrailElevationProfile trail={{...trail,slug:'other'}} lang="en"/>);
 expect(screen.getByText(profileText.en.unavailable)).toBeVisible();expect(screen.queryByText(profileText.en.title)).toBeNull();
 view.rerender(<TrailElevationProfile trail={{...trail,route_geometry:{type:'LineString',coordinates:[[0,0],[1,1]]}}} lang="en"/>);
 await user.click(screen.getByText(profileText.en.title,{selector:'summary'}));await waitFor(()=>expect(screen.getByText(profileText.en.changed)).toBeVisible());expect(screen.queryByRole('img')).toBeNull();
});

it('offers a retry if the profile chunk fails without inventing a chart',async()=>{
 vi.spyOn(profileApi,'loadProfile').mockRejectedValueOnce(new Error('Network unavailable'));
 const user=userEvent.setup();render(<TrailElevationProfile trail={trail} lang="en"/>);
 await user.click(screen.getByText(profileText.en.title,{selector:'summary'}));
 expect(await screen.findByRole('alert')).toHaveTextContent(profileText.en.error);expect(screen.queryByRole('img')).toBeNull();
 await user.click(screen.getByRole('button',{name:'Retry'}));expect(await screen.findByRole('img')).toBeVisible();
});
