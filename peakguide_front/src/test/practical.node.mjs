import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeUrl,translation,verifiedDate} from '../utils/practical.mjs';
test('reject unsafe and missing links',()=>{for(const v of [null,'','javascript:alert(1)','data:text/html,test','/relative']) assert.equal(safeUrl(v),null);});
test('preserve map coordinates',()=>assert.equal(safeUrl('https://www.google.com/maps/search/?api=1&query=54.456730,-3.262496'),'https://www.google.com/maps/search/?api=1&query=54.456730,-3.262496'));
test('no cross-language fallback',()=>{assert.deepEqual(translation([{lang:'pl',name:'Parking'}],'zh'),{});assert.deepEqual(translation(null,'en'),{});});
test('select each supported language',()=>{for(const lang of ['pl','en','ua','zh'])assert.equal(translation([{lang,name:lang}],lang).name,lang);});
test('missing or invalid verification date stays unknown',()=>{for(const v of [null,'','invalid'])assert.equal(verifiedDate(v,'pl'),null);});
test('dates render for four languages',()=>{for(const lang of ['pl','en','ua','zh'])assert.ok(verifiedDate('2026-09-10T00:00:00Z',lang));});
